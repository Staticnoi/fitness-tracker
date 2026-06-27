import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import WorkoutExerciseCard from '@/components/WorkoutExerciseCard';
import NeonButton from '@/components/NeonButton';
import TrainingHudOverlay from '@/components/TrainingHudOverlay';
import { useApp } from '@/context/AppContext';
import type { CompletedSet } from '@/types';
import { dateKey } from '@/utils/progression';
import { tr } from '@/utils/i18n';
import { numericRepTarget } from '@/utils/workoutGenerator';

const c = colors.dark;
type HudMode = 'scanner' | 'counter';

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function ActiveWorkoutScreen() {
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, addCompletedWorkout, startWorkoutSession, updateWorkoutDraft, clearWorkoutSession } = useApp();
  const language = state.language;
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [hudVisible, setHudVisible] = useState(false);
  const [hudMode, setHudMode] = useState<HudMode>('scanner');
  const [hudRevision, setHudRevision] = useState(0);
  const [lastHudCapture, setLastHudCapture] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const workoutDay = state.workoutPlan?.days.find(d => d.id === dayId)
    ?? state.recoveryChain?.objectives.find(objective => objective.workout.id === dayId)?.workout;
  const sessionStartedAt = dayId ? state.activeWorkoutSessions[dayId]?.startedAt : undefined;
  const sessionDraft = dayId ? state.activeWorkoutSessions[dayId]?.exercises ?? [] : [];
  const exerciseData = useRef<Array<{ sets: CompletedSet[]; notes: string }>>(
    workoutDay ? workoutDay.exercises.map((_, index) => sessionDraft[index] ?? { sets: [], notes: '' }) : []
  );

  useEffect(() => {
    if (dayId && !sessionStartedAt) startWorkoutSession(dayId);
  }, [dayId, sessionStartedAt, startWorkoutSession]);

  useEffect(() => {
    if (!sessionStartedAt) return;
    const updateElapsed = () => setElapsed(Math.max(0, Math.floor((Date.now() - sessionStartedAt) / 1000)));
    updateElapsed();
    timerRef.current = setInterval(updateElapsed, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionStartedAt]);

  const updateExercise = useCallback((index: number, sets: CompletedSet[], notes: string) => {
    exerciseData.current[index] = { sets, notes };
    if (dayId) updateWorkoutDraft(dayId, index, sets, notes);
  }, [dayId, updateWorkoutDraft]);

  const openHud = (mode: HudMode) => {
    setHudMode(mode);
    setHudVisible(true);
  };

  const applyRepSet = useCallback((exerciseIndex: number, reps: number) => {
    if (!workoutDay) return;
    const prescribed = workoutDay.exercises[exerciseIndex];
    if (!prescribed) return;

    const current = exerciseData.current[exerciseIndex] ?? { sets: [], notes: '' };
    const defaultReps = numericRepTarget(prescribed.reps);
    const sets = Array.from({ length: prescribed.sets }, (_, setIndex) => ({
      reps: current.sets[setIndex]?.reps ?? defaultReps,
      weight: current.sets[setIndex]?.weight ?? 0,
      completed: current.sets[setIndex]?.completed ?? false,
    }));
    const firstOpenSet = sets.findIndex(set => !set.completed);
    const targetSet = firstOpenSet >= 0 ? firstOpenSet : sets.length - 1;
    sets[targetSet] = { ...sets[targetSet], reps, completed: true };

    updateExercise(exerciseIndex, sets, current.notes);
    setHudRevision(revision => revision + 1);
    setLastHudCapture(`${prescribed.exercise.name} | set ${targetSet + 1} | ${reps} reps verified`);
  }, [updateExercise, workoutDay]);

  const completeWorkout = () => {
    if (saving) return;
    const alreadyCleared = state.dailyQuests.some(quest => quest.workoutDayId === dayId && quest.dateKey === dateKey() && quest.status === 'completed')
      || state.recoveryChain?.objectives.some(objective => objective.workout.id === dayId && objective.status === 'completed');
    if (alreadyCleared) {
      if (dayId) clearWorkoutSession(dayId);
      Alert.alert('Quest Already Cleared', 'This quest has already granted its progression reward.');
      return;
    }
    const requiredSets = workoutDay?.exercises.reduce((sum, exercise) => sum + exercise.sets, 0) ?? 0;
    const completedSets = exerciseData.current.reduce((sum, exercise) => sum + exercise.sets.filter(set => set.completed && set.reps > 0).length, 0);
    if (completedSets < requiredSets) {
      Alert.alert('Quest Requirements Incomplete', `Complete every prescribed set before clearing this quest. ${completedSets}/${requiredSets} sets verified.`);
      return;
    }
    Alert.alert('Clear Quest?', 'Submit all verified training data to the System?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete', onPress: async () => {
          if (timerRef.current) clearInterval(timerRef.current);
          setSaving(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          const totalVolume = exerciseData.current.reduce((total, ex) =>
            total + ex.sets.reduce((setTotal, s) => setTotal + (s.reps * (s.weight ?? 0)), 0), 0);

          const completed = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            workoutDayId: dayId ?? '',
            workoutName: workoutDay?.name ?? 'Workout',
            date: Date.now(),
            duration: Math.round(elapsed / 60),
            exercises: (workoutDay?.exercises ?? []).map((ex, i) => ({
              name: ex.exercise.name,
              targetMuscle: ex.exercise.targetMuscle,
              sets: (exerciseData.current[i]?.sets ?? []).filter(set => set.completed),
              notes: exerciseData.current[i]?.notes,
            })),
            totalVolume,
          };
          addCompletedWorkout(completed);
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (!workoutDay) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <Text style={styles.errorText}>Workout not found</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: c.neonCyan }}>Go Back</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => Alert.alert('Leave Workout?', 'Your weights, completed sets, notes, and timer will be saved.', [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => router.back() },
        ])} style={styles.closeBtn}>
          <Feather name="x" size={20} color={c.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.workoutName}>{tr(language, 'active.quest')} // {workoutDay.name}</Text>
          <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
        </View>
        <View style={[styles.splitBadge, { backgroundColor: c.neonCyan + '15', borderColor: c.neonCyan + '40' }]}>
          <Text style={[styles.splitText, { color: c.neonCyan }]}>{workoutDay.splitLabel}</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statVal}>{workoutDay.exercises.length}</Text>
          <Text style={styles.statLbl}>{tr(language, 'active.exercises')}</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statVal}>{workoutDay.exercises.reduce((a, ex) => a + ex.sets, 0)}</Text>
          <Text style={styles.statLbl}>{tr(language, 'active.totalSets')}</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statVal}>{formatTime(elapsed)}</Text>
          <Text style={styles.statLbl}>{tr(language, 'active.duration')}</Text>
        </View>
      </View>

      <View style={styles.featureDock}>
        <TouchableOpacity style={styles.hudButton} onPress={() => openHud('scanner')} activeOpacity={0.85}>
          <Feather name="camera" size={17} color={c.neonCyan} />
          <View style={styles.hudButtonTextWrap}>
            <Text style={styles.hudButtonTitle}>AI Form Scanner</Text>
            <Text style={styles.hudButtonSub}>HUD posture cues</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.hudButton} onPress={() => openHud('counter')} activeOpacity={0.85}>
          <Feather name="activity" size={17} color={c.success} />
          <View style={styles.hudButtonTextWrap}>
            <Text style={styles.hudButtonTitle}>Rep Counter</Text>
            <Text style={styles.hudButtonSub}>HUD set tracker</Text>
          </View>
        </TouchableOpacity>
      </View>
      {lastHudCapture && (
        <View style={styles.hudStatus}>
          <Feather name="check-circle" size={14} color={c.success} />
          <Text style={styles.hudStatusText} numberOfLines={1}>{lastHudCapture}</Text>
        </View>
      )}

      {/* Exercise list */}
      <ScrollView style={styles.list} contentContainerStyle={[styles.listContent, { paddingBottom: botPad + 100 }]}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {workoutDay.exercises.map((ex, i) => (
          <WorkoutExerciseCard key={ex.exercise.id + i} item={ex} index={i}
            initialSets={sessionDraft[i]?.sets}
            initialNotes={sessionDraft[i]?.notes}
            syncedSets={exerciseData.current[i]?.sets}
            syncedNotes={exerciseData.current[i]?.notes}
            syncRevision={hudRevision}
            onUpdate={(sets, notes) => updateExercise(i, sets, notes)} />
        ))}
      </ScrollView>

      {/* Complete button */}
      <View style={[styles.footer, { paddingBottom: botPad + 12 }]}>
        <NeonButton title={tr(language, 'active.clear')} size="lg" onPress={completeWorkout} loading={saving} style={styles.completeBtn} />
      </View>
      <TrainingHudOverlay
        visible={hudVisible}
        initialMode={hudMode}
        exercises={workoutDay.exercises}
        onClose={() => setHudVisible(false)}
        onApplyRepSet={applyRepSet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 16, color: c.mutedForeground, textAlign: 'center', marginTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: c.secondary, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  workoutName: { fontFamily: 'Inter_700Bold', fontSize: 17, color: c.foreground },
  timerText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: c.neonCyan, marginTop: 2 },
  splitBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  splitText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  statChip: { flex: 1, backgroundColor: c.card, borderRadius: 3, borderWidth: 1, borderColor: c.border, padding: 10, alignItems: 'center' },
  statVal: { fontFamily: 'Inter_700Bold', fontSize: 18, color: c.foreground },
  statLbl: { fontFamily: 'Inter_400Regular', fontSize: 11, color: c.mutedForeground },
  featureDock: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  hudButton: { flex: 1, minHeight: 54, borderRadius: 8, borderWidth: 1, borderColor: c.neonCyan + '45', backgroundColor: c.darkCard, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 9 },
  hudButtonTextWrap: { flex: 1 },
  hudButtonTitle: { fontFamily: 'Inter_700Bold', fontSize: 12, color: c.foreground },
  hudButtonSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: c.mutedForeground, marginTop: 2 },
  hudStatus: { minHeight: 32, marginHorizontal: 16, marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor: c.success + '55', backgroundColor: c.success + '12', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  hudStatusText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12, color: c.success },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 4, gap: 2 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.background },
  completeBtn: { width: '100%' },
});
