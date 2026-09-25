import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';

import { AddSiteDialog } from '@/features/sites/add-site-dialog';
import { AppTile, TILE_WIDTH } from '@/features/sites/app-tile';
import { useSites } from '@/features/sites/sites-store';
import { useTabBar } from '@/lib/tab-bar';
import {
  BOTTOM_BAR_HEIGHT,
  BottomBar,
  Button,
  EmptyState,
  haptic,
  IconButton,
  layout,
  Screen,
  space,
  Text,
} from '@/ui';

export default function HomeScreen() {
  const { sites, loaded, removeSites, reorderSites } = useSites();
  const router = useRouter();
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

  const gridWidth = Math.min(width, layout.maxContentWidth) - layout.gutter * 2;
  const columns = Math.max(3, Math.floor(gridWidth / TILE_WIDTH));
  const allSelected = sites.length > 0 && sites.every((site) => selected.has(site.id));

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

  function deleteSelected() {
    const ids = sites.filter((site) => selected.has(site.id)).map((site) => site.id);
    if (ids.length === 0) return;

    const title = ids.length === 1 ? 'Remove 1 app?' : `Remove ${ids.length} apps?`;
    const message = 'Their bookmarks will be deleted too.';
    const remove = () => {
      haptic('success');
      removeSites(ids);
      setSelected(new Set());
    };

    haptic('warning');
    if (Platform.OS === 'web') {
      if (window.confirm(`${title} ${message}`)) remove();
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: remove },
    ]);
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () =>
            editing ? (
              <Button title="Done" variant="plain" onPress={stopEditing} />
            ) : (
              <View style={styles.headerActions}>
                {sites.length > 0 && <Button title="Edit" variant="plain" onPress={() => startEditing()} />}
                <IconButton icon="add" size={24} accessibilityLabel="Add website" onPress={() => setAdding(true)} />
              </View>
            ),
        }}
      />

      {!loaded ? (
        <Screen scroll={false} centered>
          <ActivityIndicator />
        </Screen>
      ) : sites.length === 0 ? (
        <Screen scroll={false} centered>
          <EmptyState
            title="No apps yet"
            message="Add any website and it opens here as an app, with its own icon and name."
            action={{ title: 'Add a website', onPress: () => setAdding(true) }}
          />
        </Screen>
      ) : (
        <Screen scrollRef={scrollRef} bottomInset={editing ? BOTTOM_BAR_HEIGHT : 0}>
          <Sortable.Grid
            data={sites}
            columns={columns}
            keyExtractor={(site) => site.id}
            renderItem={({ item }) => (
              <AppTile
                site={item}
                editing={editing}
                selected={selected.has(item.id)}
                onPress={() =>
                  editing
                    ? toggleSelected(item.id)
                    : router.push({ pathname: '/site/[id]', params: { id: item.id } })
                }
                onLongPress={() => {
                  if (!editing) startEditing(item.id);
                }}
              />
            )}
            sortEnabled={editing}
            onDragStart={() => haptic('dragStart')}
            onDragEnd={({ data }) => {
              haptic('drop');
              reorderSites(data.map((site) => site.id));
            }}
            scrollableRef={scrollRef}
            rowGap={space.xl}
            dragActivationDelay={150}
            activeItemScale={1.1}
            inactiveItemOpacity={0.8}
          />
          <Text variant="footnote" color="textSecondary" align="center">
            {editing ? 'Drag to reorder · Tap to select' : 'Long press an app to edit'}
          </Text>
        </Screen>
      )}

      {editing && (
        <BottomBar>
          <Button
            title={allSelected ? 'Deselect all' : 'Select all'}
            variant="plain"
            onPress={() => setSelected(allSelected ? new Set() : new Set(sites.map((site) => site.id)))}
            haptic="selection"
          />
          <Text variant="footnote" color="textSecondary" align="center" style={styles.flex}>
            {selected.size === 0 ? 'Tap apps to select' : `${selected.size} selected`}
          </Text>
          <Button
            title="Delete"
            icon="delete"
            variant="destructive"
            size="sm"
            onPress={deleteSelected}
            disabled={selected.size === 0}
            haptic={false}
          />
        </BottomBar>
      )}

      <AddSiteDialog visible={adding} onClose={() => setAdding(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
  },
});
