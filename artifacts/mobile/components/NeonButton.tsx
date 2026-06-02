import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function NeonButton({ title, onPress, variant = 'primary', size = 'md', disabled, loading, style, textStyle }: Props) {
  const c = colors.dark;

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const btnStyle: ViewStyle[] = [styles.base];
  const txtStyle: TextStyle[] = [styles.text];

  if (size === 'sm') { btnStyle.push(styles.sm); txtStyle.push(styles.textSm); }
  else if (size === 'lg') { btnStyle.push(styles.lg); txtStyle.push(styles.textLg); }
  else { btnStyle.push(styles.md); txtStyle.push(styles.textMd); }

  if (variant === 'primary') {
    btnStyle.push({ backgroundColor: c.neonCyan, borderColor: c.neonCyan });
    txtStyle.push({ color: '#000000', fontWeight: '700' });
  } else if (variant === 'secondary') {
    btnStyle.push({ backgroundColor: 'transparent', borderColor: c.neonCyan, borderWidth: 1.5 });
    txtStyle.push({ color: c.neonCyan });
  } else if (variant === 'ghost') {
    btnStyle.push({ backgroundColor: c.secondary, borderColor: c.border, borderWidth: 1 });
    txtStyle.push({ color: c.foreground });
  } else if (variant === 'danger') {
    btnStyle.push({ backgroundColor: 'transparent', borderColor: c.destructive, borderWidth: 1.5 });
    txtStyle.push({ color: c.destructive });
  }

  if (disabled || loading) btnStyle.push(styles.disabled);

  return (
    <TouchableOpacity
      style={[...btnStyle, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled || loading}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? '#000' : c.neonCyan} size="small" />
        : <Text style={[...txtStyle, textStyle]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sm: { paddingVertical: 8, paddingHorizontal: 16 },
  md: { paddingVertical: 14, paddingHorizontal: 24 },
  lg: { paddingVertical: 18, paddingHorizontal: 32 },
  text: { fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
  textSm: { fontSize: 13 },
  textMd: { fontSize: 15 },
  textLg: { fontSize: 17 },
  disabled: { opacity: 0.4 },
});
