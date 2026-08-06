import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { TimerProvider } from '../src/context/TimerContext';
import { colors } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigation() {
  const { initializing, session, onboardingDone } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    SplashScreen.hideAsync().catch(() => {});

    const root = segments[0];
    const inAuth = root === '(auth)';
    const inApp = root === '(app)';
    const inOnboarding = root === 'onboarding';

    if (!onboardingDone) {
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }
    if (!session && !inAuth) {
      router.replace('/(auth)/login');
    } else if (session && (inAuth || inOnboarding || !inApp)) {
      router.replace('/(app)/feed');
    }
  }, [initializing, session, onboardingDone, segments, router]);

  if (initializing) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <TimerProvider>
          <RootNavigation />
        </TimerProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
