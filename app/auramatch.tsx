import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  Pressable, 
  ActivityIndicator, 
  Dimensions, 
  PanResponder, 
  Animated, 
  ScrollView 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { X, Heart, Shield, Sparkles, RefreshCw, Sliders, MessageSquare } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Theme';
import { useAuthStore } from '@/store/useAuthStore';
import { API_BASE_URL } from '@/constants/Config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.42;

interface MatchUser {
  profile: {
    _id: string;
    auraColor: string;
    genreVector: number[];
    userId: {
      _id: string;
      name: string;
      profileImage?: string;
    };
  };
  similarity: number;
}

export default function AuraMatchScreen() {
  const insets = useSafeAreaInsets();
  const token = useAuthStore(state => state.token);

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [myProfile, setMyProfile] = useState<{ genreVector: number[]; auraColor: string } | null>(null);
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedPeer, setMatchedPeer] = useState<MatchUser | null>(null);

  // Profile preferences
  const [prefAction, setPrefAction] = useState(0.5);
  const [prefComedy, setPrefComedy] = useState(0.5);
  const [prefDrama, setPrefDrama] = useState(0.5);
  const [prefHorror, setPrefHorror] = useState(0.5);
  const [prefSciFi, setPrefSciFi] = useState(0.5);

  const [activeTab, setActiveTab] = useState<'match' | 'prefs'>('match');

  // Swipe animation values
  const position = useRef(new Animated.ValueXY()).current;
  const matchPulse = useRef(new Animated.Value(0)).current;

  // PanResponder for swiping cards
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 120) {
          swipe('right');
        } else if (gestureState.dx < -120) {
          swipe('left');
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 4,
            useNativeDriver: false
          }).start();
        }
      }
    })
  ).current;

  useEffect(() => {
    fetchMyProfile();
  }, []);

  const fetchMyProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/mcp/aura/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          setMyProfile(json.data);
          const [a, c, d, h, s] = json.data.genreVector;
          setPrefAction(a);
          setPrefComedy(c);
          setPrefDrama(d);
          setPrefHorror(h);
          setPrefSciFi(s);
        }
      }
    } catch (err) {
      console.warn('Could not load profile:', err);
    }
  };

  const updateProfileAndSearch = async (isStart: boolean) => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const vector = [prefAction, prefComedy, prefDrama, prefHorror, prefSciFi];
    const colors = ['#8A2BE2', '#FF1464', '#E5FF00', '#00F0FF', '#FF00FF'];
    // pick aura color dynamically based on highest genre weight
    const maxIdx = vector.indexOf(Math.max(...vector));
    const auraColor = colors[maxIdx] || '#8A2BE2';

    try {
      // 1. Save preferences
      await fetch(`${API_BASE_URL}/mcp/aura/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ genreVector: vector, auraColor })
      });

      // 2. Search matches
      const response = await fetch(`${API_BASE_URL}/mcp/aura/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isSearching: isStart })
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success) {
          setMatches(json.data || []);
          setCurrentIndex(0);
          setSearching(isStart);
        }
      }
    } catch (err) {
      console.warn('Failed updating Aura profile, running locally:', err);
      // Offline fallback: simulate matches
      if (isStart) {
        const dummy: MatchUser[] = [
          {
            profile: {
              _id: '1',
              auraColor: '#FF1464',
              genreVector: [0.8, 0.4, 0.3, 0.9, 0.2],
              userId: { _id: '101', name: 'גלעד כהן', profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde' }
            },
            similarity: 0.92
          },
          {
            profile: {
              _id: '2',
              auraColor: '#00F0FF',
              genreVector: [0.3, 0.9, 0.8, 0.2, 0.7],
              userId: { _id: '102', name: 'מיכל לוי', profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330' }
            },
            similarity: 0.85
          }
        ];
        setMatches(dummy);
        setCurrentIndex(0);
        setSearching(true);
      } else {
        setSearching(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const swipe = (dir: 'left' | 'right') => {
    Animated.timing(position, {
      toValue: { x: dir === 'right' ? 500 : -500, y: 0 },
      duration: 250,
      useNativeDriver: false
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      handleCardProcessed(dir);
    });
  };

  const handleCardProcessed = (dir: 'left' | 'right') => {
    const peer = matches[currentIndex];
    if (dir === 'right' && peer) {
      // Simulate Match (e.g. 50% chance for simulation or trigger on positive feedback)
      if (Math.random() > 0.3) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMatchedPeer(peer);
        setShowMatchModal(true);
        // Animate match panel
        Animated.sequence([
          Animated.timing(matchPulse, { toValue: 1.1, duration: 400, useNativeDriver: true }),
          Animated.spring(matchPulse, { toValue: 1, friction: 3, useNativeDriver: true })
        ]).start();
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCurrentIndex(prev => prev + 1);
  };

  // Card styles
  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: ['-10deg', '0deg', '10deg'],
      extrapolate: 'clamp'
    });
    return {
      ...position.getLayout(),
      transform: [{ rotate }]
    };
  };

  const adjustPref = (genre: string, val: number) => {
    if (genre === 'action') setPrefAction(val);
    if (genre === 'comedy') setPrefComedy(val);
    if (genre === 'drama') setPrefDrama(val);
    if (genre === 'horror') setPrefHorror(val);
    if (genre === 'scifi') setPrefSciFi(val);
  };

  return (
    <View style={styles.container}>
      
      {/* Background Gradient */}
      <LinearGradient colors={['#100220', '#03010A', '#000']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.circleButton} onPress={() => router.back()}>
          <X size={20} color="#FFF" />
        </Pressable>

        <View style={styles.titleContainer}>
          <Sparkles size={16} color="#8A2BE2" />
          <Text style={styles.headerTitle}>מעגלי Aura-Match</Text>
        </View>

        <Pressable 
          style={styles.circleButton} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab(activeTab === 'match' ? 'prefs' : 'match');
          }}
        >
          <Sliders size={20} color={activeTab === 'prefs' ? '#8A2BE2' : '#FFF'} />
        </Pressable>
      </View>

      {activeTab === 'match' ? (
        /* ── MATCH SWIPER TAB ── */
        <View style={styles.swipingArea}>
          {loading ? (
            <ActivityIndicator size="large" color="#8A2BE2" />
          ) : !searching ? (
            <View style={styles.emptyContainer}>
              <View style={styles.largeHaloContainer}>
                <View style={styles.pulseHalo} />
                <Sparkles size={48} color="#8A2BE2" />
              </View>
              <Text style={styles.emptyTitle}>התאמת הילות קולנועית</Text>
              <Text style={styles.emptyDesc}>
                הגדירו את העדפות הצפייה שלכם והפעילו את חיפוש ההילות כדי למצוא שותפים תואמים להקרנה הבאה.
              </Text>
              <Pressable style={styles.primaryButton} onPress={() => updateProfileAndSearch(true)}>
                <Text style={styles.primaryButtonText}>הפעל חיפוש הילות</Text>
              </Pressable>
            </View>
          ) : currentIndex >= matches.length ? (
            <View style={styles.emptyContainer}>
              <RefreshCw size={44} color="#8A2BE2" />
              <Text style={styles.emptyTitle}>ההילות הסתנכרנו בהצלחה</Text>
              <Text style={styles.emptyDesc}>
                עברת על כל הפרופילים התואמים בסביבתך. תוכל לרענן או לעדכן את העדפות הז׳אנרים שלך.
              </Text>
              <Pressable style={styles.primaryButton} onPress={() => updateProfileAndSearch(true)}>
                <Text style={styles.primaryButtonText}>חפש שוב</Text>
              </Pressable>
            </View>
          ) : (
            /* Card Stack */
            <View style={styles.cardsWrapper}>
              {matches.map((item, index) => {
                if (index < currentIndex) return null;
                if (index === currentIndex) {
                  return (
                    <Animated.View 
                      key={item.profile._id}
                      style={[styles.swipeCard, getCardStyle()]}
                      {...panResponder.panHandlers}
                    >
                      <BlurView intensity={45} tint="dark" style={[styles.cardBlur, { borderColor: `${item.profile.auraColor}50` }]}>
                        {/* Avatar & Halo */}
                        <View style={styles.avatarWrapper}>
                          <View style={[styles.cardAuraHalo, { backgroundColor: item.profile.auraColor, shadowColor: item.profile.auraColor }]} />
                          {item.profile.userId.profileImage ? (
                            <Image source={{ uri: item.profile.userId.profileImage }} style={styles.avatarImage} />
                          ) : (
                            <View style={styles.avatarPlaceholder}>
                              <Text style={styles.avatarPlaceholderText}>{item.profile.userId.name.charAt(0)}</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.peerName}>{item.profile.userId.name}</Text>
                        <Text style={[styles.matchPercentText, { color: item.profile.auraColor }]}>
                          התאמה של {(item.similarity * 100).toFixed(0)}% בהילת הסרטים
                        </Text>

                        {/* Top Genres Indicators */}
                        <View style={styles.genresRow}>
                          <Text style={styles.genreBadgeText}>פעולה • קומדיה • מדע בדיוני</Text>
                        </View>

                        {/* Swipe Action Buttons */}
                        <View style={styles.actionsBar}>
                          <Pressable style={[styles.actionButton, styles.passButton]} onPress={() => swipe('left')}>
                            <X size={22} color="#FF3B30" />
                          </Pressable>
                          <Pressable style={[styles.actionButton, styles.likeButton, { backgroundColor: item.profile.auraColor }]} onPress={() => swipe('right')}>
                            <Heart size={22} color="#000" />
                          </Pressable>
                        </View>
                      </BlurView>
                    </Animated.View>
                  );
                }
                return null;
              }).reverse()}
            </View>
          )}
        </View>
      ) : (
        /* ── PREFERENCES TAB ── */
        <ScrollView contentContainerStyle={styles.scrollPrefs}>
          <BlurView intensity={30} tint="dark" style={styles.prefsGlassCard}>
            <Text style={styles.prefsTitle}>התאמת הילת הצפייה האישית</Text>
            <Text style={styles.prefsDesc}>גררו את המחוונים כדי להגדיר מה רמת העניין שלכם בכל ז׳אנר קולנועי:</Text>

            {/* Slider action */}
            <GenreSlider label="אקשן ומתח" value={prefAction} onChange={(val) => adjustPref('action', val)} />
            <GenreSlider label="קומדיה ובידור" value={prefComedy} onChange={(val) => adjustPref('comedy', val)} />
            <GenreSlider label="דרמה ורגש" value={prefDrama} onChange={(val) => adjustPref('drama', val)} />
            <GenreSlider label="אימה ומסתורין" value={prefHorror} onChange={(val) => adjustPref('horror', val)} />
            <GenreSlider label="מדע בדיוני ופנטזיה" value={prefSciFi} onChange={(val) => adjustPref('scifi', val)} />

            <Pressable style={styles.savePrefsButton} onPress={() => {
              setActiveTab('match');
              updateProfileAndSearch(true);
            }}>
              <Text style={styles.savePrefsButtonText}>עדכן העדפות והצג התאמות</Text>
            </Pressable>
          </BlurView>
        </ScrollView>
      )}

      {/* ── MATCH CELEBRATION MODAL ── */}
      {showMatchModal && matchedPeer && (
        <View style={styles.matchModalOverlay}>
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          <Animated.View style={[styles.matchModalContent, { transform: [{ scale: matchPulse }] }]}>
            
            <Sparkles size={60} color="#E5FF00" />
            <Text style={styles.matchModalTitle}>זו התאמה!</Text>
            <Text style={styles.matchModalDesc}>
              ההילת הקולנועית שלכם ושל {matchedPeer.profile.userId.name} מסונכרנות לחלוטין.
            </Text>

            {/* Halos Merging Visual */}
            <View style={styles.mergingContainer}>
              <View style={[styles.mergingAvatarCard, { borderColor: '#8A2BE2', shadowColor: '#8A2BE2' }]}>
                <Text style={styles.mergingCardLabel}>אתה</Text>
              </View>
              <View style={[styles.mergingAvatarCard, { borderColor: matchedPeer.profile.auraColor, shadowColor: matchedPeer.profile.auraColor }]}>
                {matchedPeer.profile.userId.profileImage ? (
                  <Image source={{ uri: matchedPeer.profile.userId.profileImage }} style={styles.mergingImage} />
                ) : (
                  <View style={styles.mergingPlaceholder}>
                    <Text style={styles.mergingPlaceholderText}>{matchedPeer.profile.userId.name.charAt(0)}</Text>
                  </View>
                )}
              </View>
            </View>

            <Pressable style={styles.chatConnectButton} onPress={() => {
              setShowMatchModal(false);
              router.push('/friends'); // Route to chat/squad lobby
            }}>
              <MessageSquare size={18} color="#000" style={{ marginRight: 8 }} />
              <Text style={styles.chatConnectButtonText}>שלח הודעה ועכשיו!</Text>
            </Pressable>

            <Pressable style={styles.cancelModalButton} onPress={() => setShowMatchModal(false)}>
              <Text style={styles.cancelModalButtonText}>המשך להחליק</Text>
            </Pressable>

          </Animated.View>
        </View>
      )}

    </View>
  );
}

function GenreSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderValueText}>{(value * 100).toFixed(0)}%</Text>
        <Text style={styles.sliderLabelText}>{label}</Text>
      </View>
      <View style={styles.sliderTrackWrapper}>
        <Pressable 
          style={styles.sliderTrackClickArea}
          onPress={(e) => {
            const clickX = e.nativeEvent.locationX;
            const trackWidth = SCREEN_WIDTH * 0.7;
            const val = Math.max(0, Math.min(1, clickX / trackWidth));
            onChange(val);
          }}
        >
          <View style={styles.sliderTrackLine}>
            <View style={[styles.sliderTrackFill, { width: `${value * 100}%` }]} />
            <View style={[styles.sliderThumb, { left: `${value * 100}%` }]} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    zIndex: 100,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Assistant-Bold',
  },
  swipingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 16,
  },
  largeHaloContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(138,43,226,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseHalo: {
    ...StyleSheet.absoluteFill,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#8A2BE2',
    opacity: 0.3,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 22,
    fontFamily: 'Assistant-Bold',
    textAlign: 'center',
  },
  emptyDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontFamily: 'Assistant-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#8A2BE2',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Assistant-Bold',
  },
  cardsWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeCard: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardBlur: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardAuraHalo: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    opacity: 0.45,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 8,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFF',
    fontSize: 32,
    fontFamily: 'Assistant-Bold',
  },
  peerName: {
    color: '#FFF',
    fontSize: 22,
    fontFamily: 'Assistant-Bold',
    marginTop: 10,
  },
  matchPercentText: {
    fontSize: 14,
    fontFamily: 'Assistant-Medium',
  },
  genresRow: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  genreBadgeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: 'Assistant-Regular',
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 14,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  likeButton: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scrollPrefs: {
    padding: 20,
    paddingBottom: 100,
  },
  prefsGlassCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    gap: 20,
    overflow: 'hidden',
  },
  prefsTitle: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Assistant-Bold',
    textAlign: 'right',
  },
  prefsDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontFamily: 'Assistant-Regular',
    textAlign: 'right',
    lineHeight: 18,
  },
  sliderContainer: {
    gap: 8,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderValueText: {
    color: '#8A2BE2',
    fontFamily: 'Outfit-Bold',
    fontSize: 13,
  },
  sliderLabelText: {
    color: '#FFF',
    fontFamily: 'Assistant-Medium',
    fontSize: 14,
  },
  sliderTrackWrapper: {
    height: 30,
    justifyContent: 'center',
  },
  sliderTrackClickArea: {
    width: '100%',
    height: 10,
    justifyContent: 'center',
  },
  sliderTrackLine: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    position: 'relative',
  },
  sliderTrackFill: {
    height: '100%',
    backgroundColor: '#8A2BE2',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#8A2BE2',
    marginLeft: -8,
  },
  savePrefsButton: {
    marginTop: 10,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savePrefsButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Assistant-Bold',
  },
  matchModalOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  matchModalContent: {
    width: SCREEN_WIDTH * 0.85,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(10,3,25,0.8)',
    padding: 32,
    alignItems: 'center',
    gap: 20,
    overflow: 'hidden',
  },
  matchModalTitle: {
    color: '#FFF',
    fontSize: 28,
    fontFamily: 'Assistant-Bold',
  },
  matchModalDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontFamily: 'Assistant-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  mergingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginVertical: 10,
  },
  mergingAvatarCard: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 6,
  },
  mergingCardLabel: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Assistant-Bold',
  },
  mergingImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  mergingPlaceholder: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mergingPlaceholderText: {
    color: '#FFF',
    fontSize: 24,
    fontFamily: 'Assistant-Bold',
  },
  chatConnectButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5FF00',
    borderRadius: 24,
    height: 48,
    width: '100%',
  },
  chatConnectButtonText: {
    color: '#000',
    fontSize: 15,
    fontFamily: 'Assistant-Bold',
  },
  cancelModalButton: {
    paddingVertical: 8,
  },
  cancelModalButtonText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontFamily: 'Assistant-Medium',
  }
});
