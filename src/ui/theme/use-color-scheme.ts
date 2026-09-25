import { useSyncExternalStore } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { getAppearance, subscribeToAppearance } from '@/ui/theme/appearance';

/** 'light' or 'dark': the user's choice in Settings, or the phone's setting for "Match system". */
export function useColorScheme(): 'light' | 'dark' {
  const system = useSystemColorScheme();
  const preference = useSyncExternalStore(subscribeToAppearance, getAppearance);
  if (preference !== 'system') return preference;
  return system === 'dark' ? 'dark' : 'light';
}
