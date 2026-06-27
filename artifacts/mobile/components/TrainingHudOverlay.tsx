import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import colors from '@/constants/colors';
import type { MuscleGroup, WorkoutExercise } from '@/types';
import { numericRepTarget } from '@/utils/workoutGenerator';

const c = colors.dark;

type HudMode = 'scanner' | 'counter';
type ScanState = 'idle' | 'scanning' | 'complete';

interface ScanResult {
  score: number;
  confidence: number;
  status: string;
  primaryCue: string;
  correction: string;
  warning: string;
}

interface Props {
  visible: boolean;
  initialMode: HudMode;
  exercises: WorkoutExercise[];
  onClose: () => void;
  onApplyRepSet: (exerciseIndex: number, reps: number) => void;
}

const MUSCLE_CUES: Record<MuscleGroup, { primary: string; correction: string }> = {
  full_body: { primary: 'Stack ribs over hips and keep tempo even.', correction: 'Brace before each rep and avoid rushing transitions.' },
  chest: { primary: 'Keep shoulder blades packed and wrists stacked.', correction: 'Lower under control until elbows track slightly below the torso.' },
  back: { primary: 'Initiate with the lats before bending the elbows.', correction: 'Pull shoulder blades down and avoid shrugging at lockout.' },
  arms: { primary: 'Pin the upper arm and control the eccentric.', correction: 'Stop swinging the torso to keep tension on the target muscle.' },
  shoulders: { primary: 'Keep ribs down and press through a stable path.', correction: 'Do not flare the elbows past a comfortable shoulder angle.' },
  abs: { primary: 'Brace hard and keep the pelvis tucked.', correction: 'Shorten the range before the lower back starts arching.' },
  legs: { primary: 'Track knees over toes and maintain mid-foot pressure.', correction: 'Slow the descent until depth stays consistent.' },
  glutes: { primary: 'Drive through the heel and finish with full hip extension.', correction: 'Avoid overextending the lower back at the top.' },
};

function buildScanResult(item: WorkoutExercise, imageUri: string): ScanResult {
  const seed = `${item.exercise.name}:${imageUri}`.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const score = 78 + (seed % 18);
  const cue = MUSCLE_CUES[item.exercise.targetMuscle];
  const commonMistake = item.exercise.commonMistakes[seed % Math.max(1, item.exercise.commonMistakes.length)];

  return {
    score,
    confidence: Math.min(99, score + 3),
    status: score >= 90 ? 'LOCKED' : score >= 84 ? 'STABLE' : 'ADJUST',
    primaryCue: cue.primary,
    correction: commonMistake ? `Watch for: ${commonMistake}` : cue.correction,
    warning: item.exercise.safetyNotes,
  };
}

function clampExerciseIndex(index: number, length: number) {
  return Math.min(Math.max(index, 0), Math.max(0, length - 1));
}

