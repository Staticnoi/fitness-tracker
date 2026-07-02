import { describe, it, expect } from 'vitest';
import {
  dateKey,
  rankForLevel,
  levelForXp,
  xpForLevel,
  workoutXp,
  deriveStats,
  buildProgression,
  questForDate,
} from '@/utils/progression';
import type {
  CompletedWorkout,
  WorkoutPlan,
  DayOfWeek,
} from '@/types';

describe('dateKey', () => {
  it('formats a Date as YYYY-MM-DD', () => {
    expect(dateKey(new Date(2025, 0, 5, 14))).toBe('2025-01-05');
    expect(dateKey(new Date(2025, 11, 31))).toBe('2025-12-31');
  });

  it('formats a timestamp as YYYY-MM-DD', () => {
    const ts = new Date(2024, 5, 15, 10).getTime();
    expect(dateKey(ts)).toBe('2024-06-15');
  });

  it('pads single-digit months and days', () => {
    expect(dateKey(new Date(2025, 2, 3))).toBe('2025-03-03');
  });
});

describe('rankForLevel', () => {
  it('returns E for levels below 5', () => {
    expect(rankForLevel(1)).toBe('E');
    expect(rankForLevel(4)).toBe('E');
  });

  it('returns D for levels 5-9', () => {
    expect(rankForLevel(5)).toBe('D');
    expect(rankForLevel(9)).toBe('D');
  });

  it('returns C for levels 10-19', () => {
    expect(rankForLevel(10)).toBe('C');
    expect(rankForLevel(19)).toBe('C');
  });

  it('returns B for levels 20-34', () => {
    expect(rankForLevel(20)).toBe('B');
    expect(rankForLevel(34)).toBe('B');
  });

  it('returns A for levels 35-49', () => {
    expect(rankForLevel(35)).toBe('A');
    expect(rankForLevel(49)).toBe('A');
  });

  it('returns S for levels 50-69', () => {
    expect(rankForLevel(50)).toBe('S');
    expect(rankForLevel(69)).toBe('S');
  });

  it('returns SS for levels 70-89', () => {
    expect(rankForLevel(70)).toBe('SS');
    expect(rankForLevel(89)).toBe('SS');
  });

  it('returns SSS for level 90+', () => {
    expect(rankForLevel(90)).toBe('SSS');
    expect(rankForLevel(100)).toBe('SSS');
  });
});

describe('levelForXp', () => {
  it('returns 1 for 0 xp', () => {
    expect(levelForXp(0)).toBe(1);
  });

  it('returns 1 for negative xp', () => {
    expect(levelForXp(-100)).toBe(1);
  });

  it('calculates level correctly from xp', () => {
    // level 2 starts at xp 100 (formula: (level-1)^2 * 100)
    expect(levelForXp(100)).toBe(2);
    // level 3 starts at xp 400
    expect(levelForXp(400)).toBe(3);
    // level 4 starts at xp 900
    expect(levelForXp(900)).toBe(4);
  });

  it('xp just below a level threshold stays at previous level', () => {
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(399)).toBe(2);
  });
});

