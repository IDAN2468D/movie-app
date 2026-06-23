import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Navigation, Users, X, Car, Clock, ShieldCheck, ChevronUp, ChevronDown } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { API_BASE_URL } from '@/constants/Config';
import { useAuthStore } from '@/store/useAuthStore';

const { width } = Dimensions.get('window');

const MAP_HTML = (members: any[]) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map {
      height: 100%;
      margin: 0;
      padding: 0;
      background: #09090b;
    }
    .cinema-marker {
      background: rgba(255, 20, 100, 0.25);
      border: 2px solid #FF1464;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 15px rgba(255, 20, 100, 0.6);
      animation: pulse 2s infinite;
    }
    .cinema-marker-inner {
      background: #FF1464;
      border-radius: 50%;
      width: 12px;
      height: 12px;
      box-shadow: 0 0 8px #FF1464;
    }
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.8; }
      50% { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.8; }
    }
    .member-marker {
      background: #3B82F6;
      border: 2px solid #ffffff;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: system-ui, -apple-system;
      font-size: 11px;
      font-weight: bold;
      box-shadow: 0 3px 6px rgba(0,0,0,0.6);
      transition: all 0.3s ease;
    }
    .member-marker.driver {
      background: #F59E0B;
      color: black;
      border-color: #000000;
    }
    .leaflet-bar {
      border: 1px solid rgba(255,255,255,0.1) !important;
    }
    .leaflet-bar a {
      background-color: #18181b !important;
      color: #fafafa !important;
      border-bottom: 1px solid rgba(255,255,255,0.1) !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([32.0853, 34.7818], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(map);

    // Cinema Marker
    var cinemaIcon = L.divIcon({
      className: '',
      html: '<div class="cinema-marker"><div class="cinema-marker-inner"></div></div>',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    L.marker([32.0853, 34.7818], { icon: cinemaIcon }).addTo(map);

    // Member Markers
    var markers = {};

    function updateMarkers(membersList) {
      // Remove old markers
      for (var key in markers) {
        map.removeLayer(markers[key]);
      }
      markers = {};

      membersList.forEach(function(m) {
        var lat = 32.0853 + m.latOffset;
        var lng = 34.7818 + m.lngOffset;
        var initials = m.name.substring(0, 2);
        var isDriver = m.status === 'driving';
        
        var iconHtml = '<div class="member-marker ' + (isDriver ? 'driver' : '') + '">' + initials + '</div>';
        
        var memberIcon = L.divIcon({
          className: '',
          html: iconHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        
        var marker = L.marker([lat, lng], { icon: memberIcon }).addTo(map);
        marker.bindPopup('<b>' + m.name + '</b><br>ETA: ' + m.eta);
        markers[m.name] = marker;
      });
    }

    // Initial load
    updateMarkers(${JSON.stringify(members)});

    // Listen for messages from React Native to update coordinates
    window.addEventListener('message', function(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.type === 'update_members') {
          updateMarkers(data.members);
        }
      } catch(e) {}
    });
  </script>
</body>
</html>
`;

// Mock coordinates for squad members
const INITIAL_MEMBERS = [
  { name: 'דניאל (נהג)', status: 'driving', latOffset: -0.005, lngOffset: 0.004, eta: '12 דק׳' },
  { name: 'מיכל', status: 'passenger', latOffset: 0.003, lngOffset: -0.002, eta: '18 דק׳' },
  { name: 'אור', status: 'passenger', latOffset: 0.006, lngOffset: 0.008, eta: '5 דק׳' },
];

export default function CineSquadTransitScreen() {
  const insets = useSafeAreaInsets();
  const token = useAuthStore(state => state.token);
  const [myStatus, setMyStatus] = useState<'driving' | 'passenger' | 'arrived'>('driving');
  const [squadMembers, setSquadMembers] = useState(INITIAL_MEMBERS);
  const [sendingPosition, setSendingPosition] = useState(false);

  // Collapsible Bottom Sheet state & Reanimated variables
  const [isCollapsed, setIsCollapsed] = useState(false);
  const translateY = useSharedValue(0);

  const toggleCollapse = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    translateY.value = withSpring(isCollapsed ? 0 : 300, { damping: 15 });
    setIsCollapsed(!isCollapsed);
  };

  const animatedSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }]
    };
  });

  const webViewRef = React.useRef<any>(null);

  // Send dynamic coordinates updates to Leaflet Map WebView
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'update_members',
        members: squadMembers
      }));
    }
  }, [squadMembers]);

  // Simulate positions updating on map
  useEffect(() => {
    const timer = setInterval(() => {
      setSquadMembers(prev => 
        prev.map(m => ({
          ...m,
          latOffset: m.latOffset + (Math.random() - 0.5) * 0.0008,
          lngOffset: m.lngOffset + (Math.random() - 0.5) * 0.0008,
        }))
      );
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const handleUpdateStatus = async (newStatus: 'driving' | 'passenger' | 'arrived') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMyStatus(newStatus);
    setSendingPosition(true);

    try {
      const response = await fetch(`${API_BASE_URL}/mcp/cinesquad/transit/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          squadId: '60c72b2f9b1d8a23d88b4999',
          latitude: 32.0853 + (Math.random() - 0.5) * 0.01,
          longitude: 34.7818 + (Math.random() - 0.5) * 0.01,
          status: newStatus
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err) {
      console.warn('Squad location sync offline fallback:', err);
    } finally {
      setTimeout(() => setSendingPosition(false), 500);
    }
  };

  return (
    <View className="flex-1 bg-black">
      {/* Real Free Dark Leaflet Map */}
      <View style={StyleSheet.absoluteFill}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: MAP_HTML(squadMembers) }}
          style={{ flex: 1, backgroundColor: '#09090b' }}
        />
      </View>

      {/* Screen Controls Overlays */}
      <View 
        style={{ paddingTop: insets.top + 20, position: 'absolute', top: 0, left: 0, right: 0 }} 
        className="px-6 flex-row justify-between items-center"
        pointerEvents="box-none"
      >
        <Pressable 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }} 
          className="w-12 h-12 rounded-2xl bg-black/60 border border-white/10 items-center justify-center"
        >
          <X size={24} color="white" />
        </Pressable>
        <View className="bg-black/60 px-4 py-2 rounded-full border border-white/10 flex-row items-center gap-2">
          <Users size={16} color={Colors.primary} />
          <Text className="text-white text-sm font-semibold">CineSquad Live</Text>
        </View>
      </View>

      {/* Dynamic Collapsible Bottom Sheet */}
      <Animated.View entering={FadeInUp.duration(900).delay(200)} style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <Animated.View style={[animatedSheetStyle]} className="bg-surfaceLight border-t border-white/10 rounded-t-[36px] p-6 pb-12 shadow-2xl">
          <Pressable onPress={toggleCollapse} className="w-full">
            <View className="w-12 h-1.5 bg-white/15 rounded-full self-center mb-5" />

            <View className="flex-row-reverse justify-between items-center mb-6">
              <View className="items-end">
                <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white text-lg font-bold">תיאום הגעה קבוצתית</Text>
                <Text style={{ textAlign: 'right', writingDirection: 'rtl' }} className="text-white/40 text-[10px] mt-0.5">מיקום נמחק אוטומטית כעבור 3 שעות</Text>
              </View>
              <View className="flex-row-reverse items-center gap-2">
                <Clock size={16} color={Colors.secondary} />
                <Text className="text-secondary text-xs font-semibold">איסוף פעיל ({squadMembers.length})</Text>
                {isCollapsed ? <ChevronUp size={16} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.4)" />}
              </View>
            </View>
          </Pressable>

        {/* Location Status Option Buttons */}
        <View className="flex-row gap-3 mb-6">
          {(['driving', 'passenger', 'arrived'] as const).map((status) => (
            <Pressable
              key={status}
              onPress={() => handleUpdateStatus(status)}
              className={`flex-1 py-3 rounded-xl border flex-row justify-center items-center gap-2 ${myStatus === status ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/5'}`}
            >
              {status === 'driving' && <Car size={16} color={myStatus === status ? Colors.primary : 'white'} />}
              {status === 'passenger' && <Users size={16} color={myStatus === status ? Colors.primary : 'white'} />}
              {status === 'arrived' && <ShieldCheck size={16} color={myStatus === status ? Colors.primary : 'white'} />}
              <Text className={`text-xs font-semibold ${myStatus === status ? 'text-primary' : 'text-white/60'}`}>
                {status === 'driving' ? 'אני נהג' : status === 'passenger' ? 'אני נוסע' : 'הגעתי!'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Members Status Header & Privacy */}
        <View className="flex-row-reverse justify-between items-center mb-2 px-1">
          <Text className="text-white/60 text-xs font-bold">חברי הקבוצה בדרך</Text>
          <View className="flex-row-reverse items-center gap-1.5 opacity-60">
            <View className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <Text className="text-white/80 text-[10px]">סודיות ואבטחה מופעלים</Text>
          </View>
        </View>

        <ScrollView className="max-h-36 mb-4" showsVerticalScrollIndicator={false}>
          {squadMembers.map((member, i) => (
            <View key={i} className="flex-row justify-between items-center border-b border-white/5 py-3 px-1">
              <View className="flex-row items-center gap-2">
                <Clock size={14} color="#A1A1AA" />
                <Text className="text-white/60 text-xs">{member.eta}</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Text style={{ textAlign: 'right' }} className="text-white text-sm font-semibold">{member.name}</Text>
                <View className={`w-8 h-8 rounded-full items-center justify-center bg-white/5 border border-white/10`}>
                  {member.status === 'driving' ? <Car size={14} color={Colors.secondary} /> : <Users size={14} color="#3B82F6" />}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Spacer for bottom padding */}
        <View className="h-2" />

        </Animated.View>
      </Animated.View>
    </View>
  );
}
