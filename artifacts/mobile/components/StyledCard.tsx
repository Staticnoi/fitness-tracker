import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import colors from '@/constants/colors';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  neonBorder?: boolean;
  variant?: 'default' | 'dark' | 'deep';
  padding?: number;
}

export default function StyledCard({ children, style, neonBorder, variant = 'default', padding = 16 }: Props) {
  const c = colors.dark;
  const bg = variant === 'deep' ? c.deepCard : variant === 'dark' ? c.darkCard : c.card;

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: bg,
        borderColor: neonBorder ? c.neonCyan : c.cardBorder,
        borderWidth: neonBorder ? 1.5 : 1,
        padding,
      },
      neonBorder && styles.neonShadow,
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 3,
    overflow: 'hidden',
  },
  neonShadow: {
    shadowColor: colors.dark.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
