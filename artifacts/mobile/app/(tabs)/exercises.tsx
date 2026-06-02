import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { EXERCISES } from '@/constants/exercises';
import type { MuscleGroup } from '@/types';

const c = colors.dark;

const MUSCLE_FILTERS: Array<{ label: string; value: MuscleGroup | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Chest', value: 'chest' },
  { label: 'Back', value: 'back' },
  { label: 'Legs', value: 'legs' },
  { label: 'Shoulders', value: 'shoulders' },
  { label: 'Arms', value: 'arms' },
  { label: 'Abs', value: 'abs' },
  { label: 'Glutes', value: 'glutes' },
  { label: 'Full Body', value: 'full_body' },
];

const DIFFICULTY_COLORS: Record<string, string> = { beginner: c.success, intermediate: c.warning, advanced: c.destructive };

function ExerciseDetailModal({ exercise, onClose }: { exercise: typeof EXERCISES[0]; onClose: () => void }) {
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: c.background }]}>
        <View style={[styles.modalHeader, { borderColor: c.border }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalTitleRow}>
            <View>
              <Text style={styles.modalTitle}>{exercise.name}</Text>
              <Text style={[styles.modalSub, { color: c.mutedForeground }]}>
                {exercise.targetMuscle.replace('_', ' ')} • {exercise.equipment.join(', ').replace(/_/g, ' ')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: c.secondary }]}>
              <Feather name="x" size={18} color={c.foreground} />
            </TouchableOpacity>
          </View>
          {/* Tags */}
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: DIFFICULTY_COLORS[exercise.difficulty] + '20', borderColor: DIFFICULTY_COLORS[exercise.difficulty] + '50' }]}>
              <Text style={[styles.tagText, { color: DIFFICULTY_COLORS[exercise.difficulty] }]}>{exercise.difficulty}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: c.secondary, borderColor: c.border }]}>
              <Text style={[styles.tagText, { color: c.mutedForeground }]}>{exercise.sets} sets</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: c.secondary, borderColor: c.border }]}>
              <Text style={[styles.tagText, { color: c.mutedForeground }]}>{exercise.reps} reps</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: c.secondary, borderColor: c.border }]}>
              <Text style={[styles.tagText, { color: c.mutedForeground }]}>{exercise.restTime}s rest</Text>
            </View>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
          {/* Instructions */}
          <Text style={styles.detailSection}>Instructions</Text>
          {exercise.instructions.map((inst, i) => (
            <View key={i} style={styles.instructionRow}>
              <View style={[styles.instNum, { backgroundColor: c.neonCyan + '20' }]}>
                <Text style={[styles.instNumText, { color: c.neonCyan }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.instText, { color: c.foreground }]}>{inst}</Text>
            </View>
          ))}
          {/* Common Mistakes */}
          <Text style={[styles.detailSection, { marginTop: 20 }]}>Common Mistakes</Text>
          {exercise.commonMistakes.map((m, i) => (
            <View key={i} style={styles.mistakeRow}>
              <Feather name="alert-circle" size={14} color={c.warning} />
              <Text style={[styles.mistakeText, { color: c.foreground }]}>{m}</Text>
            </View>
          ))}
          {/* Safety */}
          <Text style={[styles.detailSection, { marginTop: 20 }]}>Safety Notes</Text>
          <View style={[styles.safetyCard, { backgroundColor: c.success + '10', borderColor: c.success + '30' }]}>
            <Feather name="shield" size={16} color={c.success} />
            <Text style={[styles.safetyText, { color: c.foreground }]}>{exercise.safetyNotes}</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function ExercisesScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MuscleGroup | 'all'>('all');
  const [selected, setSelected] = useState<typeof EXERCISES[0] | null>(null);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const filtered = useMemo(() => {
    return EXERCISES.filter(ex => {
      const matchSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.targetMuscle.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || ex.targetMuscle === filter;
      return matchSearch && matchFilter;
    });
  }, [search, filter]);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.headerArea}>
        <Text style={styles.pageTitle}>Exercise Guide</Text>
        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: c.card, borderColor: c.border }]}>
          <Feather name="search" size={16} color={c.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: c.foreground }]}
            placeholder="Search exercises..."
            placeholderTextColor={c.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={14} color={c.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        {/* Muscle filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 1 }}>
          {MUSCLE_FILTERS.map(f => (
            <TouchableOpacity key={f.value}
              style={[styles.filterChip, { borderColor: filter === f.value ? c.neonCyan : c.border, backgroundColor: filter === f.value ? c.neonCyan + '15' : c.secondary }]}
              onPress={() => setFilter(f.value)}>
              <Text style={[styles.filterText, { color: filter === f.value ? c.neonCyan : c.mutedForeground }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={[styles.countText, { color: c.mutedForeground }]}>{filtered.length} exercises</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 90 }]} showsVerticalScrollIndicator={false}>
        {filtered.map((ex) => (
          <TouchableOpacity key={ex.id}
            style={[styles.exCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
            onPress={() => setSelected(ex)} activeOpacity={0.8}>
            <View style={styles.exTop}>
              <View style={styles.exInfo}>
                <Text style={styles.exName}>{ex.name}</Text>
                <Text style={[styles.exMeta, { color: c.mutedForeground }]}>
                  {ex.targetMuscle.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} • {ex.sets} × {ex.reps}
                </Text>
              </View>
              <View style={styles.exBadges}>
                <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLORS[ex.difficulty] + '20' }]}>
                  <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[ex.difficulty] }]}>{ex.difficulty}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={c.mutedForeground} />
              </View>
            </View>
            <Text style={[styles.exEquip, { color: c.mutedForeground }]}>
              {ex.equipment.map(e => e.replace(/_/g, ' ')).join(' • ')}
            </Text>
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="search" size={40} color={c.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>No exercises found</Text>
            <Text style={[styles.emptySub, { color: c.mutedForeground }]}>Try a different search or filter</Text>
          </View>
        )}
      </ScrollView>

      {selected && <ExerciseDetailModal exercise={selected} onClose={() => setSelected(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  headerArea: { paddingHorizontal: 20, paddingBottom: 12, gap: 10 },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, color: c.foreground, letterSpacing: -1, paddingTop: 20 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15 },
  filterRow: { marginHorizontal: -1 },
  filterChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  filterText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  countText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  scroll: { paddingHorizontal: 20, gap: 8 },
  exCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  exTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exInfo: { flex: 1, gap: 3 },
  exName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: c.foreground },
  exMeta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  exEquip: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  exBadges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  diffBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  diffText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  // Modal
  modalContainer: { flex: 1 },
  modalHeader: { padding: 20, borderBottomWidth: 1, gap: 12 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center' },
  modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, color: c.foreground },
  modalSub: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 3 },
  closeBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  modalScroll: { padding: 20, paddingBottom: 40 },
  detailSection: { fontFamily: 'Inter_700Bold', fontSize: 16, color: c.foreground, marginBottom: 12 },
  instructionRow: { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
  instNum: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  instNumText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  instText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  mistakeRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  mistakeText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  safetyCard: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'flex-start' },
  safetyText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
});