describe('xpForLevel', () => {
  it('returns 0 for level 1', () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it('returns correct xp thresholds', () => {
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(400);
    expect(xpForLevel(4)).toBe(900);
    expect(xpForLevel(5)).toBe(1600);
  });

  it('handles level 0 and negative', () => {
    // xpForLevel(0) = max(0, (0-1)^2 * 100) = max(0, 100) = 100
    expect(xpForLevel(0)).toBe(100);
    // xpForLevel(-1) = max(0, (-2)^2 * 100) = max(0, 400) = 400
    expect(xpForLevel(-1)).toBe(400);
  });

  it('roundtrips with levelForXp', () => {
    for (let level = 1; level <= 20; level++) {
      expect(levelForXp(xpForLevel(level))).toBe(level);
    }
  });
});

describe('workoutXp', () => {
  it('gives base 80 xp with no sets and 0 duration', () => {
    expect(workoutXp({ exercises: [], duration: 0 })).toBe(80);
  });

  it('adds 12 xp per completed set', () => {
    const workout = {
      exercises: [
        { sets: [{ reps: 10, completed: true }, { reps: 10, completed: true }] },
      ],
      duration: 0,
    };
    expect(workoutXp(workout)).toBe(80 + 2 * 12);
  });

  it('excludes sets marked as not completed', () => {
    const workout = {
      exercises: [
        { sets: [{ reps: 10, completed: true }, { reps: 5, completed: false }] },
      ],
      duration: 0,
    };
    expect(workoutXp(workout)).toBe(80 + 1 * 12);
  });

  it('counts sets with no completed field as completed', () => {
    const workout = {
      exercises: [
        { sets: [{ reps: 10 }] },
      ],
      duration: 0,
    };
    expect(workoutXp(workout)).toBe(80 + 1 * 12);
  });

  it('adds 2 xp per minute of duration up to 120 min', () => {
    expect(workoutXp({ exercises: [], duration: 60 })).toBe(80 + 60 * 2);
    expect(workoutXp({ exercises: [], duration: 120 })).toBe(80 + 120 * 2);
    expect(workoutXp({ exercises: [], duration: 200 })).toBe(80 + 120 * 2);
  });

  it('clamps negative duration to 0', () => {
    expect(workoutXp({ exercises: [], duration: -10 })).toBe(80);
  });
});

describe('deriveStats', () => {
  it('returns base stats for empty workouts', () => {
    const stats = deriveStats([], 0, 0);
    expect(stats.strength).toBe(1);
    expect(stats.endurance).toBe(1);
    expect(stats.consistency).toBe(1);
    expect(stats.discipline).toBe(1);
    expect(stats.recovery).toBe(1);
  });

  it('clamps stats between 1 and 100', () => {
    const manyWorkouts: CompletedWorkout[] = Array.from({ length: 200 }, (_, i) => ({
      id: `w${i}`,
      workoutDayId: 'day1',
      workoutName: 'Test',
      date: Date.now(),
      duration: 120,
      exercises: Array.from({ length: 20 }, () => ({
        name: 'Test',
        targetMuscle: 'chest',
        sets: Array.from({ length: 10 }, () => ({ reps: 15, weight: 100 })),
      })),
      totalVolume: 999999,
    }));
    const stats = deriveStats(manyWorkouts, 100, 20);
    expect(stats.strength).toBeGreaterThanOrEqual(1);
    expect(stats.strength).toBeLessThanOrEqual(100);
    expect(stats.endurance).toBeGreaterThanOrEqual(1);
    expect(stats.endurance).toBeLessThanOrEqual(100);
    expect(stats.consistency).toBeGreaterThanOrEqual(1);
    expect(stats.consistency).toBeLessThanOrEqual(100);
    expect(stats.discipline).toBeGreaterThanOrEqual(1);
    expect(stats.discipline).toBeLessThanOrEqual(100);
    expect(stats.recovery).toBeGreaterThanOrEqual(1);
    expect(stats.recovery).toBeLessThanOrEqual(100);
  });

  it('increases stats with more workouts', () => {
    const empty = deriveStats([], 0, 0);
    const workouts: CompletedWorkout[] = [{
      id: 'w1',
      workoutDayId: 'day1',
      workoutName: 'Test',
      date: Date.now(),
      duration: 45,
      exercises: [{ name: 'Test', targetMuscle: 'chest', sets: [{ reps: 10, weight: 50 }] }],
      totalVolume: 500,
    }];
    const one = deriveStats(workouts, 1, 0);
    expect(one.strength).toBeGreaterThan(empty.strength);
    expect(one.endurance).toBeGreaterThan(empty.endurance);
    expect(one.consistency).toBeGreaterThan(empty.consistency);
  });
});

describe('buildProgression', () => {
  it('returns level 1, rank E for no workouts', () => {
    const prog = buildProgression([], 0);
    expect(prog.xp).toBe(0);
    expect(prog.level).toBe(1);
    expect(prog.rank).toBe('E');
  });

  it('accumulates xp from workouts', () => {
    const workouts: CompletedWorkout[] = [{
      id: 'w1',
      workoutDayId: 'day1',
      workoutName: 'Test',
      date: Date.now(),
      duration: 30,
      exercises: [{ name: 'Test', targetMuscle: 'chest', sets: [{ reps: 10 }] }],
      totalVolume: 100,
    }];
    const prog = buildProgression(workouts, 1);
    expect(prog.xp).toBeGreaterThan(0);
  });

  it('skips workouts where progressionAwarded is false', () => {
    const workouts: CompletedWorkout[] = [{
      id: 'w1',
      workoutDayId: 'day1',
      workoutName: 'Test',
      date: Date.now(),
      duration: 30,
      exercises: [{ name: 'Test', targetMuscle: 'chest', sets: [{ reps: 10 }] }],
      totalVolume: 100,
      progressionAwarded: false,
    }];
    const prog = buildProgression(workouts, 0);
    expect(prog.xp).toBe(0);
  });

  it('adds 100 xp per recovery part', () => {
    const withoutRecovery = buildProgression([], 0, 0);
    const withRecovery = buildProgression([], 0, 3);
    expect(withRecovery.xp).toBe(withoutRecovery.xp + 300);
  });
});

describe('questForDate', () => {
  const dayNames: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  function makePlan(dayOfWeek: DayOfWeek): WorkoutPlan {
    return {
      id: 'plan1',
      generatedAt: Date.now(),
      split: 'Full Body',
      days: [{
        id: 'day1',
        name: 'Full Body A',
        dayOfWeek,
        splitLabel: 'Full Body',
        exercises: [
          {
            exercise: {
              id: 'push_up', name: 'Push-Up', targetMuscle: 'chest',
              equipment: ['none_bodyweight'], difficulty: 'beginner',
              sets: 3, reps: '10-15', restTime: 60,
              instructions: [], commonMistakes: [], safetyNotes: '', category: 'push',
            },
            sets: 3,
            reps: '12',
            restTime: 60,
            completedSets: [],
          },
        ],
      }],
    };
  }

  it('returns null when plan is null', () => {
    expect(questForDate(null)).toBeNull();
  });

  it('returns null when no workout matches the day', () => {
    const plan = makePlan('monday');
    // Use a date key for a Tuesday
    const tuesday = '2025-01-07'; // Jan 7 2025 is a Tuesday
    expect(questForDate(plan, tuesday)).toBeNull();
  });

  it('returns a quest matching the workout day', () => {
    const plan = makePlan('monday');
    const monday = '2025-01-06'; // Jan 6 2025 is a Monday
    const quest = questForDate(plan, monday);
    expect(quest).not.toBeNull();
    expect(quest!.workoutDayId).toBe('day1');
    expect(quest!.title).toBe('Full Body A');
    expect(quest!.status).toBe('active');
    expect(quest!.prescribedSets).toBe(3);
  });

  it('includes xpReward based on prescribed sets', () => {
    const plan = makePlan('wednesday');
    const wednesday = '2025-01-08';
    const quest = questForDate(plan, wednesday);
    expect(quest).not.toBeNull();
    // xpReward = 80 + sets * 12 + 60
    expect(quest!.xpReward).toBe(80 + 3 * 12 + 60);
  });
});
