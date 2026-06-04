import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { dateKey } from '@/utils/progression';
import { RankBadge, SystemAlert, SystemPanel, XpBar } from '@/components/SystemUI';
import AchievementBadge from '@/components/AchievementBadge';
import { getNextWorkout } from '@/utils/workoutGenerator';

const c = colors.dark;

export default function CommandCenterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const today = dateKey();
  const quest = state.dailyQuests.find(item => item.dateKey === today);
  const recovery = state.recoveryChain?.status === 'active' ? state.recoveryChain : null;
  const nextRecovery = recovery?.objectives.find(item => item.status === 'active' && item.dueDateKey <= today);
  const open = (dayId: string) => router.push({ pathname: '/active-workout', params: { dayId } });
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weeklyCompleted = state.completedWorkouts.filter(item => item.date >= weekStart.getTime()).length;
  const nextWorkout = state.workoutPlan ? getNextWorkout(state.workoutPlan) : null;
  const recent = [...state.completedWorkouts].sort((a, b) => b.date - a.date).slice(0, 2);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 90 }]}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>ARISEFORGE // COMMAND CENTER</Text><Text style={styles.title}>PLAYER STATUS</Text></View>
          <RankBadge rank={state.progression.rank} />
        </View>
        <SystemPanel active style={styles.gap}>
          <View style={styles.playerRow}>
            <View><Text style={styles.micro}>REGISTERED PLAYER</Text><Text style={styles.goal}>{state.userProfile?.goal.replaceAll('_', ' ').toUpperCase()}</Text></View>
            <View style={styles.streak}><Text style={styles.streakValue}>{state.currentStreak}</Text><Text style={styles.micro}>STREAK</Text></View>
          </View>
          <XpBar xp={state.progression.xp} level={state.progression.level} />
        </SystemPanel>

        <Text style={styles.section}>DAILY QUEST</Text>
        {quest ? (
          <TouchableOpacity disabled={quest.status !== 'active'} onPress={() => open(quest.workoutDayId)}>
            <SystemPanel active={quest.status === 'active'} style={styles.gap}>
              <View style={styles.questRow}>
                <Feather name={quest.status === 'completed' ? 'check-circle' : 'crosshair'} size={24} color={quest.status === 'completed' ? c.success : c.neonCyan} />
                <View style={{ flex: 1 }}><Text style={styles.micro}>{quest.status.toUpperCase()}</Text><Text style={styles.questTitle}>{quest.title}</Text></View>
                <Text style={styles.reward}>+{quest.xpReward} XP</Text>
              </View>
              <Text style={styles.meta}>VERIFY ALL {quest.prescribedSets} PRESCRIBED SETS</Text>
            </SystemPanel>
          </TouchableOpacity>
        ) : <SystemPanel><Text style={styles.meta}>NO QUEST ASSIGNED // RECOVERY DAY</Text></SystemPanel>}

        {nextRecovery && <>
          <Text style={[styles.section, { color: c.destructive }]}>RECOVERY PROTOCOL</Text>
          <TouchableOpacity onPress={() => open(nextRecovery.workout.id)}>
            <SystemPanel style={[styles.gap, { borderColor: c.destructive }]}>
              <Text style={[styles.micro, { color: c.destructive }]}>MANDATORY CHAIN // {recovery?.objectives.filter(item => item.status === 'completed').length}/3</Text>
              <Text style={styles.questTitle}>{nextRecovery.workout.name}</Text>
              <Text style={styles.meta}>INCREASED WORKLOAD // HEALTH RESTRICTIONS ACTIVE</Text>
            </SystemPanel>
          </TouchableOpacity>
        </>}

        <Text style={styles.section}>SYSTEM METRICS</Text>
        <View style={styles.metrics}>
          {[
            ['WEEKLY', `${weeklyCompleted}/${state.userProfile?.workoutsPerWeek ?? 0}`],
            ['CALORIES', `${state.nutritionPlan?.calories ?? 0}`],
            ['NEXT TARGET', nextWorkout?.exercises[0]?.exercise.targetMuscle.replaceAll('_', ' ').toUpperCase() ?? 'RECOVERY'],
          ].map(([label, value]) => <SystemPanel key={label} style={styles.metric}><Text style={styles.micro}>{label}</Text><Text style={styles.metricValue} numberOfLines={1}>{value}</Text></SystemPanel>)}
        </View>

        <Text style={styles.section}>QUICK START</Text>
        <View style={styles.actions}>
          {quest?.status === 'active' && <TouchableOpacity style={styles.action} onPress={() => open(quest.workoutDayId)}><Feather name="play" size={17} color={c.success} /><Text style={styles.actionText}>START QUEST</Text></TouchableOpacity>}
          {[
            ['book-open', 'EXERCISES', '/(tabs)/exercises'],
            ['pie-chart', 'NUTRITION', '/(tabs)/nutrition'],
            ['clock', 'HISTORY', '/(tabs)/history'],
          ].map(([icon, label, route]) => <TouchableOpacity key={label} style={styles.action} onPress={() => router.push(route as never)}><Feather name={icon as never} size={17} color={c.neonCyan} /><Text style={styles.actionText}>{label}</Text></TouchableOpacity>)}
        </View>

        {state.achievements.some(item => item.unlocked) && <>
          <Text style={styles.section}>RECENT RECORDS</Text>
          <SystemPanel style={styles.recordRow}>{state.achievements.filter(item => item.unlocked).slice(-4).map(item => <AchievementBadge key={item.id} achievement={item} size="sm" />)}</SystemPanel>
        </>}

        {recent.length > 0 && <>
          <Text style={styles.section}>RECENT HISTORY</Text>
          <SystemPanel>{recent.map(item => <View key={item.id} style={styles.historyRow}><View><Text style={styles.historyName}>{item.workoutName}</Text><Text style={styles.meta}>{new Date(item.date).toLocaleDateString()}</Text></View><Text style={styles.reward}>{item.duration} MIN</Text></View>)}</SystemPanel>
        </>}

        <Text style={styles.section}>SYSTEM LOG</Text>
        <SystemPanel>{state.systemEvents.length ? state.systemEvents.slice(0, 5).map(item => <SystemAlert key={item.id} event={item} />) : <Text style={styles.meta}>NO RECENT SYSTEM EVENTS</Text>}</SystemPanel>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { paddingHorizontal: 18, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 22, paddingRight: 10 },
  eyebrow: { color: c.neonCyan, fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.7 },
  title: { color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: 2, marginTop: 5 },
  gap: { gap: 16 },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  micro: { color: c.neonCyan, fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4 },
  goal: { color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 5 },
  streak: { alignItems: 'center', paddingLeft: 18, borderLeftWidth: 1, borderLeftColor: c.border },
  streakValue: { color: c.neonCyan, fontFamily: 'Inter_700Bold', fontSize: 25 },
  section: { color: c.neonCyan, fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 2, marginTop: 10 },
  questRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  questTitle: { color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 18, marginTop: 3 },
  reward: { color: c.gold, fontFamily: 'Inter_700Bold', fontSize: 12 },
  meta: { color: c.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1 },
  metrics: { flexDirection: 'row', gap: 7 },
  metric: { flex: 1, padding: 10, gap: 5 },
  metricValue: { color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 14 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  action: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.card, borderWidth: 1, borderColor: c.cardBorder, padding: 13 },
  actionText: { color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.8 },
  recordRow: { flexDirection: 'row', justifyContent: 'space-around' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: c.border },
  historyName: { color: c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});
