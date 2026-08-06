import { supabase } from './supabase';

export type Person = {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export type DirectMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
};

export type ConversationPreview = { body: string; at: string; fromMe: boolean; unread: number };

/** Everyone except me — the pool of people to follow / message. */
export async function fetchPeople(meId: string): Promise<Person[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .neq('id', meId)
    .order('username', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    username: p.username,
    fullName: p.full_name,
    avatarUrl: p.avatar_url,
  }));
}

/** Latest message per conversation partner, for the inbox preview line. */
export async function fetchPreviews(
  meId: string,
): Promise<Record<string, ConversationPreview>> {
  const { data, error } = await supabase
    .from('messages')
    .select('sender_id, recipient_id, body, created_at, read')
    .or(`sender_id.eq.${meId},recipient_id.eq.${meId}`)
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) throw error;
  const map: Record<string, ConversationPreview> = {};
  for (const m of data ?? []) {
    const other = m.sender_id === meId ? m.recipient_id : m.sender_id;
    if (!map[other]) {
      map[other] = { body: m.body, at: m.created_at, fromMe: m.sender_id === meId, unread: 0 };
    }
    // Count messages the other person sent me that I haven't read.
    if (m.recipient_id === meId && !m.read) map[other].unread += 1;
  }
  return map;
}

export async function fetchProfile(userId: string): Promise<Person | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();
  if (!data) return null;
  return { id: data.id, username: data.username, fullName: data.full_name, avatarUrl: data.avatar_url };
}

export async function fetchThread(meId: string, otherId: string): Promise<DirectMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, recipient_id, body, created_at')
    .or(
      `and(sender_id.eq.${meId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${meId})`,
    )
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapMessage);
}

export async function sendMessage(
  meId: string,
  otherId: string,
  body: string,
): Promise<DirectMessage> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: meId, recipient_id: otherId, body: body.trim() })
    .select('id, sender_id, recipient_id, body, created_at')
    .single();
  if (error) throw error;
  return mapMessage(data);
}

/** Mark messages the other person sent me as read. */
export async function markRead(meId: string, otherId: string): Promise<void> {
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('recipient_id', meId)
    .eq('sender_id', otherId)
    .eq('read', false);
}

function mapMessage(m: {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
}): DirectMessage {
  return {
    id: m.id,
    senderId: m.sender_id,
    recipientId: m.recipient_id,
    body: m.body,
    createdAt: m.created_at,
  };
}
