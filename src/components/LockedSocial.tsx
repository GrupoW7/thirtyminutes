import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, font, radius, spacing } from '../theme';
import { Button } from './ui';
import { formatUnlockIn, secondsUntilMidnight } from '../lib/time';

/**
 * Shown in place of the feed once the daily 30 minutes are spent.
 * Nudges the user toward the gamified activities world instead.
 */
export function LockedSocial() {
  const router = useRouter();
  const [untilMidnight, setUntilMidnight] = useState(secondsUntilMidnight());

  useEffect(() => {
    const id = setInterval(() => setUntilMidnight(secondsUntilMidnight()), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <LinearGradient colors={[colors.bg, colors.bgElevated]} style={styles.wrap}>
      <Image
        source={require('../../assets/illustrations/timesup.png')}
        style={styles.illustration}
        contentFit="contain"
        transition={250}
      />

      <Text style={styles.title}>Seus 30 minutos acabaram por hoje 🌙</Text>
      <Text style={styles.body}>
        A área social volta em{' '}
        <Text style={styles.highlight}>{formatUnlockIn(untilMidnight)}</Text>.
        {'\n'}Que tal aproveitar o resto do dia vivendo?
      </Text>

      <View style={styles.card}>
        <Ionicons name="sparkles" size={22} color={colors.accent} />
        <Text style={styles.cardText}>
          Você tem atividades esperando por você. Ganhe pontos vivendo momentos
          reais — longe da tela.
        </Text>
      </View>

      <Button
        label="Ir para minhas atividades"
        icon="rocket-outline"
        variant="accent"
        onPress={() => router.replace('/(app)/activities')}
        style={{ alignSelf: 'stretch' }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  illustration: {
    width: 200,
    height: 200,
  },
  title: {
    color: colors.text,
    fontSize: font.size.xl,
    fontWeight: font.weight.black,
    textAlign: 'center',
  },
  body: {
    color: colors.textMuted,
    fontSize: font.size.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  highlight: { color: colors.primary, fontWeight: font.weight.bold },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardText: { flex: 1, color: colors.text, fontSize: font.size.sm, lineHeight: 20 },
});
