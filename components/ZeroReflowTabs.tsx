import React from 'react';
import { View, Text, Pressable, StyleSheet, GestureResponderEvent } from 'react-native';
import { playSpatialTone } from '../utils/SoundEffects';

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
  const handleTabPress = (id: string, index: number, e: GestureResponderEvent) => {
    // Play audible audio frequency corresponding to selected mode (e.g. 400Hz, 600Hz, 800Hz)
    const panOffset = (index / (tabs.length - 1)) * 1.8 - 0.9;
    playSpatialTone(500 + index * 200, panOffset);
    onTabSelect(id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          return (
            <Pressable
              key={tab.id}
              onPress={(e) => handleTabPress(tab.id, index, e)}
              style={[styles.tabButton, isActive && styles.activeTabBg]}
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
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 4,
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  activeTabBg: {
    backgroundColor: 'rgba(139, 92, 246, 0.45)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '800',
  },
});

export default ZeroReflowTabs;
