import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Pressable, Image, Platform, Linking, Alert } from 'react-native';
import { useHaptics } from '@/lib/useHaptics';
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
let MapView: any, Marker: any, UrlTile: any, PROVIDER_GOOGLE: any;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  UrlTile = Maps.UrlTile;
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

        let location = await Location.getLastKnownPositionAsync({});
        if (!location) {
          location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        }
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

  const renderBranchItem = ({ item }: { item: typeof BRANCHES[0] }) => (
    <View 
      className="mx-5 mb-4 p-4 rounded-[32px] border-2 flex-row items-center justify-between"
      style={{
        backgroundColor: selectedBranch?.id === item.id ? '#251214' : '#18181C',
        borderColor: selectedBranch?.id === item.id ? Colors.primary : 'rgba(255, 255, 255, 0.08)',
        shadowColor: selectedBranch?.id === item.id ? Colors.primary : 'transparent',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: selectedBranch?.id === item.id ? 0.25 : 0,
        shadowRadius: 20,
        elevation: selectedBranch?.id === item.id ? 8 : 0,
      }}
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
        {/* Cinema Image Thumbnail */}
        <View style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }}>
          <Image 
            source={{ uri: item.image }} 
            className="rounded-[18px] border border-white/10" 
            style={{ width: 64, height: 64 }}
            resizeMode="cover"
          />
        </View>

        {/* Text Details */}
        <View className="flex-1 items-end justify-center px-3">
          <Text 
            className="text-white text-[16px] font-bold text-right" 
            style={{ fontFamily: 'Rubik-Bold', writingDirection: 'rtl' }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          
          <View className="flex-row items-center justify-end mt-1.5 mb-1.5" style={{ width: '100%' }}>
            <Text 
              className="text-textMuted text-[12px] text-right" 
              style={{ writingDirection: 'rtl', marginRight: 4, fontFamily: 'Rubik-Regular' }}
              numberOfLines={1}
            >
              {item.address}
            </Text>
            <MapPin size={11} color={Colors.textMuted} />
          </View>

          {/* Features badges */}
          {item.features && item.features.length > 0 && (
            <View className="flex-row flex-wrap gap-1 mt-1 justify-end" style={{ direction: 'rtl' }}>
              {item.features.slice(0, 3).map((feature, idx) => (
                <View 
                  key={idx} 
                  className="px-2 py-0.5 rounded-md"
                  style={{ 
                    backgroundColor: '#222226',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <Text className="text-white/60 text-[9px] font-bold" style={{ fontFamily: 'Rubik-Medium' }}>
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
            backgroundColor: '#26262B',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)'
          }}
        >
          <Text className="text-white/60 text-[10px] font-bold" style={{ fontFamily: 'Rubik-Medium' }}>
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
              backgroundColor: Colors.primary,
              shadowColor: Colors.primary,
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
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View 
        className="absolute top-0 start-0 end-0 z-50 px-5 flex-row items-center justify-between border-b border-primary/30" 
        style={{ 
          paddingTop: insets.top + 10,
          paddingBottom: 15,
          backgroundColor: 'rgba(9, 9, 11, 0.92)',
        }}
      >
        <Pressable 
          onPress={() => {
            impactLight();
            router.back();
          }}
          className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 items-center justify-center"
        >
          <X size={24} color="white" />
        </Pressable>
        <Text className="text-white text-h3 font-display">סניפי CineBook</Text>
        {MapView ? (
          <Pressable 
            onPress={() => {
              impactMedium();
              setViewMode(viewMode === 'map' ? 'list' : 'map');
            }}
            className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 items-center justify-center"
          >
            {viewMode === 'map' ? <List size={22} color={Colors.primary} /> : <MapIcon size={22} color={Colors.primary} />}
          </Pressable>
        ) : (
          <View className="w-12 h-12" />
        )}
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
              onPress={() => handleBranchSelect(branch)}
            >
              <View className={`w-10 h-10 rounded-full items-center justify-center border-2 ${selectedBranch?.id === branch.id ? 'bg-primary border-white' : 'bg-surface border-primary'}`}>
                <MapPin size={20} color="white" fill={selectedBranch?.id === branch.id ? 'white' : 'transparent'} />
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
            contentContainerStyle={{ paddingBottom: 220 }}
          />
        </View>
      )}

      {/* Selected Branch Card */}
      {selectedBranch && viewMode === 'map' && (
        <Animated.View 
          key={`detail-${selectedBranch.id}`}
          entering={SlideInDown.duration(400)}
          className="absolute start-5 end-5"
          style={{ bottom: bottomOffset }}
          pointerEvents="box-none"
        >
          <View 
            className="rounded-[40px] overflow-hidden border-2 p-6"
            style={{ 
              backgroundColor: Colors.surface,
              borderColor: 'rgba(229, 9, 20, 0.5)', // border-primary/50
              shadowColor: Colors.primary, // shadow-primary/30
              shadowOffset: { width: 0, height: 15 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* Close Button */}
            <Pressable 
              onPress={() => {
                impactLight();
                setSelectedBranch(null as any);
              }}
              className="absolute top-4 end-4 w-11 h-11 rounded-full bg-white/10 items-center justify-center z-50 active:opacity-70"
            >
              <X size={16} color="white" />
            </Pressable>

            <View className="flex-row gap-4 mb-6">
              <Image 
                source={{ uri: selectedBranch.image }} 
                className="rounded-3xl" 
                style={{ width: 96, height: 96 }}
                resizeMode="cover"
              />
              <View 
                className="flex-1 justify-center" 
                style={{ 
                  paddingLeft: 40, // Avoid close button which is on the top-left in RTL
                  alignItems: 'flex-start', // Align elements to the left in LTR
                  direction: 'ltr', // Force LTR rules inside the text container
                }}
              >
                <Text 
                  className="text-white text-h3 font-bold mb-1" 
                  style={{ 
                    fontFamily: 'Rubik-Bold', 
                    textAlign: 'right', // Align to the other side (right) next to the image
                    writingDirection: 'rtl',
                    alignSelf: 'stretch',
                  }}
                >
                  {selectedBranch.name}
                </Text>
                
                <Text 
                  className="text-textMuted text-[13px] leading-tight mb-2" 
                  style={{ 
                    textAlign: 'left', // Left align address
                    writingDirection: 'ltr' 
                  }}
                >
                  {selectedBranch.address}
                </Text>
                
                <View 
                  className="flex-row items-center gap-3" 
                  style={{ 
                    flexDirection: 'row', 
                    alignSelf: 'flex-start' 
                  }}
                >
                  <View className="flex-row items-center" style={{ flexDirection: 'row' }}>
                    <Clock size={14} color={Colors.secondary} style={{ marginRight: 4 }} />
                    <Text 
                      className="text-secondary text-[12px] font-bold" 
                      style={{ 
                        textAlign: 'left', 
                        writingDirection: 'ltr' 
                      }}
                    >
                      פתוח עד 23:00
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="flex-row gap-3">
              <Pressable 
                onPress={() => {
                  impactMedium();
                  handleNavigate(selectedBranch);
                }}
                className="flex-1 bg-primary py-4 rounded-2xl items-center flex-row justify-center gap-2"
              >
                <Navigation size={18} color="white" />
                <Text className="text-white font-bold text-[14px]" style={{ fontFamily: 'Rubik-Bold' }}>ניווט לסניף</Text>
              </Pressable>
              <Pressable 
                onPress={() => {
                  impactLight();
                  handleCall(selectedBranch.phone);
                }}
                className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl items-center justify-center"
              >
                <Phone size={20} color="white" />
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}

      {/* User Location Button */}
      {viewMode === 'map' && (
        <Pressable 
          onPress={() => {
            selection();
            centerOnUser();
          }}
          className="absolute end-5 w-12 h-12 bg-surfaceLight border border-white/10 rounded-2xl items-center justify-center shadow-xl z-50"
          style={{ bottom: selectedBranch ? bottomOffset + 200 : bottomOffset }}
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
