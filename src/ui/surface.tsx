import { StyleSheet, View, type ViewProps } from 'react-native';

import { radius as radii, space, type ColorName } from '@/ui/theme/tokens';
import { useTheme } from '@/ui/theme/use-theme';

type SurfaceProps = ViewProps & {
  /** Background color from the theme (default: surface). */
  tone?: ColorName;
  padding?: keyof typeof space;
  radius?: keyof typeof radii;
};

/** A rounded, filled block: cards, list groups, dialogs. */
export function Surface({ tone = 'surface', padding = 'none', radius = 'lg', style, ...rest }: SurfaceProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colors[tone], padding: space[padding], borderRadius: radii[radius] },
        style,
      ]}
      {...rest}
    />
  );
}

/** A hairline between rows. `inset` lines it up with row text rather than the edge. */
export function Separator({ inset = 0 }: { inset?: number }) {
  const { colors } = useTheme();
  return <View style={[styles.separator, { backgroundColor: colors.separator, marginLeft: inset }]} />;
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});
