import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { typography, type ColorName, type TypographyVariant } from '@/ui/theme/tokens';
import { useTheme } from '@/ui/theme/use-theme';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  /** A theme color name, or any color. */
  color?: ColorName | (string & {});
  align?: 'auto' | 'left' | 'center' | 'right';
};

/** All text in the app: a size from the type scale and a color from the theme. */
export function Text({ variant = 'body', color = 'text', align, style, ...rest }: TextProps) {
  const { colors } = useTheme();
  const resolved = color in colors ? colors[color as ColorName] : color;
  return (
    <RNText
      style={[typography[variant], { color: resolved }, align && { textAlign: align }, style]}
      {...rest}
    />
  );
}
