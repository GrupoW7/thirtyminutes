import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { fetchNotifications, type AppNotification } from '../../src/lib/notifications';
import { Avatar, EmptyState, Pill } from '../../src/components/ui';
import { FollowButton } from '../../src/components/FollowButton';
import { timeAgo, localDateKey } from '../../src/lib/time';
import { colors, font, radius, spacing } from '../../src/theme';

type Filter = 'all' | 'follow' | 'comment';

export default function Notifications() {
  const { session } = useAuth();
  const meId = session?.user?.id ?? '';
  const router = useRouter();

  const [items, setItems] = useState<AppNotification[]>([]);
  const [cleared, setCleared] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!meId) return;
    try {
      setItems(await fetchNotifications(meId));
    } finally {
      setLoading(false);
    }
  }, [meId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((n) => n.type === filter)),
    [items, filter],
  );

  const today = localDateKey();
  const groups = useMemo(() => {
    const hoje: AppNotification[] = [];
    const antes: AppNotification[] = [];
    for (const n of filtered) {
      (localDateKey(new Date(n.at)) === today ? hoje : antes).push(n);
    }
    return { hoje, antes };
  }, [filtered, today]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Notificações</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.subRow}>
        <Text style={styles.subText}>
          {cleared || items.length === 0
            ? 'Tudo em dia por aqui'
            : `Você tem ${items.length} notificaç${items.length === 1 ? 'ão' : 'ões'}`}
        </Text>
        {items.length > 0 && !cleared ? (
          <Pressable onPress={() => setCleared(true)} hitSlop={8} style={styles.clearBtn}>
            <Ionicons name="checkmark-done" size={16} color={colors.primary} />
            <Text style={styles.clearText}>Limpar tudo</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.chips}>
        <Pill label="Todas" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Pill label="Conexões" active={filter === 'follow'} onPress={() => setFilter('follow')} />
        <Pill label="Menções" active={filter === 'comment'} onPress={() => setFilter('comment')} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {groups.hoje.length > 0 ? (
            <>
              <Text style={styles.groupLabel}>HOJE</Text>
              {groups.hoje.map((n) => (
                <NotifCard key={n.id} n={n} unread={!cleared} onView={(pid) => router.push(`/(app)/post/${pid}`)} />
              ))}
            </>
          ) : null}
          {groups.antes.length > 0 ? (
            <>
              <Text style={styles.groupLabel}>ANTERIORES</Text>
              {groups.antes.map((n) => (
                <NotifCard key={n.id} n={n} unread={false} onView={(pid) => router.push(`/(app)/post/${pid}`)} />
              ))}
            </>
          ) : null}
          {filtered.length === 0 ? (
            <EmptyState icon="notifications-outline" title="Nenhuma notificação" subtitle="Interações com você aparecem aqui." />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function NotifCard({
  n,
  unread,
  onView,
}: {
  n: AppNotification;
  unread: boolean;
  onView: (postId: string) => void;
}) {
  const name = n.actor.fullName ?? n.actor.username;
  const badge = n.type === 'follow' ? 'person-add' : 'chatbubble-ellipses';
  return (
    <View style={[styles.card, unread && styles.cardUnread]}>
      <View style={styles.avatarWrap}>
        <Avatar uri={n.actor.avatarUrl} name={name} size={48} />
        <View style={styles.badge}>
          <Ionicons name={badge as keyof typeof Ionicons.glyphMap} size={11} color={colors.white} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.text}>
          <Text style={styles.actorName}>{name}</Text>{' '}
          {n.type === 'follow' ? 'começou a te seguir.' : 'comentou no seu post:'}
        </Text>
        {n.type === 'comment' && n.text ? (
          <Text style={styles.comment} numberOfLines={2}>“{n.text}”</Text>
        ) : null}
        <View style={styles.actionRow}>
          {n.type === 'follow' ? (
            <FollowButton targetId={n.actor.id} />
          ) : n.postId ? (
            <Pressable style={styles.viewBtn} onPress={() => onView(n.postId!)}>
              <Text style={styles.viewText}>Ver comentário</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={styles.timeCol}>
        <Text style={styles.time}>{timeAgo(n.at)}</Text>
        {unread ? <View style={styles.dot} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  topTitle: { color: colors.text, fontSize: font.size.lg, fontWeight: font.weight.black, flex: 1, textAlign: 'center' },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  subText: { color: colors.textMuted, fontSize: font.size.sm },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clearText: { color: colors.primary, fontSize: font.size.sm, fontWeight: font.weight.bold },
  chips: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  groupLabel: {
    color: colors.textFaint,
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: colors.primary, backgroundColor: colors.bgElevated },
  avatarWrap: { width: 48, height: 48 },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  text: { color: colors.text, fontSize: font.size.sm, lineHeight: 20 },
  actorName: { fontWeight: font.weight.bold },
  comment: { color: colors.textMuted, fontSize: font.size.sm, marginTop: 2, fontStyle: 'italic' },
  actionRow: { marginTop: spacing.sm, flexDirection: 'row' },
  viewBtn: {
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewText: { color: colors.text, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  timeCol: { alignItems: 'flex-end', gap: 6 },
  time: { color: colors.textFaint, fontSize: font.size.xs },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
