import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';

const c = colors.dark;

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <View style={styles.macroBarContainer}>
      <View style={styles.macroBarHeader}>
        <Text style={[styles.macroBarLabel, { color: c.foreground }]}>{label}</Text>
        <Text style={[styles.macroBarValue, { color }]}>{value}g</Text>
      </View>
      <View style={[styles.track, { backgroundColor: c.secondary }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const n = state.nutritionPlan;
  const goal = state.userProfile?.goal;

  const goalDesc: Record<string, string> = {
    build_muscle: 'Calorie surplus with high protein to fuel muscle growth',
    lose_weight: 'Calorie deficit with high protein to preserve muscle',
    look_better: 'Body recomposition — slight deficit with balanced macros',
    stay_in_shape: 'Maintenance calories to sustain current fitness level',
  };

  if (!n) {
    return (
      <View style={[styles.container, styles.empty, { paddingTop: topPad }]}>
        <Feather name="pie-chart" size={48} color={c.mutedForeground} />
        <Text style={styles.emptyTitle}>No Plan Yet</Text>
        <Text style={[styles.emptySub, { color: c.mutedForeground }]}>Complete onboarding to get your nutrition plan</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 90 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Nutrition</Text>

        {/* Strategy */}
        <View style={[styles.strategyCard, { backgroundColor: c.card, borderColor: c.neonCyan + '40' }]}>
          <View style={styles.strategyHeader}>
            <Feather name="target" size={18} color={c.neonCyan} />
            <Text style={styles.strategyTitle}>Your Strategy</Text>
          </View>
          <Text style={[styles.strategyDesc, { color: c.mutedForeground }]}>{goalDesc[goal ?? ''] ?? 'Balanced nutrition plan'}</Text>
        </View>

        {/* Calorie overview */}
        <View style={[styles.calorieCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={styles.calorieVal}>{n.calories}</Text>
          <Text style={[styles.calorieLabel, { color: c.mutedForeground }]}>kcal / day</Text>
          <View style={styles.calorieRow}>
            {[
              { label: 'Protein', val: `${n.protein}g`, cal: n.protein * 4, color: c.success },
              { label: 'Carbs', val: `${n.carbs}g`, cal: n.carbs * 4, color: c.warning },
              { label: 'Fat', val: `${n.fat}g`, cal: n.fat * 9, color: '#e040fb' },
            ].map(({ label, val, cal, color }) => (
              <View key={label} style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: color }]} />
                <Text style={[styles.macroVal, { color }]}>{val}</Text>
                <Text style={[styles.macroName, { color: c.mutedForeground }]}>{label}</Text>
                <Text style={[styles.macroCal, { color: c.mutedForeground }]}>{cal} kcal</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Macro bars */}
        <View style={[styles.macroSection, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={styles.sectionTitle}>MACRO BREAKDOWN</Text>
          <MacroBar label="Protein" value={n.protein} max={250} color={c.success} />
          <MacroBar label="Carbohydrates" value={n.carbs} max={400} color={c.warning} />
          <MacroBar label="Fat" value={n.fat} max={100} color="#e040fb" />
        </View>

        {/* Hydration */}
        <View style={[styles.hydroCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.hydroHeader}>
            <Feather name="droplet" size={20} color="#00aaff" />
            <Text style={styles.hydroTitle}>Daily Hydration</Text>
          </View>
          <Text style={styles.hydroVal}>{n.water}L / day</Text>
          <Text style={[styles.hydroSub, { color: c.mutedForeground }]}>
            Drink consistently throughout the day. Add 0.5L per hour of training.
          </Text>
        </View>

        {/* Meal Plan */}
        <Text style={styles.sectionTitleStandalone}>MEAL PLAN</Text>
        {n.meals.map((meal, i) => (
          <View key={i} style={[styles.mealCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <View style={styles.mealHeader}>
              <View>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={[styles.mealTime, { color: c.mutedForeground }]}>{meal.time}</Text>
              </View>
              <View style={[styles.mealCal, { backgroundColor: c.neonCyan + '15', borderColor: c.neonCyan + '30' }]}>
                <Text style={[styles.mealCalText, { color: c.neonCyan }]}>{meal.calories} kcal</Text>
              </View>
            </View>
            <View style={styles.foodList}>
              {meal.foods.map((food, j) => (
                <View key={j} style={styles.foodItem}>
                  <View style={[styles.foodDot, { backgroundColor: c.neonCyan }]} />
                  <Text style={[styles.foodText, { color: c.foreground }]}>{food}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={styles.tipsTitle}>General Tips</Text>
          {[
            'Eat protein with every meal to support muscle recovery',
            'Time carbs around your workouts for energy and recovery',
            'Don\'t skip meals — consistency drives results',
            'Prep meals in advance to stay on track',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Feather name="check" size={14} color={c.success} />
              <Text style={[styles.tipText, { color: c.foreground }]}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 24, color: c.foreground },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 15, textAlign: 'center' },
  scroll: { paddingHorizontal: 20, gap: 16 },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, color: c.foreground, letterSpacing: -1, paddingTop: 20 },
  strategyCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 8 },
  strategyHeader: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  strategyTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: c.foreground },
  strategyDesc: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  calorieCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'center', gap: 8 },
  calorieVal: { fontFamily: 'Inter_700Bold', fontSize: 52, color: c.neonCyan, lineHeight: 56 },
  calorieLabel: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  calorieRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 8 },
  macroItem: { alignItems: 'center', gap: 3 },
  macroDot: { width: 8, height: 8, borderRadius: 4 },
  macroVal: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  macroName: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  macroCal: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  macroSection: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 11, color: c.mutedForeground, letterSpacing: 2 },
  sectionTitleStandalone: { fontFamily: 'Inter_700Bold', fontSize: 11, color: c.mutedForeground, letterSpacing: 2 },
  macroBarContainer: { gap: 6 },
  macroBarHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  macroBarLabel: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  macroBarValue: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  hydroCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  hydroHeader: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  hydroTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: c.foreground },
  hydroVal: { fontFamily: 'Inter_700Bold', fontSize: 32, color: '#00aaff' },
  hydroSub: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  mealCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  mealName: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: c.foreground },
  mealTime: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 2 },
  mealCal: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  mealCalText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  foodList: { gap: 6 },
  foodItem: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  foodDot: { width: 5, height: 5, borderRadius: 3 },
  foodText: { fontFamily: 'Inter_400Regular', fontSize: 14, flex: 1 },
  tipsCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  tipsTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: c.foreground },
  tipRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  tipText: { fontFamily: 'Inter_400Regular', fontSize: 14, flex: 1, lineHeight: 20 },
});
