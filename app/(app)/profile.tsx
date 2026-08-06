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
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { fetchTotalPoints, fetchStreak } from '../../src/lib/activityService';
import { fetchFollowStats } from '../../src/lib/follows';
import { levelFromPoints } from '../../src/lib/activities';
import { Avatar } from '../../src/components/ui';
import { PostsMasonry } from '../../src/components/PostsMasonry';
import { LogoMark } from '../../src/components/Logo';
import { colors, font, radius, spacing } from '../../src/theme';

const GAP = 3;
const size = (Dimensions.get('window').width - spacing.lg * 2 - GAP * 2) / 3;

type MiniPost = { id: string; media_url: string; media_type: string };

export default function Profile() {
  const { profile, session, signOut } = useAuth();
  const meId = session?.user?.id ?? '';

  const [posts, setPosts] = useState<MiniPost[]>([]);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [activities, setActivities] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!meId) return;
    const [{ data }, pts, stk, stats, act] = await Promise.all([
      supabase
        .from('posts')
        .select('id, media_url, media_type')
        .eq('user_id', meId)
        .order('created_at', { ascending: false }),
      fetchTotalPoints(meId),
      fetchStreak(meId),
      fetchFollowStats(meId),
      supabase
        .from('user_activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', meId)
        .eq('completed', true),
    ]);
    setPosts((data as MiniPost[]) ?? []);
    setPoints(pts);
    setStreak(stk);
    setFollowers(stats.followers);
    setFollowing(stats.following);
    setActivities(act.count ?? 0);
    setLoading(false);
  }, [meId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const level = levelFromPoints(points);
  const name = profile?.full_name ?? profile?.username ?? 'Você';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <LogoMark size={30} showNumber={false} />
          <Text style={styles.brand}>
            30<Text style={{ color: colors.primary }}>minutes</Text>
          </Text>
        </View>
        <Pressable style={styles.signOut} onPress={signOut} hitSlop={8}>
          <Ionicons name="log-out-outline" size={22} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.coverWrap}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cover}
          />
          <View style={styles.avatarRing}>
            <Avatar uri={profile?.avatar_url} name={name} size={88} />
          </View>
        </View>

        <Text style={styles.name}>{name}</Text>
        <Text style={styles.username}>@{profile?.username ?? 'usuario'}</Text>
        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        <View style={styles.statsRow}>
          <Stat value={followers} label="SEGUIDORES" />
          <View style={styles.statDivider} />
          <Stat value={following} label="SEGUINDO" />
          <View style={styles.statDivider} />
          <Stat value={activities} label="ATIVIDADES" />
        </View>

        <View style={styles.gameCard}>
          <GameStat icon="trophy-outline" value={`Nível ${level.level}`} />
          <GameStat icon="flame-outline" value={`${streak} dias`} />
          <GameStat icon="star-outline" value={`${points} pts`} />
        </View>

        <Text style={styles.gridTitle}>Postagens Recentes</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : posts.length === 0 ? (
          <Text style={styles.emptyGrid}>Você ainda não publicou nada.</Text>
        ) : (
          <PostsMasonry posts={posts} />
        )}
      </ScrollView>
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

function GameStat({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
  return (
    <View style={styles.gameStat}>
      <Ionicons name={icon} size={16} color={colors.accent} />
      <Text style={styles.gameStatText}>{value}</Text>
    </View>
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
  signOut: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingBottom: spacing.xxxl },
  coverWrap: { alignItems: 'center', marginBottom: 52 },
  cover: {
    width: '100%',
    height: 130,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  avatarRing: {
    position: 'absolute',
    bottom: -44,
    padding: 4,
    borderRadius: 999,
    backgroundColor: colors.bg,
  },
  name: {
    color: colors.text,
    fontSize: font.size.xl,
    fontWeight: font.weight.black,
    textAlign: 'center',
  },
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
  gameCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gameStatText: { color: colors.text, fontSize: font.size.sm, fontWeight: font.weight.semibold },
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
