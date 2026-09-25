/**
 * Design tokens: the only place colors, spacing, radii and type sizes are defined. Components
 * read them through `useTheme()` (colors follow light/dark mode) or import the static scales.
 */

import '@/global.css';

import { Platform, type TextStyle } from 'react-native';

/** The app icon's blue. Fixed in both modes: the splash and lock screens are painted with it. */
export const BRAND = '#0D68F7';

const light = {
  /** Screen background. */
  background: '#FFFFFF',
  /** Cards, list groups, inputs. */
  surface: '#F2F2F6',
  /** A selected / pressed surface, and chips on top of `surface`. */
  surfaceSelected: '#E3E4EA',
  /** Hairlines between rows. */
  separator: '#D9DAE0',
  text: '#0B0B0F',
  textSecondary: '#5E6068',
  textTertiary: '#8E9098',
  accent: BRAND,
  onAccent: '#FFFFFF',
  danger: '#E5484D',
  onDanger: '#FFFFFF',
  /** Dims the screen behind dialogs. */
  backdrop: 'rgba(0, 0, 0, 0.45)',
  /** Floating notices (toasts) and badges drawn over content. */
  inverseSurface: 'rgba(28, 28, 32, 0.94)',
  onInverse: '#FFFFFF',
  onInverseSecondary: 'rgba(255, 255, 255, 0.7)',
  inverseSelected: 'rgba(255, 255, 255, 0.16)',
  scrim: 'rgba(0, 0, 0, 0.55)',
};

export type ThemeColors = typeof light;
export type ColorName = keyof ThemeColors;

const dark: ThemeColors = {
  background: '#000000',
  surface: '#1C1C1F',
  surfaceSelected: '#2E3035',
  separator: '#34363B',
  text: '#FFFFFF',
  textSecondary: '#A8ABB2',
  textTertiary: '#72757C',
  accent: '#3D8BFF',
  onAccent: '#FFFFFF',
  danger: '#FF6369',
  onDanger: '#FFFFFF',
  backdrop: 'rgba(0, 0, 0, 0.6)',
  inverseSurface: 'rgba(44, 44, 48, 0.96)',
  onInverse: '#FFFFFF',
  onInverseSecondary: 'rgba(255, 255, 255, 0.7)',
  inverseSelected: 'rgba(255, 255, 255, 0.16)',
  scrim: 'rgba(0, 0, 0, 0.55)',
};

export const colors = { light, dark };

/** Spacing scale. Use these names instead of raw numbers for padding, margins and gaps. */
export const space = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Layout constants shared by every screen. */
export const layout = {
  /** Side padding of every screen's content. */
  gutter: space.lg,
  /** Content stops growing past this on tablets / wide windows. */
  maxContentWidth: 720,
  dialogMaxWidth: 440,
  /** Smallest comfortable tap target. */
  minTouch: 44,
  hitSlop: 12,
} as const;

const fonts = Platform.select({
  web: { sans: 'var(--font-display)', mono: 'var(--font-mono)' },
  default: { sans: undefined, mono: Platform.OS === 'ios' ? 'ui-monospace' : 'monospace' },
});

type TypeStyle = Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontWeight' | 'fontFamily'>;

/** Type scale (sizes follow the iOS text styles, which read well on Android too). */
export const typography = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700', fontFamily: fonts.sans },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', fontFamily: fonts.sans },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '600', fontFamily: fonts.sans },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', fontFamily: fonts.sans },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400', fontFamily: fonts.sans },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600', fontFamily: fonts.sans },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400', fontFamily: fonts.sans },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400', fontFamily: fonts.sans },
  footnoteStrong: { fontSize: 13, lineHeight: 18, fontWeight: '600', fontFamily: fonts.sans },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', fontFamily: fonts.sans },
  code: { fontSize: 13, lineHeight: 18, fontWeight: '500', fontFamily: fonts.mono },
} satisfies Record<string, TypeStyle>;

export type TypographyVariant = keyof typeof typography;
