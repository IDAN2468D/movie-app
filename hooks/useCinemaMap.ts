import { useState, useRef, useEffect } from 'react';
import { Dimensions, FlatList, Linking, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useHaptics } from '@/lib/useHaptics';
import { BRANCHES as GLOBAL_BRANCHES } from '@/constants/Branches';

const { width } = Dimensions.get('window');

// Parabolic geodesic arc calculation
const calculateArcPoints = (
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number }
) => {
  const points = [];
  const numPoints = 30;
  const dLat = end.latitude - start.latitude;
  const dLon = end.longitude - start.longitude;
  const curvature = 0.25;
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = (1 - t) * start.latitude + t * end.latitude;
    const lon = (1 - t) * start.longitude + t * end.longitude;
    points.push({
      latitude: lat + (-dLon * curvature * Math.sin(t * Math.PI)),
      longitude: lon + (dLat * curvature * Math.sin(t * Math.PI)),
    });
  }
  return points;
};

export const BRANCHES = GLOBAL_BRANCHES.map(b => ({
  id: b.id,
  name: b.name,
  lat: b.coords.latitude,
  lng: b.coords.longitude,
  address: b.location,
  distance: b.distance,
  image: b.image,
  features: b.features,
  phone: '*2202',
}));

export type BranchItem = typeof BRANCHES[0];

export const useCinemaMap = () => {
  const { selection, impactLight, impactMedium } = useHaptics();

  const [selectedBranch, setSelectedBranch] = useState<BranchItem>(BRANCHES[0]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [pulseIndex, setPulseIndex] = useState(0);

  const mapRef = useRef<any>(null);
  const horizontalListRef = useRef<FlatList>(null);

  // Request location permission
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { console.warn('Location permission denied'); return; }
        let location = await Location.getLastKnownPositionAsync({});
        if (!location) location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation(location);
      } catch { console.warn('Location not available'); }
    })();
  }, []);

  // Fetch route when branch or location changes
  useEffect(() => {
    if (!userLocation || !selectedBranch) return;
    let active = true;
    const fetchRoute = async () => {
      try {
        const { latitude: sLat, longitude: sLng } = userLocation.coords;
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${selectedBranch.lng},${selectedBranch.lat}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data.code === 'Ok' && data.routes?.[0]) {
          const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => ({ latitude: c[1], longitude: c[0] }));
          if (active) { setRouteCoords(coords); setPulseIndex(0); }
        } else { throw new Error('OSRM failed'); }
      } catch {
        const start = { latitude: userLocation.coords.latitude, longitude: userLocation.coords.longitude };
        const end = { latitude: selectedBranch.lat, longitude: selectedBranch.lng };
        if (active) { setRouteCoords(calculateArcPoints(start, end)); setPulseIndex(0); }
      }
    };
    fetchRoute();
    return () => { active = false; };
  }, [selectedBranch, userLocation]);

  // Pulse animation along route
  useEffect(() => {
    if (routeCoords.length === 0) return;
    const interval = setInterval(() => setPulseIndex(prev => (prev + 1) % routeCoords.length), 60);
    return () => clearInterval(interval);
  }, [routeCoords]);

  const calculateDistance = (lat: number, lng: number) => {
    if (!userLocation) return null;
    const R = 6371;
    const dLat = (lat - userLocation.coords.latitude) * Math.PI / 180;
    const dLon = (lng - userLocation.coords.longitude) * Math.PI / 180;
    const a = 0.5 - Math.cos(dLat) / 2 + Math.cos(userLocation.coords.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * (1 - Math.cos(dLon)) / 2;
    return (R * 2 * Math.asin(Math.sqrt(a))).toFixed(1) + ' ק"מ';
  };

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({ latitude: userLocation.coords.latitude, longitude: userLocation.coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    }
  };

  const handleBranchSelect = (branch: BranchItem) => {
    setSelectedBranch(branch);
    if (viewMode === 'map') {
      setTimeout(() => { mapRef.current?.animateToRegion({ latitude: branch.lat, longitude: branch.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 300); }, 150);
    }
  };

  const handleMarkerPress = (branch: BranchItem) => {
    selection();
    setSelectedBranch(branch);
    const index = BRANCHES.findIndex(b => b.id === branch.id);
    if (index !== -1) horizontalListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    mapRef.current?.animateToRegion({ latitude: branch.lat, longitude: branch.lng, latitudeDelta: 0.015, longitudeDelta: 0.015 }, 300);
  };

  const handleNavigate = (branch: BranchItem) => {
    const googleUrl = `https://www.google.com/maps/search/?api=1&query=${branch.lat},${branch.lng}`;
    const wazeUrl = `waze://?ll=${branch.lat},${branch.lng}&navigate=yes`;
    Linking.canOpenURL(wazeUrl).then(supported => {
      if (supported) {
        Alert.alert('ניווט לסניף', 'בחר אפליקציית ניווט', [
          { text: 'Waze', onPress: () => Linking.openURL(wazeUrl).catch(() => Linking.openURL(googleUrl)) },
          { text: 'Google Maps', onPress: () => Linking.openURL(googleUrl) },
          { text: 'ביטול', style: 'cancel' },
        ]);
      } else { Linking.openURL(googleUrl).catch(() => Alert.alert('שגיאה', 'לא ניתן לפתוח את אפליקציית המפות')); }
    }).catch(() => Linking.openURL(googleUrl).catch(() => Alert.alert('שגיאה', 'לא ניתן לפתוח את אפליקציית המפות')));
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/-/g, '')}`).catch(() => Alert.alert('שגיאה', 'לא ניתן לבצע את שיחת הטלפון'));
  };

  const handleScrollEnd = (offsetX: number) => {
    const index = Math.round(offsetX / (width - 24));
    if (index >= 0 && index < BRANCHES.length) {
      const branch = BRANCHES[index];
      if (selectedBranch?.id !== branch.id) {
        setSelectedBranch(branch);
        impactLight();
        mapRef.current?.animateToRegion({ latitude: branch.lat, longitude: branch.lng, latitudeDelta: 0.015, longitudeDelta: 0.015 }, 300);
      }
    }
  };

  return {
    selectedBranch, viewMode, setViewMode, userLocation, routeCoords, pulseIndex,
    mapRef, horizontalListRef,
    calculateDistance, centerOnUser, handleBranchSelect, handleMarkerPress,
    handleNavigate, handleCall, handleScrollEnd,
    selection, impactLight, impactMedium,
  };
};
