import { Pressable, StyleSheet } from 'react-native';

import { haptic, type HapticEvent } from '@/ui/haptics';
import { Icon, type IconName } from '@/ui/icon';
import { layout, type ColorName } from '@/ui/theme/tokens';
import { useTheme } from '@/ui/theme/use-theme';

type IconButtonProps = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  /**
   * plain: just the icon · filled: on a surface-colored circle · overlay: white on a dark
   * circle, for use over images or video.
   */
  variant?: 'plain' | 'filled' | 'overlay';
  size?: number;
  /** Icon color: a theme color name, or any color (e.g. contrasted against a site's color). */
  color?: ColorName | (string & {});
  disabled?: boolean;
  /** Feedback on press (default: a light tap); false for none. */
  haptic?: HapticEvent | false;
};

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'plain',
  size = 20,
  color,
  disabled,
  haptic: feedback = 'tap',
}: IconButtonProps) {
  const { colors } = useTheme();
  const box = variant === 'plain' ? layout.minTouch - 8 : size + 14;
  const background =
    variant === 'filled' ? colors.surface : variant === 'overlay' ? colors.scrim : 'transparent';

  return (
    <Pressable
      onPress={() => {
        if (feedback) haptic(feedback);
        onPress();
      }}
      disabled={disabled}
      hitSlop={variant === 'plain' ? 4 : layout.hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        { width: box, height: box, borderRadius: box / 2, backgroundColor: background },
        (pressed || disabled) && styles.dimmed,
      ]}>
      <Icon
        name={icon}
        size={variant === 'plain' ? size : size - 4}
        color={color ?? (variant === 'overlay' ? 'onInverse' : variant === 'filled' ? 'textSecondary' : 'text')}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: {
    opacity: 0.5,
  },
});
