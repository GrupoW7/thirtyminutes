import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTimer } from '../../src/context/TimerContext';
import { fetchFeed, toggleLike, type FeedPost } from '../../src/lib/social';
import { PostCard } from '../../src/components/PostCard';
import { TimerBadge } from '../../src/components/TimerBadge';
import { LockedSocial } from '../../src/components/LockedSocial';
import { EmptyState } from '../../src/components/ui';
import { colors, font, spacing } from '../../src/theme';

export default function Feed() {
  const { session } = useAuth();
  const { isLocked, setSocialActive } = useTimer();
  const meId = session?.user?.id ?? '';

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!meId) return;
    try {
      setError(null);
      const data = await fetchFeed(meId);
      setPosts(data);
    } catch (e) {
      setError('Não foi possível carregar o feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [meId]);

  // Count social time only while this screen is focused AND not locked.
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
              ? {
                  ...p,
                  likedByMe: !p.likedByMe,
                  likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
                }
              : p,
          ),
        );
      } catch {
        /* optimistic UI already updated in the card; ignore transient errors */
      }
    },
    [meId],
  );

  if (isLocked) return <LockedSocial />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.brand}>
          30<Text style={{ color: colors.primary }}>minutes</Text>
        </Text>
        <TimerBadge />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <PostCard post={item} onToggleLike={onToggleLike} />}
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
          ListEmptyComponent={
            <EmptyState
              icon={error ? 'cloud-offline-outline' : 'images-outline'}
              title={error ?? 'Nada por aqui ainda'}
              subtitle={
                error
                  ? 'Verifique sua conexão e o backend Supabase.'
                  : 'Seja o primeiro a publicar um momento no seu feed.'
              }
            />
          }
        />
      )}
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
  brand: { color: colors.text, fontSize: font.size.xl, fontWeight: font.weight.black },
  list: { padding: spacing.lg, paddingTop: spacing.sm, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
