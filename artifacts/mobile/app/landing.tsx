import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import NeonButton from '@/components/NeonButton';

const { width } = Dimensions.get('window');
const c = colors.dark;

const FEATURES = [
  { icon: 'zap', title: 'Daily Quests', desc: 'Scheduled training objectives assigned to your profile', color: '#00e5ff' },
  { icon: 'book-open', title: 'Exercise Guide', desc: '50+ exercises with form cues and safety notes', color: '#00ff7f' },
  { icon: 'pie-chart', title: 'Nutrition Plan', desc: 'Personalized macros and meal suggestions', color: '#ffb800' },
  { icon: 'cpu', title: 'Workout Generator', desc: 'Adaptive plans based on your profile and rank', color: '#e040fb' },
  { icon: 'activity', title: 'Smart Tracking', desc: 'Sets, reps, weight, and body progress', color: '#ff6b35' },
  { icon: 'award', title: 'System Records', desc: 'Earn XP, unlock records, and advance your rank', color: '#ffd700' },
  { icon: 'clock', title: 'History', desc: 'Every workout logged and visualized', color: '#00e5ff' },
  { icon: 'bar-chart-2', title: 'Charts', desc: 'Progress graphs that motivate you to push', color: '#00ff7f' },
];

function FeatureCard({ icon, title, desc, color, delay }: typeof FEATURES[0] & { delay: number }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, delay, useNativeDriver: false }),
      Animated.timing(slide, { toValue: 0, duration: 400, delay, useNativeDriver: false }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.featureCard, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <View style={[styles.featureIcon, { backgroundColor: color + '18', borderColor: color + '30' }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
      <Feather name="chevron-right" size={16} color={c.border} />
    </Animated.View>
  );
}

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, { toValue: 1, duration: 600, useNativeDriver: false }),
      Animated.timing(heroSlide, { toValue: 0, duration: 600, useNativeDriver: false }),
    ]).start();
  }, []);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 100 }]} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Animated.View style={[styles.hero, { opacity: heroFade, transform: [{ translateY: heroSlide }] }]}>
          <View style={styles.badge}>
            <Feather name="zap" size={12} color={c.neonCyan} />
            <Text style={styles.badgeText}>PLAYER REGISTRATION AVAILABLE</Text>
          </View>
          <Text style={styles.heroTitle}>
            <Text style={{ color: c.neonCyan }}>ARISE</Text>
            {'\n'}REFORGED
          </Text>
          <Text style={styles.heroSub}>
            Enter a progression-driven training protocol built around quests, ranks, and measurable growth.
          </Text>
          <View style={styles.statsRow}>
            {[['3', 'Splits'], ['50+', 'Exercises'], ['MAX', 'Progress']].map(([val, lbl]) => (
              <View key={lbl} style={styles.statItem}>
                <Text style={styles.statVal}>{val}</Text>
                <Text style={styles.statLbl}>{lbl}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Feature Cards */}
        <Text style={styles.sectionTitle}>WHAT YOU GET</Text>
        <View style={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={100 + i * 60} />
          ))}
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.cta, { paddingBottom: bottomPad + 16 }]}>
        <NeonButton
          title="BEGIN REGISTRATION"
          size="lg"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/onboarding');
          }}
          style={styles.ctaBtn}
        />
        <Text style={styles.ctaNote}>Takes about 3 minutes to set up</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  hero: { alignItems: 'center', paddingVertical: 32, gap: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.neonGlow, borderColor: c.neonCyan + '40', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { color: c.neonCyan, fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1.5 },
  heroTitle: { fontSize: 56, fontFamily: 'Inter_700Bold', color: c.foreground, textAlign: 'center', lineHeight: 60, letterSpacing: -2 },
  heroSub: { fontSize: 16, color: c.mutedForeground, textAlign: 'center', lineHeight: 24, maxWidth: 280 },
  statsRow: { flexDirection: 'row', gap: 32, marginTop: 8 },
  statItem: { alignItems: 'center', gap: 4 },
  statVal: { fontSize: 28, fontFamily: 'Inter_700Bold', color: c.neonCyan },
  statLbl: { fontSize: 12, fontFamily: 'Inter_400Regular', color: c.mutedForeground },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 12, color: c.mutedForeground, letterSpacing: 2, marginBottom: 12, marginTop: 8 },
  featuresGrid: { gap: 10 },
  featureCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.cardBorder, borderRadius: 3, padding: 16 },
  featureIcon: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1, gap: 3 },
  featureTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: c.foreground },
  featureDesc: { fontFamily: 'Inter_400Regular', fontSize: 13, color: c.mutedForeground, lineHeight: 18 },
  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, backgroundColor: c.background + 'ee', borderTopWidth: 1, borderTopColor: c.border, gap: 8, alignItems: 'center' },
  ctaBtn: { width: '100%' },
  ctaNote: { fontFamily: 'Inter_400Regular', fontSize: 12, color: c.mutedForeground },
});
