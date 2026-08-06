import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

const ONBOARDING_KEY = '@30min/onboarding_done';

type AuthState = {
  initializing: boolean;
  session: Session | null;
  profile: Profile | null;
  onboardingDone: boolean;
  signUp: (params: SignUpParams) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

type SignUpParams = {
  email: string;
  password: string;
  username: string;
  fullName: string;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data ?? null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const done = await AsyncStorage.getItem(ONBOARDING_KEY);
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setOnboardingDone(done === 'true');
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setInitializing(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = useCallback(
    async ({ email, password, username, fullName }: SignUpParams) => {
      const cleanUsername = username.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { username: cleanUsername, full_name: fullName.trim() },
        },
      });
      if (error) throw error;

      // With email confirmation disabled the session is returned immediately.
      // The profile row is created by a DB trigger (see migrations), but we
      // upsert here as a safety net for the display name/username.
      const userId = data.user?.id;
      if (userId) {
        await supabase.from('profiles').upsert({
          id: userId,
          username: cleanUsername,
          full_name: fullName.trim(),
        });
      }
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboardingDone(true);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      initializing,
      session,
      profile,
      onboardingDone,
      signUp,
      signIn,
      signOut,
      completeOnboarding,
      refreshProfile,
    }),
    [
      initializing,
      session,
      profile,
      onboardingDone,
      signUp,
      signIn,
      signOut,
      completeOnboarding,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
