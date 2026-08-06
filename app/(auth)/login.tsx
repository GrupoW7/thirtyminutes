import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Button, TextField } from '../../src/components/ui';
import { authErrorMessage, validateEmail } from '../../src/lib/validation';
import { isSupabaseConfigured } from '../../src/lib/supabase';
import { colors, font, spacing } from '../../src/theme';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    const emailErr = validateEmail(email);
    if (emailErr) return setError(emailErr);
    if (!password) return setError('Informe sua senha.');
    if (!isSupabaseConfigured)
      return setError('Backend não configurado. Preencha o arquivo .env com as chaves do Supabase.');

    setLoading(true);
    try {
      await signIn(email, password);
      // Navigation gate handles the redirect on session change.
    } catch (e) {
      setError(authErrorMessage((e as Error).message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.brand}>
              30<Text style={{ color: colors.primary }}>minutes</Text>
            </Text>
            <Text style={styles.subtitle}>Bem-vindo de volta 👋</Text>
          </View>

          <TextField
            label="E-mail"
            icon="mail-outline"
            placeholder="voce@email.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextField
            label="Senha"
            icon="lock-closed-outline"
            placeholder="Sua senha"
            secureTextEntry={!showPass}
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
          <Pressable onPress={() => setShowPass((s) => !s)} style={styles.toggle}>
            <Ionicons
              name={showPass ? 'eye-off-outline' : 'eye-outline'}
              size={16}
              color={colors.textMuted}
            />
            <Text style={styles.toggleText}>{showPass ? 'Ocultar senha' : 'Mostrar senha'}</Text>
          </Pressable>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button label="Entrar" onPress={onSubmit} loading={loading} style={{ marginTop: spacing.md }} />

          <Link href="/(auth)/register" asChild>
            <Pressable style={styles.footerLink}>
              <Text style={styles.footerText}>
                Não tem conta? <Text style={{ color: colors.primary, fontWeight: '700' }}>Cadastre-se</Text>
              </Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, paddingTop: spacing.xxxl, flexGrow: 1 },
  header: { marginBottom: spacing.xxl },
  brand: { color: colors.text, fontSize: font.size.display, fontWeight: font.weight.black },
  subtitle: { color: colors.textMuted, fontSize: font.size.lg, marginTop: spacing.sm },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -spacing.sm, marginBottom: spacing.md },
  toggleText: { color: colors.textMuted, fontSize: font.size.sm },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: { color: colors.danger, fontSize: font.size.sm, flex: 1 },
  footerLink: { alignItems: 'center', marginTop: spacing.xl },
  footerText: { color: colors.textMuted, fontSize: font.size.md },
});
