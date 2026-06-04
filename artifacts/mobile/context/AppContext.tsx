import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { AppState as NativeAppState } from 'react-native';
import type { AppState, UserProfile, CompletedWorkout, BodyWeightEntry, WorkoutPlan } from '@/types';
import { saveAppState, loadAppState, clearAppState } from '@/utils/storage';
import { DEFAULT_ACHIEVEMENTS } from '@/constants/achievements';
import { generateWorkoutPlan } from '@/utils/workoutGenerator';
import { calculateNutrition } from '@/utils/nutrition';
import { CURRENT_SCHEMA_VERSION, buildProgression, completeProgression, dateKey, questForDate, syncQuests } from '@/utils/progression';

const INITIAL_STATE: AppState = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  onboardingCompleted: false,
  userProfile: null,
  workoutPlan: null,
  completedWorkouts: [],
  achievements: DEFAULT_ACHIEVEMENTS,
  bodyWeightHistory: [],
  currentStreak: 0,
  longestStreak: 0,
  lastWorkoutDate: null,
  nutritionPlan: null,
  progression: buildProgression([], 0),
  dailyQuests: [],
  recoveryChain: null,
  systemEvents: [],
  lastQuestSyncDate: dateKey(),
  firedReminderKeys: [],
};

type Action =
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'COMPLETE_ONBOARDING'; payload: UserProfile }
  | { type: 'SET_WORKOUT_PLAN'; payload: WorkoutPlan }
  | { type: 'ADD_COMPLETED_WORKOUT'; payload: CompletedWorkout }
  | { type: 'ADD_BODY_WEIGHT'; payload: BodyWeightEntry }
  | { type: 'RESET_ALL' }
  | { type: 'SYNC_QUESTS' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> };

function checkAndUnlockAchievements(state: AppState, newWorkout?: CompletedWorkout): AppState['achievements'] {
  const achievements = state.achievements.map(a => ({ ...a }));
  const totalWorkouts = state.completedWorkouts.length;
  const streak = state.currentStreak;

  const unlock = (id: string, progress?: number) => {
    const a = achievements.find(x => x.id === id);
    if (!a) return;
    if (progress !== undefined) a.progress = progress;
    if (!a.unlocked && (progress === undefined || progress >= (a.maxProgress ?? 1))) {
      a.unlocked = true;
      a.unlockedAt = Date.now();
    }
  };

  if (totalWorkouts >= 1) unlock('first_workout');
  if (totalWorkouts >= 10) unlock('total_10', Math.min(totalWorkouts, 10));
  else unlock('total_10', totalWorkouts);
  if (totalWorkouts >= 50) unlock('total_50', Math.min(totalWorkouts, 50));
  else unlock('total_50', totalWorkouts);

  unlock('streak_3', Math.min(streak, 3));
  if (streak >= 3) unlock('streak_3');
  unlock('streak_7', Math.min(streak, 7));
  if (streak >= 7) unlock('streak_7');
  unlock('streak_30', Math.min(streak, 30));
  if (streak >= 30) unlock('streak_30');

  if (newWorkout) {
    const lower = newWorkout.workoutName.toLowerCase();
    if (lower.includes('chest') || lower.includes('push')) unlock('chest_day');
    if (lower.includes('leg')) unlock('leg_day');

    const previousBest = new Map<string, number>();
    state.completedWorkouts.slice(0, -1).forEach(workout => workout.exercises.forEach(exercise => {
      const volume = exercise.sets.reduce((sum, set) => sum + set.reps * (set.weight ?? 0), 0);
      previousBest.set(exercise.name, Math.max(previousBest.get(exercise.name) ?? 0, volume));
    }));
    const hasPr = newWorkout.exercises.some(exercise => {
      const volume = exercise.sets.reduce((sum, set) => sum + set.reps * (set.weight ?? 0), 0);
      return volume > 0 && volume > (previousBest.get(exercise.name) ?? volume);
    });
    if (hasPr) unlock('new_pr');
  }

  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const currentDayIndex = (now.getDay() + 6) % 7;
  const plannedDayIndexes = state.workoutPlan?.days.map(day => dayOrder.indexOf(day.dayOfWeek)) ?? [];
  const scheduledThisWeek = state.dailyQuests.filter(quest => new Date(`${quest.dateKey}T12:00:00`) >= monday && quest.dateKey <= dateKey());
  const weekScheduleReached = plannedDayIndexes.length > 0 && Math.max(...plannedDayIndexes) <= currentDayIndex;
  if (weekScheduleReached && scheduledThisWeek.filter(quest => quest.status === 'completed').length >= plannedDayIndexes.length) unlock('no_skip_week');

  const bwCount = state.bodyWeightHistory.length;
  unlock('weight_progress', Math.min(bwCount, 5));
  if (bwCount >= 5) unlock('weight_progress');

  return achievements;
}

