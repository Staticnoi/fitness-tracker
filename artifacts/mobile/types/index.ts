export type Gender = 'male' | 'female' | 'other';
export type Goal = 'build_muscle' | 'lose_weight' | 'look_better' | 'stay_in_shape';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
export type HealthIssue = 'none' | 'knee' | 'hip_joints' | 'back_hernia' | 'arms_shoulders' | 'no_jumps';
export type Equipment = 'none_bodyweight' | 'full_gym' | 'barbells' | 'dumbbells' | 'kettlebells' | 'machines';
export type MuscleGroup = 'full_body' | 'chest' | 'back' | 'arms' | 'shoulders' | 'abs' | 'legs' | 'glutes';
export type Motivation = 'health' | 'weight_loss' | 'appearance' | 'stress_relief' | 'social_support' | 'enjoyment';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type Language = 'en' | 'id';

export interface ReminderSetting {
  day: DayOfWeek;
  time: string;
  enabled: boolean;
}

export interface UserProfile {
  gender: Gender;
  goal: Goal;
  motivations: Motivation[];
  focusAreas: MuscleGroup[];
  fitnessLevel: FitnessLevel;
  activityLevel: ActivityLevel;
  age: number;
  height: number;
  weight: number;
  targetWeight: number;
  healthIssues: HealthIssue[];
  equipment: Equipment[];
  workoutsPerWeek: number;
  workoutDays: DayOfWeek[];
  reminderSettings: ReminderSetting[];
}

export interface Exercise {
  id: string;
  name: string;
  targetMuscle: MuscleGroup;
  equipment: Equipment[];
  difficulty: FitnessLevel;
  sets: number;
  reps: string;
  restTime: number;
  instructions: string[];
  commonMistakes: string[];
  safetyNotes: string;
  avoidFor?: HealthIssue[];
  category: string;
  demoUrl?: string;
}

export interface CompletedSet {
  reps: number;
  weight?: number;
  completed?: boolean;
}

export interface WorkoutExercise {
  exercise: Exercise;
  sets: number;
  reps: string;
  restTime: number;
  completedSets?: CompletedSet[];
  notes?: string;
}

export interface WorkoutDay {
  id: string;
  name: string;
  dayOfWeek: DayOfWeek;
  exercises: WorkoutExercise[];
  splitLabel: string;
}

export interface WorkoutPlan {
  id: string;
  generatedAt: number;
  days: WorkoutDay[];
  split: string;
}

export interface CompletedWorkout {
  id: string;
  workoutDayId: string;
  workoutName: string;
  date: number;
  duration: number;
  exercises: Array<{
    name: string;
    targetMuscle: string;
    sets: CompletedSet[];
    notes?: string;
  }>;
  totalVolume: number;
  progressionAwarded?: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
}

export interface BodyWeightEntry {
  date: number;
  weight: number;
}

export interface NutritionPlan {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  meals: Array<{
    name: string;
    time: string;
    foods: string[];
    calories: number;
  }>;
}

export type PlayerRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';
export type QuestStatus = 'active' | 'completed' | 'missed';
export type ProgressionEventType = 'quest_complete' | 'quest_failed' | 'xp_gain' | 'level_up' | 'rank_up' | 'record_unlocked' | 'recovery_complete' | 'reminder';

export interface PlayerStats {
  strength: number;
  endurance: number;
  consistency: number;
  discipline: number;
  recovery: number;
}

export interface ProgressionProfile {
  xp: number;
  level: number;
  rank: PlayerRank;
  stats: PlayerStats;
  completedRecoveryParts: number;
}

export interface DailyQuest {
  id: string;
  dateKey: string;
  workoutDayId: string;
  title: string;
  prescribedSets: number;
  status: QuestStatus;
  xpReward: number;
  completedAt?: number;
}

export interface RecoveryObjective {
  id: string;
  dueDateKey: string;
  status: QuestStatus;
  workout: WorkoutDay;
  xpReward: number;
  completedAt?: number;
}

export interface RecoveryChain {
  id: string;
  sourceQuestId: string;
  createdAt: number;
  status: 'active' | 'completed';
  objectives: RecoveryObjective[];
}

export interface ProgressionEvent {
  id: string;
  type: ProgressionEventType;
  title: string;
  message: string;
  createdAt: number;
}

export interface ActiveWorkoutSession {
  workoutDayId: string;
  startedAt: number;
  dateKey: string;
  exercises: Array<{
    sets: CompletedSet[];
    notes: string;
  }>;
}

export interface AppState {
  schemaVersion: number;
  language: Language;
  onboardingCompleted: boolean;
  userProfile: UserProfile | null;
  workoutPlan: WorkoutPlan | null;
  completedWorkouts: CompletedWorkout[];
  achievements: Achievement[];
  bodyWeightHistory: BodyWeightEntry[];
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: number | null;
  nutritionPlan: NutritionPlan | null;
  progression: ProgressionProfile;
  dailyQuests: DailyQuest[];
  recoveryChain: RecoveryChain | null;
  systemEvents: ProgressionEvent[];
  lastQuestSyncDate: string;
  firedReminderKeys: string[];
  activeWorkoutSessions: Record<string, ActiveWorkoutSession>;
}
