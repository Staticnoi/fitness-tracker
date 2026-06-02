import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, TextInput, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import StatCard from '@/components/StatCard';
import AchievementBadge from '@/components/AchievementBadge';
import NeonButton from '@/components/NeonButton';
import { getTodaysWorkout, getNextWorkout } from '@/utils/workoutGenerator';

const c = colors.dark;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, addBodyWeight } = useApp();
  const [weightModal, setWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const profile = state.userProfile;
  const plan = state.workoutPlan;
  const todayWorkout = plan ? getTodaysWorkout(plan) : null;
  const nextWorkout = plan ? getNextWorkout(plan) : null;
  const totalWorkouts = state.completedWorkouts.length;
  const thisWeek = state.completedWorkouts.filter(w => {
    const d = new Date(w.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  }).length;

  const goalLabel: Record<string, string> = {
    build_muscle: 'Build Muscle', lose_weight: 'Lose Weight',
    look_better: 'Look Better', stay_in_shape: 'Stay In Shape',
  };

  const nutrition = state.nutritionPlan;
  const lastWeight = state.bodyWeightHistory[state.bodyWeightHistory.length - 1]?.weight ?? profile?.weight;

  const logWeight = () => {
    const w = parseFloat(weightInput);
    if (!w || w < 20 || w > 300) { Alert.alert('Invalid weight', 'Enter a valid weight in kg.'); return; }
    addBodyWeight({ date: Date.now(), weight: w });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setWeightModal(false);
    setWeightInput('');
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}</Text>
            <Text style={styles.title}>AriseForge</Text>
          </View>
          <View style={[styles.goalChip, { backgroundColor: c.neonCyan + '15', borderColor: c.neonCyan + '40' }]}>
            <Feather name="target" size={12} color={c.neonCyan} />
            <Text style={styles.goalText}>{goalLabel[profile?.goal ?? ''] ?? 'Set Goal'}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard icon="zap" value={String(state.currentStreak)} label="Day Streak" accent={c.neonCyan} />
          <StatCard icon="check-circle" value={String(totalWorkouts)} label="Workouts" accent={c.success} />
          <StatCard icon="calendar" value={String(thisWeek)} label="This Week" accent={c.warning} />
        </View>

        {/* Today's Workout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TODAY'S WORKOUT</Text>
          {todayWorkout ? (
            <TouchableOpacity
              style={[styles.workoutCard, { backgroundColor: c.card, borderColor: c.neonCyan + '60' }]}
              onPress={() => router.push({ pathname: '/active-workout', params: { dayId: todayWorkout.id } })}
              activeOpacity={0.85}
            >
              <View style={styles.workoutCardTop}>
                <View>
                  <Text style={styles.workoutName}>{todayWorkout.name}</Text>
                  <Text style={styles.workoutMeta}>{todayWorkout.exercises.length} exercises • {todayWorkout.splitLabel}</Text>
                </View>
                <View style={[styles.startBtn, { backgroundColor: c.neonCyan }]}>
                  <Feather name="play" size={20} color="#000" />
                </View>
              </View>
              <View style={styles.exercisePreview}>
                {todayWorkout.exercises.slice(0, 3).map((ex, i) => (
                  <View key={i} style={[styles.exerciseChip, { backgroundColor: c.secondary, borderColor: c.border }]}>
                    <Text style={styles.exerciseChipText}>{ex.exercise.name}</Text>
                  </View>
                ))}
                {todayWorkout.exercises.length > 3 && (
                  <View style={[styles.exerciseChip, { backgroundColor: c.secondary }]}>
                    <Text style={[styles.exerciseChipText, { color: c.neonCyan }]}>+{todayWorkout.exercises.length - 3} more</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.restCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Feather name="moon" size={28} color={c.mutedForeground} />
              <View>
                <Text style={styles.restTitle}>Rest Day</Text>
                <Text style={styles.restSub}>Recovery is part of the process</Text>
              </View>
              {nextWorkout && (
                <Text style={[styles.nextWorkoutText, { color: c.neonCyan }]}>
                  Next: {nextWorkout.name} on {nextWorkout.dayOfWeek.charAt(0).toUpperCase() + nextWorkout.dayOfWeek.slice(1)}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Nutrition Preview */}
        {nutrition && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DAILY NUTRITION</Text>
            <View style={[styles.nutritionCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={styles.macroRow}>
                {[
                  { label: 'Calories', val: `${nutrition.calories}`, unit: 'kcal', color: c.neonCyan },
                  { label: 'Protein', val: `${nutrition.protein}g`, unit: '', color: c.success },
                  { label: 'Carbs', val: `${nutrition.carbs}g`, unit: '', color: c.warning },
                  { label: 'Fat', val: `${nutrition.fat}g`, unit: '', color: '#e040fb' },
                ].map(({ label, val, color }) => (
                  <View key={label} style={styles.macroItem}>
                    <Text style={[styles.macroVal, { color }]}>{val}</Text>
                    <Text style={styles.macroLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Body Weight */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BODY WEIGHT</Text>
          <View style={[styles.weightCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.weightRow}>
              <View>
                <Text style={styles.weightVal}>{lastWeight?.toFixed(1) ?? '—'} <Text style={styles.weightUnit}>kg</Text></Text>
                <Text style={styles.weightSub}>Current • Target: {profile?.targetWeight ?? '—'} kg</Text>
              </View>
              <TouchableOpacity style={[styles.logBtn, { borderColor: c.neonCyan, backgroundColor: c.neonCyan + '15' }]}
                onPress={() => setWeightModal(true)}>
                <Feather name="plus" size={16} color={c.neonCyan} />
                <Text style={[styles.logBtnText, { color: c.neonCyan }]}>Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EXPLORE</Text>
          <View style={styles.quickGrid}>
            {[
              { icon: 'book-open', label: 'Exercises', route: '/(tabs)/exercises', color: c.neonCyan },
              { icon: 'pie-chart', label: 'Nutrition', route: '/(tabs)/nutrition', color: c.warning },
              { icon: 'clock', label: 'History', route: '/(tabs)/history', color: c.success },
              { icon: 'bar-chart', label: 'Charts', route: '/(tabs)/progress', color: '#e040fb' },
            ].map(({ icon, label, route, color }) => (
              <TouchableOpacity key={label}
                style={[styles.quickCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
                onPress={() => router.push(route as any)} activeOpacity={0.8}>
                <View style={[styles.quickIcon, { backgroundColor: color + '15' }]}>
                  <Feather name={icon as any} size={20} color={color} />
                </View>
                <Text style={styles.quickLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Achievements */}
        {state.achievements.some(a => a.unlocked) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RECENT ACHIEVEMENTS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achieveRow}>
              {state.achievements.filter(a => a.unlocked).slice(-5).map(a => (
                <AchievementBadge key={a.id} achievement={a} />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Weight Modal */}
      <Modal visible={weightModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={styles.modalTitle}>Log Body Weight</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: c.neonCyan, color: c.neonCyan }]}
              keyboardType="numeric"
              placeholder="kg"
              placeholderTextColor={c.mutedForeground}
              value={weightInput}
              onChangeText={setWeightInput}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <NeonButton title="Cancel" variant="ghost" onPress={() => setWeightModal(false)} style={{ flex: 1 }} />
              <NeonButton title="Save" onPress={logWeight} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { paddingHorizontal: 20, gap: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 },
  greeting: { fontFamily: 'Inter_400Regular', fontSize: 13, color: c.mutedForeground },
  title: { fontFamily: 'Inter_700Bold', fontSize: 28, color: c.foreground, letterSpacing: -1 },
  goalChip: { flexDirection: 'row', gap: 5, alignItems: 'center', borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  goalText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: c.neonCyan },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 11, color: c.mutedForeground, letterSpacing: 2, marginBottom: 12 },
  workoutCard: { borderRadius: 18, borderWidth: 1.5, padding: 18, gap: 14 },
  workoutCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  workoutName: { fontFamily: 'Inter_700Bold', fontSize: 20, color: c.foreground },
  workoutMeta: { fontFamily: 'Inter_400Regular', fontSize: 13, color: c.mutedForeground, marginTop: 4 },
  startBtn: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  exercisePreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  exerciseChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  exerciseChipText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: c.foreground },
  restCard: { borderRadius: 16, borderWidth: 1, padding: 20, gap: 12 },
  restTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: c.foreground },
  restSub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: c.mutedForeground },
  nextWorkoutText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  nutritionCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around' },
  macroItem: { alignItems: 'center', gap: 4 },
  macroVal: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  macroLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: c.mutedForeground },
  weightCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  weightRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weightVal: { fontFamily: 'Inter_700Bold', fontSize: 32, color: c.foreground },
  weightUnit: { fontSize: 18, color: c.mutedForeground },
  weightSub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: c.mutedForeground, marginTop: 4 },
  logBtn: { flexDirection: 'row', gap: 6, alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  logBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: { width: '47%', borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  quickIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: c.foreground },
  achieveRow: { paddingBottom: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: 300, borderRadius: 20, borderWidth: 1, padding: 24, gap: 16 },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: c.foreground, textAlign: 'center' },
  modalInput: { fontSize: 40, fontFamily: 'Inter_700Bold', textAlign: 'center', borderBottomWidth: 2, paddingVertical: 8 },
  modalButtons: { flexDirection: 'row', gap: 10 },
});
