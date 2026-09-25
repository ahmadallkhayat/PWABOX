import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { layout, radius, space, typography } from '@/ui/theme/tokens';
import { useTheme } from '@/ui/theme/use-theme';

type TextFieldProps = TextInputProps & {
  /** Draw on the page background instead of a surface (for fields inside a card). */
  onSurface?: boolean;
};

export function TextField({ style, onSurface, ...rest }: TextFieldProps) {
  const { colors } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.textTertiary}
      selectionColor={colors.accent}
      style={[
        styles.input,
        { color: colors.text, backgroundColor: onSurface ? colors.background : colors.surface },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    ...typography.body,
    minHeight: layout.minTouch + space.xs,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
  },
});
