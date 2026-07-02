import { describe, it, expect } from 'vitest';
import {
  prescribedReps,
  numericRepTarget,
  generateWorkoutPlan,
  scaleWorkoutPlan,
  getTodaysWorkout,
  getNextWorkout,
} from '@/utils/workoutGenerator';
import type { UserProfile, Exercise, WorkoutPlan, DayOfWeek } from '@/types';

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    gender: 'male',
    goal: 'stay_in_shape',
    motivations: ['health'],
    focusAreas: ['full_body'],
    fitnessLevel: 'intermediate',
    activityLevel: 'moderately_active',
    age: 25,
    height: 175,
    weight: 75,
    targetWeight: 73,
    healthIssues: ['none'],
    equipment: ['none_bodyweight'],
    workoutsPerWeek: 3,
    workoutDays: ['monday', 'wednesday', 'friday'],
    reminderSettings: [],
    ...overrides,
  };
}

const sampleExercise: Exercise = {
  id: 'push_up',
  name: 'Push-Up',
  targetMuscle: 'chest',
  equipment: ['none_bodyweight'],
  difficulty: 'beginner',
  sets: 3,
  reps: '10-15',
  restTime: 60,
  instructions: [],
  commonMistakes: [],
  safetyNotes: '',
  category: 'push',
};

describe('prescribedReps', () => {
  it('returns reps based on beginner fitness level', () => {
    const profile = makeProfile({ fitnessLevel: 'beginner' });
    const result = prescribedReps(sampleExercise, profile, 1);
    const num = parseInt(result, 10);
    expect(num).toBeGreaterThanOrEqual(10);
  });

  it('returns higher reps for advanced fitness level', () => {
    const beginner = makeProfile({ fitnessLevel: 'beginner' });
    const advanced = makeProfile({ fitnessLevel: 'advanced' });
    const beginnerReps = parseInt(prescribedReps(sampleExercise, beginner, 1), 10);
    const advancedReps = parseInt(prescribedReps(sampleExercise, advanced, 1), 10);
    expect(advancedReps).toBeGreaterThanOrEqual(beginnerReps);
  });

  it('increases reps with higher player level', () => {
    const profile = makeProfile();
    const low = parseInt(prescribedReps(sampleExercise, profile, 1), 10);
    const high = parseInt(prescribedReps(sampleExercise, profile, 50), 10);
    expect(high).toBeGreaterThan(low);
  });

  it('adds goal boost for build_muscle', () => {
    const base = makeProfile({ goal: 'stay_in_shape' });
    const muscle = makeProfile({ goal: 'build_muscle' });
    const baseReps = parseInt(prescribedReps(sampleExercise, base, 1), 10);
    const muscleReps = parseInt(prescribedReps(sampleExercise, muscle, 1), 10);
    expect(muscleReps).toBeGreaterThanOrEqual(baseReps);
  });

  it('preserves suffix for "each" reps', () => {
    const exercise: Exercise = { ...sampleExercise, reps: '10-12 each' };
    const result = prescribedReps(exercise, makeProfile(), 1);
    expect(result).toContain(' each');
  });

  it('preserves suffix for reps ending in s', () => {
    const exercise: Exercise = { ...sampleExercise, reps: '30-60s' };
    const result = prescribedReps(exercise, makeProfile(), 1);
    expect(result).toContain('s');
  });
});

describe('numericRepTarget', () => {
  it('returns the min rep from a range', () => {
    expect(numericRepTarget('10-15')).toBe(10);
    expect(numericRepTarget('8-12')).toBe(8);
  });

  it('returns single number when no range', () => {
    expect(numericRepTarget('12')).toBe(12);
  });

  it('handles reps with suffix', () => {
    expect(numericRepTarget('10-12 each')).toBe(10);
    expect(numericRepTarget('30-60s')).toBe(30);
  });
});

