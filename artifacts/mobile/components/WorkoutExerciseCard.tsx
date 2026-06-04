import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import type { WorkoutExercise, CompletedSet } from '@/types';

interface Props {
  item: WorkoutExercise;
  index: number;
  onUpdate: (sets: CompletedSet[], notes: string) => void;
}

export default function WorkoutExerciseCard({ item, index, onUpdate }: Props) {
  const c = colors.dark;
  const [completedSets, setCompletedSets] = useState<CompletedSet[]>(
    Array.from({ length: item.sets }, () => ({ reps: 0, weight: 0 }))
  );
  const [checkedSets, setCheckedSets] = useState<boolean[]>(Array(item.sets).fill(false));
  const [notes, setNotes] = useState('');
  const [expanded, setExpanded] = useState(index === 0);

  const allChecked = checkedSets.every(Boolean);

  const toggleSet = (i: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = [...checkedSets];
    updated[i] = !updated[i];
    setCheckedSets(updated);
    const sets = completedSets.map((set, index) => ({ ...set, completed: updated[index] }));
    setCompletedSets(sets);
    onUpdate(sets, notes);
  };

  const updateSet = (i: number, field: 'reps' | 'weight', val: string) => {
    const updated = [...completedSets];
    updated[i] = { ...updated[i], [field]: parseInt(val) || 0 };
    setCompletedSets(updated);
    onUpdate(updated, notes);
  };

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: allChecked ? c.success + '80' : c.cardBorder }]}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={[styles.indexBadge, { backgroundColor: allChecked ? c.success + '20' : c.secondary }]}>
          {allChecked
            ? <Feather name="check" size={14} color={c.success} />
            : <Text style={[styles.indexText, { color: c.neonCyan }]}>{index + 1}</Text>
          }
        </View>
        <View style={styles.exerciseInfo}>
          <Text style={[styles.name, { color: allChecked ? c.success : c.foreground }]}>{item.exercise.name}</Text>
          <Text style={[styles.meta, { color: c.mutedForeground }]}>
            {item.exercise.targetMuscle.replace('_', ' ')} | {item.sets} sets x {item.reps} reps | {item.restTime}s rest
          </Text>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={c.mutedForeground} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {/* Set rows */}
          <View style={styles.setHeader}>
            <Text style={[styles.setLabel, { color: c.mutedForeground, flex: 0.3 }]}>Set</Text>
            <Text style={[styles.setLabel, { color: c.mutedForeground, flex: 1 }]}>Reps</Text>
            <Text style={[styles.setLabel, { color: c.mutedForeground, flex: 1 }]}>Weight (kg)</Text>
            <Text style={[styles.setLabel, { color: c.mutedForeground, flex: 0.3 }]}>Done</Text>
          </View>
          {Array.from({ length: item.sets }, (_, i) => (
            <View key={i} style={[styles.setRow, checkedSets[i] && { opacity: 0.6 }]}>
              <Text style={[styles.setNum, { color: c.neonCyan, flex: 0.3 }]}>{i + 1}</Text>
              <TextInput
                style={[styles.input, { flex: 1, borderColor: c.border, color: c.foreground }]}
                keyboardType="numeric"
                placeholder={item.reps.split('-')[0]}
                placeholderTextColor={c.mutedForeground}
                value={completedSets[i]?.reps ? String(completedSets[i].reps) : ''}
                onChangeText={v => updateSet(i, 'reps', v)}
              />
              <TextInput
                style={[styles.input, { flex: 1, borderColor: c.border, color: c.foreground }]}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={c.mutedForeground}
                value={completedSets[i]?.weight ? String(completedSets[i].weight) : ''}
                onChangeText={v => updateSet(i, 'weight', v)}
              />
              <TouchableOpacity
                style={[styles.checkBtn, { flex: 0.3, borderColor: checkedSets[i] ? c.success : c.border, backgroundColor: checkedSets[i] ? c.success + '20' : 'transparent' }]}
                onPress={() => toggleSet(i)}
              >
                <Feather name="check" size={14} color={checkedSets[i] ? c.success : c.border} />
              </TouchableOpacity>
            </View>
          ))}
          {/* Notes */}
          <TextInput
            style={[styles.notesInput, { borderColor: c.border, color: c.foreground }]}
            placeholder="Notes (optional)..."
            placeholderTextColor={c.mutedForeground}
            value={notes}
            onChangeText={v => { setNotes(v); onUpdate(completedSets, v); }}
            multiline
          />
          {/* Instructions */}
          <View style={styles.tipsRow}>
            <Feather name="info" size={13} color={c.neonCyan} />
            <Text style={[styles.tipsText, { color: c.neonCyan }]}>
              {item.exercise.instructions[0]}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 3, borderWidth: 1, overflow: 'hidden', marginBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  indexBadge: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  indexText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  exerciseInfo: { flex: 1 },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  body: { paddingHorizontal: 14, paddingBottom: 14, gap: 6 },
  setHeader: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  setLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, textTransform: 'uppercase' },
  setRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  setNum: { fontFamily: 'Inter_600SemiBold', fontSize: 14, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center' },
  checkBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  notesInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 4, minHeight: 40 },
  tipsRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', paddingTop: 4 },
  tipsText: { fontFamily: 'Inter_400Regular', fontSize: 12, flex: 1, lineHeight: 17 },
});
