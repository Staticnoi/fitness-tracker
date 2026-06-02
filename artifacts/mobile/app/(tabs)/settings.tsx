import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Share } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import NeonButton from '@/components/NeonButton';

const c = colors.dark;

function SettingRow({ icon, label, value, onPress, destructive, rightIcon = 'chevron-right' }: {
  icon: string; label: string; value?: string; onPress?: () => void; destructive?: boolean; rightIcon?: string;
}) {
  return (
    <TouchableOpacity style={[styles.row, { borderColor: c.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: (destructive ? c.destructive : c.neonCyan) + '15' }]}>
        <Feather name={icon as any} size={18} color={destructive ? c.destructive : c.neonCyan} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: destructive ? c.destructive : c.foreground }]}>{label}</Text>
        {value && <Text style={[styles.rowValue, { color: c.mutedForeground }]}>{value}</Text>}
      </View>
      <Feather name={rightIcon as any} size={16} color={c.mutedForeground} />
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { state, resetAll } = useApp();
  const router = useRouter();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const p = state.userProfile;
  const plan = state.workoutPlan;

  const handleExport = async () => {
    try {
      const data = JSON.stringify({
        profile: state.userProfile,
        completedWorkouts: state.completedWorkouts,
        achievements: state.achievements.filter(a => a.unlocked),
        bodyWeightHistory: state.bodyWeightHistory,
        streak: state.currentStreak,
      }, null, 2);
      await Share.share({ message: data, title: 'AriseForge Progress Export' });
    } catch { /* ignore */ }
  };

  const handleReset = () => {
    Alert.alert('Reset All Progress?',
      'This will permanently delete all workouts, achievements, and progress data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset Everything', style: 'destructive', onPress: async () => {
          await resetAll();
          router.replace('/landing');
        }},
      ]
    );
  };

  const handleResetOnboarding = () => {
    Alert.alert('Reset Onboarding?',
      'You will go through onboarding again and get a new workout plan.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: async () => {
          await resetAll();
          router.replace('/onboarding');
        }},
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 90 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Profile</Text>

        {/* Profile Card */}
        {p && (
          <View style={[styles.profileCard, { backgroundColor: c.card, borderColor: c.neonCyan + '40' }]}>
            <View style={[styles.avatar, { backgroundColor: c.neonCyan + '20', borderColor: c.neonCyan }]}>
              <Feather name="user" size={28} color={c.neonCyan} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileGoal}>{p.goal?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
              <Text style={styles.profileLevel}>{p.fitnessLevel?.charAt(0).toUpperCase() + p.fitnessLevel.slice(1)} • {p.age} yrs • {p.height} cm</Text>
              <Text style={styles.profileWeight}>{p.weight} kg → {p.targetWeight} kg goal</Text>
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: c.card, borderColor: c.border }]}>
          {[
            ['Workouts Done', String(state.completedWorkouts.length)],
            ['Current Streak', `${state.currentStreak} days`],
            ['Best Streak', `${state.longestStreak} days`],
            ['Achievements', `${state.achievements.filter(a => a.unlocked).length}/${state.achievements.length}`],
            ['Plan Type', plan?.split ?? '—'],
          ].map(([label, val]) => (
            <View key={label} style={[styles.statRow, { borderColor: c.border }]}>
              <Text style={[styles.statLabel, { color: c.mutedForeground }]}>{label}</Text>
              <Text style={[styles.statValue, { color: c.foreground }]}>{val}</Text>
            </View>
          ))}
        </View>

        {/* Plan Settings */}
        <SectionHeader title="PLAN" />
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <SettingRow icon="calendar" label="Workout Days"
            value={p?.workoutDays.map(d => d.charAt(0).toUpperCase()).join(', ')}
            onPress={handleResetOnboarding} />
          <SettingRow icon="clock" label="Reminders"
            value={p?.reminderSettings.length ? `${p.reminderSettings.length} active` : 'None'}
            onPress={handleResetOnboarding} />
        </View>

        {/* Data */}
        <SectionHeader title="DATA" />
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <SettingRow icon="download" label="Export Progress" onPress={handleExport} rightIcon="external-link" />
        </View>

        {/* Danger Zone */}
        <SectionHeader title="DANGER ZONE" />
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <SettingRow icon="refresh-cw" label="Reset Onboarding" onPress={handleResetOnboarding} />
          <SettingRow icon="trash-2" label="Reset All Progress" onPress={handleReset} destructive />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: c.mutedForeground }]}>AriseForge v1.0.0</Text>
          <Text style={[styles.appInfoText, { color: c.mutedForeground }]}>Your training. Your forge.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { paddingHorizontal: 20 },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, color: c.foreground, letterSpacing: -1, paddingVertical: 20 },
  profileCard: { borderRadius: 18, borderWidth: 1.5, padding: 20, flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  profileInfo: { flex: 1, gap: 3 },
  profileGoal: { fontFamily: 'Inter_700Bold', fontSize: 18, color: c.foreground },
  profileLevel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: c.mutedForeground },
  profileWeight: { fontFamily: 'Inter_500Medium', fontSize: 13, color: c.neonCyan },
  statsCard: { borderRadius: 16, borderWidth: 1, marginBottom: 24, overflow: 'hidden' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  statValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 11, color: c.mutedForeground, letterSpacing: 2, marginBottom: 10 },
  section: { borderRadius: 16, borderWidth: 1, marginBottom: 24, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, gap: 2 },
  rowLabel: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  rowValue: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  appInfo: { alignItems: 'center', gap: 4, paddingVertical: 20 },
  appInfoText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});
