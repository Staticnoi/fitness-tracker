import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '@/constants/colors';

interface Props {
  icon: string;
  value: string;
  label: string;
  accent?: string;
  style?: ViewStyle;
}

export default function StatCard({ icon, value, label, accent, style }: Props) {
  const c = colors.dark;
  const accentColor = accent ?? c.neonCyan;
  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }, style]}>
      <View style={[styles.iconWrap, { backgroundColor: accentColor + '18' }]}>
        <Feather name={icon as any} size={18} color={accentColor} />
      </View>
      <Text style={[styles.value, { color: c.foreground }]} numberOfLines={1}>{value}</Text>
      <Text style={[styles.label, { color: c.mutedForeground }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 6, minWidth: 80 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  value: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  label: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});
