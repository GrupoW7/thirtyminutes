import React, { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, font, radius, spacing } from '../theme';
import { Avatar } from './ui';
import { timeAgo } from '../lib/time';
import type { FeedPost } from '../lib/social';

export function PostCard({
  post,
  onToggleLike,
}: {
  post: FeedPost;
  onToggleLike: (post: FeedPost) => void;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.likedByMe);
  const [count, setCount] = useState(post.likeCount);

  const handleLike = () => {
    // Optimistic update; parent persists to the backend.
    setLiked((prev) => !prev);
    setCount((c) => (liked ? c - 1 : c + 1));
    onToggleLike(post);
  };

  const handleShare = async () => {
    const who = post.author.fullName ?? `@${post.author.username}`;
    await Share.share({
      message: `${who} compartilhou um momento no 30minutes${
        post.caption ? `: "${post.caption}"` : ''
      } 🌿`,
    });
  };

  const openComments = () => router.push(`/(app)/post/${post.id}`);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar uri={post.author.avatarUrl} name={post.author.fullName ?? post.author.username} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{post.author.fullName ?? post.author.username}</Text>
          <Text style={styles.meta}>@{post.author.username} · {timeAgo(post.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.mediaWrap}>
        {post.mediaType === 'video' ? (
          <Video
            source={{ uri: post.mediaUrl }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            useNativeControls
            isLooping
          />
        ) : (
          <Image source={{ uri: post.mediaUrl }} style={styles.media} contentFit="cover" transition={200} />
        )}
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={handleLike} hitSlop={8}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={24}
            color={liked ? colors.danger : colors.text}
          />
          <Text style={styles.actionText}>{count}</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={openComments} hitSlop={8}>
          <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
          <Text style={styles.actionText}>{post.commentCount}</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={handleShare} hitSlop={8}>
          <Ionicons name="paper-plane-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      {post.caption ? (
        <Text style={styles.caption}>
          <Text style={styles.captionName}>{post.author.username} </Text>
          {post.caption}
        </Text>
      ) : null}

      {post.commentCount > 0 ? (
        <Pressable onPress={openComments}>
          <Text style={styles.viewComments}>Ver todos os {post.commentCount} comentários</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  name: { color: colors.text, fontSize: font.size.md, fontWeight: font.weight.bold },
  meta: { color: colors.textMuted, fontSize: font.size.xs },
  mediaWrap: { width: '100%', aspectRatio: 1, backgroundColor: colors.bg },
  media: { width: '100%', height: '100%' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, padding: spacing.md },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: colors.text, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  caption: { color: colors.text, fontSize: font.size.sm, paddingHorizontal: spacing.md, lineHeight: 20 },
  captionName: { fontWeight: font.weight.bold },
  viewComments: {
    color: colors.textMuted,
    fontSize: font.size.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
});
