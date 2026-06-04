import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Share, Modal, TextInput, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import NeonButton from '@/components/NeonButton';
import type { DayOfWeek, Goal } from '@/types';
import { tr } from '@/utils/i18n';

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
  const { state, resetAll, updateProfile, setLanguage } = useApp();
  const language = state.language;
  const router = useRouter();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const p = state.userProfile;
  const plan = state.workoutPlan;
  const [editor, setEditor] = useState<'profile' | 'days' | 'reminders' | null>(null);
  const [weight, setWeight] = useState(String(p?.weight ?? ''));
  const [targetWeight, setTargetWeight] = useState(String(p?.targetWeight ?? ''));
  const [goal, setGoal] = useState<Goal>(p?.goal ?? 'stay_in_shape');
  const [days, setDays] = useState<DayOfWeek[]>(p?.workoutDays ?? []);
  const [reminders, setReminders] = useState(p?.reminderSettings ?? []);

  const openEditor = (type: 'profile' | 'days' | 'reminders') => {
    setWeight(String(p?.weight ?? ''));
    setTargetWeight(String(p?.targetWeight ?? ''));
    setGoal(p?.goal ?? 'stay_in_shape');
    setDays(p?.workoutDays ?? []);
    setReminders(p?.reminderSettings ?? []);
    setEditor(type);
  };

  const saveEditor = () => {
    if (!p || !editor) return;
    if (editor === 'profile') {
      const current = Number(weight);
      const target = Number(targetWeight);
      if (!current || !target) return Alert.alert('Invalid profile', 'Enter valid current and target weights.');
      updateProfile({ weight: current, targetWeight: target, goal });
    } else if (editor === 'days') {
      if (!days.length) return Alert.alert('Select a day', 'At least one workout day is required.');
      updateProfile({ workoutDays: days, workoutsPerWeek: days.length, reminderSettings: reminders.filter(item => days.includes(item.day)) });
    } else {
      const invalid = reminders.some(item => {
        const match = /^(\d{1,2}):(\d{2})$/.exec(item.time);
        return !match || Number(match[1]) > 23 || Number(match[2]) > 59;
      });
      if (invalid) return Alert.alert('Invalid reminder time', 'Use 24-hour HH:MM format, for example 07:00.');
      updateProfile({ reminderSettings: reminders });
    }
    setEditor(null);
  };

  const handleExport = async () => {
    try {
      const data = JSON.stringify({
        profile: state.userProfile,
        completedWorkouts: state.completedWorkouts,
        achievements: state.achievements.filter(a => a.unlocked),
        bodyWeightHistory: state.bodyWeightHistory,
        streak: state.currentStreak,
        progression: state.progression,
        dailyQuests: state.dailyQuests,
        recoveryChain: state.recoveryChain,
        systemEvents: state.systemEvents,
      }, null, 2);
      await Share.share({ message: data, title: 'Arise Reforged Progress Export' });
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
        <Text style={styles.pageTitle}>{tr(language, 'settings.title')}</Text>

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
            <TouchableOpacity onPress={() => openEditor('profile')}><Feather name="edit-2" size={18} color={c.neonCyan} /></TouchableOpacity>
          </View>
        )}

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: c.card, borderColor: c.border }]}>
          {[
            ['Workouts Done', String(state.completedWorkouts.length)],
            ['Current Streak', `${state.currentStreak} days`],
            ['Best Streak', `${state.longestStreak} days`],
            ['Achievements', `${state.achievements.filter(a => a.unlocked).length}/${state.achievements.length}`],
            ['System Level', `${state.progression.level} / Rank ${state.progression.rank}`],
            ['Total XP', String(state.progression.xp)],
            ['Plan Type', plan?.split ?? '—'],
          ].map(([label, val]) => (
            <View key={label} style={[styles.statRow, { borderColor: c.border }]}>
              <Text style={[styles.statLabel, { color: c.mutedForeground }]}>{label}</Text>
              <Text style={[styles.statValue, { color: c.foreground }]}>{val}</Text>
            </View>
          ))}
        </View>

        {/* Plan Settings */}
        <SectionHeader title={tr(language, 'settings.preferences')} />
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.languageRow, { borderColor: c.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: c.neonCyan + '15' }]}><Feather name="globe" size={18} color={c.neonCyan} /></View>
            <View style={styles.rowContent}><Text style={[styles.rowLabel, { color: c.foreground }]}>{tr(language, 'settings.language')}</Text><Text style={[styles.rowValue, { color: c.mutedForeground }]}>{tr(language, 'settings.languageHint')}</Text></View>
            <View style={styles.languageButtons}>
              {(['en', 'id'] as const).map(item => <TouchableOpacity key={item} onPress={() => setLanguage(item)} style={[styles.languageButton, state.language === item && styles.languageButtonActive]}><Text style={[styles.languageButtonText, state.language === item && styles.languageButtonTextActive]}>{item.toUpperCase()}</Text></TouchableOpacity>)}
            </View>
          </View>
        </View>

        <SectionHeader title={tr(language, 'settings.plan')} />
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <SettingRow icon="calendar" label={tr(language, 'settings.workoutDays')}
            value={p?.workoutDays.map(d => d.charAt(0).toUpperCase()).join(', ')}
            onPress={() => openEditor('days')} />
          <SettingRow icon="clock" label={tr(language, 'settings.reminders')}
            value={p?.reminderSettings.length ? `${p.reminderSettings.length} active` : 'None'}
            onPress={() => openEditor('reminders')} />
        </View>

        {/* Data */}
        <SectionHeader title={tr(language, 'settings.data')} />
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <SettingRow icon="download" label={tr(language, 'settings.export')} onPress={handleExport} rightIcon="external-link" />
        </View>

        {/* Danger Zone */}
        <SectionHeader title={tr(language, 'settings.danger')} />
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <SettingRow icon="refresh-cw" label={tr(language, 'settings.resetOnboarding')} onPress={handleResetOnboarding} />
          <SettingRow icon="trash-2" label={tr(language, 'settings.resetAll')} onPress={handleReset} destructive />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: c.mutedForeground }]}>Arise Reforged v1.0.0</Text>
          <Text style={[styles.appInfoText, { color: c.mutedForeground }]}>{tr(language, 'settings.tagline')}</Text>
        </View>
      </ScrollView>
      <Modal visible={editor !== null} transparent animationType="fade" onRequestClose={() => setEditor(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editor === 'profile' ? 'EDIT PLAYER PROFILE' : editor === 'days' ? 'EDIT QUEST DAYS' : 'EDIT REMINDERS'}</Text>
            {editor === 'profile' && <>
              <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="Current weight" placeholderTextColor={c.mutedForeground} />
              <TextInput style={styles.input} value={targetWeight} onChangeText={setTargetWeight} keyboardType="numeric" placeholder="Target weight" placeholderTextColor={c.mutedForeground} />
              <View style={styles.chips}>{(['build_muscle', 'lose_weight', 'look_better', 'stay_in_shape'] as Goal[]).map(item => <TouchableOpacity key={item} style={[styles.chip, goal === item && styles.chipActive]} onPress={() => setGoal(item)}><Text style={styles.chipText}>{item.replaceAll('_', ' ')}</Text></TouchableOpacity>)}</View>
            </>}
            {editor === 'days' && <View style={styles.chips}>{(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as DayOfWeek[]).map(day => <TouchableOpacity key={day} style={[styles.chip, days.includes(day) && styles.chipActive]} onPress={() => setDays(current => current.includes(day) ? current.filter(item => item !== day) : [...current, day])}><Text style={styles.chipText}>{day.slice(0, 3).toUpperCase()}</Text></TouchableOpacity>)}</View>}
            {editor === 'reminders' && (p?.workoutDays ?? []).map(day => {
              const reminder = reminders.find(item => item.day === day) ?? { day, time: '07:00', enabled: false };
              return <View key={day} style={styles.reminderEdit}><Text style={styles.reminderLabel}>{day.toUpperCase()}</Text><TextInput style={[styles.input, { flex: 1 }]} value={reminder.time} onChangeText={time => setReminders(current => [...current.filter(item => item.day !== day), { ...reminder, time }])} /><Switch value={reminder.enabled} onValueChange={enabled => setReminders(current => [...current.filter(item => item.day !== day), { ...reminder, enabled }])} trackColor={{ true: c.neonCyan }} /></View>;
            })}
            <View style={styles.modalButtons}><NeonButton title="CANCEL" variant="ghost" onPress={() => setEditor(null)} style={{ flex: 1 }} /><NeonButton title="SAVE" onPress={saveEditor} style={{ flex: 1 }} /></View>
          </View>
        </View>
      </Modal>
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
  languageRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  languageButtons: { flexDirection: 'row', gap: 5 },
  languageButton: { borderWidth: 1, borderColor: c.border, paddingHorizontal: 9, paddingVertical: 7 },
  languageButtonActive: { borderColor: c.neonCyan, backgroundColor: c.neonGlow },
  languageButtonText: { color: c.mutedForeground, fontFamily: 'Inter_700Bold', fontSize: 10 },
  languageButtonTextActive: { color: c.neonCyan },
  appInfo: { alignItems: 'center', gap: 4, paddingVertical: 20 },
  appInfoText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: c.darkCard, borderWidth: 1, borderColor: c.neonCyan, padding: 18, gap: 14 },
  modalTitle: { color: c.neonCyan, fontFamily: 'Inter_700Bold', letterSpacing: 1.5, fontSize: 15 },
  input: { color: c.foreground, backgroundColor: c.secondary, borderWidth: 1, borderColor: c.border, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Inter_500Medium' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: c.border, backgroundColor: c.secondary, paddingHorizontal: 10, paddingVertical: 8 },
  chipActive: { borderColor: c.neonCyan, backgroundColor: c.neonGlow },
  chipText: { color: c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 11, textTransform: 'uppercase' },
  reminderEdit: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reminderLabel: { color: c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 11, width: 78 },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
