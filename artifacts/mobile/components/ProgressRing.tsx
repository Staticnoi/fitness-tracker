import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '@/constants/colors';

interface Props {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string;
}

export default function ProgressRing({ progress, size = 80, strokeWidth = 6, label, sublabel, color }: Props) {
  const c = colors.dark;
  const fillColor = color ?? c.neonCyan;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const innerSize = size - strokeWidth * 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background ring */}
      <View style={[styles.ring, {
        width: size, height: size, borderRadius: size / 2,
        borderWidth: strokeWidth, borderColor: c.secondary,
      }]} />
      {/* Progress overlay using a rotation mask trick */}
      <View style={[styles.ring, styles.absolute, {
        width: size, height: size, borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: fillColor,
        borderTopColor: clampedProgress > 0.75 ? fillColor : 'transparent',
        borderRightColor: clampedProgress > 0.25 ? fillColor : 'transparent',
        borderBottomColor: clampedProgress > 0.5 ? fillColor : 'transparent',
        borderLeftColor: fillColor,
        transform: [{ rotate: `${-90 + clampedProgress * 360}deg` }],
        opacity: clampedProgress > 0 ? 1 : 0,
      }]} />
      {/* Center content */}
      <View style={[styles.absolute, styles.center]}>
        {label ? <Text style={[styles.label, { color: c.foreground }]}>{label}</Text> : null}
        {sublabel ? <Text style={[styles.sublabel, { color: c.mutedForeground }]}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  ring: {},
  absolute: { position: 'absolute' },
  center: { alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  sublabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});
