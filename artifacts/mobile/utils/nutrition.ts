import type { UserProfile, NutritionPlan } from '@/types';

export function calculateNutrition(profile: UserProfile): NutritionPlan {
  const { weight, height, age, activityLevel, goal } = profile;

  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  const activityMultiplier: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
  };
  const tdee = Math.round(bmr * (activityMultiplier[activityLevel] ?? 1.375));

  let calories = tdee;
  if (goal === 'build_muscle') calories = tdee + 300;
  else if (goal === 'lose_weight') calories = tdee - 400;
  else if (goal === 'look_better') calories = tdee - 100;

  let protein = 0, carbs = 0, fat = 0;
  if (goal === 'build_muscle') {
    protein = Math.round(weight * 2.0);
    fat = Math.round((calories * 0.25) / 9);
    carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  } else if (goal === 'lose_weight') {
    protein = Math.round(weight * 2.2);
    fat = Math.round((calories * 0.30) / 9);
    carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  } else {
    protein = Math.round(weight * 1.8);
    fat = Math.round((calories * 0.28) / 9);
    carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  }

  const water = Math.round(weight * 0.035 * 10) / 10;

  const meals = goal === 'build_muscle' ? [
    { name: 'Breakfast', time: '7:00 AM', calories: Math.round(calories * 0.25), foods: ['Oatmeal with banana', '3-4 whole eggs', 'Greek yogurt', 'Whey protein shake'] },
    { name: 'Mid-Morning Snack', time: '10:00 AM', calories: Math.round(calories * 0.15), foods: ['Rice cakes with peanut butter', 'Apple', 'Protein bar'] },
    { name: 'Lunch', time: '1:00 PM', calories: Math.round(calories * 0.30), foods: ['Chicken breast 150g', 'Brown rice', 'Broccoli & vegetables', 'Olive oil drizzle'] },
    { name: 'Dinner', time: '7:00 PM', calories: Math.round(calories * 0.30), foods: ['Salmon or beef 200g', 'Sweet potato', 'Mixed greens', 'Avocado'] },
  ] : goal === 'lose_weight' ? [
    { name: 'Breakfast', time: '7:00 AM', calories: Math.round(calories * 0.25), foods: ['3 egg whites + 1 whole egg', 'Spinach & tomato', 'Black coffee or green tea'] },
    { name: 'Lunch', time: '12:30 PM', calories: Math.round(calories * 0.35), foods: ['Grilled chicken 180g', 'Large salad', 'Quinoa 50g', 'Lemon dressing'] },
    { name: 'Snack', time: '4:00 PM', calories: Math.round(calories * 0.10), foods: ['Greek yogurt (low fat)', 'Handful of almonds', 'Cucumber slices'] },
    { name: 'Dinner', time: '7:30 PM', calories: Math.round(calories * 0.30), foods: ['White fish 200g', 'Steamed vegetables', 'Small portion of brown rice'] },
  ] : [
    { name: 'Breakfast', time: '7:00 AM', calories: Math.round(calories * 0.25), foods: ['Whole grain toast', 'Eggs (2-3)', 'Fruit bowl', 'Milk or plant milk'] },
    { name: 'Lunch', time: '12:30 PM', calories: Math.round(calories * 0.35), foods: ['Balanced plate: protein + carbs + veggies', 'Lean protein 150g', 'Whole grains', 'Colorful vegetables'] },
    { name: 'Snack', time: '4:00 PM', calories: Math.round(calories * 0.10), foods: ['Mixed nuts', 'Fruit', 'Protein snack'] },
    { name: 'Dinner', time: '7:30 PM', calories: Math.round(calories * 0.30), foods: ['Lean meat or fish', 'Vegetables', 'Complex carbs', 'Healthy fats'] },
  ];

  return { calories, protein, carbs, fat, water, meals };
}
