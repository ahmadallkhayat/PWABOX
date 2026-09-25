import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { haptic } from '@/ui/haptics';
import { Icon, type IconName } from '@/ui/icon';
import { Separator, Surface } from '@/ui/surface';
import { Text } from '@/ui/text';
import { layout, space } from '@/ui/theme/tokens';
import { useTheme } from '@/ui/theme/use-theme';

const ICON_SIZE = 20;
const ROW_PADDING = space.lg;

/** A titled group of rows (grouped-settings style). Separators between rows are added for you. */
export function ListSection({
  title,
  footer,
  children,
}: {
  title?: string;
  footer?: string;
  children: ReactNode;
}) {
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={styles.section}>
      {title && (
        <Text variant="footnoteStrong" color="textSecondary" style={styles.sectionTitle}>
          {title.toUpperCase()}
        </Text>
      )}
      <Surface>
        {rows.map((row, index) => (
          <Fragment key={row.key ?? index}>
            {index > 0 && <Separator inset={ROW_PADDING} />}
            {row}
          </Fragment>
        ))}
      </Surface>
      {footer && (
        <Text variant="footnote" color="textSecondary" style={styles.footer}>
          {footer}
        </Text>
      )}
    </View>
  );
}

type Accessory =
  | { type: 'switch'; value: boolean; onValueChange: (value: boolean) => void; disabled?: boolean }
  | { type: 'check'; checked: boolean }
  | { type: 'value'; text: string };

type ListRowProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  accessory?: Accessory;
  onPress?: () => void;
  accessibilityRole?: 'button' | 'radio';
};

export function ListRow({ title, subtitle, icon, accessory, onPress, accessibilityRole }: ListRowProps) {
  const { colors } = useTheme();

  const content = (
    <>
      {icon && <Icon name={icon} size={ICON_SIZE} />}
      <View style={styles.text}>
        <Text>{title}</Text>
        {subtitle && (
          <Text variant="footnote" color="textSecondary">
            {subtitle}
          </Text>
        )}
      </View>
      {accessory?.type === 'switch' && (
        <Switch
          value={accessory.value}
          disabled={accessory.disabled}
          onValueChange={(value) => {
            haptic(value ? 'toggleOn' : 'toggleOff');
            accessory.onValueChange(value);
          }}
          trackColor={{ true: colors.accent }}
        />
      )}
      {accessory?.type === 'check' && accessory.checked && <Icon name="check" color="accent" />}
      {accessory?.type === 'value' && <Text color="textSecondary">{accessory.text}</Text>}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;

  const checked = accessory?.type === 'check' ? accessory.checked : undefined;
  return (
    <Pressable
      onPress={() => {
        haptic('selection');
        onPress();
      }}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityState={checked === undefined ? undefined : { selected: checked }}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceSelected }]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: space.sm,
  },
  sectionTitle: {
    paddingHorizontal: ROW_PADDING,
  },
  footer: {
    paddingHorizontal: ROW_PADDING,
  },
  row: {
    minHeight: layout.minTouch + space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: ROW_PADDING,
    paddingVertical: space.md,
  },
  text: {
    flex: 1,
    gap: space.xxs,
  },
});
