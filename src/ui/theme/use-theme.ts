import { colors, type ThemeColors } from '@/ui/theme/tokens';
import { useColorScheme } from '@/ui/theme/use-color-scheme';

export type Theme = {
  dark: boolean;
  colors: ThemeColors;
};

/** The current light/dark palette. https://docs.expo.dev/guides/color-schemes/ */
export function useTheme(): Theme {
  const dark = useColorScheme() === 'dark';
  return { dark, colors: dark ? colors.dark : colors.light };
}
