import { Appearance } from 'react-native';

/** The user's light/dark choice. 'system' follows the phone's setting. */
export type AppearancePreference = 'system' | 'light' | 'dark';

let preference: AppearancePreference = 'system';
const listeners = new Set<() => void>();

/**
 * Applies a light/dark choice to the whole app. On iOS and Android this also switches native
 * UI the app shows (alerts, keyboard, tab bar); `useColorScheme` picks it up everywhere.
 */
export function setAppearance(next: AppearancePreference) {
  if (next === preference) return;
  preference = next;
  try {
    Appearance.setColorScheme(next === 'system' ? 'unspecified' : next);
  } catch {
    // Not supported (e.g. web): the hook below still applies the choice to our own UI.
  }
  listeners.forEach((listener) => listener());
}

export function getAppearance() {
  return preference;
}

export function subscribeToAppearance(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
