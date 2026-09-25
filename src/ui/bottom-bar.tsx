import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, space } from '@/ui/theme/tokens';
import { useTheme } from '@/ui/theme/use-theme';

/** Height of a BottomBar above the safe area; pass it to `Screen bottomInset` so nothing hides under it. */
export const BOTTOM_BAR_HEIGHT = layout.minTouch + space.md * 2;

/** An action bar pinned to the bottom of the screen (e.g. while editing), safe-area aware. */
export function BottomBar({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Animated.View
      entering={SlideInDown.duration(200)}
      exiting={SlideOutDown.duration(200)}
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.separator,
          paddingBottom: insets.bottom + space.md,
        },
      ]}>
      <View style={styles.row}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: space.md,
    paddingHorizontal: layout.gutter,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    minHeight: layout.minTouch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
});
