import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTimer } from '../../src/context/TimerContext';
import { fetchFeed, toggleLike, type FeedPost } from '../../src/lib/social';
import { loadFollowing, followingIds } from '../../src/lib/follows';
import { FeedMasonry, FeaturedCard } from '../../src/components/FeedMasonry';
import { PostCard } from '../../src/components/PostCard';
import { LogoMark } from '../../src/components/Logo';
import { TimerBadge } from '../../src/components/TimerBadge';
import { LockedSocial } from '../../src/components/LockedSocial';
import { EmptyState, Pill } from '../../src/components/ui';
import { colors, font, radius, spacing } from '../../src/theme';

type FeedFilter = 'all' | 'following' | 'popular';
type FeedView = 'grid' | 'list';

const CATEGORIES: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; kw: string[] }[] = [
  { key: 'leitura', label: 'Leitura', icon: 'book-outline', kw: ['livro', 'ler', 'pagina', 'página', 'leitura'] },
  { key: 'natureza', label: 'Natureza', icon: 'leaf-outline', kw: ['parque', 'natureza', 'planta', 'ar livre', 'sol', 'jardin', 'trilha'] },
  { key: 'culinaria', label: 'Culinária', icon: 'restaurant-outline', kw: ['cozinh', 'almoço', 'almoco', 'refeição', 'comida', 'receita', 'pão', 'delivery'] },
  { key: 'esporte', label: 'Esporte', icon: 'walk-outline', kw: ['corrida', 'correr', 'km', 'treino', 'caminh', 'pedal'] },
  { key: 'cafe', label: 'Café', icon: 'cafe-outline', kw: ['café', 'cafe', 'coffee', 'tarde'] },
  { key: 'familia', label: 'Família', icon: 'people-outline', kw: ['família', 'familia', 'filho', 'criança', 'crianca', 'amigos'] },
];

function matchesCategory(caption: string | null, catKey: string): boolean {
  const cat = CATEGORIES.find((c) => c.key === catKey);
  if (!cat) return true;
  const text = (caption ?? '').toLowerCase();
  return cat.kw.some((k) => text.includes(k));
}

export default function Feed() {
  const router = useRouter();
  const { session } = useAuth();
  const { isLocked, setSocialActive } = useTimer();
  const meId = session?.user?.id ?? '';

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [category, setCategory] = useState<string | null>(null);
  const [view, setView] = useState<FeedView>('grid');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!meId) return;
    try {
      setError(null);
      const [data] = await Promise.all([fetchFeed(meId), loadFollowing(meId, true)]);
      setPosts(data);
      setFollowing(new Set(followingIds()));
    } catch (e) {
      setError('Não foi possível carregar o feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [meId]);

  useFocusEffect(
    useCallback(() => {
      if (!isLocked) {
        setSocialActive(true);
        load();
      }
      return () => setSocialActive(false);
    }, [isLocked, setSocialActive, load]),
  );

  const onToggleLike = useCallback(
    async (post: FeedPost) => {
      if (!meId) return;
      try {
        await toggleLike(post.id, meId, post.likedByMe);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1 }
              : p,
          ),
        );
      } catch {
        /* optimistic UI already updated in the card */
      }
    },
    [meId],
  );

  const filtered = useMemo(() => {
    let list = posts;
    if (filter === 'following') list = list.filter((p) => following.has(p.userId));
    else if (filter === 'popular') list = [...list].sort((a, b) => b.likeCount - a.likeCount);
    if (category) list = list.filter((p) => matchesCategory(p.caption, category));
    return list;
  }, [posts, filter, following, category]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  if (isLocked) return <LockedSocial />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <LogoMark size={30} showNumber={false} />
          <Text style={styles.brand}>
            30<Text style={{ color: colors.primary }}>minutes</Text>
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/(app)/search')} hitSlop={8}>
            <Ionicons name="search-outline" size={22} color={colors.textMuted} />
          </Pressable>
          <Pressable onPress={() => router.push('/(app)/notifications')} hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color={colors.textMuted} />
          </Pressable>
          <TimerBadge />
        </View>
      </View>

      {/* Filter chips + grid/list toggle */}
      <View style={styles.controls}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Pill label="Todos" active={filter === 'all'} onPress={() => setFilter('all')} />
          <Pill label="Seguindo" active={filter === 'following'} onPress={() => setFilter('following')} />
          <Pill label="Populares" active={filter === 'popular'} onPress={() => setFilter('popular')} />
        </ScrollView>
        <View style={styles.toggle}>
          <Pressable
            style={[styles.toggleBtn, view === 'grid' && styles.toggleOn]}
            onPress={() => setView('grid')}
          >
            <Ionicons name="grid-outline" size={18} color={view === 'grid' ? colors.white : colors.textMuted} />
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, view === 'list' && styles.toggleOn]}
            onPress={() => setView('list')}
          >
            <Ionicons name="list-outline" size={20} color={view === 'list' ? colors.white : colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Category carousel — quick topic filter */}
      <View style={styles.catWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          <CategoryCard label="Todas" icon="apps-outline" active={category === null} onPress={() => setCategory(null)} />
          {CATEGORIES.map((c) => (
            <CategoryCard
              key={c.key}
              label={c.label}
              icon={c.icon}
              active={category === c.key}
              onPress={() => setCategory(category === c.key ? null : c.key)}
            />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.primary}
            />
          }
        >
          {filtered.length === 0 ? (
            <EmptyState
              icon={error ? 'cloud-offline-outline' : filter === 'following' ? 'people-outline' : 'images-outline'}
              title={
                error ?? (filter === 'following' ? 'Siga alguém para ver por aqui' : 'Nada por aqui ainda')
              }
              subtitle={
                error
                  ? 'Verifique sua conexão e o backend Supabase.'
                  : filter === 'following'
                    ? 'Use a busca para encontrar e seguir pessoas.'
                    : 'Seja o primeiro a publicar um momento.'
              }
            />
          ) : (
            <>
              {featured ? <FeaturedCard post={featured} onToggleLike={onToggleLike} /> : null}
              {view === 'grid' ? (
                <FeedMasonry posts={rest} onToggleLike={onToggleLike} />
              ) : (
                <View style={styles.classicList}>
                  {rest.map((p) => (
                    <PostCard key={p.id} post={p} onToggleLike={onToggleLike} />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function CategoryCard({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.catCard} onPress={onPress}>
      <View style={[styles.catIcon, active && styles.catIconOn]}>
        <Ionicons name={icon} size={22} color={active ? colors.white : colors.primary} />
      </View>
      <Text style={[styles.catLabel, active && styles.catLabelOn]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  brand: { color: colors.text, fontSize: font.size.xl, fontWeight: font.weight.black },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  chips: { alignItems: 'center', paddingRight: spacing.sm },
  toggle: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, padding: 2 },
  toggleBtn: { width: 34, height: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.primary },
  catWrap: { paddingBottom: spacing.sm },
  catRow: { paddingHorizontal: spacing.lg, gap: spacing.md },
  catCard: { alignItems: 'center', gap: 4, width: 64 },
  catIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIconOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  catLabel: { color: colors.textMuted, fontSize: font.size.xs, fontWeight: font.weight.medium },
  catLabelOn: { color: colors.primary, fontWeight: font.weight.bold },
  list: { paddingTop: spacing.sm, paddingBottom: spacing.xl, flexGrow: 1 },
  classicList: { paddingHorizontal: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
