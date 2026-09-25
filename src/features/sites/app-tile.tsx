import { StyleSheet, View } from 'react-native';
import Sortable from 'react-native-sortables';

import type { Site } from '@/features/sites/sites-store';
import { SiteIcon } from '@/features/sites/site-icon';
import { haptic, Icon, space, Text, useTheme } from '@/ui';

export const TILE_WIDTH = 88;
const ICON_SIZE = 64;

type AppTileProps = {
  site: Site;
  editing: boolean;
  selected: boolean;
  onPress: () => void;
  onLongPress: () => void;
};

/** One app on the home grid: icon and name, with a selection badge in edit mode. */
export function AppTile({ site, editing, selected, onPress, onLongPress }: AppTileProps) {
  const { colors } = useTheme();
  return (
    // Sortable.Touchable so taps coexist with the grid's drag gesture.
    <Sortable.Touchable
      style={styles.tile}
      onTap={() => {
        haptic(editing ? 'selection' : 'tap');
        onPress();
      }}
      onLongPress={() => {
        haptic('longPress');
        onLongPress();
      }}
      accessibilityRole="button"
      accessibilityState={editing ? { selected } : undefined}
      accessibilityLabel={editing ? `${selected ? 'Deselect' : 'Select'} ${site.name}` : `Open ${site.name}`}
      accessibilityHint={editing ? 'Drag to reorder' : 'Long press to edit apps'}>
      <View>
        <SiteIcon name={site.name} iconUrl={site.iconUrl} themeColor={site.themeColor} size={ICON_SIZE} />
        {editing && (
          <View
            style={[
              styles.badge,
              { borderColor: colors.background },
              { backgroundColor: selected ? colors.accent : colors.surfaceSelected },
            ]}>
            {selected && <Icon name="check" size={12} color="onAccent" />}
          </View>
        )}
      </View>
      <Text variant="footnote" numberOfLines={1} align="center" style={styles.label}>
        {site.name}
      </Text>
    </Sortable.Touchable>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    gap: space.sm,
  },
  label: {
    maxWidth: TILE_WIDTH,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
