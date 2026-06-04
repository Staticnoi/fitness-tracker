import type { UserProfile, WorkoutDay, WorkoutPlan, WorkoutExercise, Exercise, DayOfWeek, MuscleGroup } from '@/types';
import { EXERCISES } from '@/constants/exercises';
import { rankForLevel } from '@/utils/progression';

function uid(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function repRange(value: string): { min: number; max: number; suffix: string } {
  const numbers = value.match(/\d+/g)?.map(Number) ?? [10];
  return {
    min: numbers[0],
    max: numbers[1] ?? numbers[0],
    suffix: value.toLowerCase().includes('each') ? ' each' : value.toLowerCase().includes('s') ? 's' : '',
  };
}

export function prescribedReps(exercise: Exercise, profile: UserProfile, playerLevel: number): string {
  const { min, max, suffix } = repRange(exercise.reps);
  const profileProgress = profile.fitnessLevel === 'advanced' ? 1 : profile.fitnessLevel === 'intermediate' ? 0.5 : 0;
  const profileTarget = Math.round(min + (max - min) * profileProgress);
  const rank = rankForLevel(playerLevel);
  const rankBoost = { E: 0, D: 0, C: 1, B: 2, A: 3, S: 5, SS: 7, SSS: 9 }[rank];
  const levelBoost = Math.min(6, Math.floor(Math.max(0, playerLevel - 1) / 5));
  const goalBoost = profile.goal === 'build_muscle' && suffix !== 's' ? 1 : 0;
  return `${profileTarget + rankBoost + levelBoost + goalBoost}${suffix}`;
}

function prescribedSets(baseSets: number, profile: UserProfile, playerLevel: number): number {
  const profileSets = profile.fitnessLevel === 'beginner' ? 3 : 4;
  const goalBoost = profile.goal === 'build_muscle' ? 1 : 0;
  const levelBoost = playerLevel >= 25 ? 2 : playerLevel >= 10 ? 1 : 0;
  return Math.min(6, Math.max(baseSets, profileSets) + goalBoost + levelBoost);
}

function getFilteredExercises(profile: UserProfile): Exercise[] {
  return EXERCISES.filter(ex => {
    const hasEquip = ex.equipment.some(e =>
      profile.equipment.includes(e) ||
      profile.equipment.includes('full_gym') ||
      e === 'none_bodyweight'
    );
    const notAvoided = !ex.avoidFor?.some(h => profile.healthIssues.includes(h));
    return hasEquip && notAvoided;
  });
}

function pickExercisesForMuscles(
  muscles: MuscleGroup[],
  allEx: Exercise[],
  profile: UserProfile,
  count: number,
  playerLevel: number,
): WorkoutExercise[] {
  const results: WorkoutExercise[] = [];
  const levelMap: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
  const userLevel = levelMap[profile.fitnessLevel] ?? 0;

  const filtered = allEx.filter(ex => {
    const inMuscle = muscles.includes('full_body') || muscles.includes(ex.targetMuscle);
    const notFocus = !muscles.includes(ex.targetMuscle as MuscleGroup) && muscles.length > 0 && !muscles.includes('full_body');
    const levelOk = levelMap[ex.difficulty] <= userLevel + 1;
    return inMuscle && levelOk && !notFocus;
  });

  const compatibleFallback = allEx.filter(ex => levelMap[ex.difficulty] <= userLevel + 1);
  const shuffled = [...(filtered.length > 0 ? filtered : compatibleFallback)].sort(() => Math.random() - 0.5);
  let picked = shuffled.slice(0, count);
  if (profile.equipment.includes('full_gym')) {
    const bodyweight = shuffled.find(ex => ex.equipment.includes('none_bodyweight'));
    const gym = shuffled.find(ex => !ex.equipment.includes('none_bodyweight'));
    const required = [bodyweight, gym].filter((exercise): exercise is Exercise => Boolean(exercise));
    picked = [...required, ...shuffled.filter(exercise => !required.some(item => item.id === exercise.id))].slice(0, count);
  }

  for (const ex of picked) {
    results.push({
      exercise: ex,
      sets: prescribedSets(ex.sets, profile, playerLevel),
      reps: prescribedReps(ex, profile, playerLevel),
      restTime: profile.fitnessLevel === 'advanced' ? Math.max(ex.restTime - 15, 45) : ex.restTime,
      completedSets: [],
    });
  }
  return results;
}

const FULL_BODY_MUSCLES: MuscleGroup[] = ['chest', 'back', 'legs', 'shoulders', 'abs'];
const UPPER_MUSCLES: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms'];
const LOWER_MUSCLES: MuscleGroup[] = ['legs', 'glutes', 'abs'];
const PUSH_MUSCLES: MuscleGroup[] = ['chest', 'shoulders', 'arms'];
const PULL_MUSCLES: MuscleGroup[] = ['back', 'arms'];
const LEG_MUSCLES: MuscleGroup[] = ['legs', 'glutes'];

export function generateWorkoutPlan(profile: UserProfile, playerLevel = 1): WorkoutPlan {
  const allEx = getFilteredExercises(profile);
  const freq = profile.workoutsPerWeek;
  const days = profile.workoutDays;
  const exCount = profile.fitnessLevel === 'beginner' ? 4 : profile.fitnessLevel === 'intermediate' ? 5 : 6;

  let workoutDays: WorkoutDay[] = [];

  if (freq <= 3) {
    // Full Body
    days.forEach((day, i) => {
      const label = freq === 1 ? 'Full Body' : `Full Body ${String.fromCharCode(65 + i)}`;
      const muscles = profile.focusAreas.includes('full_body')
        ? FULL_BODY_MUSCLES
        : profile.focusAreas as MuscleGroup[];
      workoutDays.push({
        id: uid(),
        name: label,
        dayOfWeek: day,
        splitLabel: 'Full Body',
        exercises: pickExercisesForMuscles(muscles, allEx, profile, exCount, playerLevel),
      });
    });
  } else if (freq <= 5) {
    // Upper/Lower
    const splits = days.map((_, i) => i % 2 === 0 ? 'upper' : 'lower');
    days.forEach((day, i) => {
      const isUpper = splits[i] === 'upper';
      const muscles = isUpper ? UPPER_MUSCLES : LOWER_MUSCLES;
      const label = isUpper ? 'Upper Body' : 'Lower Body';
      workoutDays.push({
        id: uid(),
        name: label,
        dayOfWeek: day,
        splitLabel: isUpper ? 'Upper' : 'Lower',
        exercises: pickExercisesForMuscles(muscles, allEx, profile, exCount, playerLevel),
      });
    });
  } else {
    // PPL
    const sequence = ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'full_body'];
    days.forEach((day, i) => {
      const split = sequence[i % sequence.length];
      let muscles: MuscleGroup[];
      let label: string;
      if (split === 'push') { muscles = PUSH_MUSCLES; label = 'Push Day'; }
      else if (split === 'pull') { muscles = PULL_MUSCLES; label = 'Pull Day'; }
      else if (split === 'full_body') { muscles = FULL_BODY_MUSCLES; label = 'Full Body'; }
      else { muscles = LEG_MUSCLES; label = 'Leg Day'; }
      workoutDays.push({
        id: uid(),
        name: label,
        dayOfWeek: day,
        splitLabel: label,
        exercises: pickExercisesForMuscles(muscles, allEx, profile, exCount, playerLevel),
      });
    });
  }

  const splitName = freq <= 3 ? 'Full Body' : freq <= 5 ? 'Upper/Lower' : 'Push/Pull/Legs';
  return {
    id: uid(),
    generatedAt: Date.now(),
    days: workoutDays,
    split: splitName,
  };
}

