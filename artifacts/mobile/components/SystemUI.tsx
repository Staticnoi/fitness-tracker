import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '@/constants/colors';
import type { PlayerRank, ProgressionEvent } from '@/types';
import { xpForLevel } from '@/utils/progression';

const c = colors.dark;

export function SystemPanel({ children, style, active = false }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; active?: boolean }) {
  return (
    <View style={[styles.panel, active && styles.panelActive, style]}>
      <View style={styles.cornerTop} />
      <View style={styles.cornerBottom} />
      {children}
    </View>
  );
}

export function RankBadge({ rank, size = 68 }: { rank: PlayerRank; size?: number }) {
  const rankFontScale = rank.length === 1 ? 0.42 : rank.length === 2 ? 0.32 : 0.25;
  return (
    <View style={[styles.rank, { width: size, height: size * 0.78 }]}>
      <Text style={[styles.rankLabel, { fontSize: size * 0.12 }]}>CURRENT RANK</Text>
      <Text style={[styles.rankValue, { fontSize: size * rankFontScale }]}>{rank}</Text>
    </View>
  );
}

export function XpBar({ xp, level }: { xp: number; level: number }) {
  const start = xpForLevel(level);
  const end = xpForLevel(level + 1);
  const progress = Math.max(0, Math.min(1, (xp - start) / Math.max(1, end - start)));
  return (
    <View style={styles.xpWrap}>
      <View style={styles.xpLabels}>
        <Text style={styles.micro}>LEVEL {level}</Text>
        <Text style={styles.micro}>{xp - start} / {end - start} XP</Text>
      </View>
      <View style={styles.track}><View style={[styles.fill, { width: `${progress * 100}%` }]} /></View>
    </View>
  );
}

export function SystemStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
      <View style={styles.statTrack}><View style={[styles.statFill, { width: `${value}%` }]} /></View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function SystemAlert({ event }: { event: ProgressionEvent }) {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [fade]);
  return (
    <Animated.View style={[styles.alert, { opacity: fade }]}>
      <Feather name={event.type === 'quest_failed' ? 'alert-triangle' : 'cpu'} size={15} color={event.type === 'quest_failed' ? c.destructive : c.neonCyan} />
      <View style={{ flex: 1 }}>
        <Text style={styles.alertTitle}>{event.title}</Text>
        <Text style={styles.alertMessage}>{event.message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: 'rgba(7,20,38,0.92)', borderColor: c.cardBorder, borderWidth: 1, borderRadius: 3, padding: 16, overflow: 'hidden' },
  panelActive: { borderColor: c.neonCyan, shadowColor: c.neonCyan, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 },
  cornerTop: { position: 'absolute', right: -8, top: -8, width: 24, height: 24, borderLeftWidth: 1, borderLeftColor: c.neonCyan, transform: [{ rotate: '45deg' }] },
  cornerBottom: { position: 'absolute', left: -8, bottom: -8, width: 24, height: 24, borderRightWidth: 1, borderRightColor: c.neonCyan, transform: [{ rotate: '45deg' }] },
  rank: { borderWidth: 1, borderColor: c.neonCyan, backgroundColor: c.neonGlow, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, gap: 1 },
  rankLabel: { color: c.mutedForeground, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, textAlign: 'center' },
  rankValue: { color: c.neonCyan, fontFamily: 'Inter_700Bold', lineHeight: 32, textAlign: 'center' },
  xpWrap: { gap: 7 },
  xpLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  micro: { color: c.neonCyan, fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2 },
  track: { height: 5, backgroundColor: c.secondary, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: c.neonCyan },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statLabel: { width: 92, color: c.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1 },
  statTrack: { height: 4, flex: 1, backgroundColor: c.secondary },
  statFill: { height: '100%', backgroundColor: c.neonCyan },
  statValue: { width: 26, color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 13, textAlign: 'right' },
  alert: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  alertTitle: { color: c.neonCyan, fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.3 },
  alertMessage: { color: c.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
});
