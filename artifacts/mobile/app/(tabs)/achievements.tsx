import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import AchievementBadge from '@/components/AchievementBadge';

const c = colors.dark;

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const unlocked = state.achievements.filter(a => a.unlocked);
  const locked = state.achievements.filter(a => !a.unlocked);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 90 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Achievements</Text>
          <View style={[styles.countBadge, { backgroundColor: c.gold + '20', borderColor: c.gold + '50' }]}>
            <Feather name="award" size={14} color={c.gold} />
            <Text style={[styles.countText, { color: c.gold }]}>{unlocked.length}/{state.achievements.length}</Text>
          </View>
        </View>

        {/* Unlocked */}
        {unlocked.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>UNLOCKED</Text>
            <View style={styles.grid}>
              {unlocked.map(a => (
                <View key={a.id} style={[styles.achieveCard, { backgroundColor: c.card, borderColor: a.color + '40' }]}>
                  <AchievementBadge achievement={a} />
                  {a.unlockedAt && (
                    <Text style={[styles.dateText, { color: c.mutedForeground }]}>
                      {new Date(a.unlockedAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Locked */}
        {locked.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>IN PROGRESS</Text>
            <View style={styles.grid}>
              {locked.map(a => (
                <View key={a.id} style={[styles.achieveCard, { backgroundColor: c.card, borderColor: c.border }]}>
                  <AchievementBadge achievement={a} />
                  {a.maxProgress && (
                    <Text style={[styles.progressText, { color: c.mutedForeground }]}>
                      {a.progress ?? 0}/{a.maxProgress}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {unlocked.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: c.card, borderColor: c.border }]}>
            <Feather name="lock" size={40} color={c.mutedForeground} />
            <Text style={styles.emptyTitle}>Start Training</Text>
            <Text style={[styles.emptySub, { color: c.mutedForeground }]}>
              Complete your first workout to unlock achievements
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, color: c.foreground, letterSpacing: -1 },
  countBadge: { flexDirection: 'row', gap: 6, alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  countText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 11, color: c.mutedForeground, letterSpacing: 2, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  achieveCard: { width: '47%', borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center', gap: 8 },
  dateText: { fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'center' },
  progressText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  emptyState: { borderRadius: 16, borderWidth: 1, padding: 40, alignItems: 'center', gap: 12, marginTop: 20 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: c.foreground },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center' },
});
