import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { DAILY_SOCIAL_BUDGET_SECONDS, localDateKey } from '../lib/time';

const usageKey = (date: string) => `@30min/usage/${date}`;

type TimerState = {
  /** Seconds of social time already spent today. */
  secondsUsed: number;
  /** Seconds still available in today's 30-minute budget. */
  secondsRemaining: number;
  /** True once the daily budget is exhausted — social area is hidden/blocked. */
  isLocked: boolean;
  /** True while the social clock is actively ticking (user is in the feed). */
  isTicking: boolean;
  budget: number;
  /** Called by social screens on focus/blur to start/stop counting. */
  setSocialActive: (active: boolean) => void;
};

const TimerContext = createContext<TimerState | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [secondsUsed, setSecondsUsed] = useState(0);
  const [socialActive, setSocialActiveState] = useState(false);
  const [today, setToday] = useState(localDateKey());

  const secondsRef = useRef(0);
  const dirtyRef = useRef(false);
  const lastSyncRef = useRef(0);

  secondsRef.current = secondsUsed;

  const isLocked = secondsUsed >= DAILY_SOCIAL_BUDGET_SECONDS;
  const secondsRemaining = Math.max(0, DAILY_SOCIAL_BUDGET_SECONDS - secondsUsed);

  // --- Load today's usage (local first, then reconcile with server) ---
  const loadUsage = useCallback(
    async (date: string, userId: string | undefined) => {
      const local = await AsyncStorage.getItem(usageKey(date));
      let value = local ? parseInt(local, 10) || 0 : 0;

      if (userId) {
        const { data } = await supabase
          .from('daily_usage')
          .select('seconds_used')
          .eq('user_id', userId)
          .eq('usage_date', date)
          .maybeSingle();
        if (data?.seconds_used != null) {
          // The larger of the two is the source of truth: the budget must not
          // "refill" just because one device lagged behind.
          value = Math.max(value, data.seconds_used);
        }
      }
      setSecondsUsed(value);
      secondsRef.current = value;
    },
    [],
  );

  useEffect(() => {
    loadUsage(today, session?.user?.id);
  }, [today, session?.user?.id, loadUsage]);

  // --- Persist helpers ---
  const persistLocal = useCallback(
    async (date: string, value: number) => {
      await AsyncStorage.setItem(usageKey(date), `${value}`);
    },
    [],
  );

  const persistServer = useCallback(
    async (date: string, value: number, userId: string | undefined) => {
      if (!userId) return;
      await supabase.from('daily_usage').upsert(
        {
          user_id: userId,
          usage_date: date,
          seconds_used: value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,usage_date' },
      );
    },
    [],
  );

  // --- The 1-second tick ---
  useEffect(() => {
    if (!socialActive || isLocked) return;

    const interval = setInterval(() => {
      // Roll over at midnight even mid-session.
      const currentDay = localDateKey();
      if (currentDay !== today) {
        setToday(currentDay);
        setSecondsUsed(0);
        secondsRef.current = 0;
        return;
      }

      const next = secondsRef.current + 1;
      secondsRef.current = next;
      dirtyRef.current = true;
      setSecondsUsed(next);
      persistLocal(currentDay, next);

      // Throttle server writes to every 15s.
      const now = Date.now();
      if (now - lastSyncRef.current >= 15000) {
        lastSyncRef.current = now;
        persistServer(currentDay, next, session?.user?.id);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [socialActive, isLocked, today, session?.user?.id, persistLocal, persistServer]);

  // --- Flush to server when app backgrounds or budget hits zero ---
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state !== 'active' && dirtyRef.current) {
        dirtyRef.current = false;
        persistServer(today, secondsRef.current, session?.user?.id);
      }
    });
    return () => sub.remove();
  }, [today, session?.user?.id, persistServer]);

  useEffect(() => {
    if (isLocked && dirtyRef.current) {
      dirtyRef.current = false;
      persistServer(today, secondsRef.current, session?.user?.id);
    }
  }, [isLocked, today, session?.user?.id, persistServer]);

  const setSocialActive = useCallback((active: boolean) => {
    setSocialActiveState(active);
  }, []);

  const value = useMemo<TimerState>(
    () => ({
      secondsUsed,
      secondsRemaining,
      isLocked,
      isTicking: socialActive && !isLocked,
      budget: DAILY_SOCIAL_BUDGET_SECONDS,
      setSocialActive,
    }),
    [secondsUsed, secondsRemaining, isLocked, socialActive, setSocialActive],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer(): TimerState {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer deve ser usado dentro de TimerProvider');
  return ctx;
}
