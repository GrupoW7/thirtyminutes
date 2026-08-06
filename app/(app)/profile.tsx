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
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { fetchTotalPoints, fetchStreak } from '../../src/lib/activityService';
import { levelFromPoints } from '../../src/lib/activities';
import { Avatar } from '../../src/components/ui';
import { colors, font, radius, spacing } from '../../src/theme';

const GAP = 2;
const size = (Dimensions.get('window').width - spacing.lg * 2 - GAP * 2) / 3;

type MiniPost = { id: string; media_url: string; media_type: string };

export default function Profile() {
  const { profile, session, signOut } = useAuth();
  const meId = session?.user?.id ?? '';

  const [posts, setPosts] = useState<MiniPost[]>([]);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!meId) return;
    const [{ data }, pts, stk] = await Promise.all([
      supabase
        .from('posts')
        .select('id, media_url, media_type')
        .eq('user_id', meId)
        .order('created_at', { ascending: false }),
      fetchTotalPoints(meId),
      fetchStreak(meId),
    ]);
    setPosts((data as MiniPost[]) ?? []);
    setPoints(pts);
    setStreak(stk);
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Avatar uri={profile?.avatar_url} name={name} size={80} />
          <Pressable style={styles.signOut} onPress={signOut} hitSlop={8}>
            <Ionicons name="log-out-outline" size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        <Text style={styles.name}>{name}</Text>
        <Text style={styles.username}>@{profile?.username ?? 'usuario'}</Text>
        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        <View style={styles.statsCard}>
          <Stat icon="images-outline" value={`${posts.length}`} label="Posts" />
          <View style={styles.divider} />
          <Stat icon="trophy-outline" value={`${level.level}`} label="Nível" />
          <View style={styles.divider} />
          <Stat icon="flame-outline" value={`${streak}`} label="Sequência" />
          <View style={styles.divider} />
          <Stat icon="star-outline" value={`${points}`} label="Pontos" />
        </View>

        <Text style={styles.gridTitle}>Meus momentos</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : posts.length === 0 ? (
          <Text style={styles.emptyGrid}>Você ainda não publicou nada.</Text>
        ) : (
          <View style={styles.grid}>
            {posts.map((p) => (
              <View key={p.id} style={styles.gridItem}>
                {p.media_type === 'video' ? (
                  <View style={[styles.gridImage, styles.videoTile]}>
                    <Ionicons name="videocam" size={24} color={colors.white} />
                  </View>
                ) : (
                  <Image source={{ uri: p.media_url }} style={styles.gridImage} contentFit="cover" />
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  signOut: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: colors.text, fontSize: font.size.xl, fontWeight: font.weight.black, marginTop: spacing.md },
  username: { color: colors.textMuted, fontSize: font.size.md },
  bio: { color: colors.text, fontSize: font.size.sm, marginTop: spacing.sm, lineHeight: 20 },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { color: colors.text, fontSize: font.size.lg, fontWeight: font.weight.black },
  statLabel: { color: colors.textMuted, fontSize: font.size.xs },
  divider: { width: 1, height: 36, backgroundColor: colors.border },
  gridTitle: { color: colors.text, fontSize: font.size.lg, fontWeight: font.weight.bold, marginTop: spacing.xl, marginBottom: spacing.md },
  emptyGrid: { color: colors.textMuted, fontSize: font.size.sm, textAlign: 'center', marginTop: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  gridItem: { width: size, height: size },
  gridImage: { width: '100%', height: '100%', borderRadius: 4, backgroundColor: colors.surface },
  videoTile: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
});
