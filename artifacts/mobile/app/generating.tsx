import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';

const c = colors.dark;

const MESSAGES = [
  'Analyzing your profile…',
  'Balancing recovery and intensity…',
  'Generating your custom workout split…',
  'Calculating your nutrition plan…',
  'Preparing your fitness journey…',
  'Almost ready…',
];

export default function GeneratingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const msgFade = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spin animation
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: false })
    ).start();

    // Progress animation
    Animated.timing(progressAnim, { toValue: 1, duration: 3500, useNativeDriver: false }).start();
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 0.05, 1));
    }, 175);

    // Message cycling
    let i = 0;
    const msgInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(msgFade, { toValue: 0, duration: 200, useNativeDriver: false }),
        Animated.timing(msgFade, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]).start();
      i = (i + 1) % MESSAGES.length;
      setMsgIndex(i);
    }, 650);

    const timeout = setTimeout(() => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
      router.replace('/plan-ready');
    }, 4200);

    return () => { clearTimeout(timeout); clearInterval(msgInterval); clearInterval(progressInterval); };
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Animated background dots */}
      <View style={styles.bgDots}>
        {Array.from({ length: 12 }, (_, i) => (
          <View key={i} style={[styles.dot, { opacity: 0.04 + (i % 4) * 0.02 }]} />
        ))}
      </View>

      <View style={styles.content}>
        {/* Glow ring */}
        <View style={styles.ringContainer}>
          <View style={styles.ringOuter}>
            <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
              <View style={styles.spinnerDot} />
            </Animated.View>
            <View style={styles.ringInner}>
              <View style={styles.ringGlow} />
              <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
            </View>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          <View style={[styles.progressGlow, { width: `${progress * 100}%` }]} />
        </View>

        {/* Message */}
        <Animated.Text style={[styles.message, { opacity: msgFade }]}>
          {MESSAGES[msgIndex]}
        </Animated.Text>

        <Text style={styles.subtitle}>Building your personalized training system</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' },
  bgDots: { position: 'absolute', width: '100%', height: '100%', flexDirection: 'row', flexWrap: 'wrap', padding: 20, gap: 40 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: c.neonCyan },
  content: { alignItems: 'center', gap: 32, width: '80%' },
  ringContainer: { alignItems: 'center', justifyContent: 'center' },
  ringOuter: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  spinner: { position: 'absolute', width: 160, height: 160, alignItems: 'center', justifyContent: 'flex-start' },
  spinnerDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: c.neonCyan, marginTop: 4, shadowColor: c.neonCyan, shadowOpacity: 1, shadowRadius: 8 },
  ringInner: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: c.border, alignItems: 'center', justifyContent: 'center', backgroundColor: c.darkCard },
  ringGlow: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: c.neonCyan + '10' },
  percent: { fontFamily: 'Inter_700Bold', fontSize: 32, color: c.neonCyan },
  progressTrack: { width: '100%', height: 4, borderRadius: 2, backgroundColor: c.secondary, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: c.neonCyan, borderRadius: 2 },
  progressGlow: { position: 'absolute', top: -2, height: 8, backgroundColor: c.neonCyan + '40', borderRadius: 4 },
  message: { fontFamily: 'Inter_500Medium', fontSize: 16, color: c.foreground, textAlign: 'center' },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, color: c.mutedForeground, textAlign: 'center' },
});