function calculateStreak(state: AppState, newWorkout: CompletedWorkout): { streak: number; longest: number } {
  if (!state.lastWorkoutDate) return { streak: 1, longest: Math.max(1, state.longestStreak) };
  const previous = new Date(state.lastWorkoutDate);
  previous.setHours(12, 0, 0, 0);
  const current = new Date(newWorkout.date);
  current.setHours(12, 0, 0, 0);
  const days = Math.round((current.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000));
  const streak = days === 0 ? Math.max(1, state.currentStreak) : days === 1 ? state.currentStreak + 1 : 1;
  return { streak, longest: Math.max(state.longestStreak, streak) };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;
    case 'COMPLETE_ONBOARDING': {
      const plan = generateWorkoutPlan(action.payload);
      const nutrition = calculateNutrition(action.payload);
      return {
        ...state,
        onboardingCompleted: true,
        userProfile: action.payload,
        workoutPlan: plan,
        nutritionPlan: nutrition,
        bodyWeightHistory: [{ date: Date.now(), weight: action.payload.weight }],
        progression: buildProgression([], 0),
        dailyQuests: [questForDate(plan)].filter(Boolean) as AppState['dailyQuests'],
        recoveryChain: null,
        systemEvents: [],
        lastQuestSyncDate: dateKey(),
        firedReminderKeys: [],
      };
    }
    case 'SET_WORKOUT_PLAN':
      return { ...state, workoutPlan: action.payload };
    case 'ADD_COMPLETED_WORKOUT': {
      const isActiveQuest = state.dailyQuests.some(quest =>
        quest.workoutDayId === action.payload.workoutDayId
        && quest.dateKey === dateKey(action.payload.date)
        && quest.status === 'active'
      );
      const isActiveRecovery = state.recoveryChain?.objectives.some(objective =>
        objective.workout.id === action.payload.workoutDayId && objective.status === 'active'
      ) ?? false;
      const streakResult = isActiveQuest || isActiveRecovery
        ? calculateStreak(state, action.payload)
        : { streak: state.currentStreak, longest: state.longestStreak };
      const progressed = completeProgression({
        ...state,
        currentStreak: streakResult.streak,
        longestStreak: Math.max(streakResult.longest, state.longestStreak),
        lastWorkoutDate: isActiveQuest || isActiveRecovery ? action.payload.date : state.lastWorkoutDate,
      }, action.payload);
      const achievements = checkAndUnlockAchievements(progressed, action.payload);
      const newlyUnlocked = achievements.filter(item => item.unlocked && !state.achievements.find(previous => previous.id === item.id)?.unlocked);
      const recordEvents = newlyUnlocked.map(item => ({
        id: `${Date.now()}:record:${item.id}`,
        type: 'record_unlocked' as const,
        title: 'RECORD UNLOCKED',
        message: item.name,
        createdAt: Date.now(),
      }));
      return { ...progressed, achievements, systemEvents: [...recordEvents, ...progressed.systemEvents].slice(0, 30) };
    }
    case 'ADD_BODY_WEIGHT': {
      const newHistory = [...state.bodyWeightHistory, action.payload];
      const newState = { ...state, bodyWeightHistory: newHistory };
      const achievements = checkAndUnlockAchievements(newState);
      const newlyUnlocked = achievements.filter(item => item.unlocked && !state.achievements.find(previous => previous.id === item.id)?.unlocked);
      const recordEvents = newlyUnlocked.map(item => ({
        id: `${Date.now()}:record:${item.id}`,
        type: 'record_unlocked' as const,
        title: 'RECORD UNLOCKED',
        message: item.name,
        createdAt: Date.now(),
      }));
      return { ...newState, achievements, systemEvents: [...recordEvents, ...state.systemEvents].slice(0, 30) };
    }
    case 'UPDATE_PROFILE': {
      if (!state.userProfile) return state;
      const updatedProfile = { ...state.userProfile, ...action.payload };
      const changedKeys = Object.keys(action.payload) as Array<keyof UserProfile>;
      if (changedKeys.every(key => key === 'reminderSettings')) {
        return { ...state, userProfile: updatedProfile };
      }
      const plan = generateWorkoutPlan(updatedProfile);
      const nutrition = calculateNutrition(updatedProfile);
      return {
        ...state,
        userProfile: updatedProfile,
        workoutPlan: plan,
        nutritionPlan: nutrition,
        dailyQuests: [questForDate(plan)].filter(Boolean) as AppState['dailyQuests'],
        recoveryChain: null,
        lastQuestSyncDate: dateKey(),
      };
    }
    case 'SYNC_QUESTS':
      return syncQuests(state);
    case 'RESET_ALL':
      return INITIAL_STATE;
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  completeOnboarding: (profile: UserProfile) => void;
  addCompletedWorkout: (workout: CompletedWorkout) => void;
  addBodyWeight: (entry: BodyWeightEntry) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  resetAll: () => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    loadAppState().then(loaded => {
      if (loaded) dispatch({ type: 'LOAD_STATE', payload: syncQuests(loaded) });
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    const subscription = NativeAppState.addEventListener('change', status => {
      if (status === 'active') dispatch({ type: 'SYNC_QUESTS' });
    });
    const reminderTimer = setInterval(() => dispatch({ type: 'SYNC_QUESTS' }), 60_000);
    return () => {
      subscription.remove();
      clearInterval(reminderTimer);
    };
  }, []);

  useEffect(() => {
    if (!isLoading) saveAppState(state);
  }, [state, isLoading]);

  const completeOnboarding = useCallback((profile: UserProfile) => {
    dispatch({ type: 'COMPLETE_ONBOARDING', payload: profile });
  }, []);

  const addCompletedWorkout = useCallback((workout: CompletedWorkout) => {
    dispatch({ type: 'ADD_COMPLETED_WORKOUT', payload: workout });
  }, []);

  const addBodyWeight = useCallback((entry: BodyWeightEntry) => {
    dispatch({ type: 'ADD_BODY_WEIGHT', payload: entry });
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: updates });
  }, []);

  const resetAll = useCallback(async () => {
    await clearAppState();
    dispatch({ type: 'RESET_ALL' });
  }, []);

  return (
    <AppContext.Provider value={{ state, completeOnboarding, addCompletedWorkout, addBodyWeight, updateProfile, resetAll, isLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
