import React, { useCallback, useEffect, useState } from 'react';
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
import { addComment, fetchComments, type FeedComment } from '../../../src/lib/social';
import { Avatar, EmptyState } from '../../../src/components/ui';
import { timeAgo } from '../../../src/lib/time';
import { colors, font, spacing } from '../../../src/theme';

export default function PostComments() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const postId = String(id);

  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setComments(await fetchComments(postId));
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    const body = text.trim();
    if (!body || !session?.user) return;
    setSending(true);
    setText('');
    try {
      await addComment(postId, session.user.id, body);
      await load();
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Comentários</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(c) => c.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.commentRow}>
                <Avatar uri={item.author.avatarUrl} name={item.author.fullName ?? item.author.username} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.commentAuthor}>
                    {item.author.username}
                    <Text style={styles.commentTime}> · {timeAgo(item.createdAt)}</Text>
                  </Text>
                  <Text style={styles.commentBody}>{item.body}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <EmptyState icon="chatbubbles-outline" title="Sem comentários ainda" subtitle="Seja o primeiro a comentar." />
            }
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Adicione um comentário..."
            placeholderTextColor={colors.textFaint}
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable onPress={send} disabled={sending || !text.trim()} hitSlop={8}>
            <Ionicons
              name="send"
              size={22}
              color={text.trim() ? colors.primary : colors.textFaint}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topTitle: { color: colors.text, fontSize: font.size.lg, fontWeight: font.weight.bold },
  list: { padding: spacing.lg, gap: spacing.lg, flexGrow: 1 },
  commentRow: { flexDirection: 'row', gap: spacing.md },
  commentAuthor: { color: colors.text, fontSize: font.size.sm, fontWeight: font.weight.bold },
  commentTime: { color: colors.textMuted, fontWeight: font.weight.regular },
  commentBody: { color: colors.text, fontSize: font.size.sm, marginTop: 2, lineHeight: 20 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: font.size.md,
  },
});
