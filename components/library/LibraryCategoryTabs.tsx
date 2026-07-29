import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useAcousticEngine } from '@/hooks/useAcousticEngine';
import { Colors } from '@/constants/Theme';

export type LibraryCategory = 'watchlist' | 'journal' | 'collectibles';

interface LibraryCategoryTabsProps {
  activeTab: LibraryCategory;
  onTabChange: (tab: LibraryCategory) => void;
}

export const LibraryCategoryTabs: React.FC<LibraryCategoryTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { playSpatialClick } = useAcousticEngine();

  const tabs: { id: LibraryCategory; label: string; icon: string }[] = [
    { id: 'watchlist', label: 'נשמרו', icon: '🔖' },
    { id: 'journal', label: 'יומן צפיות', icon: '📓' },
    { id: 'collectibles', label: 'מזכרות 3D', icon: '🏆' },
  ];

  const handlePress = (id: LibraryCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playSpatialClick();
    onTabChange(id);
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={35} tint="dark" style={styles.blurContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => handlePress(tab.id)}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.icon} {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  blurContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
    backgroundColor: 'rgba(18, 18, 20, 0.6)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  activeTabButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.45)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Rubik-Medium',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'Rubik-Bold',
  },
});

export default LibraryCategoryTabs;
