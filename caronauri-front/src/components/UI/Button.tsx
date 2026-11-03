import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, BUTTON } from '../../styles/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  title?: string;
  onPress?: () => void;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: string;
  iconRight?: boolean;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  icon,
  iconRight = false,
  disabled = false,
  loading = false,
  fullWidth = false,
}: ButtonProps) {
  const bgColor = variant === 'primary' ? COLORS.primaryLight : variant === 'secondary' ? COLORS.white : 'transparent';
  const border = variant === 'secondary' ? { borderWidth: 1.5, borderColor: COLORS.border } : {};
  const textColor = variant === 'primary' ? COLORS.white : variant === 'secondary' ? COLORS.text : COLORS.primaryLight;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bgColor, ...(fullWidth ? { alignSelf: 'stretch' } : {}) },
        border,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon && !iconRight ? (
            <Ionicons name={icon as any} size={18} color={textColor} style={{ marginRight: 8 }} />
          ) : null}
          {title ? (
            <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
          ) : null}
          {icon && iconRight ? (
            <Ionicons name={icon as any} size={18} color={textColor} style={{ marginLeft: 8 }} />
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: BUTTON.height,
    borderRadius: BUTTON.radius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  text: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
});
