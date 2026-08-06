import React, { useMemo, useState } from 'react';
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
import {
  authErrorMessage,
  passwordChecks,
  validateEmail,
  validateFullName,
  validatePassword,
  validateUsername,
} from '../../src/lib/validation';
import { isSupabaseConfigured } from '../../src/lib/supabase';
import { colors, font, spacing } from '../../src/theme';

export default function Register() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checks = useMemo(() => passwordChecks(password), [password]);

  const onSubmit = async () => {
    setError(null);
    const firstError =
      validateFullName(fullName) ||
      validateUsername(username) ||
      validateEmail(email) ||
      validatePassword(password);
    if (firstError) return setError(firstError);
    if (!isSupabaseConfigured)
      return setError('Backend não configurado. Preencha o arquivo .env com as chaves do Supabase.');

    setLoading(true);
    try {
      await signUp({ email, password, username, fullName });
      // Navigation gate handles the redirect once the session is created.
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
            <Text style={styles.brand}>Criar conta</Text>
            <Text style={styles.subtitle}>Leva menos de um minuto ⚡</Text>
          </View>

          <TextField
            label="Nome completo"
            icon="person-outline"
            placeholder="Seu nome"
            autoCapitalize="words"
            value={fullName}
            onChangeText={setFullName}
          />
          <TextField
            label="Nome de usuário"
            icon="at-outline"
            placeholder="seu_usuario"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
          <TextField
            label="E-mail"
            icon="mail-outline"
            placeholder="voce@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            label="Senha"
            icon="lock-closed-outline"
            placeholder="Crie uma senha forte"
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

          <View style={styles.checklist}>
            {checks.map((c) => (
              <View key={c.label} style={styles.checkRow}>
                <Ionicons
                  name={c.met ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={c.met ? colors.success : colors.textFaint}
                />
                <Text style={[styles.checkText, c.met ? styles.checkTextMet : null]}>{c.label}</Text>
              </View>
            ))}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button label="Criar minha conta" onPress={onSubmit} loading={loading} style={{ marginTop: spacing.sm }} />

          <Text style={styles.terms}>
            Ao criar a conta você concorda em usar o 30minutes com equilíbrio 💚
          </Text>

          <Link href="/(auth)/login" asChild>
            <Pressable style={styles.footerLink}>
              <Text style={styles.footerText}>
                Já tem conta? <Text style={{ color: colors.primary, fontWeight: '700' }}>Entrar</Text>
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
  scroll: { padding: spacing.xl, paddingTop: spacing.xl, flexGrow: 1 },
  header: { marginBottom: spacing.xl },
  brand: { color: colors.text, fontSize: font.size.xxl, fontWeight: font.weight.black },
  subtitle: { color: colors.textMuted, fontSize: font.size.md, marginTop: spacing.xs },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -spacing.sm, marginBottom: spacing.md },
  toggleText: { color: colors.textMuted, fontSize: font.size.sm },
  checklist: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkText: { color: colors.textMuted, fontSize: font.size.sm },
  checkTextMet: { color: colors.text },
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
  terms: { color: colors.textFaint, fontSize: font.size.xs, textAlign: 'center', marginTop: spacing.md },
  footerLink: { alignItems: 'center', marginTop: spacing.lg },
  footerText: { color: colors.textMuted, fontSize: font.size.md },
});
