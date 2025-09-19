import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'comfort' | 'growth';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.secondary,
          borderWidth: 1,
        };
      case 'danger':
        return {
          backgroundColor: colors.error,
          borderColor: colors.error,
        };
      case 'comfort':
        return {
          backgroundColor: colors.warning,
          borderColor: colors.warning,
        };
      case 'growth':
        return {
          backgroundColor: colors.success,
          borderColor: colors.success,
        };
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.sm,
        };
      case 'md':
        return {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderRadius: borderRadius.md,
        };
      case 'lg':
        return {
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.lg,
          borderRadius: borderRadius.lg,
        };
      default:
        return {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderRadius: borderRadius.md,
        };
    }
  };

  const getTextColor = () => {
    if (variant === 'secondary') {
      return colors.text.primary;
    }
    return colors.text.inverse;
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return typography.bodySmall.fontSize;
      case 'md':
        return typography.body.fontSize;
      case 'lg':
        return typography.h4.fontSize;
      default:
        return typography.body.fontSize;
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.6 : 1,
        },
        variantStyles,
        sizeStyles,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={getTextColor()} 
          style={{ marginRight: spacing.sm }}
        />
      ) : (
        icon && <>{icon}</>
      )}
      <Text
        style={[
          {
            color: getTextColor(),
            fontSize: getTextSize(),
            fontWeight: '600',
            textAlign: 'center',
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
