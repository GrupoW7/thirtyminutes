import { supabase } from './supabase';

/**
 * A tiny in-memory store of "who the current user follows", shared across every
 * FollowButton so duplicate authors (e.g. the same person appearing twice in
 * the feed) stay in sync without each one hitting the network.
 */
let followingSet = new Set<string>();
let loadedFor: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeFollows(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function isFollowing(id: string): boolean {
  return followingSet.has(id);
}

export function followingCount(): number {
  return followingSet.size;
}

export function followingIds(): string[] {
  return [...followingSet];
}

/** Loads (once per user) the set of ids the current user follows. */
export async function loadFollowing(meId: string, force = false): Promise<void> {
  if (!meId || (loadedFor === meId && !force)) return;
  loadedFor = meId;
  const { data } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', meId);
  followingSet = new Set((data ?? []).map((r) => r.following_id));
  emit();
}

export async function followUser(meId: string, targetId: string): Promise<void> {
  followingSet.add(targetId);
  emit();
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: meId, following_id: targetId });
  if (error) {
    followingSet.delete(targetId);
    emit();
    throw error;
  }
}

export async function unfollowUser(meId: string, targetId: string): Promise<void> {
  followingSet.delete(targetId);
  emit();
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', meId)
    .eq('following_id', targetId);
  if (error) {
    followingSet.add(targetId);
    emit();
    throw error;
  }
}

/** Follower / following counts for any profile (used on the profile screen). */
export async function fetchFollowStats(
  userId: string,
): Promise<{ followers: number; following: number }> {
  const [followers, following] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}
