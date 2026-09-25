import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Sortable, { type SortableGridRenderItem } from 'react-native-sortables';

import { AddSiteDialog } from '@/components/add-site-dialog';
import { SiteIcon } from '@/components/site-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSites, type Site } from '@/lib/sites';
import { useTabBar } from '@/lib/tab-bar';

const TILE_WIDTH = 88;
const ICON_SIZE = 64;
const ACCENT = '#208AEF';
const DANGER = '#E5484D';

export default function HomeScreen() {
  const { sites, loaded, removeSites, reorderSites } = useSites();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const [editingRequested, setEditingRequested] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [adding, setAdding] = useState(false);
  // Deleting the last app ends edit mode by itself.
  const editing = editingRequested && sites.length > 0;

  // The edit bar takes the tab bar's place at the bottom.
  const { setTabBarHidden } = useTabBar();
  useEffect(() => {
    setTabBarHidden(editing);
    return () => setTabBarHidden(false);
  }, [editing, setTabBarHidden]);

  const contentWidth = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const columns = Math.max(3, Math.floor(contentWidth / TILE_WIDTH));

  function startEditing(firstSelectedId?: string) {
    setSelected(new Set(firstSelectedId ? [firstSelectedId] : []));
    setEditingRequested(true);
  }

  function stopEditing() {
    setEditingRequested(false);
    setSelected(new Set());
  }

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected = sites.length > 0 && sites.every((site) => selected.has(site.id));

  function deleteSelected() {
    const ids = sites.filter((site) => selected.has(site.id)).map((site) => site.id);
    if (ids.length === 0) return;

    const title = ids.length === 1 ? 'Remove 1 app?' : `Remove ${ids.length} apps?`;
    const message = 'Their bookmarks will be deleted too.';
    const remove = () => {
      removeSites(ids);
      setSelected(new Set());
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`${title} ${message}`)) remove();
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: remove },
    ]);
  }

  const renderItem: SortableGridRenderItem<Site> = ({ item }) => {
    const isSelected = selected.has(item.id);
    return (
      <Sortable.Touchable
        style={styles.tile}
        onTap={() =>
          editing
            ? toggleSelected(item.id)
            : router.push({ pathname: '/site/[id]', params: { id: item.id } })
        }
        onLongPress={() => {
          if (!editing) startEditing(item.id);
        }}
        accessibilityRole="button"
        accessibilityLabel={editing ? `${isSelected ? 'Deselect' : 'Select'} ${item.name}` : `Open ${item.name}`}
        accessibilityHint={editing ? 'Drag to reorder' : 'Long press to edit apps'}>
        <View>
          <SiteIcon name={item.name} iconUrl={item.iconUrl} themeColor={item.themeColor} size={ICON_SIZE} />
          {editing && (
            <View
              style={[
                styles.check,
                { borderColor: theme.background },
                isSelected ? styles.checkOn : { backgroundColor: theme.backgroundSelected },
              ]}>
              {isSelected && (
                <SymbolView
                  name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  tintColor="#ffffff"
                  size={12}
                />
              )}
            </View>
          )}
        </View>
        <ThemedText type="small" numberOfLines={1} style={styles.tileLabel}>
          {item.name}
        </ThemedText>
      </Sortable.Touchable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerLeft: editing
            ? () => (
                <HeaderTextButton
                  label={allSelected ? 'Deselect all' : 'Select all'}
                  onPress={() =>
                    setSelected(allSelected ? new Set() : new Set(sites.map((site) => site.id)))
                  }
                />
              )
            : undefined,
          headerRight: () =>
            editing ? (
              <HeaderTextButton label="Done" bold onPress={stopEditing} />
            ) : (
              <View style={styles.headerButtons}>
                {sites.length > 0 && <HeaderTextButton label="Edit" onPress={() => startEditing()} />}
                <Pressable hitSlop={12} accessibilityLabel="Add website" onPress={() => setAdding(true)}>
                  <SymbolView
                    name={{ ios: 'plus', android: 'add', web: 'add' }}
                    tintColor={theme.text}
                    size={24}
                  />
                </Pressable>
              </View>
            ),
        }}
      />

      {!loaded ? (
        <ActivityIndicator style={styles.loading} />
      ) : sites.length === 0 ? (
        <EmptyState onAdd={() => setAdding(true)} />
      ) : (
        <Animated.ScrollView
          ref={scrollRef}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            styles.grid,
            editing && { paddingBottom: insets.bottom + 96 },
          ]}>
          <Sortable.Grid
            data={sites}
            columns={columns}
            keyExtractor={(site) => site.id}
            renderItem={renderItem}
            sortEnabled={editing}
            onDragEnd={({ data }) => reorderSites(data.map((site) => site.id))}
            scrollableRef={scrollRef}
            rowGap={Spacing.four}
            dragActivationDelay={150}
            activeItemScale={1.1}
            inactiveItemOpacity={0.8}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            {editing ? 'Drag to reorder · Tap to select' : 'Long press an app to edit'}
          </ThemedText>
        </Animated.ScrollView>
      )}

      {editing && (
        <ThemedView
          type="backgroundElement"
          style={[styles.editBar, { paddingBottom: insets.bottom + Spacing.three }]}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
            {selected.size === 0 ? 'Select apps to remove' : `${selected.size} selected`}
          </ThemedText>
          <Pressable
            onPress={deleteSelected}
            disabled={selected.size === 0}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.deleteButton,
              (pressed || selected.size === 0) && styles.dimmed,
            ]}>
            <SymbolView
              name={{ ios: 'trash', android: 'delete', web: 'delete' }}
              tintColor="#ffffff"
              size={16}
            />
            <ThemedText style={styles.deleteText}>Delete</ThemedText>
          </Pressable>
        </ThemedView>
      )}

      <AddSiteDialog visible={adding} onClose={() => setAdding(false)} />
    </ThemedView>
  );
}

function HeaderTextButton({
  label,
  onPress,
  bold,
}: {
  label: string;
  onPress: () => void;
  bold?: boolean;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={12} accessibilityRole="button">
      <ThemedText style={[styles.headerText, bold && styles.headerTextBold]}>{label}</ThemedText>
    </Pressable>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.empty}>
      <ThemedText type="subtitle" style={styles.centered}>
        No apps yet
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.centered}>
        Add any website and it opens here as an app, with its own icon and name.
      </ThemedText>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.dimmed]}>
        <ThemedText style={styles.primaryButtonText}>Add a website</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loading: {
    marginTop: Spacing.six,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  headerText: {
    color: ACCENT,
    fontSize: 17,
  },
  headerTextBold: {
    fontWeight: 600,
  },
  grid: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  tile: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  tileLabel: {
    maxWidth: TILE_WIDTH,
    textAlign: 'center',
  },
  check: {
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
  checkOn: {
    backgroundColor: ACCENT,
  },
  hint: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
  editBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: DANGER,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: Spacing.five,
  },
  deleteText: {
    color: '#ffffff',
    fontWeight: 600,
  },
  dimmed: {
    opacity: 0.5,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  centered: {
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: Spacing.two,
    backgroundColor: ACCENT,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.five,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: 600,
  },
});
