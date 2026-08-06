import { supabase } from './supabase';

export type NotifActor = {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export type NotifType = 'follow' | 'comment';

export type AppNotification = {
  id: string;
  type: NotifType;
  actor: NotifActor;
  at: string;
  text?: string; // comment body
  postId?: string;
};

async function fetchProfilesMap(ids: string[]): Promise<Record<string, NotifActor>> {
  if (!ids.length) return {};
  const { data } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .in('id', ids);
  const map: Record<string, NotifActor> = {};
  for (const p of data ?? []) {
    map[p.id] = { id: p.id, username: p.username, fullName: p.full_name, avatarUrl: p.avatar_url };
  }
  return map;
}

/** Notifications derived from real data: new followers + comments on my posts. */
export async function fetchNotifications(meId: string): Promise<AppNotification[]> {
  const { data: followers } = await supabase
    .from('follows')
    .select('follower_id, created_at')
    .eq('following_id', meId)
    .order('created_at', { ascending: false })
    .limit(30);

  const { data: myPosts } = await supabase.from('posts').select('id').eq('user_id', meId);
  const myPostIds = (myPosts ?? []).map((p) => p.id);

  let comments: { id: string; user_id: string; post_id: string; body: string; created_at: string }[] = [];
  if (myPostIds.length) {
    const { data } = await supabase
      .from('comments')
      .select('id, user_id, post_id, body, created_at')
      .in('post_id', myPostIds)
      .neq('user_id', meId)
      .order('created_at', { ascending: false })
      .limit(30);
    comments = data ?? [];
  }

  const actorIds = new Set<string>();
  (followers ?? []).forEach((f) => actorIds.add(f.follower_id));
  comments.forEach((c) => actorIds.add(c.user_id));
  const profiles = await fetchProfilesMap([...actorIds]);

  const items: AppNotification[] = [];
  for (const f of followers ?? []) {
    const actor = profiles[f.follower_id];
    if (actor) items.push({ id: `f-${f.follower_id}`, type: 'follow', actor, at: f.created_at });
  }
  for (const c of comments) {
    const actor = profiles[c.user_id];
    if (actor)
      items.push({ id: `c-${c.id}`, type: 'comment', actor, at: c.created_at, text: c.body, postId: c.post_id });
  }
  items.sort((a, b) => (a.at < b.at ? 1 : -1));
  return items;
}
