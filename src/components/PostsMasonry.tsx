import React from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '../theme';

export type MasonryPost = { id: string; media_url: string; media_type: string };

const GAP = spacing.sm;
const COL_W = (Dimensions.get('window').width - spacing.lg * 2 - GAP) / 2;

/** Deterministic pseudo-random height so the grid feels varied but stable. */
function tileHeight(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 150 + (h % 130); // 150–280px
}

/**
 * Pinterest-style masonry of a user's posts with varied tile sizes.
 * Tapping a tile opens the full post.
 */
export function PostsMasonry({ posts }: { posts: MasonryPost[] }) {
  const router = useRouter();

  // Distribute into two columns, always filling the shorter one next.
  const columns: { post: MasonryPost; h: number }[][] = [[], []];
  const colHeights = [0, 0];
  for (const post of posts) {
    const h = tileHeight(post.id);
    const c = colHeights[0] <= colHeights[1] ? 0 : 1;
    columns[c].push({ post, h });
    colHeights[c] += h + GAP;
  }

  return (
    <View style={styles.row}>
      {columns.map((col, ci) => (
        <View key={ci} style={styles.col}>
          {col.map(({ post, h }) => (
            <Pressable
              key={post.id}
              style={[styles.tile, { height: h }]}
              onPress={() => router.push(`/(app)/post/${post.id}`)}
            >
              {post.media_type === 'video' ? (
                <View style={[styles.media, styles.videoTile]}>
                  <Ionicons name="play-circle" size={34} color={colors.white} />
                </View>
              ) : (
                <Image source={{ uri: post.media_url }} style={styles.media} contentFit="cover" transition={150} />
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: GAP, paddingHorizontal: spacing.lg },
  col: { width: COL_W, gap: GAP },
  tile: { width: '100%', borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  media: { width: '100%', height: '100%' },
  videoTile: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.borderStrong },
});
