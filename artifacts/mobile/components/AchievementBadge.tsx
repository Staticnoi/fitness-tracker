import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '@/constants/colors';
import type { Achievement } from '@/types';

interface Props {
  achievement: Achievement;
  size?: 'sm' | 'md';
}

export default function AchievementBadge({ achievement, size = 'md' }: Props) {
  const c = colors.dark;
  const isLarge = size === 'md';
  const iconSize = isLarge ? 24 : 18;
  const containerSize = isLarge ? 56 : 40;

  return (
    <View style={[styles.wrapper, !isLarge && styles.wrapperSm]}>
      <View style={[
        styles.iconContainer,
        { width: containerSize, height: containerSize, borderRadius: containerSize / 2 },
        achievement.unlocked
          ? { backgroundColor: achievement.color + '20', borderColor: achievement.color }
          : { backgroundColor: c.secondary, borderColor: c.border },
      ]}>
        <Feather
          name={achievement.icon as any}
          size={iconSize}
          color={achievement.unlocked ? achievement.color : c.mutedForeground}
        />
      </View>
      {isLarge && (
        <>
          <Text style={[styles.name, { color: achievement.unlocked ? c.foreground : c.mutedForeground }]} numberOfLines={1}>
            {achievement.name}
          </Text>
          <Text style={[styles.desc, { color: c.mutedForeground }]} numberOfLines={2}>
            {achievement.description}
          </Text>
          {achievement.maxProgress && !achievement.unlocked && (
            <View style={[styles.progressBar, { backgroundColor: c.secondary }]}>
              <View style={[styles.progressFill, {
                width: `${((achievement.progress ?? 0) / achievement.maxProgress) * 100}%`,
                backgroundColor: achievement.color,
              }]} />
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 8, width: 100 },
  wrapperSm: { width: 60 },
  iconContainer: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: 12, textAlign: 'center' },
  desc: { fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'center', lineHeight: 15 },
  progressBar: { width: '100%', height: 3, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
});
