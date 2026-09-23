import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { lockPortrait } from '@/lib/orientation';
import { SitesProvider } from '@/lib/sites';

SplashScreen.preventAutoHideAsync();
// The app can rotate (for fullscreen video), but the launcher itself stays portrait.
lockPortrait();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SitesProvider>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'PWABOX', headerLargeTitle: true }} />
          <Stack.Screen
            name="add"
            options={{ title: 'Add website', presentation: 'modal' }}
          />
          <Stack.Screen name="site/[id]" options={{ headerShown: false }} />
        </Stack>
      </SitesProvider>
      <AnimatedSplashOverlay />
    </ThemeProvider>
  );
}
