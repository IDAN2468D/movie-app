import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EmotionTimelineNode } from '../../store/useCineVibeStore';

interface VibeTimelineChartProps {
  timeline: EmotionTimelineNode[];
}

export const VibeTimelineChart: React.FC<VibeTimelineChartProps> = ({ timeline }) => {
  return (
    <View style={styles.chartBox}>
      <Text style={styles.chartTitle}>📊 מפת דופק ורגשות לאורך הסרט (Live Heatmap)</Text>

      <View style={styles.timelineRow}>
        {timeline.map((node) => (
          <View key={node.minute} style={styles.nodeColumn}>
            <Text style={styles.intensityVal}>{node.intensity}%</Text>
            <View
              style={[
                styles.barFill,
                {
                  height: node.intensity * 1.2,
                  backgroundColor:
                    node.dominantEmotion === 'hype'
                      ? '#FF1464'
                      : node.dominantEmotion === 'shock'
                      ? '#E5FF00'
                      : node.dominantEmotion === 'laughter'
                      ? '#0AEFFF'
                      : '#8B5CF6',
                },
              ]}
            />
            <Text style={styles.minuteLabel}>{node.minute} דק'</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    marginVertical: 10,
  },
  chartTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
  },
  nodeColumn: {
    alignItems: 'center',
    width: 50,
  },
  intensityVal: {
    color: '#D1D5DB',
    fontSize: 10,
    marginBottom: 4,
  },
  barFill: {
    width: 20,
    borderRadius: 10,
  },
  minuteLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 6,
  },
});
