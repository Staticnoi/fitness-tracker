import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Animated, Platform, Alert, PanResponder
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import NeonButton from '@/components/NeonButton';
import { useApp } from '@/context/AppContext';
import type {
  Gender, Goal, Motivation, MuscleGroup, FitnessLevel, ActivityLevel,
  HealthIssue, Equipment, DayOfWeek, UserProfile, ReminderSetting
} from '@/types';

const c = colors.dark;
const TOTAL_STEPS = 16;

interface PartialProfile {
  gender?: Gender;
  goal?: Goal;
  motivations: Motivation[];
  focusAreas: MuscleGroup[];
  fitnessLevel?: FitnessLevel;
  activityLevel?: ActivityLevel;
  age: string;
  height: string;
  weight: string;
  targetWeight: string;
  healthIssues: HealthIssue[];
  equipment: Equipment[];
  workoutsPerWeek: number;
  workoutDays: DayOfWeek[];
  reminderSettings: ReminderSetting[];
}

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

const THUMB = 28;

function FrequencySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const currentValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const thumbAnim = useRef(new Animated.Value(0)).current;
  const startThumbX = useRef(0);

  useEffect(() => { trackWidthRef.current = trackWidth; }, [trackWidth]);

  useEffect(() => {
    currentValueRef.current = value;
    if (trackWidthRef.current > THUMB) {
      const pos = ((value - 1) / 6) * (trackWidthRef.current - THUMB);
      Animated.spring(thumbAnim, { toValue: pos, useNativeDriver: false, tension: 180, friction: 9 }).start();
    }
  }, [value, trackWidth]);

  const clampPos = (x: number) => Math.max(0, Math.min(trackWidthRef.current - THUMB, x));
  const posToVal = (x: number) => Math.max(1, Math.min(7, Math.round((x / (trackWidthRef.current - THUMB)) * 6) + 1));

  const applyPosition = (x: number) => {
    const clamped = clampPos(x);
    thumbAnim.setValue(clamped);
    const newVal = posToVal(clamped);
    if (newVal !== currentValueRef.current) {
      currentValueRef.current = newVal;
      onChangeRef.current(newVal);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const touchX = e.nativeEvent.locationX;
        const newX = clampPos(touchX - THUMB / 2);
        startThumbX.current = newX;
        applyPosition(newX);
      },
      onPanResponderMove: (_, gs) => {
        applyPosition(startThumbX.current + gs.dx);
      },
      onPanResponderRelease: () => {
        const tw = trackWidthRef.current;
        if (tw > THUMB) {
          const pos = ((currentValueRef.current - 1) / 6) * (tw - THUMB);
          Animated.spring(thumbAnim, { toValue: pos, useNativeDriver: false, tension: 220, friction: 11 }).start();
        }
      },
    })
  ).current;

  const fillWidth = Animated.add(thumbAnim, THUMB / 2);

  return (
    <View style={sliderStyles.wrapper}>
      <View
        style={sliderStyles.hitArea}
        onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View style={sliderStyles.trackBg} />
        {trackWidth > 0 && (
          <Animated.View style={[sliderStyles.trackFill, { width: fillWidth }]} />
        )}
        {trackWidth > 0 && (
          <Animated.View style={[sliderStyles.thumb, { transform: [{ translateX: thumbAnim }] }]} />
        )}
      </View>
      <View style={sliderStyles.labelsRow}>
        {[1, 2, 3, 4, 5, 6, 7].map(n => (
          <Text key={n} style={[sliderStyles.tickLabel, value === n && { color: c.neonCyan, fontFamily: 'Inter_700Bold' }]}>{n}</Text>
        ))}
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  wrapper: { gap: 10, paddingVertical: 8 },
  hitArea: { height: 48, justifyContent: 'center' },
  trackBg: { position: 'absolute', left: 0, right: 0, top: 21, height: 6, borderRadius: 3, backgroundColor: c.secondary },
  trackFill: { position: 'absolute', left: 0, top: 21, height: 6, borderRadius: 3, backgroundColor: c.neonCyan },
  thumb: {
    position: 'absolute', top: 10, width: THUMB, height: THUMB, borderRadius: THUMB / 2,
    backgroundColor: c.neonCyan,
    shadowColor: c.neonCyan, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 8,
  },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: THUMB / 2 },
  tickLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: c.mutedForeground, textAlign: 'center', width: 20 },
});

