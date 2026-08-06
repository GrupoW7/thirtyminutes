import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { fetchActivityProfile, saveActivityProfile } from '../../src/lib/activityService';
import { GOAL_OPTIONS, INTEREST_OPTIONS } from '../../src/lib/activities';
import { Button, Pill } from '../../src/components/ui';
import { colors, font, radius, spacing } from '../../src/theme';

const ENERGY: { value: 'low' | 'medium' | 'high'; label: string; icon: string }[] = [
  { value: 'low', label: 'Tranquila', icon: 'cafe-outline' },
  { value: 'medium', label: 'Equilibrada', icon: 'walk-outline' },
  { value: 'high', label: 'Cheia de energia', icon: 'flash-outline' },
];

export default function ActivityProfileScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const meId = session?.user?.id ?? '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>('medium');
  const [hasKids, setHasKids] = useState(false);

  useEffect(() => {
    (async () => {
      if (!meId) return;
      const p = await fetchActivityProfile(meId);
      if (p) {
        setInterests(p.interests ?? []);
        setGoals(p.goals ?? []);
        setEnergy(p.energy_level ?? 'medium');
        setHasKids(!!p.has_kids);
      }
      setLoading(false);
    })();
  }, [meId]);

  const toggle = (list: string[], set: (v: string[]) => void, value: string) => {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveActivityProfile(meId, {
        interests,
        goals,
        energy_level: energy,
        has_kids: hasKids,
        available_minutes: 60,
      });
      router.back();
    } catch {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Meu perfil</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.lead}>
          Personalize suas sugestões. Quanto mais você contar, melhores as ideias 🌱
        </Text>

        <Text style={styles.section}>O que você gosta de fazer?</Text>
        <View style={styles.pillWrap}>
          {INTEREST_OPTIONS.map((opt) => (
            <Pill
              key={opt.value}
              label={opt.label}
              icon={opt.icon as keyof typeof Ionicons.glyphMap}
              active={interests.includes(opt.value)}
              onPress={() => toggle(interests, setInterests, opt.value)}
            />
          ))}
        </View>

        <Text style={styles.section}>Quais são seus objetivos?</Text>
        <View style={styles.pillWrap}>
          {GOAL_OPTIONS.map((opt) => (
            <Pill
              key={opt.value}
              label={opt.label}
              active={goals.includes(opt.value)}
              onPress={() => toggle(goals, setGoals, opt.value)}
            />
          ))}
        </View>

        <Text style={styles.section}>Como costuma ser sua energia?</Text>
        <View style={styles.energyRow}>
          {ENERGY.map((e) => (
            <Pressable
              key={e.value}
              style={[styles.energyCard, energy === e.value && styles.energyActive]}
              onPress={() => setEnergy(e.value)}
            >
              <Ionicons
                name={e.icon as keyof typeof Ionicons.glyphMap}
                size={24}
                color={energy === e.value ? colors.bg : colors.textMuted}
              />
              <Text style={[styles.energyText, energy === e.value && styles.energyTextActive]}>
                {e.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.switchRow} onPress={() => setHasKids((v) => !v)}>
          <Ionicons name="happy-outline" size={22} color={colors.text} />
          <Text style={styles.switchText}>Tenho filhos / cuido de crianças</Text>
          <Ionicons
            name={hasKids ? 'checkbox' : 'square-outline'}
            size={24}
            color={hasKids ? colors.primary : colors.textFaint}
          />
        </Pressable>

        <Button label="Salvar perfil" onPress={save} loading={saving} variant="accent" style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  topTitle: { color: colors.text, fontSize: font.size.lg, fontWeight: font.weight.bold },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  lead: { color: colors.textMuted, fontSize: font.size.md, lineHeight: 22, marginBottom: spacing.lg },
  section: { color: colors.text, fontSize: font.size.md, fontWeight: font.weight.bold, marginTop: spacing.lg, marginBottom: spacing.md },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  energyRow: { flexDirection: 'row', gap: spacing.sm },
  energyCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  energyActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  energyText: { color: colors.textMuted, fontSize: font.size.xs, fontWeight: font.weight.semibold, textAlign: 'center' },
  energyTextActive: { color: colors.bg },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  switchText: { flex: 1, color: colors.text, fontSize: font.size.md },
});
