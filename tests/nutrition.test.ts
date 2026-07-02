import { describe, it, expect } from 'vitest';
import { calculateNutrition } from '@/utils/nutrition';
import type { UserProfile } from '@/types';

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

describe('calculateNutrition', () => {
  it('returns all required fields', () => {
    const result = calculateNutrition(makeProfile());
    expect(result).toHaveProperty('calories');
    expect(result).toHaveProperty('protein');
    expect(result).toHaveProperty('carbs');
    expect(result).toHaveProperty('fat');
    expect(result).toHaveProperty('water');
    expect(result).toHaveProperty('meals');
  });

  it('calculates BMR-based TDEE for moderately active', () => {
    const profile = makeProfile({ weight: 80, height: 180, age: 30 });
    // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 1780
    // TDEE = round(1780 * 1.55) = 2759
    // stay_in_shape falls into else branch (no calorie adjustment)
    const result = calculateNutrition(profile);
    expect(result.calories).toBe(2759);
  });

  it('adds 300 calories for build_muscle goal', () => {
    const base = makeProfile();
    const muscle = makeProfile({ goal: 'build_muscle' });
    const baseResult = calculateNutrition(base);
    const muscleResult = calculateNutrition(muscle);
    // build_muscle adds 300, stay_in_shape leaves TDEE unchanged
    expect(muscleResult.calories - baseResult.calories).toBe(300);
  });

  it('subtracts 400 calories for lose_weight goal', () => {
    const base = makeProfile();
    const loseWeight = makeProfile({ goal: 'lose_weight' });
    const baseResult = calculateNutrition(base);
    const loseResult = calculateNutrition(loseWeight);
    // stay_in_shape = TDEE, lose_weight = TDEE - 400
    expect(baseResult.calories - loseResult.calories).toBe(400);
  });

  it('calculates higher protein for lose_weight', () => {
    const muscle = calculateNutrition(makeProfile({ goal: 'build_muscle', weight: 80 }));
    const lose = calculateNutrition(makeProfile({ goal: 'lose_weight', weight: 80 }));
    // build_muscle: 2.0g/kg = 160g, lose_weight: 2.2g/kg = 176g
    expect(muscle.protein).toBe(Math.round(80 * 2.0));
    expect(lose.protein).toBe(Math.round(80 * 2.2));
  });

  it('calculates water intake based on weight', () => {
    const result = calculateNutrition(makeProfile({ weight: 70 }));
    expect(result.water).toBe(Math.round(70 * 0.035 * 10) / 10);
  });

  it('generates 4 meals', () => {
    const result = calculateNutrition(makeProfile());
    expect(result.meals).toHaveLength(4);
  });

  it('meal calories roughly sum to total calories', () => {
    const result = calculateNutrition(makeProfile());
    const mealCaloriesSum = result.meals.reduce((sum, m) => sum + m.calories, 0);
    expect(mealCaloriesSum).toBeGreaterThan(result.calories * 0.95);
    expect(mealCaloriesSum).toBeLessThan(result.calories * 1.05);
  });

  it('uses sedentary multiplier', () => {
    const profile = makeProfile({ activityLevel: 'sedentary', weight: 80, height: 180, age: 30 });
    const bmr = 10 * 80 + 6.25 * 180 - 5 * 30 + 5;
    const tdee = Math.round(bmr * 1.2);
    const result = calculateNutrition(profile);
    // stay_in_shape = TDEE (no adjustment)
    expect(result.calories).toBe(tdee);
  });

  it('uses very_active multiplier', () => {
    const profile = makeProfile({ activityLevel: 'very_active', weight: 80, height: 180, age: 30 });
    const bmr = 10 * 80 + 6.25 * 180 - 5 * 30 + 5;
    const tdee = Math.round(bmr * 1.725);
    const result = calculateNutrition(profile);
    expect(result.calories).toBe(tdee);
  });

  it('falls back to 1.375 multiplier for unknown activity level', () => {
    const profile = makeProfile({ activityLevel: 'unknown' as never, weight: 80, height: 180, age: 30 });
    const bmr = 10 * 80 + 6.25 * 180 - 5 * 30 + 5;
    const tdee = Math.round(bmr * 1.375);
    const result = calculateNutrition(profile);
    expect(result.calories).toBe(tdee);
  });

  it('ensures macros are non-negative', () => {
    const result = calculateNutrition(makeProfile());
    expect(result.protein).toBeGreaterThan(0);
    expect(result.fat).toBeGreaterThan(0);
    expect(result.carbs).toBeGreaterThan(0);
  });

  it('generates different meals per goal', () => {
    const muscle = calculateNutrition(makeProfile({ goal: 'build_muscle' }));
    const lose = calculateNutrition(makeProfile({ goal: 'lose_weight' }));
    expect(muscle.meals[0].foods).not.toEqual(lose.meals[0].foods);
  });
});
