import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import {
  addCatalogActivity,
  addCustomActivity,
  fetchActivityProfile,
  fetchCatalog,
  fetchStreak,
  fetchTodayActivities,
  fetchTotalPoints,
  removeActivity,
  toggleActivityDone,
} from '../../src/lib/activityService';
import { levelFromPoints, suggestActivities } from '../../src/lib/activities';
import type {
  ActivityCatalogItem,
  ActivityProfile,
  UserActivity,
} from '../../src/types/database';
import { colors, font, radius, spacing } from '../../src/theme';

export default function Activities() {
  const router = useRouter();
  const { session } = useAuth();
  const meId = session?.user?.id ?? '';

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ActivityProfile | null>(null);
  const [catalog, setCatalog] = useState<ActivityCatalogItem[]>([]);
  const [today, setToday] = useState<UserActivity[]>([]);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [customText, setCustomText] = useState('');

  const load = useCallback(async () => {
    if (!meId) return;
    try {
      const [prof, cat, list, pts, stk] = await Promise.all([
        fetchActivityProfile(meId),
        fetchCatalog(),
        fetchTodayActivities(meId),
        fetchTotalPoints(meId),
        fetchStreak(meId),
      ]);
      setProfile(prof);
      setCatalog(cat);
      setToday(list);
      setPoints(pts);
      setStreak(stk);
    } finally {
      setLoading(false);
    }
  }, [meId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const suggestions = useMemo(() => {
    const alreadyAdded = new Set(today.map((t) => t.catalog_id).filter(Boolean));
    return suggestActivities(catalog, profile, 8).filter((s) => !alreadyAdded.has(s.id));
  }, [catalog, profile, today]);

  const level = levelFromPoints(points);
  const doneToday = today.filter((t) => t.completed).length;

  const onToggle = async (activity: UserActivity) => {
    // Optimistic
    setToday((prev) =>
      prev.map((a) => (a.id === activity.id ? { ...a, completed: !a.completed } : a)),
    );
    setPoints((p) => (activity.completed ? p - activity.points : p + activity.points));
    try {
      await toggleActivityDone(activity);
      setStreak(await fetchStreak(meId));
    } catch {
      load();
    }
  };

  const onAddCatalog = async (item: ActivityCatalogItem) => {
    try {
      const created = await addCatalogActivity(meId, item);
      setToday((prev) => [...prev, created]);
    } catch {
      /* ignore */
    }
  };

  const onAddCustom = async () => {
    const text = customText.trim();
    if (!text) return;
    setCustomText('');
    try {
      const created = await addCustomActivity(meId, text);
      setToday((prev) => [...prev, created]);
    } catch {
      /* ignore */
    }
  };

  const onRemove = async (activity: UserActivity) => {
    setToday((prev) => prev.filter((a) => a.id !== activity.id));
    if (activity.completed) setPoints((p) => p - activity.points);
    try {
      await removeActivity(activity.id);
    } catch {
      load();
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Viver o dia 🌤️</Text>

        {/* Gamification header */}
        <LinearGradient
          colors={[colors.accent, colors.accentDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.levelCard}
        >
          <View style={styles.levelRow}>
            <View>
              <Text style={styles.levelLabel}>NÍVEL</Text>
              <Text style={styles.levelValue}>{level.level}</Text>
            </View>
            <View style={styles.statsRight}>
              <View style={styles.statItem}>
                <Ionicons name="flame" size={18} color={colors.bg} />
                <Text style={styles.statText}>{streak} dias</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="star" size={18} color={colors.bg} />
                <Text style={styles.statText}>{points} pts</Text>
              </View>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(level.progress * 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {level.current}/{level.needed} pts para o nível {level.level + 1}
          </Text>
        </LinearGradient>

        {/* Profile CTA */}
        {!profile ? (
          <Pressable style={styles.profileCta} onPress={() => router.push('/(app)/activity-profile')}>
            <Ionicons name="sparkles" size={22} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.ctaTitle}>Monte seu perfil</Text>
              <Text style={styles.ctaSub}>Responda 4 perguntas e receba sugestões sob medida.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ) : (
          <Pressable style={styles.editProfile} onPress={() => router.push('/(app)/activity-profile')}>
            <Ionicons name="options-outline" size={16} color={colors.textMuted} />
            <Text style={styles.editProfileText}>Ajustar meu perfil de interesses</Text>
          </Pressable>
        )}

        {/* Today's checklist */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hoje</Text>
          <Text style={styles.sectionCount}>{doneToday}/{today.length} feitas</Text>
        </View>

        {today.length === 0 ? (
          <Text style={styles.emptyHint}>
            Adicione atividades das sugestões abaixo ou crie a sua. Dê check no que realizar hoje 💪
          </Text>
        ) : (
          today.map((activity) => (
            <Pressable
              key={activity.id}
              style={styles.todoRow}
              onPress={() => onToggle(activity)}
              onLongPress={() => onRemove(activity)}
            >
              <Ionicons
                name={activity.completed ? 'checkmark-circle' : 'ellipse-outline'}
                size={26}
                color={activity.completed ? colors.success : colors.textFaint}
              />
              <Text style={[styles.todoText, activity.completed && styles.todoDone]}>
                {activity.custom_title}
              </Text>
              <Text style={styles.todoPoints}>+{activity.points}</Text>
            </Pressable>
          ))
        )}

        {/* Add custom */}
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            placeholder="Criar atividade personalizada..."
            placeholderTextColor={colors.textFaint}
            value={customText}
            onChangeText={setCustomText}
            onSubmitEditing={onAddCustom}
            returnKeyType="done"
          />
          <Pressable style={styles.addBtn} onPress={onAddCustom}>
            <Ionicons name="add" size={24} color={colors.bg} />
          </Pressable>
        </View>

        {/* Suggestions */}
        {suggestions.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
              {profile ? 'Sugeridas para você' : 'Ideias para começar'}
            </Text>
            {suggestions.map((item) => (
              <Pressable key={item.id} style={styles.suggestRow} onPress={() => onAddCatalog(item)}>
                <View style={styles.suggestIcon}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestTitle}>{item.title}</Text>
                  {item.description ? <Text style={styles.suggestDesc}>{item.description}</Text> : null}
                </View>
                <View style={styles.suggestAdd}>
                  <Ionicons name="add-circle" size={26} color={colors.accent} />
                </View>
              </Pressable>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  title: { color: colors.text, fontSize: font.size.xxl, fontWeight: font.weight.black },
  levelCard: { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  levelLabel: { color: colors.bg, fontSize: font.size.xs, fontWeight: font.weight.bold, opacity: 0.7, letterSpacing: 1 },
  levelValue: { color: colors.bg, fontSize: 44, fontWeight: font.weight.black, lineHeight: 48 },
  statsRight: { gap: spacing.sm, alignItems: 'flex-end' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: colors.bg, fontSize: font.size.md, fontWeight: font.weight.bold },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(15,27,45,0.25)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.bg, borderRadius: 4 },
  progressText: { color: colors.bg, fontSize: font.size.xs, fontWeight: font.weight.semibold, opacity: 0.85 },
  profileCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.lg,
  },
  ctaTitle: { color: colors.text, fontSize: font.size.md, fontWeight: font.weight.bold },
  ctaSub: { color: colors.textMuted, fontSize: font.size.sm },
  editProfile: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: spacing.xs },
  editProfileText: { color: colors.textMuted, fontSize: font.size.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  sectionTitle: { color: colors.text, fontSize: font.size.lg, fontWeight: font.weight.bold },
  sectionCount: { color: colors.textMuted, fontSize: font.size.sm },
  emptyHint: { color: colors.textMuted, fontSize: font.size.sm, lineHeight: 20 },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  todoText: { flex: 1, color: colors.text, fontSize: font.size.md },
  todoDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  todoPoints: { color: colors.accent, fontSize: font.size.sm, fontWeight: font.weight.bold },
  customRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  customInput: {
    flex: 1,
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: font.size.md,
  },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  suggestIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestTitle: { color: colors.text, fontSize: font.size.md, fontWeight: font.weight.semibold },
  suggestDesc: { color: colors.textMuted, fontSize: font.size.xs, marginTop: 2 },
  suggestAdd: { paddingLeft: spacing.sm },
});
