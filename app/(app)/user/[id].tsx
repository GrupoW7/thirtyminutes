import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { supabase } from '../../../src/lib/supabase';
import { fetchFollowStats } from '../../../src/lib/follows';
import { Avatar } from '../../../src/components/ui';
import { PostsMasonry } from '../../../src/components/PostsMasonry';
import { FollowButton } from '../../../src/components/FollowButton';
import { colors, font, radius, spacing } from '../../../src/theme';

const GAP = 3;
const size = (Dimensions.get('window').width - spacing.lg * 2 - GAP * 2) / 3;

type Prof = { id: string; username: string; full_name: string | null; avatar_url: string | null; bio: string | null };
type MiniPost = { id: string; media_url: string; media_type: string };

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const meId = session?.user?.id ?? '';
  const router = useRouter();
  const isSelf = id === meId;

  const [prof, setProf] = useState<Prof | null>(null);
  const [posts, setPosts] = useState<MiniPost[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [activities, setActivities] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    const [{ data: p }, { data: ps }, stats, act] = await Promise.all([
      supabase.from('profiles').select('id, username, full_name, avatar_url, bio').eq('id', id).maybeSingle(),
      supabase.from('posts').select('id, media_url, media_type').eq('user_id', id).order('created_at', { ascending: false }),
      fetchFollowStats(id),
      supabase.from('user_activities').select('*', { count: 'exact', head: true }).eq('user_id', id).eq('completed', true),
    ]);
    setProf((p as Prof) ?? null);
    setPosts((ps as MiniPost[]) ?? []);
    setFollowers(stats.followers);
    setFollowing(stats.following);
    setActivities(act.count ?? 0);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const name = prof?.full_name ?? prof?.username ?? 'Usuário';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>@{prof?.username ?? ''}</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : !prof ? (
        <View style={styles.center}>
          <Text style={styles.emptyGrid}>Usuário não encontrado.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.coverWrap}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cover}
            />
            <View style={styles.avatarRing}>
              <Avatar uri={prof.avatar_url} name={name} size={88} />
            </View>
          </View>

          <Text style={styles.name}>{name}</Text>
          <Text style={styles.username}>@{prof.username}</Text>
          {prof.bio ? <Text style={styles.bio}>{prof.bio}</Text> : null}

          <View style={styles.statsRow}>
            <Stat value={followers} label="SEGUIDORES" />
            <View style={styles.statDivider} />
            <Stat value={following} label="SEGUINDO" />
            <View style={styles.statDivider} />
            <Stat value={activities} label="ATIVIDADES" />
          </View>

          {!isSelf ? (
            <View style={styles.actions}>
              <FollowButton targetId={prof.id} block />
              <Pressable
                style={styles.msgBtn}
                onPress={() => router.push(`/(app)/messages/${prof.id}`)}
              >
                <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                <Text style={styles.msgText}>Mensagem</Text>
              </Pressable>
            </View>
          ) : null}

          <Text style={styles.gridTitle}>Postagens Recentes</Text>
          {posts.length === 0 ? (
            <Text style={styles.emptyGrid}>Nenhuma publicação ainda.</Text>
          ) : (
            <PostsMasonry posts={posts} />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value.toLocaleString('pt-BR')}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  topTitle: { color: colors.text, fontSize: font.size.md, fontWeight: font.weight.bold, flex: 1, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: spacing.xxxl },
  coverWrap: { alignItems: 'center', marginBottom: 52 },
  cover: { width: '100%', height: 130, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  avatarRing: { position: 'absolute', bottom: -44, padding: 4, borderRadius: 999, backgroundColor: colors.bg },
  name: { color: colors.text, fontSize: font.size.xl, fontWeight: font.weight.black, textAlign: 'center' },
  username: { color: colors.textMuted, fontSize: font.size.md, textAlign: 'center', marginTop: 2 },
  bio: {
    color: colors.text,
    fontSize: font.size.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  stat: { alignItems: 'center', gap: 2, flex: 1 },
  statValue: { color: colors.text, fontSize: font.size.xl, fontWeight: font.weight.black },
  statLabel: { color: colors.textFaint, fontSize: 11, fontWeight: font.weight.semibold, letterSpacing: 0.5 },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  msgBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  msgText: { color: colors.primary, fontSize: font.size.sm, fontWeight: font.weight.bold },
  gridTitle: {
    color: colors.text,
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
  },
  emptyGrid: { color: colors.textMuted, fontSize: font.size.sm, textAlign: 'center', marginTop: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: spacing.lg },
  gridItem: { width: size, height: size },
  gridImage: { width: '100%', height: '100%', borderRadius: 8, backgroundColor: colors.surfaceAlt },
  videoTile: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.borderStrong },
});
