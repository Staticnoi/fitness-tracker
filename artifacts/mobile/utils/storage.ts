import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState } from '@/types';
import { DEFAULT_ACHIEVEMENTS } from '@/constants/achievements';
import { CURRENT_SCHEMA_VERSION, buildProgression, dateKey, questForDate } from '@/utils/progression';
import { scaleWorkoutPlan } from '@/utils/workoutGenerator';

const KEYS = {
  APP_STATE: '@ariseforge/app_state',
};

let saveQueue: Promise<void> = Promise.resolve();

export function migrateAppState(saved: Partial<AppState>): AppState {
  const completedWorkouts = saved.completedWorkouts ?? [];
  const currentStreak = saved.currentStreak ?? 0;
  const savedAchievements = saved.achievements ?? [];
  const achievements = DEFAULT_ACHIEVEMENTS.map(defaultAchievement => ({
    ...defaultAchievement,
    ...savedAchievements.find(item => item.id === defaultAchievement.id),
  }));
  const recoveryParts = saved.progression?.completedRecoveryParts ?? 0;
  const progression = saved.schemaVersion === CURRENT_SCHEMA_VERSION && saved.progression
    ? saved.progression
    : buildProgression(completedWorkouts, currentStreak, recoveryParts);

  const workoutPlan = saved.workoutPlan && saved.userProfile
    ? scaleWorkoutPlan(saved.workoutPlan, saved.userProfile, progression.level)
    : saved.workoutPlan ?? null;
  const dailyQuests = (saved.dailyQuests ?? [questForDate(workoutPlan)].filter(Boolean) as AppState['dailyQuests']).map(quest => {
    const workout = workoutPlan?.days.find(day => day.id === quest.workoutDayId);
    return workout
      ? { ...quest, prescribedSets: workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0) }
      : quest;
  });

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    language: saved.language ?? 'en',
    onboardingCompleted: saved.onboardingCompleted ?? false,
    userProfile: saved.userProfile ?? null,
    workoutPlan,
    completedWorkouts,
    achievements,
    bodyWeightHistory: saved.bodyWeightHistory ?? [],
    currentStreak,
    longestStreak: saved.longestStreak ?? 0,
    lastWorkoutDate: saved.lastWorkoutDate ?? null,
    nutritionPlan: saved.nutritionPlan ?? null,
    progression,
    dailyQuests,
    recoveryChain: saved.recoveryChain ?? null,
    systemEvents: saved.systemEvents ?? [],
    lastQuestSyncDate: saved.lastQuestSyncDate ?? dateKey(),
    firedReminderKeys: saved.firedReminderKeys ?? [],
    activeWorkoutSessions: Object.fromEntries(Object.entries(saved.activeWorkoutSessions ?? {}).map(([key, session]) => [
      key,
      { ...session, exercises: session.exercises ?? [] },
    ])),
  };
}

export async function saveAppState(state: AppState): Promise<void> {
  const serialized = JSON.stringify(state);
  saveQueue = saveQueue
    .then(() => AsyncStorage.setItem(KEYS.APP_STATE, serialized))
    .catch(e => console.warn('Failed to save app state:', e));
  await saveQueue;
}

export async function loadAppState(): Promise<AppState | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.APP_STATE);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<AppState>;
    return migrateAppState(saved);
  } catch (e) {
    console.warn('Failed to load app state:', e);
    return null;
  }
}

export async function clearAppState(): Promise<void> {
  try {
    await saveQueue;
    await AsyncStorage.removeItem(KEYS.APP_STATE);
  } catch (e) {
    console.warn('Failed to clear app state:', e);
  }
}
