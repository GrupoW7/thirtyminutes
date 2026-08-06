import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '../theme';
import { useTimer } from '../context/TimerContext';
import { formatCountdown } from '../lib/time';

/** Compact live countdown shown in the social header. Turns amber < 5 min. */
export function TimerBadge() {
  const { secondsRemaining } = useTimer();
  const low = secondsRemaining <= 5 * 60;
  const tint = low ? colors.accent : colors.primary;

  return (
    <View style={[styles.wrap, { borderColor: tint }]}>
      <Ionicons name="hourglass-outline" size={14} color={tint} />
      <Text style={[styles.text, { color: tint }]}>
        {formatCountdown(secondsRemaining)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  text: {
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
    fontVariant: ['tabular-nums'],
  },
});
