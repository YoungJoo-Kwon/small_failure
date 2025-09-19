import React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows } from '../../styles/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  onPress?: () => void;
}

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  style,
  onPress,
}: CardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.background.card,
          ...shadows.md,
        };
      case 'outlined':
        return {
          backgroundColor: colors.background.card,
          borderWidth: 1,
          borderColor: colors.gray[200],
        };
      default:
        return {
          backgroundColor: colors.background.card,
          ...shadows.sm,
        };
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'sm':
        return { padding: 12 };
      case 'md':
        return { padding: 16 };
      case 'lg':
        return { padding: 20 };
      default:
        return { padding: 16 };
    }
  };

  return (
    <View
      style={[
        {
          borderRadius: borderRadius.lg,
          ...getVariantStyles(),
          ...getPaddingStyles(),
        },
        style,
      ]}
      onTouchEnd={onPress}
    >
      {children}
    </View>
  );
}
