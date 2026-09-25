import * as LocalAuthentication from 'expo-local-authentication';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';

import { LockScreen } from '@/features/lock/lock-screen';
import { useSettings } from '@/features/settings/settings-store';
import { haptic } from '@/ui';

export type LockMethod = {
  /** Whether the phone has any screen lock (biometric or PIN/passcode) the app can use. */
  available: boolean;
  /** What the prompt will use, e.g. "Face ID", "Fingerprint", "Passcode". */
  label: string;
};

type AppLockContextValue = {
  locked: boolean;
  method: LockMethod | null;
  /** Shows the system prompt; resolves true if the user proved it's them. */
  authenticate: (promptMessage: string) => Promise<boolean>;
  /** While true (e.g. watching a fullscreen video), not touching the screen doesn't count as inactivity. */
  setActivityHold: (hold: boolean) => void;
};

const AppLockContext = createContext<AppLockContextValue | null>(null);

const INACTIVITY_CHECK_MS = 5000;

// iOS briefly reports the app as inactive/active around the system prompt; ignore that window.
const AUTH_SETTLE_MS = 1000;

export async function detectLockMethod(): Promise<LockMethod> {
  if (Platform.OS === 'web') return { available: false, label: 'Screen lock' };
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    const passcode = Platform.OS === 'ios' ? 'Passcode' : 'PIN';
    if (level === LocalAuthentication.SecurityLevel.NONE) return { available: false, label: passcode };
    if (level === LocalAuthentication.SecurityLevel.SECRET) return { available: true, label: passcode };

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const { FACIAL_RECOGNITION, FINGERPRINT } = LocalAuthentication.AuthenticationType;
    if (types.includes(FACIAL_RECOGNITION)) {
      return { available: true, label: Platform.OS === 'ios' ? 'Face ID' : 'Face unlock' };
    }
    if (types.includes(FINGERPRINT)) {
      return { available: true, label: Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint' };
    }
    return { available: true, label: 'Biometrics' };
  } catch {
    return { available: false, label: 'Screen lock' };
  }
}

/**
 * Locks the app behind Face ID / fingerprint / passcode, either as soon as it's left (screen off,
 * app switched) or after a period without touches. Also hides the content in the app switcher.
 */
export function AppLockProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const enabled = settings.lockEnabled && Platform.OS !== 'web';
  const timeout = settings.lockTimeout;

  // Starts locked when the lock is on, so the app never opens straight into content.
  const [locked, setLocked] = useState(enabled);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [authenticating, setAuthenticating] = useState(false);
  const [method, setMethod] = useState<LockMethod | null>(null);

  const lastActivity = useRef(0);
  const activityHold = useRef(false);
  const authenticatingRef = useRef(false);
  const autoPrompted = useRef(false);

  useEffect(() => {
    lastActivity.current = Date.now();
  }, []);

  const isLocked = enabled && locked;

  const lockNow = useCallback(() => {
    autoPrompted.current = false;
    setLocked(true);
  }, []);

  const authenticate = useCallback(async (promptMessage: string) => {
    authenticatingRef.current = true;
    setAuthenticating(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
      });
      if (result.success) haptic('success');
      else if (result.error !== 'user_cancel' && result.error !== 'system_cancel') haptic('error');
      return result.success;
    } catch {
      return false;
    } finally {
      lastActivity.current = Date.now();
      setTimeout(() => {
        authenticatingRef.current = false;
        setAuthenticating(false);
      }, AUTH_SETTLE_MS);
    }
  }, []);

  const unlock = useCallback(async () => {
    if (await authenticate('Unlock PWABOX')) setLocked(false);
  }, [authenticate]);

  // Re-check on every return to the app: the user may have just set up a fingerprint.
  useEffect(() => {
    if (!appActive) return;
    let cancelled = false;
    detectLockMethod().then((detected) => {
      if (!cancelled) setMethod(detected);
    });
    return () => {
      cancelled = true;
    };
  }, [appActive]);

  // Leaving the app / screen turning off, and coming back after too long away.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      setAppActive(next === 'active');
      if (!enabled || authenticatingRef.current) return;

      if (next === 'background') {
        autoPrompted.current = false;
        if (timeout === 0) lockNow();
      } else if (next === 'active' && timeout > 0) {
        if (Date.now() - lastActivity.current >= timeout) lockNow();
      }
    });
    return () => subscription.remove();
  }, [enabled, timeout, lockNow]);

  // Inactivity while the app is open.
  useEffect(() => {
    if (!enabled || timeout === 0 || isLocked) return;
    const interval = setInterval(() => {
      if (activityHold.current) {
        lastActivity.current = Date.now();
      } else if (
        AppState.currentState === 'active' &&
        Date.now() - lastActivity.current >= timeout
      ) {
        lockNow();
      }
    }, INACTIVITY_CHECK_MS);
    return () => clearInterval(interval);
  }, [enabled, timeout, isLocked, lockNow]);

  // Ask right away when the lock screen appears, once per time it's shown.
  useEffect(() => {
    if (!isLocked || !appActive || authenticating || autoPrompted.current) return;
    autoPrompted.current = true;
    unlock();
  }, [isLocked, appActive, authenticating, unlock]);

  const setActivityHold = useCallback((hold: boolean) => {
    activityHold.current = hold;
    lastActivity.current = Date.now();
  }, []);

  // Covers the app in the app switcher too, not only when locked.
  const covered = isLocked || (enabled && !appActive && !authenticating);

  return (
    <AppLockContext value={{ locked: isLocked, method, authenticate, setActivityHold }}>
      <View
        style={styles.fill}
        onTouchStart={() => {
          lastActivity.current = Date.now();
        }}>
        {children}
      </View>
      <LockScreen
        visible={covered}
        locked={isLocked}
        methodLabel={method?.label ?? 'Screen lock'}
        onUnlock={unlock}
      />
    </AppLockContext>
  );
}

export function useAppLock() {
  const context = use(AppLockContext);
  if (!context) throw new Error('useAppLock must be used inside <AppLockProvider>');
  return context;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