export default function TrainingHudOverlay({ visible, initialMode, exercises, onClose, onApplyRepSet }: Props) {
  const [mode, setMode] = useState<HudMode>(initialMode);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [counterRunning, setCounterRunning] = useState(false);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeExercise = exercises[clampExerciseIndex(exerciseIndex, exercises.length)];
  const targetReps = useMemo(() => activeExercise ? numericRepTarget(activeExercise.reps) : 0, [activeExercise]);
  const repProgress = targetReps > 0 ? Math.min(1, repCount / targetReps) : 0;

  useEffect(() => {
    if (!visible) return;
    setMode(initialMode);
    setExerciseIndex(0);
    setImageUri(null);
    setScanState('idle');
    setScanResult(null);
    setRepCount(0);
    setCounterRunning(false);
  }, [initialMode, visible]);

  useEffect(() => {
    if (!counterRunning || targetReps <= 0) return;
    const timer = setInterval(() => {
      setRepCount(previous => Math.min(targetReps, previous + 1));
    }, 1050);
    return () => clearInterval(timer);
  }, [counterRunning, targetReps]);

  useEffect(() => {
    if (counterRunning && repCount >= targetReps && targetReps > 0) {
      setCounterRunning(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [counterRunning, repCount, targetReps]);

  useEffect(() => () => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
  }, []);

  const runScan = (uri: string) => {
    if (!activeExercise) return;
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    setImageUri(uri);
    setScanState('scanning');
    setScanResult(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scanTimerRef.current = setTimeout(() => {
      setScanResult(buildScanResult(activeExercise, uri));
      setScanState('complete');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1200);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Media Access Needed', 'Allow image access to scan your form from a saved frame.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled && result.assets[0]?.uri) runScan(result.assets[0].uri);
  };

  const captureImage = async () => {
    if (Platform.OS === 'web') {
      await pickImage();
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera Access Needed', 'Allow camera access to capture a form scan frame.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled && result.assets[0]?.uri) runScan(result.assets[0].uri);
  };

  const selectExercise = (direction: -1 | 1) => {
    setExerciseIndex(previous => clampExerciseIndex(previous + direction, exercises.length));
    setScanState('idle');
    setScanResult(null);
    setRepCount(0);
    setCounterRunning(false);
  };

  const applyCounter = () => {
    if (!activeExercise || repCount <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onApplyRepSet(exerciseIndex, repCount);
  };

  if (!activeExercise) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.gridLayer}>
          {Array.from({ length: 13 }, (_, index) => <View key={index} style={[styles.gridLine, { top: `${index * 8}%` }]} />)}
        </View>

        <View style={styles.shell}>
          <View style={styles.topBar}>
            <View>
              <Text style={styles.eyebrow}>SYSTEM HUD</Text>
              <Text style={styles.title}>{mode === 'scanner' ? 'AI Form Scanner' : 'Rep Counter'}</Text>
            </View>
            <TouchableOpacity style={styles.iconButton} onPress={onClose} accessibilityLabel="Close HUD">
              <Feather name="x" size={20} color={c.foreground} />
            </TouchableOpacity>
          </View>

          <View style={styles.modeRow}>
            <TouchableOpacity style={[styles.modeButton, mode === 'scanner' && styles.modeButtonActive]} onPress={() => setMode('scanner')}>
              <Feather name="camera" size={15} color={mode === 'scanner' ? c.background : c.neonCyan} />
              <Text style={[styles.modeText, mode === 'scanner' && styles.modeTextActive]}>SCAN</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modeButton, mode === 'counter' && styles.modeButtonActive]} onPress={() => setMode('counter')}>
              <Feather name="activity" size={15} color={mode === 'counter' ? c.background : c.neonCyan} />
              <Text style={[styles.modeText, mode === 'counter' && styles.modeTextActive]}>COUNT</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.exerciseDock}>
            <TouchableOpacity style={styles.arrowButton} onPress={() => selectExercise(-1)} accessibilityLabel="Previous exercise">
              <Feather name="chevron-left" size={18} color={c.neonCyan} />
            </TouchableOpacity>
            <View style={styles.exerciseMeta}>
              <Text style={styles.exerciseName} numberOfLines={1}>{activeExercise.exercise.name}</Text>
              <Text style={styles.exerciseSub}>{exerciseIndex + 1}/{exercises.length} | {activeExercise.sets} sets x {activeExercise.reps}</Text>
            </View>
            <TouchableOpacity style={styles.arrowButton} onPress={() => selectExercise(1)} accessibilityLabel="Next exercise">
              <Feather name="chevron-right" size={18} color={c.neonCyan} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {mode === 'scanner' ? (
              <View style={styles.scannerPanel}>
                <View style={styles.viewport}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.emptyViewport}>
                      <Feather name="user-check" size={42} color={c.neonCyan} />
                      <Text style={styles.emptyViewportText}>Capture or upload one rep frame</Text>
                    </View>
                  )}
                  <View style={styles.cornerTopLeft} />
                  <View style={styles.cornerTopRight} />
                  <View style={styles.cornerBottomLeft} />
                  <View style={styles.cornerBottomRight} />
                  {scanState === 'scanning' && <View style={styles.scanLine} />}
                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{scanState === 'scanning' ? 'SCANNING' : scanResult?.status ?? 'STANDBY'}</Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.primaryAction} onPress={captureImage}>
                    <Feather name="camera" size={16} color={c.background} />
                    <Text style={styles.primaryActionText}>Capture</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryAction} onPress={pickImage}>
                    <Feather name="upload" size={16} color={c.neonCyan} />
                    <Text style={styles.secondaryActionText}>Upload</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.telemetryGrid}>
                  <View style={styles.telemetryCell}>
                    <Text style={styles.telemetryValue}>{scanResult ? scanResult.score : '--'}</Text>
                    <Text style={styles.telemetryLabel}>FORM</Text>
                  </View>
                  <View style={styles.telemetryCell}>
                    <Text style={styles.telemetryValue}>{scanResult ? `${scanResult.confidence}%` : '--'}</Text>
                    <Text style={styles.telemetryLabel}>CONF</Text>
                  </View>
                </View>

                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackTitle}>LIVE CUES</Text>
                  <Text style={styles.feedbackText}>{scanResult?.primaryCue ?? MUSCLE_CUES[activeExercise.exercise.targetMuscle].primary}</Text>
                  <Text style={styles.feedbackText}>{scanResult?.correction ?? 'Run a scan to generate correction points.'}</Text>
                  <Text style={styles.warningText}>{scanResult?.warning ?? activeExercise.exercise.safetyNotes}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.counterPanel}>
                <View style={styles.counterRing}>
                  <View style={[styles.counterFill, { height: `${Math.max(8, repProgress * 100)}%` }]} />
                  <Text style={styles.repNumber}>{repCount}</Text>
                  <Text style={styles.repTarget}>/ {targetReps}</Text>
                </View>

                <View style={styles.counterReadouts}>
                  <View style={styles.readout}>
                    <Text style={styles.readoutValue}>{counterRunning ? 'TRACKING' : repCount >= targetReps ? 'COMPLETE' : 'READY'}</Text>
                    <Text style={styles.readoutLabel}>STATE</Text>
                  </View>
                  <View style={styles.readout}>
                    <Text style={styles.readoutValue}>{Math.round(repProgress * 100)}%</Text>
                    <Text style={styles.readoutLabel}>RANGE</Text>
                  </View>
                </View>

                <View style={styles.counterActions}>
                  <TouchableOpacity style={styles.primaryAction} onPress={() => setCounterRunning(running => !running)}>
                    <Feather name={counterRunning ? 'pause' : 'play'} size={16} color={c.background} />
                    <Text style={styles.primaryActionText}>{counterRunning ? 'Pause' : 'Start'}</Text>
                  </TouchableOpacity>
                  <View style={styles.counterSecondaryRow}>
                    <TouchableOpacity style={styles.secondaryAction} onPress={() => setRepCount(count => Math.min(targetReps, count + 1))}>
                      <Feather name="plus" size={16} color={c.neonCyan} />
                      <Text style={styles.secondaryActionText}>Manual</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryAction} onPress={() => { setRepCount(0); setCounterRunning(false); }}>
                      <Feather name="rotate-ccw" size={16} color={c.neonCyan} />
                      <Text style={styles.secondaryActionText}>Reset</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={[styles.applyButton, repCount <= 0 && styles.disabledButton]} onPress={applyCounter} disabled={repCount <= 0}>
                  <Feather name="check-circle" size={17} color={repCount > 0 ? c.background : c.mutedForeground} />
                  <Text style={[styles.applyText, repCount <= 0 && styles.disabledText]}>Apply to next set</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(1, 4, 13, 0.88)', paddingHorizontal: 14, paddingVertical: 28 },
  gridLayer: { ...StyleSheet.absoluteFillObject, opacity: 0.18 },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: c.neonCyan },
  shell: { flex: 1, borderWidth: 1, borderColor: c.neonCyan + '66', backgroundColor: 'rgba(2, 7, 19, 0.82)', padding: 14, gap: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, color: c.warning, letterSpacing: 2 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24, color: c.foreground, marginTop: 2 },
  iconButton: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center', backgroundColor: c.secondary },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeButton: { flex: 1, minHeight: 42, borderRadius: 8, borderWidth: 1, borderColor: c.neonCyan + '55', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: c.deepCard },
  modeButtonActive: { backgroundColor: c.neonCyan, borderColor: c.neonCyan },
  modeText: { fontFamily: 'Inter_700Bold', fontSize: 12, color: c.neonCyan, letterSpacing: 1 },
  modeTextActive: { color: c.background },
  exerciseDock: { minHeight: 58, borderWidth: 1, borderColor: c.border, backgroundColor: c.darkCard, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8 },
  arrowButton: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: c.neonCyan + '55', alignItems: 'center', justifyContent: 'center' },
  exerciseMeta: { flex: 1 },
  exerciseName: { fontFamily: 'Inter_700Bold', fontSize: 15, color: c.foreground },
  exerciseSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: c.mutedForeground, marginTop: 2 },
  content: { paddingBottom: 10 },
  scannerPanel: { gap: 12 },
  viewport: { height: 300, borderWidth: 1, borderColor: c.neonCyan + '70', backgroundColor: c.deepCard, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  emptyViewport: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 28 },
  emptyViewportText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: c.mutedForeground, textAlign: 'center' },
  cornerTopLeft: { position: 'absolute', top: 10, left: 10, width: 34, height: 34, borderTopWidth: 2, borderLeftWidth: 2, borderColor: c.neonCyan },
  cornerTopRight: { position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderTopWidth: 2, borderRightWidth: 2, borderColor: c.neonCyan },
  cornerBottomLeft: { position: 'absolute', bottom: 10, left: 10, width: 34, height: 34, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: c.neonCyan },
  cornerBottomRight: { position: 'absolute', bottom: 10, right: 10, width: 34, height: 34, borderBottomWidth: 2, borderRightWidth: 2, borderColor: c.neonCyan },
  scanLine: { position: 'absolute', left: 16, right: 16, top: '48%', height: 2, backgroundColor: c.success, shadowColor: c.success, shadowOpacity: 0.7, shadowRadius: 12 },
  statusPill: { position: 'absolute', top: 12, alignSelf: 'center', borderRadius: 6, backgroundColor: c.background + 'dd', borderWidth: 1, borderColor: c.neonCyan + '66', paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontFamily: 'Inter_700Bold', fontSize: 11, color: c.neonCyan, letterSpacing: 1 },
  actionRow: { flexDirection: 'row', gap: 8 },
  primaryAction: { flex: 1, minHeight: 44, borderRadius: 8, backgroundColor: c.neonCyan, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryActionText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: c.background },
  secondaryAction: { flex: 1, minHeight: 44, borderRadius: 8, borderWidth: 1, borderColor: c.neonCyan + '55', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.deepCard },
  secondaryActionText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: c.neonCyan },
  telemetryGrid: { flexDirection: 'row', gap: 8 },
  telemetryCell: { flex: 1, borderWidth: 1, borderColor: c.border, backgroundColor: c.darkCard, padding: 12, alignItems: 'center' },
  telemetryValue: { fontFamily: 'Inter_700Bold', fontSize: 28, color: c.foreground },
  telemetryLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, color: c.mutedForeground, letterSpacing: 1 },
  feedbackBox: { borderWidth: 1, borderColor: c.border, backgroundColor: c.darkCard, padding: 12, gap: 7 },
  feedbackTitle: { fontFamily: 'Inter_700Bold', fontSize: 11, color: c.warning, letterSpacing: 2 },
  feedbackText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: c.foreground, lineHeight: 19 },
  warningText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: c.warning, lineHeight: 18 },
  counterPanel: { alignItems: 'center', gap: 16 },
  counterRing: { width: 210, height: 210, borderRadius: 105, borderWidth: 2, borderColor: c.neonCyan + '77', backgroundColor: c.deepCard, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  counterFill: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: c.neonCyan + '22' },
  repNumber: { fontFamily: 'Inter_700Bold', fontSize: 70, color: c.foreground },
  repTarget: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: c.mutedForeground, marginTop: -8 },
  counterReadouts: { width: '100%', flexDirection: 'row', gap: 8 },
  readout: { flex: 1, borderWidth: 1, borderColor: c.border, backgroundColor: c.darkCard, padding: 12, alignItems: 'center' },
  readoutValue: { fontFamily: 'Inter_700Bold', fontSize: 14, color: c.neonCyan },
  readoutLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, color: c.mutedForeground, marginTop: 4, letterSpacing: 1 },
  counterActions: { width: '100%', gap: 8 },
  counterSecondaryRow: { flexDirection: 'row', gap: 8 },
  applyButton: { width: '100%', minHeight: 46, borderRadius: 8, backgroundColor: c.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  disabledButton: { backgroundColor: c.secondary },
  applyText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: c.background },
  disabledText: { color: c.mutedForeground },
});
