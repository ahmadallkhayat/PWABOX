import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { AppLockProvider } from '@/lib/app-lock';
import { lockPortrait } from '@/lib/orientation';
import { SettingsProvider } from '@/lib/settings';
import { SitesProvider } from '@/lib/sites';

SplashScreen.preventAutoHideAsync();
// The app can rotate (for fullscreen video), but the launcher itself stays portrait.
lockPortrait();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();

  // Android draws the app edge to edge, under the navigation bar; anywhere the app doesn't
  // paint shows the window behind it, which is white unless we match it to the theme.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.background).catch(() => {});
  }, [theme.background]);

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: theme.background }]}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SettingsProvider>
          <AppLockProvider>
            <SitesProvider>
              <Stack screenOptions={{ contentStyle: { backgroundColor: theme.background } }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="site/[id]" options={{ headerShown: false }} />
              </Stack>
            </SitesProvider>
          </AppLockProvider>
        </SettingsProvider>
        <AnimatedSplashOverlay />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
