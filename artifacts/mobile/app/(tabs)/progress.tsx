import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions, Modal, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import StatCard from '@/components/StatCard';
import { RankBadge, SystemPanel, SystemStat, XpBar } from '@/components/SystemUI';
import NeonButton from '@/components/NeonButton';

const c = colors.dark;
const { width } = Dimensions.get('window');
const CHART_W = width - 40;

function BarChart({ data, label, color }: { data: number[]; label: string; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{label}</Text>
      <View style={styles.bars}>
        {data.map((val, i) => (
          <View key={i} style={styles.barCol}>
            <View style={[styles.bar, { height: Math.max((val / max) * 100, 2), backgroundColor: val > 0 ? color : c.secondary }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

function WeightChart({ data }: { data: Array<{ date: number; weight: number }> }) {
  if (data.length < 2) return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Body Weight</Text>
      <View style={[styles.emptyChart, { backgroundColor: c.secondary }]}>
        <Feather name="trending-up" size={24} color={c.mutedForeground} />
        <Text style={[styles.emptyChartText, { color: c.mutedForeground }]}>Log more weight entries to see chart</Text>
      </View>
    </View>
  );

  const weights = data.map(d => d.weight);
  const min = Math.min(...weights) - 2;
  const max = Math.max(...weights) + 2;
  const range = max - min;

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Body Weight (kg)</Text>
      <View style={[styles.weightChart, { backgroundColor: c.secondary + '40' }]}>
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * (CHART_W - 60);
          const y = ((max - d.weight) / range) * 80;
          return (
            <View key={i} style={[styles.weightDot, { left: x + 20, top: y + 10 }]}>
              <View style={[styles.dotCircle, { backgroundColor: c.neonCyan }]} />
              {i % 3 === 0 && (
                <Text style={[styles.dotLabel, { color: c.neonCyan }]}>{d.weight.toFixed(1)}</Text>
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.weightRow}>
        <Text style={[styles.weightStat, { color: c.success }]}>Start: {data[0].weight} kg</Text>
        <Text style={[styles.weightStat, { color: c.neonCyan }]}>Now: {data[data.length - 1].weight} kg</Text>
        <Text style={[styles.weightStat, { color: data[data.length - 1].weight < data[0].weight ? c.success : c.warning }]}>
          {(data[data.length - 1].weight - data[0].weight).toFixed(1)} kg
        </Text>
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { state, addBodyWeight } = useApp();
  const [weightModal, setWeightModal] = useState(false);
  const [weight, setWeight] = useState('');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const now = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const count = state.completedWorkouts.filter(w => {
      const wd = new Date(w.date);
      return `${wd.getFullYear()}-${wd.getMonth()}-${wd.getDate()}` === dateStr;
    }).length;
    return count;
  });

  const weeklyVol = Array.from({ length: 4 }, (_, weekIdx) => {
    const weekEnd = new Date(now.getTime() - weekIdx * 7 * 24 * 60 * 60 * 1000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    return state.completedWorkouts
      .filter(w => w.date >= weekStart.getTime() && w.date <= weekEnd.getTime())
      .reduce((a, w) => a + w.totalVolume, 0);
  }).reverse();

  const muscleFreq: Record<string, number> = {};
  state.completedWorkouts.forEach(w => {
    w.exercises.forEach(ex => {
      const m = ex.targetMuscle ?? 'other';
      muscleFreq[m] = (muscleFreq[m] ?? 0) + (ex.sets?.length ?? 0);
    });
  });
  const topMuscles = Object.entries(muscleFreq).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 90 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.statusHeader}>
          <View><Text style={styles.statusEyebrow}>SYSTEM // PLAYER ANALYSIS</Text><Text style={styles.pageTitle}>Status</Text></View>
          <RankBadge rank={state.progression.rank} size={62} />
        </View>
        <SystemPanel active style={styles.progressionCard}>
          <XpBar xp={state.progression.xp} level={state.progression.level} />
          {(Object.entries(state.progression.stats) as Array<[string, number]>).map(([label, value]) => <SystemStat key={label} label={label} value={value} />)}
        </SystemPanel>
        <NeonButton title="LOG BODY WEIGHT" variant="secondary" onPress={() => setWeightModal(true)} style={{ marginBottom: 18 }} />

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard icon="zap" value={String(state.currentStreak)} label="Streak" accent={c.neonCyan} />
          <StatCard icon="award" value={String(state.longestStreak)} label="Best Streak" accent={c.gold} />
          <StatCard icon="check" value={String(state.completedWorkouts.length)} label="Total" accent={c.success} />
        </View>

        {/* Body Weight Chart */}
        <WeightChart data={state.bodyWeightHistory} />

        {/* Daily Activity */}
        <View style={[styles.chartCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <BarChart data={last7} label="Last 7 Days (Workouts)" color={c.neonCyan} />
          <View style={styles.dayLabels}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <Text key={i} style={[styles.dayLabel, { color: c.mutedForeground }]}>{d}</Text>
            ))}
          </View>
        </View>

        {/* Weekly Volume */}
        <View style={[styles.chartCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <BarChart data={weeklyVol} label="Weekly Volume (kg)" color={c.success} />
          <View style={styles.dayLabels}>
            {['W-3', 'W-2', 'W-1', 'This'].map(d => (
              <Text key={d} style={[styles.dayLabel, { color: c.mutedForeground }]}>{d}</Text>
            ))}
          </View>
        </View>

        {/* Muscle Frequency */}
        {topMuscles.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={styles.chartTitle}>Muscle Frequency</Text>
            {topMuscles.map(([muscle, count]) => {
              const max = topMuscles[0][1];
              return (
                <View key={muscle} style={styles.muscleRow}>
                  <Text style={[styles.muscleName, { color: c.foreground }]} numberOfLines={1}>
                    {muscle.charAt(0).toUpperCase() + muscle.replace('_', ' ').slice(1)}
                  </Text>
                  <View style={[styles.muscleTrack, { backgroundColor: c.secondary }]}>
                    <View style={[styles.muscleFill, { width: `${(count / max) * 100}%`, backgroundColor: c.neonCyan }]} />
                  </View>
                  <Text style={[styles.muscleCount, { color: c.neonCyan }]}>{count}</Text>
                </View>
              );
            })}
          </View>
        )}

        {state.completedWorkouts.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: c.card, borderColor: c.border }]}>
            <Feather name="bar-chart-2" size={40} color={c.mutedForeground} />
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={[styles.emptySub, { color: c.mutedForeground }]}>Complete workouts to see your progress charts</Text>
          </View>
        )}
      </ScrollView>
      <Modal visible={weightModal} transparent animationType="fade" onRequestClose={() => setWeightModal(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalCard}>
          <Text style={styles.modalTitle}>BODY WEIGHT ENTRY</Text>
          <TextInput style={styles.modalInput} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="kg" placeholderTextColor={c.mutedForeground} autoFocus />
          <View style={styles.modalButtons}><NeonButton title="CANCEL" variant="ghost" onPress={() => setWeightModal(false)} style={{ flex: 1 }} /><NeonButton title="SAVE" onPress={() => {
            const value = Number(weight);
            if (!Number.isFinite(value) || value < 20 || value > 300) return Alert.alert('Invalid weight', 'Enter a value between 20 and 300 kg.');
            addBodyWeight({ date: Date.now(), weight: value });
            setWeight('');
            setWeightModal(false);
          }} style={{ flex: 1 }} /></View>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { paddingHorizontal: 20 },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, color: c.foreground, letterSpacing: -1, paddingVertical: 20 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 10 },
  statusEyebrow: { color: c.neonCyan, fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.5, marginBottom: -14 },
  progressionCard: { gap: 14, marginBottom: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: c.darkCard, borderWidth: 1, borderColor: c.neonCyan, padding: 18, gap: 14 },
  modalTitle: { color: c.neonCyan, fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 1.5 },
  modalInput: { color: c.foreground, backgroundColor: c.secondary, borderWidth: 1, borderColor: c.border, padding: 12, fontFamily: 'Inter_700Bold', fontSize: 28, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', gap: 10 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  chartCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, gap: 12 },
  chartContainer: { gap: 12 },
  chartTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: c.foreground },
  bars: { flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 110 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', minHeight: 2, borderRadius: 4 },
  dayLabels: { flexDirection: 'row', gap: 6 },
  dayLabel: { flex: 1, textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 11 },
  emptyChart: { borderRadius: 12, height: 100, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyChartText: { fontFamily: 'Inter_400Regular', fontSize: 12, textAlign: 'center' },
  weightChart: { height: 110, borderRadius: 10, position: 'relative', overflow: 'visible', marginVertical: 4 },
  weightDot: { position: 'absolute' },
  dotCircle: { width: 8, height: 8, borderRadius: 4 },
  dotLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 2 },
  weightRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weightStat: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  muscleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  muscleName: { fontFamily: 'Inter_500Medium', fontSize: 13, width: 90 },
  muscleTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  muscleFill: { height: '100%', borderRadius: 3 },
  muscleCount: { fontFamily: 'Inter_600SemiBold', fontSize: 12, width: 28, textAlign: 'right' },
  emptyState: { borderRadius: 16, borderWidth: 1, padding: 40, alignItems: 'center', gap: 12 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: c.foreground },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center' },
});
