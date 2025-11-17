import React, { useState } from 'react';
import { View, TextInput, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type InputVariant = 'default' | 'error' | 'success';

interface InputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  numberOfLines?: number;
  variant?: InputVariant;
  label?: string;
  error?: string;
  success?: string;
  maxLength?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export default function Input({
  placeholder,
  value,
  onChangeText,
  multiline = false,
  numberOfLines = 1,
  variant = 'default',
  label,
  error,
  success,
  maxLength,
  style,
  textStyle,
  disabled = false,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { colors, typography, spacing, borderRadius } = useTheme();

  const getVariantStyles = () => {
    if (error || variant === 'error') {
      return {
        borderColor: colors.error,
        backgroundColor: 'rgba(231, 76, 60, 0.08)',
      };
    }
    if (success || variant === 'success') {
      return {
        borderColor: colors.success,
        backgroundColor: 'rgba(39, 174, 96, 0.08)',
      };
    }
    if (isFocused) {
      return {
        borderColor: colors.accent,
        backgroundColor: colors.background.light,
      };
    }
    return {
      borderColor: colors.gray[300],
      backgroundColor: colors.background.light,
    };
  };

  const getStatusText = () => {
    if (error) return error;
    if (success) return success;
    return null;
  };

  const getStatusColor = () => {
    if (error) return colors.error;
    if (success) return colors.success;
    return colors.gray[500];
  };

  return (
    <View style={[{ marginBottom: spacing.md }, style]}>
      {label && (
        <Text
          style={{
            fontSize: typography.bodySmall.fontSize,
            fontWeight: '600',
            color: colors.text.primary,
            marginBottom: spacing.sm,
            fontFamily: typography.bodySmall.fontFamily,
          }}
        >
          {label}
        </Text>
      )}
      
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        editable={!disabled}
        style={[
          {
            borderWidth: 1,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            fontSize: typography.body.fontSize,
            color: colors.text.primary,
            textAlignVertical: multiline ? 'top' : 'center',
            minHeight: multiline ? 100 : 48,
          },
          getVariantStyles(),
          textStyle,
        ]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor={colors.gray[400]}
      />
      
      {(error || success) && (
        <Text
          style={{
            fontSize: typography.caption.fontSize,
            color: getStatusColor(),
            marginTop: spacing.xs,
          }}
        >
          {getStatusText()}
        </Text>
      )}
      
      {maxLength && (
        <Text
          style={{
            fontSize: typography.small.fontSize,
            color: colors.gray[400],
            textAlign: 'right',
            marginTop: spacing.xs,
          }}
        >
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
}
