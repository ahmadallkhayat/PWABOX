import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { HistoryProvider } from '@/features/history/history-store';
import { AppLockProvider } from '@/features/lock/app-lock';
import { SettingsProvider } from '@/features/settings/settings-store';
import { SitesProvider } from '@/features/sites/sites-store';
import { SplashOverlay } from '@/features/splash/splash-overlay';
import { lockPortrait } from '@/lib/orientation';
import { useTheme } from '@/ui';

SplashScreen.preventAutoHideAsync();
// The app can rotate (for fullscreen video), but the launcher itself stays portrait.
lockPortrait();

export default function RootLayout() {
  const { dark, colors } = useTheme();

  // Android draws the app edge to edge, under the navigation bar; anywhere the app doesn't
  // paint shows the window behind it, which is white unless we match it to the theme.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  // Navigation's own theme (headers, tab bar), built from ours so every screen matches.
  const base = dark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.separator,
    },
  };

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemeProvider value={navigationTheme}>
        <SettingsProvider>
          <AppLockProvider>
            <SitesProvider>
              <HistoryProvider>
                <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="site/[id]" options={{ headerShown: false }} />
                </Stack>
              </HistoryProvider>
            </SitesProvider>
          </AppLockProvider>
        </SettingsProvider>
        <SplashOverlay />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
