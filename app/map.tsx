import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Pressable, 
  Image, 
  Linking, 
  Alert, 
  I18nManager
} from 'react-native';
import { useHaptics } from '@/lib/useHaptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  ChevronRight,
  ChevronLeft,
  Sparkles
} from 'lucide-react-native';
import { Colors } from '@/constants/Theme';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { BRANCHES as GLOBAL_BRANCHES } from '@/constants/Branches';

const BRANCHES = GLOBAL_BRANCHES.map(b => ({
  id: b.id,
  name: b.name,
  lat: b.coords.latitude,
  lng: b.coords.longitude,
  address: b.location,
  distance: b.distance,
  image: b.image,
  features: b.features,
  phone: '*2202'
}));

export default function CinemaMapScreen() {
  const insets = useSafeAreaInsets();
  const { selection, impactLight, impactMedium } = useHaptics();
  const bottomOffset = Math.max(insets.bottom + 20, 36);

  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0]);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  // Load User Location for real-time distance calculations
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        let location = await Location.getLastKnownPositionAsync({});
        if (!location) {
          location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        }
        setUserLocation(location);
      } catch {
        // Location not authorized or disabled
      }
    })();
  }, []);

  const calculateDistance = (lat: number, lng: number) => {
    if (!userLocation) return null;
    const R = 6371; // Earth radius in km
    const dLat = ((lat - userLocation.coords.latitude) * Math.PI) / 180;
    const dLon = ((lng - userLocation.coords.longitude) * Math.PI) / 180;
    const a = 
      0.5 - 
      Math.cos(dLat) / 2 + 
      (Math.cos((userLocation.coords.latitude * Math.PI) / 180) * 
        Math.cos((lat * Math.PI) / 180) * 
        (1 - Math.cos(dLon))) / 2;

    const distance = R * 2 * Math.asin(Math.sqrt(a));
    return `${distance.toFixed(1)} ק"מ`;
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
          Linking.openURL(googleMapsUrl).catch(() => {
            Alert.alert('שגיאה', 'לא ניתן לפתוח את אפליקציית המפות');
          });
        }
      })
      .catch(() => {
        Linking.openURL(googleMapsUrl);
      });
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('שגיאה', 'שיחות טלפון אינן נתמכות במכשיר זה');
    });
  };

  const renderBranchCard = ({ item }: { item: typeof BRANCHES[0] }) => {
    const isSelected = selectedBranch?.id === item.id;
    return (
      <View 
        style={[
          styles.listCardFrame,
          {
            borderColor: isSelected ? '#FF1464' : 'rgba(255, 255, 255, 0.06)',
            backgroundColor: isSelected ? 'rgba(255, 20, 100, 0.05)' : 'rgba(255, 255, 255, 0.02)',
          }
        ]}
      >
        <Pressable 
          onPress={() => {
            selection();
            setSelectedBranch(item);
          }}
          style={styles.cardInteractiveRow}
        >
          {/* Cinema Image Thumbnail */}
          <View style={[styles.thumbnailWrap, { borderColor: isSelected ? '#FF1464' : 'rgba(255, 255, 255, 0.1)' }]}>
            <Image source={{ uri: item.image }} style={styles.thumbnailImg} resizeMode="cover" />
          </View>

          {/* Details (Logical RTL Alignment) */}
          <View style={styles.cardDetails}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.name}
            </Text>
            
            <View style={styles.cardSubRow}>
              <MapPin size={11} color={isSelected ? '#FF1464' : '#A1A1AA'} style={{ marginEnd: 4 }} />
              <Text style={styles.cardAddress} numberOfLines={1}>
                {item.address}
              </Text>
            </View>

            {/* Badges */}
            <View style={styles.badgesContainer}>
              {item.features?.slice(0, 3).map((feat, idx) => (
                <View 
                  key={idx} 
                  style={[
                    styles.featureBadge, 
                    { 
                      backgroundColor: isSelected ? 'rgba(255, 20, 100, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      borderColor: isSelected ? 'rgba(255, 20, 100, 0.25)' : 'rgba(255, 255, 255, 0.06)'
                    }
                  ]}
                >
                  <Text style={[styles.featureBadgeText, { color: isSelected ? '#FF1464' : '#A1A1AA' }]}>
                    {feat}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Pressable>

        {/* Action Controls */}
        <View style={styles.cardActions}>
          {/* Distance */}
          <View style={[styles.distancePill, { borderColor: isSelected ? '#FF1464' : 'rgba(255, 255, 255, 0.08)' }]}>
            <Text style={[styles.distanceText, { color: isSelected ? '#FF1464' : '#FAFAF7' }]}>
              {calculateDistance(item.lat, item.lng) || item.distance}
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonsWrap}>
            <Pressable 
              onPress={() => {
                impactMedium();
                handleNavigate(item);
              }}
              style={styles.navigateBtn}
            >
              <Navigation size={14} color="white" />
            </Pressable>

            <Pressable 
              onPress={() => {
                impactLight();
                handleCall(item.phone);
              }}
              style={styles.phoneBtn}
            >
              <Phone size={14} color="#A1A1AA" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Floating Glass Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
        <BlurView intensity={35} tint="dark" style={styles.headerBlur}>
          <View style={styles.headerContent}>
            {/* Back Button */}
            <Pressable 
              onPress={() => {
                impactLight();
                router.back();
              }}
              style={styles.backBtn}
            >
              {I18nManager.isRTL ? <ChevronRight size={20} color="white" /> : <ChevronLeft size={20} color="white" />}
            </Pressable>
            
            {/* Header title block */}
            <View style={styles.titleContainer}>
              <Text style={styles.brandSubtitle}>CINEBOOK PLATINUM</Text>
              <Text style={styles.brandTitle}>גילוי סניפים</Text>
            </View>
            
            {/* Toggle Placeholder (Empty view to balance row) */}
            <View style={styles.emptyTogglePod} />
          </View>
          <LinearGradient 
            colors={['#FF1464', '#E5FF00']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }} 
            style={styles.dividerLine} 
          />
        </BlurView>
      </View>

      {/* Scrollable list of branches */}
      <FlatList
        data={BRANCHES}
        renderItem={renderBranchCard}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContainer, { paddingTop: insets.top + 90, paddingBottom: bottomOffset + 100 }]}
        ListHeaderComponent={() => (
          <View style={styles.listPromoCard}>
            <BlurView intensity={20} tint="dark" style={styles.promoBlur}>
              <View style={styles.promoContent}>
                <Sparkles size={16} color="#E5FF00" style={{ marginBottom: 4 }} />
                <Text style={styles.promoTitle}>הזמנה חכמה מבוססת מיקום</Text>
                <Text style={styles.promoDesc}>
                  CineBook מציגה את בתי הקולנוע הקרובים אלייך ביותר עם חישוב מרחק מדויק בזמן אמת, כיווני נסיעה מהירים, וגישה ישירה למערכת בחירת המושבים החדשנית שלנו.
                </Text>
              </View>
            </BlurView>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  headerContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerBlur: {
    paddingBottom: 12,
    paddingTop: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  brandSubtitle: {
    fontSize: 9,
    letterSpacing: 2,
    color: '#E5FF00',
    fontFamily: 'Rubik-Bold',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  brandTitle: {
    fontSize: 18,
    color: '#FAFAF7',
    fontFamily: 'Rubik-Bold',
    marginTop: 2,
    textAlign: 'center',
  },
  emptyTogglePod: {
    width: 40,
    height: 40,
  },
  dividerLine: {
    height: 1.5,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    opacity: 0.8,
  },
  
  // List view styles
  listContainer: {
    paddingHorizontal: 16,
  },
  listPromoCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(229, 255, 0, 0.2)',
    marginBottom: 20,
    marginTop: 10,
    backgroundColor: 'rgba(229, 255, 0, 0.02)',
  },
  promoBlur: {
    padding: 16,
  },
  promoContent: {
    alignItems: 'flex-start',
  },
  promoTitle: {
    fontSize: 14,
    color: '#E5FF00',
    fontFamily: 'Rubik-Bold',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  promoDesc: {
    fontSize: 11,
    color: '#A1A1AA',
    fontFamily: 'Assistant-Regular',
    textAlign: 'left',
    writingDirection: 'rtl',
    lineHeight: 18,
  },
  listCardFrame: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInteractiveRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingEnd: 12,
  },
  thumbnailWrap: {
    width: 60,
    height: 60,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  cardDetails: {
    flex: 1,
    paddingStart: 12,
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 15,
    color: '#FAFAF7',
    fontFamily: 'Rubik-Bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cardSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cardAddress: {
    fontSize: 11,
    color: '#A1A1AA',
    fontFamily: 'Assistant-Regular',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  featureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  featureBadgeText: {
    fontSize: 9,
    fontFamily: 'Rubik-Medium',
  },
  cardActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 84,
  },
  distancePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 10,
    fontFamily: 'Rubik-Medium',
  },
  buttonsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navigateBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF1464',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
