import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { FlatList, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SiteIcon } from '@/components/site-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { previewUri } from '@/lib/previews';
import type { Bookmark, Site } from '@/lib/sites';

const ACCENT = '#208AEF';

type BookmarksSheetProps = {
  site: Site;
  visible: boolean;
  /** The page open right now, highlighted in the list. */
  currentUrl: string;
  onOpen: (url: string) => void;
  onRemove: (bookmarkId: string) => void;
  onClose: () => void;
};

/** The pages saved inside one site, as preview cards, plus a shortcut back to where it starts. */
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
  const onStartPage = currentUrl === site.url;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <ThemedView style={[styles.sheet, { paddingTop: Platform.OS === 'ios' ? 0 : insets.top }]}>
        <View style={styles.header}>
          <ThemedText type="smallBold" style={styles.headerTitle} numberOfLines={1}>
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
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.four }]}
          ListHeaderComponent={
            <Pressable
              onPress={() => onOpen(site.url)}
              style={({ pressed }) => [
                styles.startRow,
                { backgroundColor: theme.backgroundElement },
                onStartPage && styles.current,
                pressed && styles.pressed,
              ]}>
              <SiteIcon name={site.name} iconUrl={site.iconUrl} themeColor={site.themeColor} size={36} />
              <View style={styles.flex}>
                <ThemedText type="smallBold">Start page</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {displayUrl(site.url)}
                </ThemedText>
              </View>
            </Pressable>
          }
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              No bookmarks yet. Tap the bookmark icon at the top while you&apos;re on a page to
              save it here.
            </ThemedText>
          }
          renderItem={({ item }) => (
            <BookmarkCard
              bookmark={item}
              site={site}
              current={currentUrl === item.url}
              onOpen={() => onOpen(item.url)}
              onRemove={() => onRemove(item.id)}
            />
          )}
        />
      </ThemedView>
    </Modal>
  );
}

function BookmarkCard({
  bookmark,
  site,
  current,
  onOpen,
  onRemove,
}: {
  bookmark: Bookmark;
  site: Site;
  current: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onOpen}
      accessibilityLabel={`Open ${bookmark.title}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View
        style={[
          styles.thumbnail,
          { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
          current && styles.current,
        ]}>
        {bookmark.preview ? (
          <Image
            source={{ uri: previewUri(bookmark.preview) }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition="top"
            transition={150}
          />
        ) : (
          <SiteIcon name={site.name} iconUrl={site.iconUrl} themeColor={site.themeColor} size={48} />
        )}
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${bookmark.title}`}
          style={({ pressed }) => [styles.removeBadge, pressed && styles.pressed]}>
          <SymbolView
            name={{ ios: 'trash', android: 'delete', web: 'delete' }}
            tintColor="#ffffff"
            size={14}
          />
        </Pressable>
      </View>
      <ThemedText type="smallBold" numberOfLines={2}>
        {bookmark.title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        {displayUrl(bookmark.url)}
      </ThemedText>
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
  flex: {
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
    gap: Spacing.four,
  },
  column: {
    justifyContent: 'space-between',
  },
  startRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  card: {
    width: '48%',
    gap: Spacing.one,
  },
  thumbnail: {
    aspectRatio: 3 / 4,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  current: {
    borderColor: ACCENT,
    borderWidth: 2,
  },
  removeBadge: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  empty: {
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
});
