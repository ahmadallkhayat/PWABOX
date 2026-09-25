import { useSyncExternalStore } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { getAppearance, subscribeToAppearance } from '@/ui/theme/appearance';

const noSubscription = () => () => {};

/**
 * Like the native version, but static rendering can't know the browser's setting, so it renders
 * light until the page has hydrated on the client.
 */
export function useColorScheme(): 'light' | 'dark' {
  // false while statically rendering and hydrating, true once running in the browser.
  const hasHydrated = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false
  );
  const system = useSystemColorScheme();
  const preference = useSyncExternalStore(subscribeToAppearance, getAppearance, getAppearance);

  if (!hasHydrated) return 'light';
  if (preference !== 'system') return preference;
  return system === 'dark' ? 'dark' : 'light';
}
