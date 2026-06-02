export type Gender = 'male' | 'female' | 'other';
export type Goal = 'build_muscle' | 'lose_weight' | 'look_better' | 'stay_in_shape';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
export type HealthIssue = 'none' | 'knee' | 'hip_joints' | 'back_hernia' | 'arms_shoulders' | 'no_jumps';
export type Equipment = 'none_bodyweight' | 'full_gym' | 'barbells' | 'dumbbells' | 'kettlebells' | 'machines';
export type MuscleGroup = 'full_body' | 'chest' | 'back' | 'arms' | 'shoulders' | 'abs' | 'legs' | 'glutes';
export type Motivation = 'health' | 'weight_loss' | 'appearance' | 'stress_relief' | 'social_support' | 'enjoyment';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

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
}

export interface CompletedSet {
  reps: number;
  weight?: number;
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

export interface AppState {
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
}