export function scaleWorkoutPlan(plan: WorkoutPlan, profile: UserProfile, playerLevel: number): WorkoutPlan {
  return {
    ...plan,
    days: plan.days.map(day => ({
      ...day,
      exercises: day.exercises.map(item => ({
        ...item,
        sets: prescribedSets(item.exercise.sets, profile, playerLevel),
        reps: prescribedReps(item.exercise, profile, playerLevel),
        completedSets: [],
      })),
    })),
  };
}

export function numericRepTarget(value: string): number {
  return repRange(value).min;
}

export function getTodaysWorkout(plan: WorkoutPlan): WorkoutDay | null {
  const now = new Date();
  const dayNames: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayName = dayNames[now.getDay()];
  return plan.days.find(d => d.dayOfWeek === todayName) ?? null;
}

export function getNextWorkout(plan: WorkoutPlan, lastWorkoutDay?: DayOfWeek): WorkoutDay | null {
  if (!plan.days.length) return null;
  const dayOrder: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const now = new Date();
  const todayIdx = (now.getDay() + 6) % 7;

  for (let i = 1; i <= 7; i++) {
    const checkDay = dayOrder[(todayIdx + i) % 7];
    const found = plan.days.find(d => d.dayOfWeek === checkDay);
    if (found) return found;
  }
  return plan.days[0];
}
