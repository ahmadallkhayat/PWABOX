import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { setHapticsEnabled } from '@/ui';

/** When the app locks: as soon as it's left (0), or after this many ms without being used. */
export type LockTimeout = 0 | 30_000 | 60_000 | 300_000;

export type Settings = {
  lockEnabled: boolean;
  lockTimeout: LockTimeout;
  /** Hide ads and stop known ad networks from loading. */
  blockAds: boolean;
  /** Stop sites opening new windows to other websites. */
  blockPopups: boolean;
  /** Stop pages sending you to other websites without a tap. */
  blockRedirects: boolean;
  /** Vibration feedback on taps, toggles, drags and confirmations. */
  haptics: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  lockEnabled: false,
  lockTimeout: 0,
  blockAds: true,
  blockPopups: true,
  blockRedirects: true,
  haptics: true,
};

const STORAGE_KEY = 'pwabox.settings.v1';

type SettingsContextValue = {
  settings: Settings;
  updateSettings: (changes: Partial<Settings>) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

/** Renders nothing until settings are loaded, so a locked app never flashes its content. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setSettings({ ...DEFAULT_SETTINGS, ...(raw ? JSON.parse(raw) : {}) }))
      .catch((error) => {
        console.warn('Failed to load settings', error);
        setSettings(DEFAULT_SETTINGS);
      });
  }, []);

  // The haptics helper lives outside React; keep it in step with the setting.
  useEffect(() => {
    if (settings) setHapticsEnabled(settings.haptics);
  }, [settings]);

  if (!settings) return null;

  function updateSettings(changes: Partial<Settings>) {
    setSettings((current) => {
      const updated = { ...(current ?? DEFAULT_SETTINGS), ...changes };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch((error) =>
        console.warn('Failed to save settings', error)
      );
      return updated;
    });
  }

  return <SettingsContext value={{ settings, updateSettings }}>{children}</SettingsContext>;
}

export function useSettings() {
  const context = use(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside <SettingsProvider>');
  return context;
}
