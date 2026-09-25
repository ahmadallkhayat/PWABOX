import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { haptic, type HapticEvent } from '@/ui/haptics';
import { Icon, type IconName } from '@/ui/icon';
import { Text } from '@/ui/text';
import { layout, radius, space, type ColorName } from '@/ui/theme/tokens';
import { useTheme } from '@/ui/theme/use-theme';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'plain' | 'inverse';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  /** Fill the available width. */
  stretch?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  /** Feedback on press (default: a light tap); false for none. */
  haptic?: HapticEvent | false;
};

const VARIANTS: Record<ButtonVariant, { background: ColorName | 'transparent' | '#FFFFFF'; text: ColorName }> = {
  primary: { background: 'accent', text: 'onAccent' },
  secondary: { background: 'surfaceSelected', text: 'text' },
  destructive: { background: 'danger', text: 'onDanger' },
  plain: { background: 'transparent', text: 'accent' },
  // White on a brand-colored screen (e.g. the lock screen).
  inverse: { background: '#FFFFFF', text: 'accent' },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  loading,
  stretch,
  style,
  accessibilityLabel,
  haptic: feedback = 'tap',
}: ButtonProps) {
  const { colors } = useTheme();
  const { background, text } = VARIANTS[variant];
  const backgroundColor =
    background === 'transparent' || background === '#FFFFFF' ? background : colors[background];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={() => {
        if (feedback) haptic(feedback);
        onPress();
      }}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      hitSlop={variant === 'plain' ? layout.hitSlop : undefined}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.small : styles.medium,
        variant === 'plain' && styles.plain,
        stretch && styles.stretch,
        { backgroundColor },
        (pressed || disabled) && styles.dimmed,
        style,
      ]}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={colors[text]} />
        ) : (
          icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} color={text} />
        )}
        <Text variant={size === 'sm' ? 'footnoteStrong' : 'bodyStrong'} color={text}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medium: {
    minHeight: layout.minTouch + space.xs,
    paddingHorizontal: space.xl,
  },
  small: {
    minHeight: 32,
    paddingHorizontal: space.md,
  },
  plain: {
    minHeight: 0,
    paddingHorizontal: 0,
  },
  stretch: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  dimmed: {
    opacity: 0.5,
  },
});
