/**
 * SectionHeader - Reusable RTL section title with optional "See All"
 */
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import MarkerHighlight from './MarkerHighlight';
import { Colors, Typography } from '@/constants/Theme';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

export default function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  return (
    <View className="flex-row justify-between items-center px-5 mb-3 mt-6 w-full">
      <MarkerHighlight 
        text={title} 
        className="text-h2 text-white" 
        color={Colors.secondary} 
      />
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} className="flex-row items-center gap-1">
          <Text style={[Typography.caption, { color: Colors.primary, fontFamily: 'Rubik-Bold' }]}>הכל</Text>
          <ChevronRight size={16} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// NativeWind migration complete - styles object removed