function OptionCard({ label, selected, onPress, subtitle }: { label: string; selected: boolean; onPress: () => void; subtitle?: string }) {
  return (
    <TouchableOpacity
      style={[styles.optionCard, { borderColor: selected ? c.neonCyan : c.border, backgroundColor: selected ? c.neonCyan + '12' : c.card }]}
      onPress={onPress} activeOpacity={0.7}
    >
      <View style={styles.optionInner}>
        <Text style={[styles.optionLabel, { color: selected ? c.neonCyan : c.foreground }]}>{label}</Text>
        {subtitle && <Text style={[styles.optionSub, { color: c.mutedForeground }]}>{subtitle}</Text>}
      </View>
      <View style={[styles.optionCheck, { borderColor: selected ? c.neonCyan : c.border, backgroundColor: selected ? c.neonCyan : 'transparent' }]}>
        {selected && <Feather name="check" size={12} color="#000" />}
      </View>
    </TouchableOpacity>
  );
}

function ChipButton({ label, selected, onPress, disabled }: { label: string; selected: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.chip, { borderColor: selected ? c.neonCyan : c.border, backgroundColor: selected ? c.neonCyan + '15' : c.secondary, opacity: disabled ? 0.35 : 1 }]}
      onPress={disabled ? undefined : onPress} activeOpacity={0.7}
    >
      <Text style={[styles.chipText, { color: selected ? c.neonCyan : c.mutedForeground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [p, setP] = useState<PartialProfile>({
    motivations: [], focusAreas: [], age: '', height: '', weight: '',
    targetWeight: '', healthIssues: [], equipment: [], workoutsPerWeek: 3,
    workoutDays: [], reminderSettings: [],
  });

  const animateStep = (dir: 1 | -1) => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -20 * dir, duration: 100, useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  };

  const next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateStep(1);
    if (step === TOTAL_STEPS - 1) {
      const profile: UserProfile = {
        gender: p.gender ?? 'male',
        goal: p.goal ?? 'build_muscle',
        motivations: p.motivations,
        focusAreas: p.focusAreas.length > 0 ? p.focusAreas : ['full_body'],
        fitnessLevel: p.fitnessLevel ?? 'beginner',
        activityLevel: p.activityLevel ?? 'lightly_active',
        age: parseInt(p.age) || 25,
        height: parseInt(p.height) || 170,
        weight: parseFloat(p.weight) || 70,
        targetWeight: parseFloat(p.targetWeight) || 70,
        healthIssues: p.healthIssues,
        equipment: p.equipment.length > 0 ? p.equipment : ['none_bodyweight'],
        workoutsPerWeek: p.workoutsPerWeek,
        workoutDays: p.workoutDays,
        reminderSettings: p.reminderSettings,
      };
      completeOnboarding(profile);
      router.replace('/generating');
    } else {
      setStep(s => s + 1);
    }
  };

  const back = () => {
    if (step === 0) { router.back(); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateStep(-1);
    setStep(s => s - 1);
  };

  const toggle = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const setFocusAreas = (areas: MuscleGroup[]) => setP(prev => ({ ...prev, focusAreas: areas }));
  const allBodyParts: MuscleGroup[] = ['chest', 'back', 'arms', 'shoulders', 'abs', 'legs', 'glutes'];

  const canNext = (): boolean => {
    if (step === 0) return !!p.gender;
    if (step === 1) return !!p.goal;
    if (step === 4) return !!p.fitnessLevel;
    if (step === 5) return !!p.activityLevel;
    if (step === 6) return p.age.length > 0;
    if (step === 7) return p.height.length > 0;
    if (step === 8) return p.weight.length > 0;
    if (step === 9) return p.targetWeight.length > 0;
    return true;
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const renderStep = () => {
    switch (step) {
      // Step 0: Gender
      case 0: return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Your Gender</Text>
          <Text style={styles.stepSub}>Helps us personalize your training</Text>
          {([['male', 'Male'], ['female', 'Female'], ['other', 'Other']] as [Gender, string][]).map(([val, label]) => (
            <OptionCard key={val} label={label} selected={p.gender === val}
              onPress={() => setP(prev => ({ ...prev, gender: val }))} />
          ))}
        </View>
      );
      // Step 1: Goal
      case 1: return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Your Goal</Text>
          <Text style={styles.stepSub}>What are you training for?</Text>
          {([['build_muscle', 'Build Muscle', 'Gain strength and size'], ['lose_weight', 'Lose Weight', 'Burn fat and get lean'],
             ['look_better', 'Look Better', 'Body recomposition'], ['stay_in_shape', 'Stay In Shape', 'Maintain current fitness']] as [Goal, string, string][]).map(([val, label, sub]) => (
            <OptionCard key={val} label={label} subtitle={sub} selected={p.goal === val}
              onPress={() => setP(prev => ({ ...prev, goal: val }))} />
          ))}
        </View>
      );
      // Step 2: Motivation
      case 2: return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Your Motivation</Text>
          <Text style={styles.stepSub}>Select all that apply</Text>
          <View style={styles.chipsGrid}>
            {([['health', 'Health'], ['weight_loss', 'Weight Loss'], ['appearance', 'Appearance'],
               ['stress_relief', 'Stress Relief'], ['social_support', 'Social Support'], ['enjoyment', 'Enjoyment']] as [Motivation, string][]).map(([val, label]) => (
              <ChipButton key={val} label={label} selected={p.motivations.includes(val)}
                onPress={() => setP(prev => ({ ...prev, motivations: toggle(prev.motivations, val) }))} />
            ))}
          </View>
        </View>
      );
      // Step 3: Focus Areas
      case 3: return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Focus Areas</Text>
          <Text style={styles.stepSub}>Select which muscles to prioritize</Text>
          <View style={styles.chipsGrid}>
            <ChipButton label="Full Body" selected={p.focusAreas.includes('full_body')}
              onPress={() => {
                if (p.focusAreas.includes('full_body')) setFocusAreas([]);
                else setFocusAreas(['full_body', ...allBodyParts]);
              }} />
            {allBodyParts.map(area => (
              <ChipButton key={area} label={area.charAt(0).toUpperCase() + area.slice(1)}
                selected={p.focusAreas.includes(area)}
                onPress={() => {
                  const newAreas = toggle(p.focusAreas, area).filter(a => a !== 'full_body');
                  const allSelected = allBodyParts.every(b => newAreas.includes(b));
                  setFocusAreas(allSelected ? ['full_body', ...newAreas] : newAreas);
                }} />
            ))}
          </View>
        </View>
      );
      // Step 4: Fitness Level
      case 4: return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Fitness Level</Text>
          <Text style={styles.stepSub}>Be honest — we'll calibrate your plan</Text>
          {([['beginner', 'Beginner', 'New or tried it for a bit'],
             ['intermediate', 'Intermediate', 'Lifted weights before'],
             ['advanced', 'Advanced', 'Been lifting for a while']] as [FitnessLevel, string, string][]).map(([val, label, sub]) => (
            <OptionCard key={val} label={label} subtitle={sub} selected={p.fitnessLevel === val}
              onPress={() => setP(prev => ({ ...prev, fitnessLevel: val }))} />
          ))}
        </View>
      );
      // Step 5: Activity Level
      case 5: return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Activity Level</Text>
          <Text style={styles.stepSub}>Your lifestyle outside the gym</Text>
          {([['sedentary', 'Sedentary', 'Little to no exercise'],
             ['lightly_active', 'Lightly Active', '1-3 days a week'],
             ['moderately_active', 'Moderately Active', '4-6 days a week'],
             ['very_active', 'Very Active', 'Hard exercises every day']] as [ActivityLevel, string, string][]).map(([val, label, sub]) => (
            <OptionCard key={val} label={label} subtitle={sub} selected={p.activityLevel === val}
              onPress={() => setP(prev => ({ ...prev, activityLevel: val }))} />
          ))}
        </View>
      );
      // Step 6-9: Number inputs
      case 6: case 7: case 8: case 9: {
        const configs = [
          { label: 'Your Age', sub: 'In years', field: 'age' as const, unit: 'years', placeholder: '25' },
          { label: 'Your Height', sub: 'In centimeters', field: 'height' as const, unit: 'cm', placeholder: '170' },
          { label: 'Current Weight', sub: 'In kilograms', field: 'weight' as const, unit: 'kg', placeholder: '70' },
          { label: 'Target Weight', sub: 'Your goal weight in kg', field: 'targetWeight' as const, unit: 'kg', placeholder: '65' },
        ];
        const cfg = configs[step - 6];
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{cfg.label}</Text>
            <Text style={styles.stepSub}>{cfg.sub}</Text>
            <View style={styles.numberInputContainer}>
              <TextInput
                style={styles.numberInput}
                value={p[cfg.field]}
                onChangeText={v => setP(prev => ({ ...prev, [cfg.field]: v }))}
                keyboardType="numeric"
                placeholder={cfg.placeholder}
                placeholderTextColor={c.mutedForeground}
                maxLength={5}
                autoFocus
              />
              <Text style={styles.numberUnit}>{cfg.unit}</Text>
            </View>
          </View>
        );
      }
      // Step 10: Health Issues
      case 10: {
        const noneSelected = p.healthIssues.includes('none');
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Health Issues</Text>
            <Text style={styles.stepSub}>We'll adapt your plan accordingly</Text>
            <View style={styles.chipsGrid}>
              <ChipButton label="None" selected={noneSelected}
                onPress={() => setP(prev => ({ ...prev, healthIssues: noneSelected ? [] : ['none'] }))} />
              {([['knee', 'Knee'], ['hip_joints', 'Hip Joints'], ['back_hernia', 'Back / Hernia'],
                 ['arms_shoulders', 'Arms & Shoulders'], ['no_jumps', "Can't Do Jumps"]] as [HealthIssue, string][]).map(([val, label]) => (
                <ChipButton key={val} label={label} disabled={noneSelected}
                  selected={p.healthIssues.includes(val)}
                  onPress={() => setP(prev => ({
                    ...prev,
                    healthIssues: toggle(prev.healthIssues.filter(h => h !== 'none'), val),
                  }))} />
              ))}
            </View>
          </View>
        );
      }
      // Step 11: Equipment
      case 11: {
        const noneEquip = p.equipment.includes('none_bodyweight');
        const fullGym = p.equipment.includes('full_gym');
        const gymExtras: Equipment[] = ['barbells', 'dumbbells', 'kettlebells', 'machines'];
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Equipment Access</Text>
            <Text style={styles.stepSub}>What do you have available?</Text>
            <View style={styles.chipsGrid}>
              <ChipButton label="No Equipment (Bodyweight)" selected={noneEquip}
                onPress={() => setP(prev => ({ ...prev, equipment: noneEquip ? [] : ['none_bodyweight'] }))} />
              <ChipButton label="Full Gym" selected={fullGym} disabled={noneEquip}
                onPress={() => {
                  if (fullGym) setP(prev => ({ ...prev, equipment: prev.equipment.filter(e => e !== 'full_gym' && !gymExtras.includes(e)) }));
                  else setP(prev => ({ ...prev, equipment: ['full_gym', ...gymExtras] }));
                }} />
              {gymExtras.map(eq => (
                <ChipButton key={eq} label={eq.charAt(0).toUpperCase() + eq.slice(1)}
                  disabled={noneEquip} selected={p.equipment.includes(eq)}
                  onPress={() => {
                    const newEquip = toggle(p.equipment.filter(e => e !== 'none_bodyweight'), eq);
                    const allGym = gymExtras.every(e => newEquip.includes(e));
                    setP(prev => ({ ...prev, equipment: allGym ? ['full_gym', ...newEquip] : newEquip.filter(e => e !== 'full_gym') }));
                  }} />
              ))}
            </View>
          </View>
        );
      }
      // Step 12: Workout Frequency
      case 12: return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Workout Frequency</Text>
          <Text style={styles.stepSub}>How many days per week?</Text>
          <View style={styles.freqDisplay}>
            <Text style={styles.freqNumber}>{p.workoutsPerWeek}</Text>
            <Text style={styles.freqLabel}>days / week</Text>
          </View>
          <FrequencySlider
            value={p.workoutsPerWeek}
            onChange={n => setP(prev => ({ ...prev, workoutsPerWeek: n, workoutDays: prev.workoutDays.slice(0, n) }))}
          />
          <Text style={[styles.freqHint, { color: c.mutedForeground }]}>
            {p.workoutsPerWeek <= 3 ? 'Full Body split recommended' : p.workoutsPerWeek <= 5 ? 'Upper/Lower split recommended' : 'Push/Pull/Legs split recommended'}
          </Text>
        </View>
      );
      // Step 13: Workout Days
      case 13: return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Workout Days</Text>
          <Text style={styles.stepSub}>Select up to {p.workoutsPerWeek} days</Text>
          <View style={styles.daysGrid}>
            {DAYS.map(day => {
              const selected = p.workoutDays.includes(day);
              const maxed = !selected && p.workoutDays.length >= p.workoutsPerWeek;
              return (
                <TouchableOpacity key={day}
                  style={[styles.dayBtn, { borderColor: selected ? c.neonCyan : c.border, backgroundColor: selected ? c.neonCyan + '20' : c.card, opacity: maxed ? 0.4 : 1 }]}
                  onPress={() => {
                    if (maxed) { Alert.alert('Limit Reached', `Max ${p.workoutsPerWeek} days selected`); return; }
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setP(prev => ({ ...prev, workoutDays: toggle(prev.workoutDays, day) }));
                  }}
                  activeOpacity={0.7}>
                  <Text style={[styles.dayBtnText, { color: selected ? c.neonCyan : c.mutedForeground }]}>{DAY_LABELS[day]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.freqHint, { color: c.mutedForeground }]}>{p.workoutDays.length} / {p.workoutsPerWeek} days selected</Text>
        </View>
      );
      // Step 14: Reminders
      case 14: return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Set Reminders</Text>
          <Text style={styles.stepSub}>Get reminded on your workout days</Text>
          {p.workoutDays.length === 0
            ? <Text style={[styles.stepSub, { color: c.mutedForeground }]}>No workout days selected. Go back to select days.</Text>
            : p.workoutDays.map(day => {
                const existing = p.reminderSettings.find(r => r.day === day);
                const time = existing?.time ?? '07:00';
                return (
                  <View key={day} style={styles.reminderRow}>
                    <Text style={[styles.reminderDay, { color: c.foreground }]}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                    <TextInput
                      style={[styles.timeInput, { borderColor: c.border, color: c.neonCyan }]}
                      value={time}
                      placeholder="07:00"
                      placeholderTextColor={c.mutedForeground}
                      onChangeText={v => {
                        setP(prev => ({
                          ...prev,
                          reminderSettings: prev.reminderSettings.filter(r => r.day !== day).concat({ day, time: v, enabled: true }),
                        }));
                      }}
                    />
                  </View>
                );
              })
          }
        </View>
      );
      // Step 15: Summary
      case 15: return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Your Profile</Text>
          <Text style={styles.stepSub}>Review before generating your plan</Text>
          <View style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.neonCyan + '50' }]}>
            {[
              ['Goal', p.goal?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) ?? '—'],
              ['Fitness Level', p.fitnessLevel?.charAt(0).toUpperCase() + p.fitnessLevel!.slice(1) ?? '—'],
              ['Focus', p.focusAreas.includes('full_body') ? 'Full Body' : p.focusAreas.slice(0, 3).join(', ')],
              ['Equipment', p.equipment.includes('full_gym') ? 'Full Gym' : p.equipment.includes('none_bodyweight') ? 'Bodyweight' : p.equipment.join(', ')],
              ['Workouts', `${p.workoutsPerWeek}× per week`],
              ['Days', p.workoutDays.map(d => DAY_LABELS[d]).join(', ')],
              ['Weight', `${p.weight} kg → ${p.targetWeight} kg`],
              ['Health', p.healthIssues.includes('none') || p.healthIssues.length === 0 ? 'None' : p.healthIssues.join(', ')],
            ].map(([label, val]) => (
              <View key={label} style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: c.mutedForeground }]}>{label}</Text>
                <Text style={[styles.summaryValue, { color: c.foreground }]} numberOfLines={1}>{val}</Text>
              </View>
            ))}
          </View>
        </View>
      );
      default: return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={back} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={c.foreground} />
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
        </View>
        <Text style={styles.stepCount}>{step + 1}/{TOTAL_STEPS}</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 100 }]}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
          {renderStep()}
        </Animated.View>
      </ScrollView>

      {/* Navigation */}
      <View style={[styles.nav, { paddingBottom: botPad + 12 }]}>
        <NeonButton
          title={step === TOTAL_STEPS - 1 ? 'Generate My Plan' : 'Continue'}
          size="lg"
          onPress={next}
          disabled={!canNext()}
          style={styles.nextBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: c.secondary, alignItems: 'center', justifyContent: 'center' },
  progressBar: { flex: 1, height: 4, backgroundColor: c.secondary, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: c.neonCyan, borderRadius: 2 },
  stepCount: { fontFamily: 'Inter_500Medium', fontSize: 12, color: c.mutedForeground, width: 36, textAlign: 'right' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  stepContent: { gap: 14 },
  stepTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, color: c.foreground, letterSpacing: -0.5 },
  stepSub: { fontFamily: 'Inter_400Regular', fontSize: 15, color: c.mutedForeground, marginBottom: 4 },
  optionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1.5, gap: 12 },
  optionInner: { flex: 1 },
  optionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  optionSub: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 2 },
  optionCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1.5 },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  numberInputContainer: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  numberInput: { fontSize: 56, fontFamily: 'Inter_700Bold', color: c.neonCyan, textAlign: 'center', width: 160 },
  numberUnit: { fontFamily: 'Inter_400Regular', fontSize: 16, color: c.mutedForeground },
  freqDisplay: { alignItems: 'center', paddingVertical: 20, gap: 4 },
  freqNumber: { fontFamily: 'Inter_700Bold', fontSize: 72, color: c.neonCyan },
  freqLabel: { fontFamily: 'Inter_400Regular', fontSize: 16, color: c.mutedForeground },
  freqHint: { textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 13 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dayBtn: { width: 72, height: 48, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  dayBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border },
  reminderDay: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  timeInput: { fontFamily: 'Inter_600SemiBold', fontSize: 18, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, width: 80, textAlign: 'center' },
  summaryCard: { borderWidth: 1.5, borderRadius: 16, padding: 18, gap: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  summaryLabel: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  summaryValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, textAlign: 'right', flex: 1 },
  nav: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: c.background + 'ee', borderTopWidth: 1, borderTopColor: c.border },
  nextBtn: { width: '100%' },
});
