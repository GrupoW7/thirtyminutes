import React, { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, font, radius, spacing } from '../theme';
import type { FeedPost } from '../lib/social';

const GAP = spacing.sm;
const COL_W = (Dimensions.get('window').width - spacing.lg * 2 - GAP) / 2;

/** Deterministic varied height so the discovery feed feels dynamic but stable. */
function tileHeight(post: FeedPost): number {
  let h = 0;
  for (let i = 0; i < post.id.length; i++) h = (h * 31 + post.id.charCodeAt(i)) >>> 0;
  const base = 190 + (h % 110); // 190–300
  return post.caption && post.caption.length > 60 ? base + 24 : base;
}

/**
 * Discovery-style masonry feed (inspired by the "hello davi" home): each post is
 * an image card with a gradient scrim, author + caption overlaid, and a like heart.
 */
export function FeedMasonry({
  posts,
  onToggleLike,
}: {
  posts: FeedPost[];
  onToggleLike: (post: FeedPost) => void;
}) {
  const columns: { post: FeedPost; h: number }[][] = [[], []];
  const colHeights = [0, 0];
  for (const post of posts) {
    const h = tileHeight(post);
    const c = colHeights[0] <= colHeights[1] ? 0 : 1;
    columns[c].push({ post, h });
    colHeights[c] += h + GAP;
  }

  return (
    <View style={styles.row}>
      {columns.map((col, ci) => (
        <View key={ci} style={styles.col}>
          {col.map(({ post, h }) => (
            <FeedTile key={post.id} post={post} h={h} onToggleLike={onToggleLike} />
          ))}
        </View>
      ))}
    </View>
  );
}

/** Full-width hero card highlighting a single post at the top of the feed. */
export function FeaturedCard({
  post,
  onToggleLike,
}: {
  post: FeedPost;
  onToggleLike: (post: FeedPost) => void;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.likedByMe);
  const [count, setCount] = useState(post.likeCount);
  const like = () => {
    setLiked((v) => !v);
    setCount((c) => (liked ? c - 1 : c + 1));
    onToggleLike(post);
  };
  const name = post.author.fullName ?? post.author.username;

  return (
    <Pressable style={styles.featured} onPress={() => router.push(`/(app)/post/${post.id}`)}>
      {post.mediaType === 'video' ? (
        <View style={[styles.media, styles.videoTile]}>
          <Ionicons name="play-circle" size={48} color={colors.white} />
        </View>
      ) : (
        <Image source={{ uri: post.mediaUrl }} style={styles.media} contentFit="cover" transition={150} />
      )}
      <LinearGradient colors={['transparent', 'rgba(10,20,35,0.85)']} style={styles.scrim} />
      <View style={styles.tag}>
        <Ionicons name="sparkles" size={12} color={colors.white} />
        <Text style={styles.tagText}>Destaque</Text>
      </View>
      <Pressable style={styles.heart} onPress={like} hitSlop={10}>
        <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? colors.danger : colors.white} />
        {count > 0 ? <Text style={styles.heartCount}>{count}</Text> : null}
      </Pressable>
      <View style={styles.featuredBottom}>
        <Text style={styles.featuredAuthor} numberOfLines={1}>{name}</Text>
        {post.caption ? <Text style={styles.featuredCaption} numberOfLines={2}>{post.caption}</Text> : null}
      </View>
    </Pressable>
  );
}

function FeedTile({
  post,
  h,
  onToggleLike,
}: {
  post: FeedPost;
  h: number;
  onToggleLike: (post: FeedPost) => void;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.likedByMe);
  const [count, setCount] = useState(post.likeCount);

  const like = () => {
    setLiked((v) => !v);
    setCount((c) => (liked ? c - 1 : c + 1));
    onToggleLike(post);
  };

  const name = post.author.fullName ?? post.author.username;

  return (
    <Pressable style={[styles.tile, { height: h }]} onPress={() => router.push(`/(app)/post/${post.id}`)}>
      {post.mediaType === 'video' ? (
        <View style={[styles.media, styles.videoTile]}>
          <Ionicons name="play-circle" size={40} color={colors.white} />
        </View>
      ) : (
        <Image source={{ uri: post.mediaUrl }} style={styles.media} contentFit="cover" transition={150} />
      )}

      <LinearGradient colors={['transparent', 'rgba(10,20,35,0.82)']} style={styles.scrim} />

      <Pressable style={styles.heart} onPress={like} hitSlop={10}>
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={20}
          color={liked ? colors.danger : colors.white}
        />
        {count > 0 ? <Text style={styles.heartCount}>{count}</Text> : null}
      </Pressable>

      <View style={styles.bottom}>
        <Text style={styles.author} numberOfLines={1}>{name}</Text>
        {post.caption ? (
          <Text style={styles.caption} numberOfLines={2}>{post.caption}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: GAP, paddingHorizontal: spacing.lg },
  col: { width: COL_W, gap: GAP },
  tile: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'flex-end',
  },
  media: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  videoTile: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.borderStrong },
  scrim: { ...StyleSheet.absoluteFillObject, top: '45%' },
  heart: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 8,
    height: 30,
    borderRadius: radius.pill,
  },
  heartCount: { color: colors.white, fontSize: font.size.xs, fontWeight: font.weight.bold },
  featured: {
    height: 260,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'flex-end',
  },
  tag: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    height: 26,
    borderRadius: radius.pill,
  },
  tagText: { color: colors.white, fontSize: font.size.xs, fontWeight: font.weight.bold },
  featuredBottom: { padding: spacing.lg, gap: 3 },
  featuredAuthor: { color: colors.white, fontSize: font.size.lg, fontWeight: font.weight.black },
  featuredCaption: { color: 'rgba(255,255,255,0.92)', fontSize: font.size.sm, lineHeight: 19 },
  bottom: { padding: spacing.md, gap: 2 },
  author: { color: colors.white, fontSize: font.size.sm, fontWeight: font.weight.black },
  caption: { color: 'rgba(255,255,255,0.9)', fontSize: font.size.xs, lineHeight: 16 },
});
