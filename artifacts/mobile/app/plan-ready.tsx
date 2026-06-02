import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import NeonButton from '@/components/NeonButton';
import { useApp } from '@/context/AppContext';

const c = colors.dark;

export default function PlanReadyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(cardFade, { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.timing(cardSlide, { toValue: 0, duration: 500, useNativeDriver: false }),
      ]),
      Animated.timing(textFade, { toValue: 1, duration: 400, useNativeDriver: false }),
    ]).start();
  }, []);

  const plan = state.workoutPlan;
  const profile = state.userProfile;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>
      <View style={styles.content}>
        {/* Badge */}
        <View style={styles.badge}>
          <Feather name="check-circle" size={14} color={c.success} />
          <Text style={styles.badgeText}>PLAN GENERATED</Text>
        </View>

        <Text style={styles.title}>Your Training{'\n'}Plan is Ready</Text>
        <Text style={styles.subtitle}>Personalized for your goals and schedule</Text>

        {/* Plan card */}
        <Animated.View style={[styles.planCard, { opacity: cardFade, transform: [{ translateY: cardSlide }] }]}>
          <View style={styles.planHeader}>
            <Feather name="cpu" size={20} color={c.neonCyan} />
            <Text style={styles.planName}>{plan?.split ?? 'Custom'} Split</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.planStats}>
            <View style={styles.planStat}>
              <Text style={styles.planStatVal}>{plan?.days.length ?? 0}</Text>
              <Text style={styles.planStatLbl}>Days/Week</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.planStat}>
              <Text style={styles.planStatVal}>{plan?.days.reduce((a, d) => a + d.exercises.length, 0) ?? 0}</Text>
              <Text style={styles.planStatLbl}>Total Exercises</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.planStat}>
              <Text style={styles.planStatVal}>{profile?.fitnessLevel?.charAt(0).toUpperCase() ?? 'B'}</Text>
              <Text style={styles.planStatLbl}>Level</Text>
            </View>
          </View>
          {plan?.days.map((d, i) => (
            <View key={i} style={styles.dayRow}>
              <View style={styles.dayDot} />
              <Text style={styles.dayName} numberOfLines={1}>{d.dayOfWeek.charAt(0).toUpperCase() + d.dayOfWeek.slice(1)}</Text>
              <Text style={styles.dayLabel}>{d.name}</Text>
              <Text style={styles.dayCount}>{d.exercises.length} ex</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View style={{ opacity: textFade, width: '100%', gap: 12 }}>
          <NeonButton
            title="Enter Dashboard"
            size="lg"
            onPress={() => router.replace('/(tabs)')}
            style={{ width: '100%' }}
          />
          <Text style={styles.note}>Your plan is saved. You can adjust it anytime in Settings.</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', gap: 20 },
  badge: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: c.success + '15', borderColor: c.success + '40', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: c.success, letterSpacing: 1.5 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 36, color: c.foreground, textAlign: 'center', lineHeight: 42, letterSpacing: -1 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 15, color: c.mutedForeground, textAlign: 'center' },
  planCard: { width: '100%', backgroundColor: c.card, borderWidth: 1.5, borderColor: c.neonCyan + '60', borderRadius: 20, padding: 20, gap: 14 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planName: { fontFamily: 'Inter_700Bold', fontSize: 18, color: c.foreground },
  divider: { height: 1, backgroundColor: c.border },
  planStats: { flexDirection: 'row', justifyContent: 'space-around' },
  planStat: { alignItems: 'center', gap: 4 },
  planStatVal: { fontFamily: 'Inter_700Bold', fontSize: 24, color: c.neonCyan },
  planStatLbl: { fontFamily: 'Inter_400Regular', fontSize: 12, color: c.mutedForeground },
  statDivider: { width: 1, backgroundColor: c.border },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.neonCyan },
  dayName: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: c.foreground, width: 80 },
  dayLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: c.mutedForeground, flex: 1 },
  dayCount: { fontFamily: 'Inter_500Medium', fontSize: 12, color: c.neonCyan },
  note: { fontFamily: 'Inter_400Regular', fontSize: 12, color: c.mutedForeground, textAlign: 'center' },
});
