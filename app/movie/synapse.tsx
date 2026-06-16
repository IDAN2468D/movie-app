import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Plus, Save, Trash2 } from 'lucide-react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Theme';
import { useSynapseStore, IEmotionNode } from '@/store/useSynapseStore';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;
const CHART_HEIGHT = 160;

export default function CineSynapseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const movieId = parseInt(params.movieId as string) || 0;
  const movieTitle = (params.movieTitle as string) || 'סרט קולנוע';

  const {
    aggregatedTimeline,
    userTimeline,
    isLoading,
    fetchSynapseData,
    saveUserTimeline
  } = useSynapseStore();

  const [localNodes, setLocalNodes] = useState<IEmotionNode[]>([]);
  const [timestampMins, setTimestampMins] = useState(30); // minutes slider
  const [sentimentScore, setSentimentScore] = useState(0.0); // -1.0 to 1.0
  const [selectedVibe, setSelectedVibe] = useState('Neutral');
  const [note, setNote] = useState('');

  const vibePresets = [
    { label: '🤩 התרגשות', name: 'Exhilaration', score: 0.8 },
    { label: '😀 שמחה', name: 'Joy', score: 0.6 },
    { label: '😰 מתח', name: 'Suspense', score: 0.2 },
    { label: '😢 עצב', name: 'Melancholy', score: -0.5 },
    { label: '😱 פחד', name: 'Fear', score: -0.8 }
  ];

  useEffect(() => {
    if (movieId) {
      fetchSynapseData(movieId);
    }
  }, [movieId, fetchSynapseData]);

  useEffect(() => {
    if (userTimeline.length > 0) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setLocalNodes(userTimeline);
    }
  }, [userTimeline]);

  const addNode = () => {
    // Format timestamp as HH:MM:SS
    const hrs = Math.floor(timestampMins / 60);
    const mins = timestampMins % 60;
    const timeStr = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;

    const newNode: IEmotionNode = {
      timestamp: timeStr,
      sentimentScore,
      vibe: selectedVibe,
      note: note.trim() || undefined
    };

    // Remove duplicates at same timestamp
    const filtered = localNodes.filter(n => n.timestamp !== timeStr);
    const updated = [...filtered, newNode].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    
    setLocalNodes(updated);
    setNote('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const removeNode = (timestamp: string) => {
    const updated = localNodes.filter(n => n.timestamp !== timestamp);
    setLocalNodes(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSave = async () => {
    const res = await saveUserTimeline(movieId, localNodes);
    if (res.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      alert('מפת הרגשות נשמרה בשרת בהצלחה!');
    } else {
      alert(res.message || 'שגיאה בשמירת הנתונים');
    }
  };

  // Build SVG Path from nodes
  const buildPath = (nodes: any[]) => {
    if (nodes.length < 2) return '';
    
    // Sort nodes by minutes
    const sorted = [...nodes].map(n => {
      const parts = n.timestamp ? n.timestamp.split(':') : [0, 0];
      const mins = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      return { mins, score: n.sentimentScore };
    }).sort((a, b) => a.mins - b.mins);

    const minMins = 0;
    const maxMins = 180; // assume max 3 hours movie

    const points = sorted.map(n => {
      const x = ((n.mins - minMins) / (maxMins - minMins)) * CHART_WIDTH;
      // sentiment ranges from -1 to 1. map to chart height
      // sentiment = 1 -> y = 20, sentiment = -1 -> y = CHART_HEIGHT - 20
      const y = CHART_HEIGHT / 2 - (n.score * (CHART_HEIGHT / 2 - 20));
      return { x, y };
    });

    // Draw smooth bezier curves
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const userPath = buildPath(localNodes);
  const globalPath = buildPath(aggregatedTimeline.map(n => ({
    timestamp: `${Math.floor(parseInt(n.timeLabel) / 60).toString().padStart(2, '0')}:${(parseInt(n.timeLabel) % 60).toString().padStart(2, '0')}:00`,
    sentimentScore: n.sentimentScore
  })));

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowRight size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>CineSynapse - מיפוי רגשי</Text>
        <Pressable onPress={handleSave} style={styles.saveButton}>
          <Save size={20} color={Colors.secondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} style={styles.scrollView}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.movieInfoCard}>
          <Text style={styles.movieTitle}>{movieTitle}</Text>
          <Text style={styles.movieSubTitle}>מפה את המסע הרגשי שלך לאורך ציר הזמן של הסרט</Text>
        </Animated.View>

        {/* The Emotional Curve Canvas */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>דופק רגשי קולנועי (Emotional Curve)</Text>
          
          <View style={styles.svgWrapper}>
            {isLoading ? (
              <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
            ) : (
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                <Defs>
                  <SvgLinearGradient id="userGrad" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" stopColor={Colors.primary} />
                    <Stop offset="100%" stopColor={Colors.secondary} />
                  </SvgLinearGradient>
                  <SvgLinearGradient id="globalGrad" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                    <Stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
                  </SvgLinearGradient>
                </Defs>

                {/* Zero center line */}
                <Path d={`M 0 ${CHART_HEIGHT / 2} H ${CHART_WIDTH}`} stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="5,5" />

                {/* Global curve */}
                {globalPath ? (
                  <Path d={globalPath} fill="none" stroke="url(#globalGrad)" strokeWidth={2} strokeDasharray="3,3" />
                ) : null}

                {/* User custom curve */}
                {userPath ? (
                  <Path d={userPath} fill="none" stroke="url(#userGrad)" strokeWidth={4} />
                ) : null}

                {/* Draw circles for user nodes */}
                {localNodes.map((node, i) => {
                  const parts = node.timestamp.split(':');
                  const mins = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                  const x = (mins / 180) * CHART_WIDTH;
                  const y = CHART_HEIGHT / 2 - (node.sentimentScore * (CHART_HEIGHT / 2 - 20));
                  return (
                    <Circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={6}
                      fill={node.sentimentScore >= 0 ? Colors.secondary : Colors.primary}
                      stroke="#09090B"
                      strokeWidth={1.5}
                    />
                  );
                })}
              </Svg>
            )}
            
            {/* Chart Legend */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: Colors.primary }]} />
                <Text style={styles.legendText}>הקו שלי</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 0 }]} />
                <Text style={styles.legendText}>קהילת סינבוק</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Node Editor Form */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.glassForm}>
          <Text style={styles.formTitle}>הוסף נקודת רגש חדשה</Text>

          {/* Timestamp Picker (Minutes) */}
          <Text style={styles.label}>זמן בסרט: {Math.floor(timestampMins / 60)}ש' {timestampMins % 60}ד'</Text>
          <View style={styles.sliderContainer}>
            <TextInput
              style={styles.numericInput}
              keyboardType="number-pad"
              value={timestampMins.toString()}
              onChangeText={(v) => {
                const num = parseInt(v);
                if (!isNaN(num) && num >= 0 && num <= 180) {
                  setTimestampMins(num);
                }
              }}
            />
            <Text style={styles.sliderLabel}>הזן בדקות (0 עד 180):</Text>
          </View>

          {/* Vibe Presets */}
          <Text style={styles.label}>בחר מצב רוח / אווירה בסצנה:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsWrapper}>
            {vibePresets.map((v) => (
              <Pressable
                key={v.name}
                onPress={() => {
                  setSelectedVibe(v.name);
                  setSentimentScore(v.score);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  styles.presetChip,
                  selectedVibe === v.name && styles.presetChipActive
                ]}
              >
                <Text style={styles.presetText}>{v.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Short Note */}
          <Text style={styles.label}>הערה קצרה (אופציונלי):</Text>
          <TextInput
            style={styles.input}
            placeholder="למשל: סצנת השיא, המוזיקה היתה מדהימה..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={note}
            onChangeText={setNote}
          />

          <Pressable onPress={addNode} style={styles.addButton}>
            <Plus size={20} color="#09090B" />
            <Text style={styles.addButtonText}>הוסף נקודה לגרף</Text>
          </Pressable>
        </Animated.View>

        {/* User Added Nodes List */}
        {localNodes.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.nodesListContainer}>
            <Text style={styles.sectionTitle}>נקודות שמיפית בסרט</Text>
            {localNodes.map((n, i) => (
              <View key={i} style={styles.nodeItem}>
                <Pressable onPress={() => removeNode(n.timestamp)} style={styles.deleteBtn}>
                  <Trash2 size={16} color={Colors.primary} />
                </Pressable>
                
                <View style={styles.nodeTextContainer}>
                  <Text style={styles.nodeVibe}>
                    {n.vibe === 'Joy' && '😀 Joy'}
                    {n.vibe === 'Exhilaration' && '🤩 Exhilaration'}
                    {n.vibe === 'Suspense' && '😰 Suspense'}
                    {n.vibe === 'Melancholy' && '😢 Melancholy'}
                    {n.vibe === 'Fear' && '😱 Fear'}
                    {n.vibe === 'Neutral' && '😐 Neutral'}
                  </Text>
                  {n.note && <Text style={styles.nodeNote}>{n.note}</Text>}
                </View>

                <View style={styles.nodeInfoContainer}>
                  <Text style={styles.nodeTime}>{n.timestamp.substring(0, 5)}</Text>
                  <Text style={[
                    styles.nodeScore,
                    { color: n.sentimentScore >= 0 ? Colors.secondary : Colors.primary }
                  ]}>
                    {(n.sentimentScore >= 0 ? '+' : '') + n.sentimentScore.toFixed(1)}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B'
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(18,18,20,0.4)'
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  saveButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(229, 255, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(229, 255, 0, 0.2)'
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Rubik-Medium',
    color: '#FAFAF7',
    textAlign: 'center'
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24
  },
  movieInfoCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  movieTitle: {
    fontSize: 22,
    fontFamily: 'Rubik-Bold',
    color: '#E5FF00',
    textAlign: 'left',
    writingDirection: 'rtl'
  },
  movieSubTitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#A1A1AA',
    marginTop: 6,
    textAlign: 'left',
    writingDirection: 'rtl'
  },
  chartContainer: {
    marginTop: 24,
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'flex-start'
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Rubik-Medium',
    color: '#FAFAF7',
    marginBottom: 16,
    textAlign: 'left',
    writingDirection: 'rtl'
  },
  svgWrapper: {
    width: '100%',
    height: CHART_HEIGHT + 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 16,
    overflow: 'hidden',
    paddingTop: 10
  },
  loader: {
    height: CHART_HEIGHT
  },
  legendContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 16
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  legendIndicator: {
    width: 12,
    height: 4,
    borderRadius: 2
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#71717A'
  },
  glassForm: {
    marginTop: 24,
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  formTitle: {
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    color: '#FAFAF7',
    marginBottom: 16,
    textAlign: 'left',
    writingDirection: 'rtl'
  },
  label: {
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    color: '#A1A1AA',
    marginBottom: 8,
    marginTop: 12,
    textAlign: 'left',
    writingDirection: 'rtl'
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  sliderLabel: {
    fontSize: 13,
    color: '#71717A',
    fontFamily: 'Inter-Regular'
  },
  numericInput: {
    width: 70,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#E5FF00',
    textAlign: 'center',
    fontFamily: 'Inter-Bold',
    fontSize: 16
  },
  presetsWrapper: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  presetChipActive: {
    backgroundColor: 'rgba(229, 255, 0, 0.12)',
    borderColor: '#E5FF00'
  },
  presetText: {
    fontSize: 12,
    color: '#FAFAF7',
    fontFamily: 'Rubik-Regular'
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: '#FAFAF7',
    paddingHorizontal: 16,
    textAlign: 'left',
    writingDirection: 'rtl',
    fontFamily: 'Inter-Regular',
    fontSize: 14
  },
  addButton: {
    marginTop: 20,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E5FF00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#E5FF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
    color: '#09090B'
  },
  nodesListContainer: {
    marginTop: 24,
    alignItems: 'stretch'
  },
  nodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 20, 100, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 20, 100, 0.1)'
  },
  nodeTextContainer: {
    flex: 1,
    paddingHorizontal: 12,
    alignItems: 'flex-start'
  },
  nodeVibe: {
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    color: '#FAFAF7',
    textAlign: 'left'
  },
  nodeNote: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#A1A1AA',
    marginTop: 2,
    textAlign: 'left'
  },
  nodeInfoContainer: {
    alignItems: 'flex-start',
    width: 60
  },
  nodeTime: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#E5FF00'
  },
  nodeScore: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    marginTop: 2
  }
});
