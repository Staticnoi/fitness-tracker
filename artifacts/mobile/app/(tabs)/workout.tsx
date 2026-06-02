import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import NeonButton from '@/components/NeonButton';
import { getTodaysWorkout, getNextWorkout } from '@/utils/workoutGenerator';

const c = colors.dark;

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
  friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

export default function WorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const plan = state.workoutPlan;
  const today = plan ? getTodaysWorkout(plan) : null;
  const next = plan ? getNextWorkout(plan) : null;

  if (!plan) {
    return (
      <View style={[styles.container, styles.empty, { paddingTop: topPad }]}>
        <Feather name="zap" size={48} color={c.mutedForeground} />
        <Text style={styles.emptyTitle}>No Plan Yet</Text>
        <Text style={styles.emptySub}>Complete onboarding to generate your plan</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 90 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Your Plan</Text>
          <View style={[styles.splitBadge, { backgroundColor: c.neonCyan + '15', borderColor: c.neonCyan + '40' }]}>
            <Text style={styles.splitText}>{plan.split}</Text>
          </View>
        </View>

        {/* Today's Workout */}
        <Text style={styles.sectionTitle}>TODAY</Text>
        {today ? (
          <View style={[styles.todayCard, { borderColor: c.neonCyan + '50' }]}>
            <View style={styles.todayHeader}>
              <View>
                <Text style={styles.todayName}>{today.name}</Text>
                <Text style={styles.todayDay}>{DAY_LABELS[today.dayOfWeek]}</Text>
              </View>
              <NeonButton title="Start" onPress={() => router.push({ pathname: '/active-workout', params: { dayId: today.id } })}
                style={styles.startBtn} />
            </View>
            <View style={styles.exList}>
              {today.exercises.map((ex, i) => (
                <View key={i} style={[styles.exRow, { borderColor: c.border }]}>
                  <View style={[styles.exNum, { backgroundColor: c.neonCyan + '15' }]}>
                    <Text style={[styles.exNumText, { color: c.neonCyan }]}>{i + 1}</Text>
                  </View>
                  <View style={styles.exInfo}>
                    <Text style={styles.exName}>{ex.exercise.name}</Text>
                    <Text style={styles.exMeta}>{ex.sets} sets × {ex.reps} reps • {ex.restTime}s rest</Text>
                  </View>
                  <View style={[styles.muscleBadge, { backgroundColor: c.secondary }]}>
                    <Text style={[styles.muscleText, { color: c.mutedForeground }]}>
                      {ex.exercise.targetMuscle.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={[styles.restCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Feather name="moon" size={24} color={c.mutedForeground} />
            <Text style={styles.restText}>Rest Day — Recovery is part of training</Text>
          </View>
        )}

        {/* Weekly Schedule */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>WEEKLY SCHEDULE</Text>
        <View style={styles.weekList}>
          {plan.days.map((d, i) => (
            <TouchableOpacity key={i}
              style={[styles.dayCard, { backgroundColor: c.card, borderColor: c.border }]}
              onPress={() => router.push({ pathname: '/active-workout', params: { dayId: d.id } })}
              activeOpacity={0.8}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{DAY_LABELS[d.dayOfWeek]}</Text>
                <Text style={[styles.daySplit, { color: c.neonCyan }]}>{d.name}</Text>
                <Feather name="chevron-right" size={16} color={c.mutedForeground} />
              </View>
              <Text style={[styles.dayMeta, { color: c.mutedForeground }]}>{d.exercises.length} exercises</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 24, color: c.foreground },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 15, color: c.mutedForeground, textAlign: 'center' },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, color: c.foreground, letterSpacing: -1 },
  splitBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  splitText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: c.neonCyan },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 11, color: c.mutedForeground, letterSpacing: 2, marginBottom: 12 },
  todayCard: { backgroundColor: c.card, borderRadius: 18, borderWidth: 1.5, padding: 18, gap: 16 },
  todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  todayName: { fontFamily: 'Inter_700Bold', fontSize: 22, color: c.foreground },
  todayDay: { fontFamily: 'Inter_400Regular', fontSize: 14, color: c.mutedForeground, marginTop: 4 },
  startBtn: { paddingHorizontal: 20, paddingVertical: 10 },
  exList: { gap: 8 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1 },
  exNum: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  exNumText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  exInfo: { flex: 1 },
  exName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: c.foreground },
  exMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, color: c.mutedForeground, marginTop: 2 },
  muscleBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  muscleText: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  restCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, borderWidth: 1, padding: 18 },
  restText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: c.mutedForeground, flex: 1 },
  weekList: { gap: 8, marginBottom: 20 },
  dayCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: c.foreground, width: 90 },
  daySplit: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14 },
  dayMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
});
