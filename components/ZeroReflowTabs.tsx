import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent, GestureResponderEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useAcousticEngine } from '../hooks/useAcousticEngine';

export interface TabItem {
  id: string;
  label: string;
}

interface ZeroReflowTabsProps {
  tabs: TabItem[];
  activeTabId: string;
  onTabSelect: (id: string) => void;
}

export const ZeroReflowTabs: React.FC<ZeroReflowTabsProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
}) => {
  const { playSpatialClick } = useAcousticEngine();
  const [tabWidths, setTabWidths] = useState<{ [key: string]: { x: number; width: number } }>({});
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorX.value }],
      width: indicatorWidth.value,
    };
  });

  const handleTabLayout = (id: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabWidths((prev) => {
      const updated = { ...prev, [id]: { x, width } };
      if (id === activeTabId) {
        indicatorX.value = withSpring(x, { stiffness: 100, damping: 15 });
        indicatorWidth.value = withSpring(width, { stiffness: 100, damping: 15 });
      }
      return updated;
    });
  };

  const handleTabPress = (id: string, e: GestureResponderEvent) => {
    playSpatialClick(e);
    if (tabWidths[id]) {
      indicatorX.value = withSpring(tabWidths[id].x, { stiffness: 100, damping: 15 });
      indicatorWidth.value = withSpring(tabWidths[id].width, { stiffness: 100, damping: 15 });
    }
    onTabSelect(id);
  };

  return (
    <View style={styles.container}>
      {/* Zero-Reflow GPU Sliding Tab Indicator */}
      <Animated.View style={[styles.activeIndicator, indicatorAnimatedStyle]} />

      <View style={styles.tabRow}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <Pressable
              key={tab.id}
              onLayout={(e) => handleTabLayout(tab.id, e)}
              onPress={(e) => handleTabPress(tab.id, e)}
              style={styles.tabButton}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    padding: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FAFAF7',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.6)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 6,
    zIndex: 1,
  },
});

export default ZeroReflowTabs;
