import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookmarkCard, displayUrl } from '@/features/bookmarks/bookmark-card';
import type { Site } from '@/features/sites/sites-store';
import { SiteIcon } from '@/features/sites/site-icon';
import { haptic, layout, Pressable, radius, space, Text, useTheme } from '@/ui';

type BookmarksGridProps = {
  site: Site;
  /** The page open right now, highlighted in the grid. */
  currentUrl: string;
  onOpen: (url: string) => void;
  onRemove: (bookmarkId: string) => void;
};

/** The pages saved inside one site, as preview cards, plus a shortcut back to where it starts. */
export function BookmarksGrid({ site, currentUrl, onOpen, onRemove }: BookmarksGridProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const onStartPage = currentUrl === site.url;

  return (
    <FlatList
      data={site.bookmarks ?? []}
      keyExtractor={(bookmark) => bookmark.id}
      numColumns={2}
      columnWrapperStyle={styles.column}
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + space.xl }]}
      ListHeaderComponent={
        <Pressable
          onPress={() => {
            haptic('tap');
            onOpen(site.url);
          }}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.startRow,
            { backgroundColor: colors.surface, borderColor: onStartPage ? colors.accent : 'transparent' },
            pressed && styles.pressed,
          ]}>
          <SiteIcon name={site.name} iconUrl={site.iconUrl} themeColor={site.themeColor} size={36} />
          <View style={styles.flex}>
            <Text variant="bodyStrong">Start page</Text>
            <Text variant="footnote" color="textSecondary" numberOfLines={1}>
              {displayUrl(site.url)}
            </Text>
          </View>
        </Pressable>
      }
      ListEmptyComponent={
        <Text variant="footnote" color="textSecondary" align="center" style={styles.empty}>
          No bookmarks yet. Tap the bookmark icon at the top while you&apos;re on a page to save it
          here.
        </Text>
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
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    paddingHorizontal: layout.gutter,
    gap: space.xl,
  },
  column: {
    justifyContent: 'space-between',
  },
  startRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  pressed: {
    opacity: 0.6,
  },
  empty: {
    paddingHorizontal: space.xl,
  },
});
