import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { haptic } from '@/ui/haptics';
import { Icon, type IconName } from '@/ui/icon';
import { IconButton } from '@/ui/icon-button';
import { Text } from '@/ui/text';
import { layout, radius, space } from '@/ui/theme/tokens';
import { useTheme } from '@/ui/theme/use-theme';

type ToastProps = {
  icon?: IconName;
  title: string;
  subtitle?: string;
  action?: { title: string; onPress: () => void };
  onDismiss: () => void;
  /** Hides itself after this long. Change `resetKey` to restart the timer. */
  duration?: number;
  resetKey?: string | number;
};

/**
 * A short floating notice at the bottom of its parent (position it inside a relative container).
 */
export function Toast({
  icon,
  title,
  subtitle,
  action,
  onDismiss,
  duration = 6000,
  resetKey,
}: ToastProps) {
  const { colors } = useTheme();

  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [resetKey, duration, onDismiss]);

  return (
    // Fade only: a sliding entrance would leave the action button untappable on Android
    // (react-native-reanimated#6676).
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(180)}
      style={styles.wrapper}
      pointerEvents="box-none">
      <View
        style={[styles.toast, { backgroundColor: colors.inverseSurface }]}
        accessibilityLiveRegion="polite">
        {icon && <Icon name={icon} size={18} color="onInverse" />}
        <View style={styles.text}>
          <Text variant="footnoteStrong" color="onInverse">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" color="onInverseSecondary" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {action && (
          <Pressable
            onPress={() => {
              haptic('tap');
              action.onPress();
            }}
            hitSlop={space.sm}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.action,
              { backgroundColor: colors.inverseSelected },
              pressed && styles.pressed,
            ]}>
            <Text variant="footnoteStrong" color="onInverse">
              {action.title}
            </Text>
          </Pressable>
        )}
        <IconButton icon="close" size={16} color="onInverse" accessibilityLabel="Dismiss" onPress={onDismiss} haptic={false} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: layout.gutter,
    right: layout.gutter,
    bottom: space.lg,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    width: '100%',
    maxWidth: 480,
    paddingLeft: space.lg,
    paddingRight: space.xs,
    paddingVertical: space.xs,
    borderRadius: radius.lg,
  },
  text: {
    flex: 1,
    paddingVertical: space.xs,
  },
  action: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
  },
  pressed: {
    opacity: 0.6,
  },
});
