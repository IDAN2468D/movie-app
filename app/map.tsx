import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Pressable, Image, Platform, Linking, Alert } from 'react-native';
import { useHaptics } from '@/lib/useHaptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  Map as MapIcon,
  List,
  Film,
  ChevronRight,
  Sparkles
} from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import Animated, { 
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { BRANCHES as GLOBAL_BRANCHES } from '@/constants/Branches';

// Attempt to import MapView, fallback if it fails
let MapView: any, Marker: any, PROVIDER_GOOGLE: any, Polyline: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  Polyline = Maps.Polyline;
} catch {
  console.warn('MapView not available');
}

// 60fps Continuous Liquid Pulse Ripple active pin marker component
function PulsingMarker({ active }: { active: boolean }) {
  const ring1Scale = useSharedValue(0.8);
  const ring1Opacity = useSharedValue(0.8);
  const ring2Scale = useSharedValue(0.8);
  const ring2Opacity = useSharedValue(0.8);

  React.useEffect(() => {
    if (active) {
      ring1Scale.value = 0.8;
      ring1Opacity.value = 0.8;
      ring1Scale.value = withRepeat(
        withTiming(2.4, { duration: 1800, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      ring1Opacity.value = withRepeat(
        withTiming(0, { duration: 1800, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );

      ring2Scale.value = 0.8;
      ring2Opacity.value = 0.8;
      const timeout = setTimeout(() => {
        ring2Scale.value = withRepeat(
          withTiming(2.4, { duration: 1800, easing: Easing.out(Easing.ease) }),
          -1,
          false
        );
        ring2Opacity.value = withRepeat(
          withTiming(0, { duration: 1800, easing: Easing.out(Easing.ease) }),
          -1,
          false
        );
      }, 900);
      return () => clearTimeout(timeout);
    } else {
      ring1Scale.value = 0.8;
      ring1Opacity.value = 0;
      ring2Scale.value = 0.8;
      ring2Opacity.value = 0;
    }
  }, [active, ring1Scale, ring1Opacity, ring2Scale, ring2Opacity]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  if (!active) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', width: 40, height: 40, backgroundColor: 'transparent' }}>
        {/* Sleek, modern glowing neon inactive marker */}
        <View 
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '#FF1464',
            borderWidth: 2,
            borderColor: '#FFFFFF',
            shadowColor: '#FF1464',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
            elevation: 4,
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 80, height: 80, backgroundColor: 'transparent' }}>
      <Animated.View 
        style={[
          ring1Style, 
          { 
            position: 'absolute', 
            width: 48, 
            height: 48, 
            borderRadius: 24, 
            backgroundColor: 'rgba(255, 20, 100, 0.25)',
            borderWidth: 1.5,
            borderColor: 'rgba(255, 20, 100, 0.45)'
          }
        ]} 
      />
      <Animated.View 
        style={[
          ring2Style, 
          { 
            position: 'absolute', 
            width: 48, 
            height: 48, 
            borderRadius: 24, 
            backgroundColor: 'rgba(255, 20, 100, 0.15)',
            borderWidth: 1.5,
            borderColor: 'rgba(255, 20, 100, 0.35)'
          }
        ]} 
      />
      
      {/* Redesigned Active Cinema Core - Glowing Hot Pink Glass with Film Icon */}
      <View 
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(9, 9, 11, 0.85)',
          borderWidth: 2,
          borderColor: '#FF1464',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#FF1464',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.6,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <Film size={20} color="#FF1464" />
      </View>
    </View>
  );
}

// Parabolic geodesic arc calculation connecting user to cinema branch
const calculateArcPoints = (
  start: { latitude: number; longitude: number }, 
  end: { latitude: number; longitude: number }
) => {
  const points = [];
  const numPoints = 30;
  
  const lat1 = start.latitude;
  const lon1 = start.longitude;
  const lat2 = end.latitude;
  const lon2 = end.longitude;
  
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const curvature = 0.25; 
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = (1 - t) * lat1 + t * lat2;
    const lon = (1 - t) * lon1 + t * lon2;
    const offsetLat = -dLon * curvature * Math.sin(t * Math.PI);
    const offsetLon = dLat * curvature * Math.sin(t * Math.PI);
    
    points.push({
      latitude: lat + offsetLat,
      longitude: lon + offsetLon
    });
  }
  return points;
};


const { width } = Dimensions.get('window');

const BRANCHES = GLOBAL_BRANCHES.map(b => ({
  id: b.id,
  name: b.name,
  lat: b.coords.latitude,
  lng: b.coords.longitude,
  address: b.location,
  distance: b.distance,
  image: b.image,
  features: b.features,
  phone: '*2202' // Default cinema phone number
}));

export default function CinemaMapScreen() {
  const insets = useSafeAreaInsets();
  const { selection, impactLight, impactMedium } = useHaptics();
  const bottomOffset = Math.max(insets.bottom + 24, 40);
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [pulseIndex, setPulseIndex] = useState(0);

  const mapRef = useRef<any>(null);
  const horizontalListRef = useRef<FlatList>(null);

  React.useEffect(() => {
    if (!userLocation || !selectedBranch) return;

    let active = true;
    const fetchRoute = async () => {
      try {
        const startLat = userLocation.coords.latitude;
        const startLng = userLocation.coords.longitude;
        const endLat = selectedBranch.lat;
        const endLng = selectedBranch.lng;

        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map((coord: [number, number]) => ({
            latitude: coord[1],
            longitude: coord[0],
          }));
          if (active) {
            setRouteCoords(coords);
            setPulseIndex(0);
          }
        } else {
          throw new Error('OSRM route failed');
        }
      } catch (err) {
        console.warn('Failed to fetch street route from OSRM, falling back to geodesic arc:', err);
        // Fallback to geodesic arc points
        const start = { latitude: userLocation.coords.latitude, longitude: userLocation.coords.longitude };
        const end = { latitude: selectedBranch.lat, longitude: selectedBranch.lng };
        if (active) {
          setRouteCoords(calculateArcPoints(start, end));
          setPulseIndex(0);
        }
      }
    };

    fetchRoute();
    return () => {
      active = false;
    };
  }, [selectedBranch, userLocation]);

  React.useEffect(() => {
    if (routeCoords.length === 0) return;
    const interval = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % routeCoords.length);
    }, 60);
    return () => clearInterval(interval);
  }, [routeCoords]);

  React.useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Permission to access location was denied');
          return;
        }

        let location = await Location.getLastKnownPositionAsync({});
        if (!location) {
          location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        }
        setUserLocation(location);
      } catch {
        console.warn('ExpoLocation native module not found or location services not available.');
      }
    })();
  }, []);

  const calculateDistance = (lat: number, lng: number) => {
    if (!userLocation) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat - userLocation.coords.latitude) * Math.PI / 180;
    const dLon = (lng - userLocation.coords.longitude) * Math.PI / 180;
    const a = 
      0.5 - Math.cos(dLat)/2 + 
      Math.cos(userLocation.coords.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
      (1 - Math.cos(dLon))/2;

    const distance = R * 2 * Math.asin(Math.sqrt(a));
    return distance.toFixed(1) + ' ק"מ';
  };

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const handleBranchSelect = (branch: any) => {
    setSelectedBranch(branch);
    if (MapView && viewMode === 'map') {
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: branch.lat,
            longitude: branch.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 300);
        }
      }, 150);
    }
  };

  const handleMarkerPress = (branch: any) => {
    selection();
    setSelectedBranch(branch);
    
    // Find index and scroll horizontal flatlist to card
    const index = BRANCHES.findIndex(b => b.id === branch.id);
    if (index !== -1 && horizontalListRef.current) {
      horizontalListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    }

    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: branch.lat,
        longitude: branch.lng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 300);
    }
  };

  const handleNavigate = (branch: any) => {
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${branch.lat},${branch.lng}`;
    const wazeUrl = `waze://?ll=${branch.lat},${branch.lng}&navigate=yes`;
    
    Linking.canOpenURL(wazeUrl)
      .then(supported => {
        if (supported) {
          Alert.alert(
            'ניווט לסניף',
            'בחר אפליקציית ניווט',
            [
              { text: 'Waze', onPress: () => Linking.openURL(wazeUrl).catch(() => Linking.openURL(googleMapsUrl)) },
              { text: 'Google Maps', onPress: () => Linking.openURL(googleMapsUrl) },
              { text: 'ביטול', style: 'cancel' }
            ]
          );
        } else {
          Linking.openURL(googleMapsUrl).catch(err => {
            console.warn("Failed to open maps", err);
            Alert.alert('שגיאה', 'לא ניתן לפתוח את אפליקציית המפות');
          });
        }
      })
      .catch(() => {
        Linking.openURL(googleMapsUrl).catch(err => {
          console.warn("Failed to open maps", err);
          Alert.alert('שגיאה', 'לא ניתן לפתוח את אפליקציית המפות');
        });
      });
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/-/g, '')}`).catch(err => {
      console.warn("Failed to make call", err);
      Alert.alert('שגיאה', 'לא ניתן לבצע את שיחת הטלפון במכשיר זה');
    });
  };

  const renderBranchItem = ({ item }: { item: typeof BRANCHES[0] }) => {
    const isSelected = selectedBranch?.id === item.id;
    return (
      <View 
        className="mx-5 mb-4 overflow-hidden rounded-[32px] border-2"
        style={{
          borderColor: isSelected ? '#FF1464' : 'rgba(255, 255, 255, 0.06)',
          shadowColor: '#FF1464',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: isSelected ? 0.35 : 0,
          shadowRadius: 20,
          elevation: isSelected ? 8 : 0,
        }}
      >
        <LinearGradient
          colors={isSelected ? ['#2A1015', '#0E0D10'] : ['#18181C', '#0F0F12']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {/* Right side: Cinema details & Image (Pressable) */}
          <Pressable 
            onPress={() => {
              selection();
              handleBranchSelect(item);
            }}
            className="flex-1 flex-row items-center py-1"
            style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }, { paddingEnd: 12 }]}
          >
            {/* Cinema Image Thumbnail with gorgeous hot-pink halo */}
            <View 
              style={{ 
                borderRadius: 18, 
                borderWidth: 2, 
                borderColor: isSelected ? '#FF1464' : 'rgba(255,255,255,0.1)',
                padding: 2,
                shadowColor: '#FF1464',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isSelected ? 0.8 : 0.2,
                shadowRadius: 6,
                elevation: 4
              }}
            >
              <Image 
                source={{ uri: item.image }} 
                className="rounded-xl border border-white/10" 
                style={{ width: 62, height: 62 }}
                resizeMode="cover"
              />
            </View>

            {/* Text Details */}
            <View className="flex-1 items-start justify-center px-3">
              <View className="flex-row items-center justify-start">
                {isSelected && (
                  <View 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ 
                      backgroundColor: '#D4AF37',
                      shadowColor: '#D4AF37',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 1,
                      shadowRadius: 6,
                      elevation: 5
                    }}
                  />
                )}
                <Text 
                  className="text-white text-[16px] font-bold text-left" 
                  style={{ fontFamily: 'Rubik-Bold', writingDirection: 'ltr' }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </View>
              
              <View className="flex-row items-center justify-start mt-1.5 mb-1.5" style={{ width: '100%' }}>
                <MapPin size={11} color={isSelected ? '#FF1464' : Colors.textMuted} style={{ marginRight: 4 }} />
                <Text 
                  className="text-textMuted text-[12px] text-left" 
                  style={{ writingDirection: 'ltr', fontFamily: 'Rubik-Regular' }}
                  numberOfLines={1}
                >
                  {item.address}
                </Text>
              </View>

              {/* Features badges */}
              {item.features && item.features.length > 0 && (
                <View className="flex-row flex-wrap gap-1 mt-1 justify-start" style={{ direction: 'ltr' }}>
                  {item.features.slice(0, 3).map((feature, idx) => (
                    <View 
                      key={idx} 
                      className="px-2.5 py-0.5 rounded-md"
                      style={{ 
                        backgroundColor: isSelected ? 'rgba(255, 20, 100, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                        borderWidth: 1,
                        borderColor: isSelected ? 'rgba(255, 20, 100, 0.2)' : 'rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      <Text 
                        className="text-[9px] font-bold" 
                        style={{ 
                          fontFamily: 'Rubik-Medium',
                          color: isSelected ? '#FF1464' : 'rgba(255, 255, 255, 0.5)'
                        }}
                      >
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Pressable>

          {/* Left side: Action Buttons & Distance */}
          <View className="flex-col items-center justify-center gap-2" style={{ zIndex: 10, minWidth: 90 }}>
            {/* Distance Pill */}
            <View 
              className="px-2.5 py-0.5 rounded-full"
              style={{ 
                backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.12)' : '#26262B',
                borderWidth: 1,
                borderColor: isSelected ? 'rgba(212, 175, 55, 0.3)' : 'rgba(255, 255, 255, 0.08)'
              }}
            >
              <Text 
                className="text-[10px] font-bold" 
                style={{ 
                  fontFamily: 'Rubik-Medium',
                  color: isSelected ? '#D4AF37' : 'rgba(255, 255, 255, 0.6)'
                }}
              >
                {calculateDistance(item.lat, item.lng) || item.distance}
              </Text>
            </View>

            {/* Buttons Row */}
            <View className="flex-row items-center gap-1.5">
              {/* Navigate Button */}
              <Pressable 
                onPress={() => {
                  impactMedium();
                  handleNavigate(item);
                }}
                className="w-9 h-9 rounded-full items-center justify-center active:opacity-75"
                style={{
                  backgroundColor: '#FF1464',
                  shadowColor: '#FF1464',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <Navigation size={14} color="white" />
              </Pressable>

              {/* Call Button */}
              <Pressable 
                onPress={() => {
                  impactLight();
                  handleCall(item.phone);
                }}
                className="w-9 h-9 rounded-full items-center justify-center active:opacity-75"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <Phone size={14} color="white" />
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Exquisite Floating Glass Header Pod */}
      <View 
        className="absolute start-4 end-4 z-50 rounded-[28px] overflow-hidden border border-white/10" 
        style={{ 
          top: insets.top + 12,
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.18,
          shadowRadius: 20,
          elevation: 12,
          backgroundColor: 'rgba(9, 9, 11, 0.45)',
        }}
      >
        <BlurView 
          intensity={45}
          tint="dark"
          style={{ 
            paddingTop: 16,
            paddingBottom: 16,
          }}
        >
          {/* Subtle liquid pink-gold gradient border divider at bottom */}
          <LinearGradient 
            colors={['#FF1464', '#D4AF37']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }} 
            style={{ 
              height: 2, 
              width: '100%', 
              position: 'absolute', 
              bottom: 0, 
              opacity: 0.85 
            }} 
          />

          <View className="px-5 flex-row items-center justify-between">
            {/* Back Chevron Pod */}
            <Pressable 
              onPress={() => {
                impactLight();
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center active:bg-white/10 active:scale-95"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
              }}
            >
              <ChevronRight size={20} color="white" />
            </Pressable>
            
            {/* Premium Cinematic Bilingual Title Block */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 12 }}>
              <Text 
                style={{ 
                  fontSize: 10, 
                  letterSpacing: 2.5, 
                  color: '#D4AF37', 
                  fontFamily: 'Rubik-Bold', 
                  textTransform: 'uppercase',
                  opacity: 0.95,
                  textAlign: 'center'
                }}
              >
                CINEBOOK PLATINUM
              </Text>
              <Text 
                className="text-white text-lg mt-0.5" 
                style={{ 
                  fontFamily: 'Rubik-Bold', 
                  letterSpacing: 0.5,
                  textShadowColor: 'rgba(255, 20, 100, 0.4)',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 6
                }}
              >
                גילוי סניפים
              </Text>
            </View>
            
            {/* View Mode Toggle Pod */}
            {MapView ? (
              <Pressable 
                onPress={() => {
                  impactMedium();
                  setViewMode(viewMode === 'map' ? 'list' : 'map');
                }}
                className="w-10 h-10 rounded-full items-center justify-center active:scale-95"
                style={{
                  backgroundColor: viewMode === 'map' ? 'rgba(255, 20, 100, 0.15)' : 'rgba(212, 175, 55, 0.15)',
                  borderWidth: 1,
                  borderColor: viewMode === 'map' ? 'rgba(255, 20, 100, 0.35)' : 'rgba(212, 175, 55, 0.35)',
                  shadowColor: viewMode === 'map' ? '#FF1464' : '#D4AF37',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 4
                }}
              >
                {viewMode === 'map' ? (
                  <List size={18} color="#FF1464" />
                ) : (
                  <MapIcon size={18} color="#D4AF37" />
                )}
              </Pressable>
            ) : (
              <View className="w-10 h-10" />
            )}
          </View>
        </BlurView>
      </View>

      {/* Map View */}
      {viewMode === 'map' && MapView ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          mapType="standard"
          customMapStyle={darkMapStyle}
          initialRegion={{
            latitude: selectedBranch?.lat || BRANCHES[0].lat,
            longitude: selectedBranch?.lng || BRANCHES[0].lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {BRANCHES.map(branch => (
            <Marker
              key={branch.id}
              coordinate={{ latitude: branch.lat, longitude: branch.lng }}
              onPress={() => handleMarkerPress(branch)}
              tracksViewChanges={Platform.OS === 'ios'}
            >
              <PulsingMarker active={selectedBranch?.id === branch.id} />
            </Marker>
          ))}
          {userLocation && (
            <Marker
              coordinate={{ 
                latitude: userLocation.coords.latitude, 
                longitude: userLocation.coords.longitude 
              }}
              title="מיקום שלי"
            >
              <View className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
            </Marker>
          )}

          {userLocation && selectedBranch && routeCoords.length > 0 && (
            <>
              {/* Geodesic curved path background glow */}
              <Polyline
                coordinates={routeCoords}
                strokeColor="rgba(229, 9, 20, 0.25)"
                strokeWidth={5}
                lineDashPattern={Platform.OS === 'android' ? [10, 10] : undefined}
              />
              {/* Main curved route line */}
              <Polyline
                coordinates={routeCoords}
                strokeColor={Colors.primary}
                strokeWidth={2.5}
              />
              {/* Liquid flowing pulse traveling along the geodesic route */}
              {(() => {
                if (routeCoords.length > 0 && routeCoords[pulseIndex]) {
                  return (
                    <Marker
                      coordinate={routeCoords[pulseIndex]}
                      anchor={{ x: 0.5, y: 0.5 }}
                      tracksViewChanges={false}
                    >
                      <View 
                        className="w-4 h-4 rounded-full bg-white justify-center items-center"
                        style={{
                          shadowColor: Colors.primary,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.8,
                          shadowRadius: 6,
                          elevation: 5,
                          borderWidth: 2,
                          borderColor: Colors.primary,
                        }}
                      >
                        <View className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </View>
                    </Marker>
                  );
                }
                return null;
              })()}
            </>
          )}
        </MapView>
      ) : (
        <View className="flex-1" style={{ paddingTop: insets.top + 92 }}>
          <FlatList
            data={BRANCHES}
            renderItem={renderBranchItem}
            keyExtractor={item => item.id}
            ListHeaderComponent={() => (
              <View 
                className="mx-5 mt-4 mb-5 overflow-hidden rounded-[24px] border"
                style={{
                  backgroundColor: 'rgba(212, 175, 55, 0.04)',
                  borderColor: 'rgba(212, 175, 55, 0.25)',
                }}
              >
                <BlurView intensity={20} tint="dark" className="p-5 flex-row items-start justify-end">
                  <View className="flex-1 items-end pr-3">
                    <View className="flex-row items-center justify-end mb-1">
                      <Text className="text-[#D4AF37] text-sm font-bold text-right" style={{ fontFamily: 'Rubik-Bold' }}>
                        הזמנה חכמה מבוססת מיקום
                      </Text>
                      <Sparkles size={16} color="#D4AF37" style={{ marginLeft: 6 }} />
                    </View>
                    <Text className="text-white/70 text-[12px] leading-5 text-right" style={{ fontFamily: 'Rubik-Regular', writingDirection: 'rtl' }}>
                      CineBook מציגה את בתי הקולנוע הקרובים אלייך ביותר עם חישוב מרחק מדויק בזמן אמת, כיווני נסיעה מהירים, וגישה ישירה למערכת בחירת המושבים החדשנית שלנו.
                    </Text>
                  </View>
                </BlurView>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 220 }}
          />
        </View>
      )}

      {/* Horizontal Branch Cards Slider */}
      {viewMode === 'map' && (
        <Animated.View 
          entering={SlideInDown.duration(400)}
          className="absolute start-0 end-0 z-50"
          style={{ bottom: bottomOffset }}
          pointerEvents="box-none"
        >
          <FlatList
            ref={horizontalListRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            data={BRANCHES}
            keyExtractor={item => `horizontal-${item.id}`}
            snapToInterval={width - 24}
            snapToAlignment="center"
            decelerationRate="fast"
            getItemLayout={(data, index) => ({
              length: width - 24,
              offset: (width - 24) * index,
              index,
            })}
            contentContainerStyle={{ 
              paddingHorizontal: 12, 
              paddingBottom: 8,
              alignItems: 'center' 
            }}
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const index = Math.round(offsetX / (width - 24));
              if (index >= 0 && index < BRANCHES.length) {
                const branch = BRANCHES[index];
                if (selectedBranch?.id !== branch.id) {
                  setSelectedBranch(branch);
                  impactLight();
                  if (mapRef.current) {
                    mapRef.current.animateToRegion({
                      latitude: branch.lat,
                      longitude: branch.lng,
                      latitudeDelta: 0.015,
                      longitudeDelta: 0.015,
                    }, 300);
                  }
                }
              }
            }}
            renderItem={({ item }) => {
              const isSelected = selectedBranch?.id === item.id;
              return (
                <View 
                  style={{ 
                    width: width - 40,
                    marginHorizontal: 8,
                  }}
                >
                  <BlurView 
                    intensity={35}
                    tint="dark"
                    className="rounded-[32px] overflow-hidden border p-5 flex-col"
                    style={{ 
                      backgroundColor: isSelected ? 'rgba(37, 18, 20, 0.75)' : 'rgba(15, 15, 18, 0.65)',
                      borderColor: isSelected ? '#FF1464' : 'rgba(255, 255, 255, 0.08)',
                      shadowColor: '#FF1464',
                      shadowOffset: { width: 0, height: 10 },
                      shadowOpacity: isSelected ? 0.45 : 0,
                      shadowRadius: 15,
                      elevation: isSelected ? 8 : 0,
                    }}
                  >
                    {/* Header Row: Pure Premium LTR Layout */}
                    <View className="flex-row gap-4 mb-4 items-center justify-between">
                      {/* Left: Cinema Image with hot-pink glowing halo frame */}
                      <View 
                        style={{ 
                          borderRadius: 16, 
                          borderWidth: 2, 
                          borderColor: isSelected ? '#FF1464' : 'transparent',
                          padding: 2,
                          shadowColor: '#FF1464',
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: isSelected ? 0.8 : 0,
                          shadowRadius: 6,
                          elevation: isSelected ? 4 : 0,
                        }}
                      >
                        <Image 
                          source={{ uri: item.image }} 
                          className="rounded-xl border border-white/10" 
                          style={{ width: 50, height: 50 }}
                          resizeMode="cover"
                        />
                      </View>

                      {/* Middle: Info - Left-aligned text (LTR) */}
                      <View className="flex-1 items-start justify-center">
                        <Text 
                          className="text-white text-[16px] font-bold text-left" 
                          style={{ fontFamily: 'Rubik-Bold', writingDirection: 'ltr' }}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text 
                          className="text-textMuted text-[12px] text-left mt-0.5" 
                          style={{ fontFamily: 'Rubik-Regular', writingDirection: 'ltr' }}
                          numberOfLines={1}
                        >
                          {item.address}
                        </Text>
                      </View>
                      
                      {/* Right: action details (phone/navigate) */}
                      <View className="flex-row gap-2">
                        <Pressable 
                          onPress={() => {
                            impactLight();
                            handleCall(item.phone);
                          }}
                          className="w-10 h-10 rounded-full items-center justify-center bg-white/5 border border-white/10 active:opacity-75"
                        >
                          <Phone size={15} color="white" />
                        </Pressable>
                        <Pressable 
                          onPress={() => {
                            impactMedium();
                            handleNavigate(item);
                          }}
                          className="w-10 h-10 rounded-full items-center justify-center active:opacity-75"
                          style={{
                            backgroundColor: '#FF1464',
                            shadowColor: '#FF1464',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 6,
                            elevation: 3,
                          }}
                        >
                          <Navigation size={15} color="white" />
                        </Pressable>
                      </View>
                    </View>

                    {/* Bottom Row: features & distance info */}
                    <View className="flex-row items-center justify-between pt-3 border-t border-white/5">
                      {/* Distance */}
                      <View className="flex-row items-center bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                        <MapPin size={11} color={Colors.secondary} style={{ marginRight: 4 }} />
                        <Text className="text-secondary text-[11px] font-bold" style={{ fontFamily: 'Rubik-Medium' }}>
                          {calculateDistance(item.lat, item.lng) || item.distance}
                        </Text>
                      </View>

                      {/* Badges */}
                      <View className="flex-row gap-1">
                        {item.features?.slice(0, 2).map((feat: string, idx: number) => (
                          <View key={idx} className="bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                            <Text className="text-white/60 text-[10px] font-medium" style={{ fontFamily: 'Rubik-Regular' }}>
                              {feat}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </BlurView>
                </View>
              );
            }}
          />
        </Animated.View>
      )}

      {/* Exquisite User Location Glass Button Pod */}
      {viewMode === 'map' && (
        <View 
          className="absolute end-5 rounded-2xl overflow-hidden border border-white/15 shadow-2xl z-50"
          style={{ 
            bottom: bottomOffset + 180,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8
          }}
        >
          <BlurView
            intensity={30}
            tint="dark"
            style={{ backgroundColor: 'rgba(20, 20, 24, 0.7)' }}
          >
            <Pressable 
              onPress={() => {
                selection();
                centerOnUser();
              }}
              className="w-12 h-12 items-center justify-center"
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            >
              <Navigation size={20} color="#FF1464" />
            </Pressable>
          </BlurView>
        </View>
      )}
    </View>
  );
}

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#09090B" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#78716C" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#09090B" }] },
  { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#27272A" }] },
  { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#52525B" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1E1E21" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#27272A" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#A1A1AA" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#2D2D30" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#3F3F46" }] },
  { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#040406" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#52525B" }] }
];
