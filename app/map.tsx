import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Sparkles,
  X,
  EyeOff
} from 'lucide-react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { useSocialStore, IFriendLocation } from '@/store/useSocialStore';
import { getImageSource } from '@/utils/ImageUtils';
import { BRANCHES as GLOBAL_BRANCHES } from '@/constants/Branches';

// Native maps disabled — using Leaflet.js inside WebView instead

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

// Generate Leaflet HTML for the dark interactive map
function generateLeafletHTML(
  userLat: number,
  userLng: number,
  friends: IFriendLocation[]
): string {
  // Serialize friend data as JSON to avoid quote escaping issues in HTML
  const friendsJSON = JSON.stringify(
    friends.map(f => ({
      id: f.id,
      name: f.name,
      firstName: f.name.split(' ')[0],
      initials: f.name.slice(0, 2),
      profileImage: f.profileImage || null,
      lat: f.coords.latitude,
      lng: f.coords.longitude,
    }))
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #09090B; }
    .leaflet-container { background: #09090B !important; }
    .leaflet-control-attribution { display: none !important; }
    .leaflet-control-zoom { display: none !important; }

    #err {
      display: none; position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%); color: #A1A1AA;
      font-family: sans-serif; font-size: 14px; text-align: center; z-index: 999;
    }

    .user-marker { display: flex; align-items: center; justify-content: center; }
    .user-dot-outer {
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(0, 150, 255, 0.2);
      border: 2px solid rgba(0, 150, 255, 0.4);
      display: flex; align-items: center; justify-content: center;
      animation: pulse 2s ease-in-out infinite;
    }
    .user-dot-inner {
      width: 12px; height: 12px; border-radius: 50%;
      background: #0096FF; border: 2px solid #FFFFFF;
      box-shadow: 0 0 12px rgba(0, 150, 255, 0.6);
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.4); opacity: 0.6; }
    }

    .friend-marker { background: none !important; border: none !important; }
    .marker-wrap {
      display: flex; flex-direction: column; align-items: center;
      cursor: pointer; transition: transform 0.2s ease;
    }
    .marker-wrap:active { transform: scale(0.92); }
    .avatar-ring {
      width: 48px; height: 48px; border-radius: 50%;
      border: 2.5px solid #FF1464; background: #1E1E21;
      overflow: hidden; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 16px rgba(255, 20, 100, 0.45), 0 4px 12px rgba(0,0,0,0.5);
    }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
    .avatar-fallback {
      color: #FF1464; font-family: sans-serif; font-weight: 700; font-size: 14px;
      display: flex; align-items: center; justify-content: center;
      width: 100%; height: 100%;
    }
    .name-badge {
      margin-top: 4px;
      background: rgba(18, 18, 20, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px; padding: 2px 8px;
      color: #FAFAF7; font-family: sans-serif; font-size: 10px; font-weight: 600;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="err">Unable to load map</div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    try {
      var map = L.map('map', {
        center: [31.5, 34.9],
        zoom: 8,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      var userIcon = L.divIcon({
        className: 'user-marker',
        html: '<div class="user-dot-outer"><div class="user-dot-inner"></div></div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      L.marker([${userLat}, ${userLng}], { icon: userIcon, interactive: false }).addTo(map);

      var friends = ${friendsJSON};
      friends.forEach(function(f) {
        var imgTag = f.profileImage
          ? '<img src="' + f.profileImage + '" class="avatar-img" />'
          : '';
        var fallback = '<span class="avatar-fallback">' + f.initials + '</span>';
        var avatarContent = f.profileImage ? imgTag + fallback : fallback;

        var el = L.divIcon({
          className: 'friend-marker',
          html: '<div class="marker-wrap">' +
                  '<div class="avatar-ring">' + avatarContent + '</div>' +
                  '<div class="name-badge">' + f.firstName + '</div>' +
                '</div>',
          iconSize: [56, 70],
          iconAnchor: [28, 70]
        });

        L.marker([f.lat, f.lng], { icon: el })
          .addTo(map)
          .on('click', function() {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                action: 'selectFriend',
                friendId: f.id
              }));
            }
          });
      });
      // Auto-fit map to show all markers
      if (friends.length > 0) {
        var allPoints = [[${userLat}, ${userLng}]];
        friends.forEach(function(f) { allPoints.push([f.lat, f.lng]); });
        map.fitBounds(allPoints, { padding: [40, 40], maxZoom: 13 });
      }
    } catch(e) {
      document.getElementById('err').style.display = 'block';
      document.getElementById('err').textContent = e.message;
    }
  </script>
</body>
</html>`;
}

export default function CinemaMapScreen() {
  const insets = useSafeAreaInsets();
  const { selection, impactLight, impactMedium } = useHaptics();
  const bottomOffset = Math.max(insets.bottom + 20, 36);

  const [activeTab, setActiveTab] = useState<'branches' | 'friends'>('branches');
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0]);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<IFriendLocation | null>(null);

  const { friendLocations, isGhostMode, fetchFriendLocations, toggleGhostMode } = useSocialStore();

  // Handle messages from the Leaflet WebView (friend marker taps)
  const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.action === 'selectFriend' && data.friendId) {
        const friend = friendLocations.find(f => f.id === data.friendId);
        if (friend) {
          impactMedium();
          setSelectedFriend(friend);
        }
      }
    } catch {
      // Ignore malformed messages
    }
  }, [friendLocations, impactMedium]);

  // Memoize the Leaflet HTML to avoid unnecessary WebView reloads
  const leafletHTML = useMemo(() => {
    const lat = userLocation ? userLocation.coords.latitude : 32.0853;
    const lng = userLocation ? userLocation.coords.longitude : 34.7818;
    return generateLeafletHTML(lat, lng, friendLocations);
  }, [userLocation, friendLocations]);

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

  // Fetch friend locations when switching to the Friends Map tab
  useEffect(() => {
    if (activeTab === 'friends') {
      fetchFriendLocations();
    }
  }, [activeTab, fetchFriendLocations]);

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

  const renderMapView = () => {
    return (
      <View style={{ flex: 1, backgroundColor: '#09090B' }}>
        <WebView
          style={{ flex: 1, backgroundColor: '#09090B' }}
          source={{ html: leafletHTML, baseUrl: 'https://unpkg.com' }}
          onMessage={handleWebViewMessage}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          androidLayerType="hardware"
          allowsInlineMediaPlayback={true}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          cacheEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.mapLoading}>
              <Text style={styles.mapLoadingText}>טוען מפה...</Text>
            </View>
          )}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Floating Glass Header */}
      <View style={[styles.headerContainer, { top: insets.top + 12 }]}>
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
              <Text style={styles.brandSubtitle}>CINEBOOK SOCIAL</Text>
              <Text style={styles.brandTitle}>
                {activeTab === 'branches' ? 'גילוי סניפים' : 'חברים בסרט 🍿'}
              </Text>
            </View>

            {/* Toggle Placeholder (Empty view to balance row) */}
            <View style={styles.emptyTogglePod} />
          </View>

          {/* Tabs Container */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[styles.tabButton, activeTab === 'branches' && styles.activeTabButton]}
              onPress={() => {
                impactLight();
                setActiveTab('branches');
                setSelectedFriend(null);
              }}
            >
              <Text style={[styles.tabText, activeTab === 'branches' && styles.activeTabText]}>
                רשימת סניפים
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabButton, activeTab === 'friends' && styles.activeTabButton]}
              onPress={() => {
                impactLight();
                setActiveTab('friends');
              }}
            >
              <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
                מפת חברים
              </Text>
            </Pressable>
          </View>

          <LinearGradient
            colors={['#FF1464', '#E5FF00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dividerLine}
          />
        </BlurView>
      </View>

      {/* Screen Content based on selected Tab */}
      {activeTab === 'branches' ? (
        <FlatList
          data={BRANCHES}
          renderItem={renderBranchCard}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContainer, { paddingTop: insets.top + 140, paddingBottom: bottomOffset + 100 }]}
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
      ) : (
        <View style={{ flex: 1 }}>
          {renderMapView()}

          {/* Ghost Mode Toggle Panel */}
          <BlurView intensity={25} tint="dark" style={[styles.ghostModeFloatCard, { top: insets.top + 150 }]}>
            <View style={styles.ghostModeRow}>
              <EyeOff size={16} color={isGhostMode ? '#E5FF00' : '#A1A1AA'} style={{ marginEnd: 8 }} />
              <Text style={styles.ghostModeLabel}>מצב רוח (הסתר אותי)</Text>
              <Pressable
                style={[styles.ghostModeSwitch, isGhostMode ? styles.ghostModeSwitchActive : styles.ghostModeSwitchInactive]}
                onPress={() => {
                  impactLight();
                  toggleGhostMode(!isGhostMode);
                }}
              >
                <View style={[styles.ghostModeSwitchKnob, isGhostMode ? styles.ghostModeSwitchKnobActive : styles.ghostModeSwitchKnobInactive]} />
              </Pressable>
            </View>
          </BlurView>

          {/* Friend Details Card */}
          {selectedFriend && (
            <Animated.View
              entering={FadeInDown.springify().damping(15)}
              exiting={FadeOutDown}
              style={[styles.friendDetailsFloatingCard, { bottom: bottomOffset }]}
            >
              <BlurView intensity={35} tint="dark" style={styles.friendDetailsBlur}>
                <Pressable
                  style={styles.closeCardBtn}
                  onPress={() => {
                    impactLight();
                    setSelectedFriend(null);
                  }}
                >
                  <X size={16} color="white" />
                </Pressable>

                <View style={styles.friendDetailsHeader}>
                  <View style={styles.friendProfileSummary}>
                    <View style={styles.friendDetailsAvatarRing}>
                      {selectedFriend.profileImage ? (
                        <Image source={{ uri: selectedFriend.profileImage }} style={styles.friendDetailsAvatar} />
                      ) : (
                        <View style={styles.friendDetailsAvatarFallback}>
                          <Text style={styles.friendDetailsAvatarFallbackText}>{selectedFriend.name.slice(0, 2)}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.friendDetailsInfoCol}>
                      <Text style={styles.friendDetailsName}>{selectedFriend.name}</Text>
                      <View style={styles.liveBadge}>
                        <Text style={styles.liveBadgeText}>צופה כעת בסרט 🍿</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.movieDetailsRow}>
                  <Image
                    source={getImageSource(selectedFriend.activeMovie.posterPath, 'poster', 'small')}
                    style={styles.movieDetailsPoster}
                    resizeMode="cover"
                  />
                  <View style={styles.movieDetailsMeta}>
                    <Text style={styles.movieDetailsTitle} numberOfLines={2}>{selectedFriend.activeMovie.title}</Text>
                    <Text style={styles.movieDetailsTheater} numberOfLines={1}>📍 {selectedFriend.activeMovie.branchName}</Text>
                    <Text style={styles.movieDetailsTime}>⏰ סיום משוער: {new Date(selectedFriend.activeMovie.showtimeEnd).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </View>

                <Pressable
                  style={styles.navigateFriendBtn}
                  onPress={() => {
                    impactMedium();
                    const branch = BRANCHES.find(b => b.name === selectedFriend.activeMovie.branchName) || {
                      lat: selectedFriend.coords.latitude,
                      lng: selectedFriend.coords.longitude,
                      name: selectedFriend.activeMovie.branchName
                    };
                    handleNavigate(branch);
                  }}
                >
                  <LinearGradient
                    colors={['#FF1464', '#9B1B30']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.navBtnGradient}
                  >
                    <Navigation size={14} color="white" style={{ marginEnd: 6 }} />
                    <Text style={styles.navBtnText}>ניווט לקולנוע של {selectedFriend.name.split(' ')[0]}</Text>
                  </LinearGradient>
                </Pressable>
              </BlurView>
            </Animated.View>
          )}
        </View>
      )}
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

  // Segmented Tabs
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: 'rgba(255, 20, 100, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 20, 100, 0.25)',
  },
  tabText: {
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
    color: '#A1A1AA',
  },
  activeTabText: {
    color: '#FF1464',
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

  // Map loading state
  mapLoading: {
    ...StyleSheet.absoluteFill as object,
    backgroundColor: '#09090B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLoadingText: {
    color: '#A1A1AA',
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    textAlign: 'center',
    writingDirection: 'rtl',
  },

  // Floating Ghost Mode Panel
  ghostModeFloatCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    zIndex: 10,
  },
  ghostModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ghostModeLabel: {
    color: '#FAFAF7',
    fontSize: 12,
    fontFamily: 'Assistant-SemiBold',
    flex: 1,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  ghostModeSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  ghostModeSwitchActive: {
    backgroundColor: '#E5FF00',
  },
  ghostModeSwitchInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  ghostModeSwitchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#09090B',
  },
  ghostModeSwitchKnobActive: {
    alignSelf: 'flex-end',
  },
  ghostModeSwitchKnobInactive: {
    alignSelf: 'flex-start',
  },

  // Friends Details Floating Card
  friendDetailsFloatingCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  friendDetailsBlur: {
    padding: 18,
  },
  closeCardBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  friendDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  friendProfileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendDetailsAvatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E5FF00',
    overflow: 'hidden',
  },
  friendDetailsAvatar: {
    width: '100%',
    height: '100%',
  },
  friendDetailsAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(229, 255, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendDetailsAvatarFallbackText: {
    color: '#E5FF00',
    fontFamily: 'Rubik-Bold',
    fontSize: 14,
  },
  friendDetailsInfoCol: {
    alignItems: 'flex-start',
    marginStart: 12,
  },
  friendDetailsName: {
    color: '#FAFAF7',
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
  },
  liveBadge: {
    backgroundColor: 'rgba(229, 255, 0, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(229, 255, 0, 0.25)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    marginTop: 2,
  },
  liveBadgeText: {
    color: '#E5FF00',
    fontSize: 9,
    fontFamily: 'Rubik-Medium',
  },
  movieDetailsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 14,
  },
  movieDetailsPoster: {
    width: 44,
    height: 66,
    borderRadius: 8,
  },
  movieDetailsMeta: {
    flex: 1,
    marginStart: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  movieDetailsTitle: {
    color: '#FAFAF7',
    fontSize: 13,
    fontFamily: 'Rubik-Bold',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  movieDetailsTheater: {
    color: '#A1A1AA',
    fontSize: 10,
    fontFamily: 'Assistant-Regular',
    marginTop: 3,
  },
  movieDetailsTime: {
    color: '#A1A1AA',
    fontSize: 9,
    fontFamily: 'Assistant-Regular',
    marginTop: 1,
  },
  navigateFriendBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  navBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  navBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Rubik-Bold',
    fontSize: 12,
  },
});
