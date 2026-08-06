import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { supabase } from '../../../src/lib/supabase';
import {
  fetchProfile,
  fetchThread,
  markRead,
  sendMessage,
  type DirectMessage,
  type Person,
} from '../../../src/lib/messages';
import { Avatar } from '../../../src/components/ui';
import { FollowButton } from '../../../src/components/FollowButton';
import { colors, font, radius, spacing } from '../../../src/theme';

export default function Thread() {
  const { id: otherId } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const meId = session?.user?.id ?? '';
  const router = useRouter();

  const [other, setOther] = useState<Person | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<DirectMessage>>(null);

  const load = useCallback(async () => {
    if (!meId || !otherId) return;
    const [profile, thread] = await Promise.all([
      fetchProfile(otherId),
      fetchThread(meId, otherId),
    ]);
    setOther(profile);
    setMessages(thread);
    setLoading(false);
    markRead(meId, otherId);
  }, [meId, otherId]);

  useEffect(() => {
    load();
  }, [load]);

  // Live updates: append messages the other person sends me in real time.
  useEffect(() => {
    if (!meId || !otherId) return;
    const channel = supabase
      .channel(`dm:${otherId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as {
            id: string;
            sender_id: string;
            recipient_id: string;
            body: string;
            created_at: string;
          };
          if (m.sender_id === otherId && m.recipient_id === meId) {
            setMessages((prev) =>
              prev.some((x) => x.id === m.id)
                ? prev
                : [
                    ...prev,
                    {
                      id: m.id,
                      senderId: m.sender_id,
                      recipientId: m.recipient_id,
                      body: m.body,
                      createdAt: m.created_at,
                    },
                  ],
            );
            markRead(meId, otherId);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [meId, otherId]);

  const send = useCallback(async () => {
    const body = text.trim();
    if (!body || !meId || !otherId || sending) return;
    setSending(true);
    setText('');
    try {
      const msg = await sendMessage(meId, otherId, body);
      setMessages((prev) => [...prev, msg]);
    } catch {
      setText(body); // restore on failure
    } finally {
      setSending(false);
    }
  }, [text, meId, otherId, sending]);

  const name = other?.fullName ?? other?.username ?? 'Conversa';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Avatar uri={other?.avatarUrl} name={name} size={38} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {other ? <Text style={styles.username}>@{other.username}</Text> : null}
        </View>
        {otherId ? <FollowButton targetId={otherId} /> : null}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const mine = item.senderId === meId;
              return (
                <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.body}</Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.empty}>
                Diga oi para {name} 👋{'\n'}Comece uma conversa de verdade.
              </Text>
            }
          />
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Mensagem..."
            placeholderTextColor={colors.textFaint}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
            onSubmitEditing={send}
          />
          <Pressable
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnOff]}
            onPress={send}
            disabled={!text.trim() || sending}
          >
            <Ionicons name="arrow-up" size={22} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { padding: 2 },
  name: { color: colors.text, fontSize: font.size.md, fontWeight: font.weight.bold },
  username: { color: colors.textMuted, fontSize: font.size.xs },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  bubbleRow: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { color: colors.text, fontSize: font.size.md, lineHeight: 21 },
  bubbleTextMine: { color: colors.white, fontWeight: font.weight.medium },
  empty: { color: colors.textMuted, fontSize: font.size.sm, textAlign: 'center', marginTop: spacing.xxl, lineHeight: 22 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'web' ? 12 : spacing.sm,
    color: colors.text,
    fontSize: font.size.md,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: colors.borderStrong },
});
