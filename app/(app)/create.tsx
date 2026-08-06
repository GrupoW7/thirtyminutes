import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { createPost, uploadMedia } from '../../src/lib/social';
import { Button } from '../../src/components/ui';
import { colors, font, radius, spacing } from '../../src/theme';
import type { MediaType } from '../../src/types/database';

export default function Create() {
  const router = useRouter();
  const { session } = useAuth();
  const [uri, setUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [caption, setCaption] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (kind: MediaType) => {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Precisamos da permissão da galeria para publicar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        kind === 'video'
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      videoMaxDuration: 60,
      allowsEditing: kind === 'image',
      aspect: kind === 'image' ? [1, 1] : undefined,
    });
    if (!result.canceled && result.assets[0]) {
      setUri(result.assets[0].uri);
      setMediaType(kind);
    }
  };

  const publish = async () => {
    if (!uri || !session?.user) return;
    setPublishing(true);
    setError(null);
    try {
      const url = await uploadMedia(session.user.id, uri, mediaType);
      await createPost(session.user.id, url, mediaType, caption);
      setUri(null);
      setCaption('');
      router.replace('/(app)/feed');
    } catch (e) {
      setError('Não foi possível publicar. Verifique o bucket de mídia no Supabase.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Novo momento</Text>
          <Text style={styles.subtitle}>Compartilhe algo real do seu dia.</Text>

          {uri ? (
            <View style={styles.previewWrap}>
              {mediaType === 'video' ? (
                <Video source={{ uri }} style={styles.preview} resizeMode={ResizeMode.COVER} useNativeControls isLooping />
              ) : (
                <Image source={{ uri }} style={styles.preview} contentFit="cover" />
              )}
              <Pressable style={styles.removeBtn} onPress={() => setUri(null)} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.white} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.pickRow}>
              <Pressable style={styles.pickCard} onPress={() => pick('image')}>
                <Ionicons name="image-outline" size={34} color={colors.primary} />
                <Text style={styles.pickText}>Foto</Text>
              </Pressable>
              <Pressable style={styles.pickCard} onPress={() => pick('video')}>
                <Ionicons name="videocam-outline" size={34} color={colors.accent} />
                <Text style={styles.pickText}>Vídeo</Text>
              </Pressable>
            </View>
          )}

          <TextInput
            style={styles.captionInput}
            placeholder="Escreva uma legenda..."
            placeholderTextColor={colors.textFaint}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={2200}
          />

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            label="Publicar"
            icon="cloud-upload-outline"
            onPress={publish}
            disabled={!uri}
            loading={publishing}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.lg, flexGrow: 1 },
  title: { color: colors.text, fontSize: font.size.xxl, fontWeight: font.weight.black },
  subtitle: { color: colors.textMuted, fontSize: font.size.md, marginTop: -spacing.sm },
  pickRow: { flexDirection: 'row', gap: spacing.lg },
  pickCard: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pickText: { color: colors.text, fontSize: font.size.md, fontWeight: font.weight.semibold },
  previewWrap: { width: '100%', aspectRatio: 1, borderRadius: radius.lg, overflow: 'hidden' },
  preview: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionInput: {
    minHeight: 100,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    color: colors.text,
    fontSize: font.size.md,
    textAlignVertical: 'top',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderRadius: 12,
    padding: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: font.size.sm, flex: 1 },
});
