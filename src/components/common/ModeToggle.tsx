import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';

export type ViewMode = 'light' | 'detailed';

interface ModeToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  style?: ViewStyle;
}

export default function ModeToggle({ mode, onModeChange, style }: ModeToggleProps) {
  return (
      <View
        style={[
          {
            flexDirection: 'row',
            backgroundColor: colors.surface,
            borderRadius: borderRadius.full,
            padding: 4,
            borderWidth: 1,
            borderColor: colors.gray[300],
          },
          style,
        ]}
      >
      <TouchableOpacity
        style={[
          {
            flex: 1,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: borderRadius.full,
            alignItems: 'center',
            backgroundColor: mode === 'light' ? colors.accent : 'transparent',
          },
        ]}
        onPress={() => onModeChange('light')}
        activeOpacity={0.8}
      >
        <Text
          style={{
            fontSize: typography.bodySmall.fontSize,
            fontWeight: '600',
            color: mode === 'light' ? colors.text.inverse : colors.text.secondary,
          }}
        >
          🔘 짧게 보기
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          {
            flex: 1,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: borderRadius.full,
            alignItems: 'center',
            backgroundColor: mode === 'detailed' ? colors.accent : 'transparent',
          },
        ]}
        onPress={() => onModeChange('detailed')}
        activeOpacity={0.8}
      >
        <Text
          style={{
            fontSize: typography.bodySmall.fontSize,
            fontWeight: '600',
            color: mode === 'detailed' ? colors.text.inverse : colors.text.secondary,
          }}
        >
          🔘 자세히 보기
        </Text>
      </TouchableOpacity>
    </View>
  );
}
