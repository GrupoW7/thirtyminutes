import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import {
  fetchPeople,
  fetchPreviews,
  type ConversationPreview,
  type Person,
} from '../../src/lib/messages';
import { loadFollowing } from '../../src/lib/follows';
import { Avatar, EmptyState } from '../../src/components/ui';
import { FollowButton } from '../../src/components/FollowButton';
import { LogoMark } from '../../src/components/Logo';
import { timeAgo } from '../../src/lib/time';
import { colors, font, radius, shadow, spacing } from '../../src/theme';

type Row = Person & { preview?: ConversationPreview };

export default function Messages() {
  const { session } = useAuth();
  const meId = session?.user?.id ?? '';
  const router = useRouter();

  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!meId) return;
    try {
      setError(null);
      const [people, previews] = await Promise.all([
        fetchPeople(meId),
        fetchPreviews(meId),
        loadFollowing(meId, true),
      ]);
      const merged: Row[] = people.map((p) => ({ ...p, preview: previews[p.id] }));
      merged.sort((a, b) => {
        if (a.preview && b.preview) return a.preview.at < b.preview.at ? 1 : -1;
        if (a.preview) return -1;
        if (b.preview) return 1;
        return a.username.localeCompare(b.username);
      });
      setRows(merged);
    } catch {
      setError('Não foi possível carregar as conversas.');
    } finally {
      setLoading(false);
    }
  }, [meId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.fullName ?? '').toLowerCase().includes(q) || r.username.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const renderRow = ({ item }: { item: Row }) => {
    const name = item.fullName ?? item.username;
    const unread = item.preview?.unread ?? 0;
    const subtitle = item.preview
      ? `${item.preview.fromMe ? 'Você: ' : ''}${item.preview.body}`
      : `@${item.username}`;
    return (
      <Pressable style={styles.row} onPress={() => router.push(`/(app)/messages/${item.id}`)}>
        <Avatar uri={item.avatarUrl} name={name} size={52} />
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            {item.preview ? (
              <Text style={[styles.time, unread > 0 && styles.timeUnread]}>
                {timeAgo(item.preview.at)}
              </Text>
            ) : null}
          </View>
          <View style={styles.rowBottom}>
            <Text
              style={[styles.subtitle, unread > 0 && styles.subtitleUnread]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
            {unread > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread}</Text>
              </View>
            ) : (
              <FollowButton targetId={item.id} />
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <LogoMark size={30} showNumber={false} />
          <Text style={styles.brand}>
            30<Text style={{ color: colors.primary }}>minutes</Text>
          </Text>
        </View>
        <Pressable onPress={() => router.push('/(app)/profile')} hitSlop={8}>
          <Ionicons name="person-circle-outline" size={30} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textFaint} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar conversas"
          placeholderTextColor={colors.textFaint}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          renderItem={renderRow}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              icon={error ? 'cloud-offline-outline' : 'people-outline'}
              title={error ?? (query ? 'Nada encontrado' : 'Ninguém por aqui ainda')}
              subtitle={error ? undefined : 'Convide amigos para viver o dia junto com você.'}
            />
          }
        />
      )}

      <Pressable style={styles.fab} onPress={() => router.push('/(app)/messages')} hitSlop={8}>
        <Ionicons name="create-outline" size={24} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brand: { color: colors.text, fontSize: font.size.xl, fontWeight: font.weight.black },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    height: 46,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: font.size.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 96, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowBody: { flex: 1, gap: 4 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  name: { color: colors.text, fontSize: font.size.md, fontWeight: font.weight.bold, flexShrink: 1 },
  time: { color: colors.textFaint, fontSize: font.size.xs },
  timeUnread: { color: colors.primary, fontWeight: font.weight.bold },
  subtitle: { color: colors.textMuted, fontSize: font.size.sm, flex: 1 },
  subtitleUnread: { color: colors.text, fontWeight: font.weight.semibold },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: colors.white, fontSize: font.size.xs, fontWeight: font.weight.bold },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
});
