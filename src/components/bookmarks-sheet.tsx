import { SymbolView } from 'expo-symbols';
import type { ComponentProps, ReactNode } from 'react';
import { FlatList, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Site } from '@/lib/sites';

type BookmarksSheetProps = {
  site: Site;
  visible: boolean;
  /** The page open right now, highlighted in the list. */
  currentUrl: string;
  onOpen: (url: string) => void;
  onRemove: (bookmarkId: string) => void;
  onClose: () => void;
};

/** The pages saved inside one site, plus a shortcut back to where the site starts. */
export function BookmarksSheet({
  site,
  visible,
  currentUrl,
  onOpen,
  onRemove,
  onClose,
}: BookmarksSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bookmarks = site.bookmarks ?? [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <ThemedView
        style={[styles.sheet, { paddingTop: Platform.OS === 'ios' ? 0 : insets.top }]}>
        <View style={styles.header}>
          <ThemedText type="smallBold" style={styles.headerTitle}>
            {site.name} bookmarks
          </ThemedText>
          <Pressable onPress={onClose} hitSlop={12}>
            <ThemedText type="linkPrimary" style={styles.done}>
              Done
            </ThemedText>
          </Pressable>
        </View>

        <FlatList
          data={bookmarks}
          keyExtractor={(bookmark) => bookmark.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.four }]}
          ListHeaderComponent={
            <Row
              icon={{ ios: 'house', android: 'home', web: 'home' }}
              title="Start page"
              subtitle={displayUrl(site.url)}
              current={currentUrl === site.url}
              onPress={() => onOpen(site.url)}
            />
          }
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              No bookmarks yet. Tap the bookmark icon at the top while you&apos;re on a page to
              save it here.
            </ThemedText>
          }
          renderItem={({ item }) => (
            <Row
              icon={{ ios: 'bookmark', android: 'bookmark', web: 'bookmark' }}
              title={item.title}
              subtitle={displayUrl(item.url)}
              current={currentUrl === item.url}
              onPress={() => onOpen(item.url)}
              trailing={
                <Pressable
                  onPress={() => onRemove(item.id)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.title}`}
                  style={({ pressed }) => [styles.remove, pressed && styles.pressed]}>
                  <SymbolView
                    name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                    tintColor={theme.textSecondary}
                    size={18}
                  />
                </Pressable>
              }
            />
          )}
        />
      </ThemedView>
    </Modal>
  );
}

function Row({
  icon,
  title,
  subtitle,
  current,
  onPress,
  trailing,
}: {
  icon: ComponentProps<typeof SymbolView>['name'];
  title: string;
  subtitle: string;
  current: boolean;
  onPress: () => void;
  trailing?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: current ? theme.backgroundSelected : theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <SymbolView name={icon} tintColor={theme.text} size={18} />
      <View style={styles.rowText}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {subtitle}
        </ThemedText>
      </View>
      {trailing}
    </Pressable>
  );
}

/** "https://www.youtube.com/watch?v=x" -> "youtube.com/watch?v=x" */
function displayUrl(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
  },
  done: {
    fontSize: 16,
    fontWeight: 600,
  },
  list: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  rowText: {
    flex: 1,
  },
  remove: {
    padding: Spacing.one,
  },
  pressed: {
    opacity: 0.6,
  },
  empty: {
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
});
