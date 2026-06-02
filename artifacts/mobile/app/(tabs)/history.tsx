import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';

const c = colors.dark;

function formatDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const sorted = [...state.completedWorkouts].sort((a, b) => b.date - a.date);

  // Group by date string
  const grouped: Array<{ dateLabel: string; workouts: typeof sorted }> = [];
  sorted.forEach(w => {
    const label = formatDate(w.date);
    const last = grouped[grouped.length - 1];
    if (last && last.dateLabel === label) last.workouts.push(w);
    else grouped.push({ dateLabel: label, workouts: [w] });
  });

  const totalVol = state.completedWorkouts.reduce((a, w) => a + w.totalVolume, 0);
  const avgDur = state.completedWorkouts.length
    ? Math.round(state.completedWorkouts.reduce((a, w) => a + w.duration, 0) / state.completedWorkouts.length)
    : 0;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 90 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>History</Text>
          {state.completedWorkouts.length > 0 && (
            <View style={[styles.badge, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.badgeText, { color: c.neonCyan }]}>{state.completedWorkouts.length} workouts</Text>
            </View>
          )}
        </View>

        {/* Summary stats */}
        {state.completedWorkouts.length > 0 && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.statVal, { color: c.neonCyan }]}>{totalVol.toLocaleString()}</Text>
              <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Total kg lifted</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.statVal, { color: c.success }]}>{formatDuration(avgDur)}</Text>
              <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Avg duration</Text>
            </View>
          </View>
        )}

        {/* Grouped workout history */}
        {grouped.map(group => (
          <View key={group.dateLabel} style={styles.group}>
            <Text style={styles.dateLabel}>{group.dateLabel}</Text>
            {group.workouts.map(w => (
              <View key={w.id} style={[styles.workoutCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconWrap, { backgroundColor: c.neonCyan + '15' }]}>
                    <Feather name="activity" size={18} color={c.neonCyan} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.workoutName}>{w.workoutName}</Text>
                    <Text style={[styles.workoutDate, { color: c.mutedForeground }]}>
                      {new Date(w.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={styles.cardStats}>
                    <Text style={[styles.cardStat, { color: c.neonCyan }]}>{formatDuration(w.duration)}</Text>
                    {w.totalVolume > 0 && (
                      <Text style={[styles.cardStatSub, { color: c.mutedForeground }]}>{w.totalVolume}kg</Text>
                    )}
                  </View>
                </View>

                {/* Exercises */}
                <View style={styles.exList}>
                  {w.exercises.slice(0, 4).map((ex, i) => (
                    <View key={i} style={[styles.exChip, { backgroundColor: c.secondary }]}>
                      <Text style={[styles.exChipText, { color: c.foreground }]} numberOfLines={1}>{ex.name}</Text>
                      {ex.sets.length > 0 && (
                        <Text style={[styles.exSets, { color: c.mutedForeground }]}>{ex.sets.length}s</Text>
                      )}
                    </View>
                  ))}
                  {w.exercises.length > 4 && (
                    <View style={[styles.exChip, { backgroundColor: c.secondary }]}>
                      <Text style={[styles.exChipText, { color: c.neonCyan }]}>+{w.exercises.length - 4}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}

        {sorted.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: c.card, borderColor: c.border }]}>
            <Feather name="clock" size={48} color={c.mutedForeground} />
            <Text style={styles.emptyTitle}>No workouts yet</Text>
            <Text style={[styles.emptySub, { color: c.mutedForeground }]}>
              Complete your first workout to build your history
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { paddingHorizontal: 20, gap: 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, color: c.foreground, letterSpacing: -1 },
  badge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  statVal: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  group: { marginBottom: 20 },
  dateLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, color: c.mutedForeground, letterSpacing: 2, marginBottom: 10 },
  workoutCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  workoutName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: c.foreground },
  workoutDate: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  cardStats: { alignItems: 'flex-end', gap: 2 },
  cardStat: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  cardStatSub: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  exList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  exChip: { flexDirection: 'row', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center' },
  exChipText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  exSets: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  emptyState: { borderRadius: 16, borderWidth: 1, padding: 40, alignItems: 'center', gap: 12, marginTop: 20 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: c.foreground },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center' },
});