describe('generateWorkoutPlan', () => {
  it('generates a Full Body plan for 3 days/week', () => {
    const profile = makeProfile({ workoutsPerWeek: 3, workoutDays: ['monday', 'wednesday', 'friday'] });
    const plan = generateWorkoutPlan(profile);
    expect(plan.split).toBe('Full Body');
    expect(plan.days).toHaveLength(3);
    expect(plan.days[0].dayOfWeek).toBe('monday');
    expect(plan.days[1].dayOfWeek).toBe('wednesday');
    expect(plan.days[2].dayOfWeek).toBe('friday');
  });

  it('generates an Upper/Lower plan for 4 days/week', () => {
    const profile = makeProfile({
      workoutsPerWeek: 4,
      workoutDays: ['monday', 'tuesday', 'thursday', 'friday'],
    });
    const plan = generateWorkoutPlan(profile);
    expect(plan.split).toBe('Upper/Lower');
    expect(plan.days).toHaveLength(4);
  });

  it('generates a PPL plan for 6 days/week', () => {
    const profile = makeProfile({
      workoutsPerWeek: 6,
      workoutDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    });
    const plan = generateWorkoutPlan(profile);
    expect(plan.split).toBe('Push/Pull/Legs');
    expect(plan.days).toHaveLength(6);
  });

  it('generates fewer exercises for beginners', () => {
    const beginner = makeProfile({ fitnessLevel: 'beginner', workoutsPerWeek: 2, workoutDays: ['monday', 'wednesday'] });
    const advanced = makeProfile({ fitnessLevel: 'advanced', workoutsPerWeek: 2, workoutDays: ['monday', 'wednesday'] });
    const bPlan = generateWorkoutPlan(beginner);
    const aPlan = generateWorkoutPlan(advanced);
    const bCount = bPlan.days[0].exercises.length;
    const aCount = aPlan.days[0].exercises.length;
    expect(bCount).toBeLessThanOrEqual(aCount);
  });

  it('all workout days have exercises', () => {
    const profile = makeProfile();
    const plan = generateWorkoutPlan(profile);
    for (const day of plan.days) {
      expect(day.exercises.length).toBeGreaterThan(0);
    }
  });

  it('respects equipment constraints', () => {
    const profile = makeProfile({ equipment: ['none_bodyweight'] });
    const plan = generateWorkoutPlan(profile);
    for (const day of plan.days) {
      for (const ex of day.exercises) {
        const hasBodyweight = ex.exercise.equipment.includes('none_bodyweight');
        expect(hasBodyweight).toBe(true);
      }
    }
  });

  it('avoids exercises for health issues', () => {
    const profile = makeProfile({ healthIssues: ['knee'] });
    const plan = generateWorkoutPlan(profile);
    for (const day of plan.days) {
      for (const ex of day.exercises) {
        const avoidForKnee = ex.exercise.avoidFor?.includes('knee') ?? false;
        expect(avoidForKnee).toBe(false);
      }
    }
  });

  it('generates unique plan IDs', () => {
    const profile = makeProfile();
    const plan1 = generateWorkoutPlan(profile);
    const plan2 = generateWorkoutPlan(profile);
    expect(plan1.id).not.toBe(plan2.id);
  });

  it('generates a single workout for 1 day/week', () => {
    const profile = makeProfile({ workoutsPerWeek: 1, workoutDays: ['saturday'] });
    const plan = generateWorkoutPlan(profile);
    expect(plan.split).toBe('Full Body');
    expect(plan.days).toHaveLength(1);
    expect(plan.days[0].name).toBe('Full Body');
  });
});

describe('scaleWorkoutPlan', () => {
  it('scales sets and reps based on profile and level', () => {
    const profile = makeProfile();
    const plan = generateWorkoutPlan(profile, 1);
    const scaled = scaleWorkoutPlan(plan, profile, 20);
    for (let i = 0; i < plan.days.length; i++) {
      for (let j = 0; j < plan.days[i].exercises.length; j++) {
        const origSets = plan.days[i].exercises[j].sets;
        const scaledSets = scaled.days[i].exercises[j].sets;
        expect(scaledSets).toBeGreaterThanOrEqual(origSets);
      }
    }
  });

  it('clears completedSets on scaling', () => {
    const profile = makeProfile();
    const plan = generateWorkoutPlan(profile, 1);
    plan.days[0].exercises[0].completedSets = [{ reps: 10, weight: 50 }];
    const scaled = scaleWorkoutPlan(plan, profile, 5);
    expect(scaled.days[0].exercises[0].completedSets).toEqual([]);
  });
});

describe('getTodaysWorkout', () => {
  it('returns the workout for today if it exists', () => {
    const today = new Date();
    const dayNames: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today.getDay()];
    const plan: WorkoutPlan = {
      id: 'p1',
      generatedAt: Date.now(),
      split: 'Full Body',
      days: [{
        id: 'day1',
        name: 'Workout A',
        dayOfWeek: todayName,
        splitLabel: 'Full Body',
        exercises: [],
      }],
    };
    const result = getTodaysWorkout(plan);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('day1');
  });

  it('returns null if no workout for today', () => {
    const today = new Date();
    const dayNames: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayIdx = today.getDay();
    const otherDay = dayNames[(todayIdx + 3) % 7];
    const plan: WorkoutPlan = {
      id: 'p1',
      generatedAt: Date.now(),
      split: 'Full Body',
      days: [{
        id: 'day1',
        name: 'Workout A',
        dayOfWeek: otherDay,
        splitLabel: 'Full Body',
        exercises: [],
      }],
    };
    const result = getTodaysWorkout(plan);
    // This might or might not be null depending on whether otherDay happens to be today
    // but we picked +3 days from today so it shouldn't be today
    expect(result).toBeNull();
  });
});

describe('getNextWorkout', () => {
  it('returns first day if plan has only one day', () => {
    const plan: WorkoutPlan = {
      id: 'p1',
      generatedAt: Date.now(),
      split: 'Full Body',
      days: [{
        id: 'day1',
        name: 'Workout A',
        dayOfWeek: 'monday',
        splitLabel: 'Full Body',
        exercises: [],
      }],
    };
    const result = getNextWorkout(plan);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('day1');
  });

  it('returns null for empty plan', () => {
    const plan: WorkoutPlan = {
      id: 'p1',
      generatedAt: Date.now(),
      split: 'Full Body',
      days: [],
    };
    expect(getNextWorkout(plan)).toBeNull();
  });

  it('always returns a workout for a plan with days', () => {
    const plan: WorkoutPlan = {
      id: 'p1',
      generatedAt: Date.now(),
      split: 'Upper/Lower',
      days: [
        { id: 'd1', name: 'Upper', dayOfWeek: 'monday', splitLabel: 'Upper', exercises: [] },
        { id: 'd2', name: 'Lower', dayOfWeek: 'thursday', splitLabel: 'Lower', exercises: [] },
      ],
    };
    const result = getNextWorkout(plan);
    expect(result).not.toBeNull();
  });
});
