import { supabase } from './supabase';
import { SEED_CATALOG } from './activities';
import { localDateKey } from './time';
import type {
  ActivityCatalogItem,
  ActivityProfile,
  UserActivity,
} from '../types/database';

export type CommunityActivity = { title: string; count: number; byUsername: string | null };

/** Search activities that OTHER users created, so you can add them to your day. */
export async function searchCommunityActivities(
  meId: string,
  query: string,
): Promise<CommunityActivity[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const { data } = await supabase
    .from('user_activities')
    .select('custom_title, user_id, created_at')
    .neq('user_id', meId)
    .not('custom_title', 'is', null)
    .ilike('custom_title', `%${q}%`)
    .order('created_at', { ascending: false })
    .limit(80);

  const map = new Map<string, { count: number; userId: string }>();
  for (const r of data ?? []) {
    const t = r.custom_title as string;
    const e = map.get(t);
    if (e) e.count += 1;
    else map.set(t, { count: 1, userId: r.user_id });
  }

  const userIds = [...new Set([...map.values()].map((v) => v.userId))];
  const names: Record<string, string> = {};
  if (userIds.length) {
    const { data: profs } = await supabase.from('profiles').select('id, username').in('id', userIds);
    for (const p of profs ?? []) names[p.id] = p.username;
  }

  return [...map.entries()].map(([title, v]) => ({
    title,
    count: v.count,
    byUsername: names[v.userId] ?? null,
  }));
}

/** Load the catalog from Supabase, falling back to the local seed offline. */
export async function fetchCatalog(): Promise<ActivityCatalogItem[]> {
  const { data, error } = await supabase.from('activity_catalog').select('*');
  if (error || !data || data.length === 0) return SEED_CATALOG;
  return data as ActivityCatalogItem[];
}

export async function fetchActivityProfile(
  userId: string,
): Promise<ActivityProfile | null> {
  const { data } = await supabase
    .from('activity_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return (data as ActivityProfile | null) ?? null;
}

export async function saveActivityProfile(
  userId: string,
  profile: Omit<ActivityProfile, 'user_id' | 'updated_at'>,
): Promise<void> {
  const { error } = await supabase.from('activity_profiles').upsert({
    user_id: userId,
    ...profile,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/** Today's checked/unchecked user activities. */
export async function fetchTodayActivities(userId: string): Promise<UserActivity[]> {
  const today = localDateKey();
  const { data, error } = await supabase
    .from('user_activities')
    .select('*')
    .eq('user_id', userId)
    .eq('activity_date', today)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as UserActivity[]) ?? [];
}

/** Add a suggested (catalog) activity to today's list. */
export async function addCatalogActivity(
  userId: string,
  item: ActivityCatalogItem,
): Promise<UserActivity> {
  const { data, error } = await supabase
    .from('user_activities')
    .insert({
      user_id: userId,
      catalog_id: item.id,
      custom_title: item.title,
      activity_date: localDateKey(),
      completed: false,
      points: item.base_points,
    })
    .select()
    .single();
  if (error) throw error;
  return data as UserActivity;
}

/** Add a personalized activity typed by the user. */
export async function addCustomActivity(
  userId: string,
  title: string,
  points = 15,
): Promise<UserActivity> {
  const { data, error } = await supabase
    .from('user_activities')
    .insert({
      user_id: userId,
      catalog_id: null,
      custom_title: title.trim(),
      activity_date: localDateKey(),
      completed: false,
      points,
    })
    .select()
    .single();
  if (error) throw error;
  return data as UserActivity;
}

export async function toggleActivityDone(
  activity: UserActivity,
): Promise<void> {
  const { error } = await supabase
    .from('user_activities')
    .update({ completed: !activity.completed })
    .eq('id', activity.id);
  if (error) throw error;
}

export async function removeActivity(activityId: string): Promise<void> {
  const { error } = await supabase.from('user_activities').delete().eq('id', activityId);
  if (error) throw error;
}

/** All-time completed points, used for the level/gamification. */
export async function fetchTotalPoints(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('user_activities')
    .select('points')
    .eq('user_id', userId)
    .eq('completed', true);
  if (error) throw error;
  return (data ?? []).reduce((sum, r: { points: number }) => sum + (r.points ?? 0), 0);
}

/** Current streak: consecutive days (up to today) with ≥1 completed activity. */
export async function fetchStreak(userId: string): Promise<number> {
  const { data } = await supabase
    .from('user_activities')
    .select('activity_date, completed')
    .eq('user_id', userId)
    .eq('completed', true)
    .order('activity_date', { ascending: false })
    .limit(200);

  const days = new Set((data ?? []).map((r: { activity_date: string }) => r.activity_date));
  let streak = 0;
  const cursor = new Date();
  // Allow the streak to still count if today has no check yet.
  if (!days.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
