import { supabase } from './supabase';
import type { MediaType } from '../types/database';

export type FeedPost = {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: MediaType;
  caption: string | null;
  createdAt: string;
  author: {
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

type RawPost = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: MediaType;
  caption: string | null;
  created_at: string;
  profiles: { username: string; full_name: string | null; avatar_url: string | null } | null;
  likes: { user_id: string }[];
  comments: { id: string }[];
};

const FEED_SELECT = `
  id, user_id, media_url, media_type, caption, created_at,
  profiles:profiles!posts_user_id_fkey ( username, full_name, avatar_url ),
  likes ( user_id ),
  comments ( id )
`;

function mapPost(row: RawPost, meId: string): FeedPost {
  return {
    id: row.id,
    userId: row.user_id,
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    caption: row.caption,
    createdAt: row.created_at,
    author: {
      username: row.profiles?.username ?? 'usuario',
      fullName: row.profiles?.full_name ?? null,
      avatarUrl: row.profiles?.avatar_url ?? null,
    },
    likeCount: row.likes?.length ?? 0,
    commentCount: row.comments?.length ?? 0,
    likedByMe: (row.likes ?? []).some((l) => l.user_id === meId),
  };
}

export async function fetchFeed(meId: string): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(FEED_SELECT)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as unknown as RawPost[]).map((r) => mapPost(r, meId));
}

export async function toggleLike(postId: string, userId: string, currentlyLiked: boolean) {
  if (currentlyLiked) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }
}

export type FeedComment = {
  id: string;
  body: string;
  createdAt: string;
  author: { username: string; fullName: string | null; avatarUrl: string | null };
};

export async function fetchComments(postId: string): Promise<FeedComment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(
      `id, body, created_at,
       profiles:profiles!comments_user_id_fkey ( username, full_name, avatar_url )`,
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    author: {
      username: c.profiles?.username ?? 'usuario',
      fullName: c.profiles?.full_name ?? null,
      avatarUrl: c.profiles?.avatar_url ?? null,
    },
  }));
}

export async function addComment(postId: string, userId: string, body: string) {
  const { error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, body: body.trim() });
  if (error) throw error;
}

export async function createPost(
  userId: string,
  mediaUrl: string,
  mediaType: MediaType,
  caption: string,
) {
  const { error } = await supabase.from('posts').insert({
    user_id: userId,
    media_url: mediaUrl,
    media_type: mediaType,
    caption: caption.trim() || null,
  });
  if (error) throw error;
}

/**
 * Uploads a local file (from expo-image-picker) to the public `media` storage
 * bucket and returns its public URL.
 */
export async function uploadMedia(
  userId: string,
  localUri: string,
  mediaType: MediaType,
): Promise<string> {
  const ext = mediaType === 'video' ? 'mp4' : 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const contentType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from('media')
    .upload(path, arrayBuffer, { contentType, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}
