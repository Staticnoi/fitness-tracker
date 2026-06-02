import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import type { AppState, UserProfile, CompletedWorkout, BodyWeightEntry, WorkoutPlan } from '@/types';
import { saveAppState, loadAppState, clearAppState } from '@/utils/storage';
import { DEFAULT_ACHIEVEMENTS } from '@/constants/achievements';
import { generateWorkoutPlan } from '@/utils/workoutGenerator';
import { calculateNutrition } from '@/utils/nutrition';

const INITIAL_STATE: AppState = {
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
};

type Action =
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'COMPLETE_ONBOARDING'; payload: UserProfile }
  | { type: 'SET_WORKOUT_PLAN'; payload: WorkoutPlan }
  | { type: 'ADD_COMPLETED_WORKOUT'; payload: CompletedWorkout }
  | { type: 'ADD_BODY_WEIGHT'; payload: BodyWeightEntry }
  | { type: 'RESET_ALL' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> };

function checkAndUnlockAchievements(state: AppState, newWorkout?: CompletedWorkout): AppState['achievements'] {
  const achievements = state.achievements.map(a => ({ ...a }));
  const totalWorkouts = state.completedWorkouts.length + (newWorkout ? 1 : 0);
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
  }

  const bwCount = state.bodyWeightHistory.length;
  unlock('weight_progress', Math.min(bwCount, 5));
  if (bwCount >= 5) unlock('weight_progress');

  return achievements;
}

function calculateStreak(completedWorkouts: CompletedWorkout[], newWorkout?: CompletedWorkout): { streak: number; longest: number } {
  const allWorkouts = newWorkout ? [...completedWorkouts, newWorkout] : completedWorkouts;
  if (!allWorkouts.length) return { streak: 0, longest: 0 };

  const dates = [...new Set(allWorkouts.map(w => {
    const d = new Date(w.date);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }))].sort().reverse();

  let streak = 1;
  let longest = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 1.5) { streak++; longest = Math.max(longest, streak); }
    else { streak = 1; }
  }
  return { streak, longest };
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
      };
    }
    case 'SET_WORKOUT_PLAN':
      return { ...state, workoutPlan: action.payload };
    case 'ADD_COMPLETED_WORKOUT': {
      const newWorkouts = [...state.completedWorkouts, action.payload];
      const { streak, longest } = calculateStreak(state.completedWorkouts, action.payload);
      const newState: AppState = {
        ...state,
        completedWorkouts: newWorkouts,
        currentStreak: streak,
        longestStreak: Math.max(longest, state.longestStreak),
        lastWorkoutDate: action.payload.date,
      };
      return { ...newState, achievements: checkAndUnlockAchievements(newState, action.payload) };
    }
    case 'ADD_BODY_WEIGHT': {
      const newHistory = [...state.bodyWeightHistory, action.payload];
      const newState = { ...state, bodyWeightHistory: newHistory };
      return { ...newState, achievements: checkAndUnlockAchievements(newState) };
    }
    case 'UPDATE_PROFILE': {
      if (!state.userProfile) return state;
      const updatedProfile = { ...state.userProfile, ...action.payload };
      const plan = generateWorkoutPlan(updatedProfile);
      const nutrition = calculateNutrition(updatedProfile);
      return { ...state, userProfile: updatedProfile, workoutPlan: plan, nutritionPlan: nutrition };
    }
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
      if (loaded) dispatch({ type: 'LOAD_STATE', payload: loaded });
      setIsLoading(false);
    });
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
