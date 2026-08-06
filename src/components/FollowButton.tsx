import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, font, radius, spacing } from '../theme';
import {
  followUser,
  isFollowing,
  loadFollowing,
  subscribeFollows,
  unfollowUser,
} from '../lib/follows';

/**
 * Follow / Following toggle. Self-contained: reads the shared follow store, so
 * every instance for the same person stays in sync. Renders nothing for your
 * own account.
 */
export function FollowButton({ targetId, block }: { targetId: string; block?: boolean }) {
  const { session } = useAuth();
  const meId = session?.user?.id ?? '';
  const [, force] = useReducer((x) => x + 1, 0);
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeFollows(force), []);
  useEffect(() => {
    if (meId) loadFollowing(meId);
  }, [meId]);

  const following = isFollowing(targetId);

  const onPress = useCallback(async () => {
    if (!meId || busy) return;
    setBusy(true);
    try {
      if (following) await unfollowUser(meId, targetId);
      else await followUser(meId, targetId);
    } catch {
      /* store already rolled back; ignore transient errors */
    } finally {
      setBusy(false);
    }
  }, [meId, targetId, following, busy]);

  if (!meId || meId === targetId) return null;

  const fg = following ? colors.textMuted : colors.white;

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={[
        styles.btn,
        block && styles.block,
        following ? styles.following : styles.notFollowing,
        busy && { opacity: 0.6 },
      ]}
      hitSlop={6}
    >
      {busy ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          <Ionicons name={following ? 'checkmark' : 'add'} size={15} color={fg} />
          <Text style={[styles.label, { color: fg }]}>{following ? 'Seguindo' : 'Seguir'}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  block: { height: 40, paddingHorizontal: spacing.lg },
  notFollowing: { backgroundColor: colors.primary, borderColor: colors.primary },
  following: { backgroundColor: 'transparent', borderColor: colors.borderStrong },
  label: { fontSize: font.size.sm, fontWeight: font.weight.bold },
});
