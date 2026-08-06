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
import { BrandLogo } from '../../src/components/BrandLogo';
import { authErrorMessage, validateEmail } from '../../src/lib/validation';
import { isSupabaseConfigured } from '../../src/lib/supabase';
import { colors, font, radius, spacing } from '../../src/theme';

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
    } catch (e) {
      setError(authErrorMessage((e as Error).message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <BrandLogo subtitle="Bem-vindo de volta 👋" />

          <View style={styles.form}>
            <TextField
              placeholder="E-mail"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <View style={styles.passWrap}>
              <TextField
                placeholder="Senha"
                secureTextEntry={!showPass}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                style={{ paddingRight: 34 }}
              />
              <Pressable style={styles.eye} onPress={() => setShowPass((s) => !s)} hitSlop={8}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button label="Entrar" onPress={onSubmit} loading={loading} />

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>ou continue com</Text>
              <View style={styles.line} />
            </View>

            <SocialButton icon="logo-google" label="Google" onPress={() => setError('Login social chega em breve 🙂')} />
            <SocialButton icon="logo-apple" label="Apple" onPress={() => setError('Login social chega em breve 🙂')} />

            <Link href="/(auth)/register" asChild>
              <Pressable style={styles.footerLink}>
                <Text style={styles.footerText}>
                  Não tem conta? <Text style={styles.link}>Cadastre-se</Text>
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SocialButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.social} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text style={styles.socialText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, paddingTop: spacing.xxxl, flexGrow: 1 },
  form: { marginTop: spacing.xl, gap: spacing.md },
  passWrap: { justifyContent: 'center' },
  eye: { position: 'absolute', right: spacing.lg, top: 16 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(186,26,26,0.1)',
    borderRadius: 12,
    padding: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: font.size.sm, flex: 1 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.sm },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: font.size.sm },
  social: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  socialText: { color: colors.text, fontSize: font.size.md, fontWeight: font.weight.semibold },
  footerLink: { alignItems: 'center', marginTop: spacing.lg },
  footerText: { color: colors.textMuted, fontSize: font.size.md },
  link: { color: colors.primary, fontWeight: font.weight.bold },
});
