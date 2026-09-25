import type { ReactNode } from 'react';
import { StyleSheet, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import Animated, { type AnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, space } from '@/ui/theme/tokens';
import { useTheme } from '@/ui/theme/use-theme';

type ScreenProps = {
  children: ReactNode;
  /** Scrollable content (default). Static screens (e.g. an empty state) pass false. */
  scroll?: boolean;
  /** For components that drive the scroll view, e.g. a sortable grid's auto-scroll. */
  scrollRef?: AnimatedRef<Animated.ScrollView>;
  /**
   * Safe-area edges to pad. Screens under a navigation header / above the tab bar get those
   * insets from the navigator, so they only need this when drawn edge to edge.
   */
  edges?: ('top' | 'bottom')[];
  /** Extra room at the bottom, e.g. for a BottomBar laid over the content. */
  bottomInset?: number;
  /** Space between direct children. */
  gap?: keyof typeof space;
  /** Center the content vertically (empty states, messages). */
  centered?: boolean;
  /** Let content use the full width instead of the side gutter. */
  fullBleed?: boolean;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
  contentStyle?: ViewStyle;
};

/**
 * The frame of every screen: theme background, consistent side gutter and vertical rhythm,
 * content width capped and centered on wide screens, and safe-area / navigator awareness.
 */
export function Screen({
  children,
  scroll = true,
  scrollRef,
  edges = [],
  bottomInset = 0,
  gap = 'xl',
  centered,
  fullBleed,
  keyboardShouldPersistTaps = 'handled',
  contentStyle,
}: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const content: ViewStyle[] = [
    styles.content,
    {
      gap: space[gap],
      paddingHorizontal: fullBleed ? 0 : layout.gutter,
      paddingTop: space.lg + (edges.includes('top') ? insets.top : 0),
      paddingBottom: space.xl + bottomInset + (edges.includes('bottom') ? insets.bottom : 0),
    },
    centered ? styles.centered : {},
    contentStyle ?? {},
  ];

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {scroll ? (
        <Animated.ScrollView
          ref={scrollRef}
          style={styles.fill}
          contentContainerStyle={[styles.grow, content]}
          // Lets iOS inset content under the large-title header and above the tab bar.
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}>
          {children}
        </Animated.ScrollView>
      ) : (
        <View style={[styles.fill, content]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  grow: {
    flexGrow: 1,
  },
  content: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  centered: {
    justifyContent: 'center',
  },
});
