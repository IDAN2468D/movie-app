import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Pressable, Image, Platform, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  Clock, 
  X,
  ChevronLeft,
  Search,
  Map as MapIcon,
  List
} from 'lucide-react-native';
import { Colors, Typography } from '@/constants/Theme';
import Animated, { FadeInDown, SlideInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

import { BRANCHES as GLOBAL_BRANCHES } from '@/constants/Branches';

// Attempt to import MapView, fallback if it fails
let MapView: any, Marker: any, PROVIDER_GOOGLE: any;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
} catch (e) {
  console.warn('MapView not available');
}

const { width, height } = Dimensions.get('window');

const BRANCHES = GLOBAL_BRANCHES.map(b => ({
  id: b.id,
  name: b.name,
  lat: b.coords.latitude,
  lng: b.coords.longitude,
  address: b.location,
  distance: b.distance,
  image: b.image,
  phone: '*2202' // Default cinema phone number
}));

export default function CinemaMapScreen() {
  const insets = useSafeAreaInsets();
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<any>(null);

  React.useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
      } catch (e) {
        console.warn('ExpoLocation native module not found. Please rebuild your development build.');
        setErrorMsg('Location services not available in this build');
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
    if (mapRef.current && MapView) {
      mapRef.current.animateToRegion({
        latitude: branch.lat,
        longitude: branch.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const handleNavigate = (branch: any) => {
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${branch.lat},${branch.lng}`;
    const wazeUrl = `waze://?ll=${branch.lat},${branch.lng}&navigate=yes`;
    
    Linking.canOpenURL(wazeUrl).then(supported => {
      if (supported) {
        Alert.alert(
          'ניווט לסניף',
          'בחר אפליקציית ניווט',
          [
            { text: 'Waze', onPress: () => Linking.openURL(wazeUrl) },
            { text: 'Google Maps', onPress: () => Linking.openURL(googleMapsUrl) },
            { text: 'ביטול', style: 'cancel' }
          ]
        );
      } else {
        Linking.openURL(googleMapsUrl);
      }
    });
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/-/g, '')}`);
  };

  const renderBranchItem = ({ item }: { item: typeof BRANCHES[0] }) => (
    <Pressable 
      onPress={() => handleBranchSelect(item)}
      className={`mx-5 mb-4 p-4 rounded-[28px] border ${selectedBranch.id === item.id ? 'bg-primary/20 border-primary/50' : 'bg-surfaceLight border-white/5'}`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 items-start">
          <Text className="text-white text-[16px] font-bold mb-1" style={{ fontFamily: 'Rubik-Bold' }}>{item.name}</Text>
          <View className="flex-row items-center">
            <MapPin size={12} color={Colors.textMuted} />
            <Text className="text-textMuted text-[12px] ms-1">{item.address}</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable 
            onPress={() => handleNavigate(item)}
            className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 items-center justify-center"
          >
            <Navigation size={16} color={Colors.primary} />
          </Pressable>
          <Pressable 
            onPress={() => handleCall(item.phone)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center"
          >
            <Phone size={16} color="white" />
          </Pressable>
          <View className="bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <Text className="text-white/60 text-[11px] font-bold">{calculateDistance(item.lat, item.lng) || item.distance}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="absolute top-0 start-0 end-0 z-50 px-5 flex-row items-center justify-between" style={{ paddingTop: insets.top + 10 }}>
        <BlurView intensity={20} tint="dark" className="absolute inset-0" />
        <Pressable 
          onPress={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 items-center justify-center"
        >
          <X size={24} color="white" />
        </Pressable>
        <Text className="text-white text-h3 font-display">סניפי CineBook</Text>
        <Pressable 
          onPress={() => {
            const config = Constants.expoConfig as any;
            const apiKey = config?.android?.config?.googleMaps?.apiKey;
            
            if (viewMode === 'list' && Platform.OS === 'android' && !apiKey) {
              Alert.alert(
                "תצוגת מפה לא זמינה",
                "כדי להפעיל את המפה באנדרואיד יש להגדיר API Key ב-app.json ולבצע Build חדש. בינתיים ניתן להשתמש ברשימה ולנווט ממנה.",
                [{ text: "הבנתי" }]
              );
              return;
            }
            setViewMode(viewMode === 'map' ? 'list' : 'map');
          }}
          className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 items-center justify-center"
        >
          {viewMode === 'map' ? <List size={22} color={Colors.primary} /> : <MapIcon size={22} color={Colors.primary} />}
        </Pressable>
      </View>

      {/* Map View */}
      {viewMode === 'map' && MapView ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          customMapStyle={darkMapStyle}
          initialRegion={{
            latitude: selectedBranch.lat,
            longitude: selectedBranch.lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          provider={PROVIDER_GOOGLE}
        >
          {BRANCHES.map(branch => (
            <Marker
              key={branch.id}
              coordinate={{ latitude: branch.lat, longitude: branch.lng }}
              onPress={() => setSelectedBranch(branch)}
            >
              <View className={`w-10 h-10 rounded-full items-center justify-center border-2 ${selectedBranch.id === branch.id ? 'bg-primary border-white' : 'bg-surface border-primary'}`}>
                <MapPin size={20} color="white" fill={selectedBranch.id === branch.id ? 'white' : 'transparent'} />
              </View>
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
        </MapView>
      ) : (
        <View className="flex-1 pt-[120px]">
          <FlatList
            data={BRANCHES}
            renderItem={renderBranchItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 200 }}
          />
        </View>
      )}

      {/* Selected Branch Card */}
      {viewMode === 'map' && (
        <Animated.View 
          entering={SlideInDown.duration(500)}
          className="absolute bottom-10 start-5 end-5"
        >
          <BlurView intensity={80} tint="dark" className="rounded-[40px] overflow-hidden border border-white/10 shadow-2xl">
            <View className="p-6">
              <View className="flex-row gap-4 mb-6">
                <Image source={{ uri: selectedBranch.image }} className="w-24 h-24 rounded-3xl" />
                <View className="flex-1 items-start justify-center">
                  <Text className="text-white text-h3 font-bold mb-1" style={{ fontFamily: 'Rubik-Bold' }}>{selectedBranch.name}</Text>
                  <Text className="text-textMuted text-[13px] leading-tight mb-2 text-left">{selectedBranch.address}</Text>
                  <View className="flex-row items-center gap-3">
                    <View className="flex-row items-center">
                      <Clock size={14} color={Colors.secondary} />
                      <Text className="text-secondary text-[12px] ms-1 font-bold">פתוח עד 23:00</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View className="flex-row gap-3">
                <Pressable 
                  onPress={() => handleNavigate(selectedBranch)}
                  className="flex-1 bg-primary py-4 rounded-2xl items-center flex-row justify-center gap-2"
                >
                  <Navigation size={18} color="white" />
                  <Text className="text-white font-bold text-[14px]" style={{ fontFamily: 'Rubik-Bold' }}>ניווט לסניף</Text>
                </Pressable>
                <Pressable 
                  onPress={() => handleCall(selectedBranch.phone)}
                  className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl items-center justify-center"
                >
                  <Phone size={20} color="white" />
                </Pressable>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* User Location Button */}
      {viewMode === 'map' && (
        <Pressable 
          onPress={centerOnUser}
          className="absolute bottom-[240] end-5 w-12 h-12 bg-surfaceLight border border-white/10 rounded-2xl items-center justify-center shadow-xl"
        >
          <Navigation size={22} color="white" />
        </Pressable>
      )}
    </View>
  );
}

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#263c3f" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
  { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }
];
