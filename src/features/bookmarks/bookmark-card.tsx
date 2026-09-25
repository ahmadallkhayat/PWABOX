import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { previewUri } from '@/features/bookmarks/previews';
import type { Bookmark, Site } from '@/features/sites/sites-store';
import { SiteIcon } from '@/features/sites/site-icon';
import { haptic, IconButton, Pressable, radius, space, Text, useTheme } from '@/ui';

type BookmarkCardProps = {
  bookmark: Bookmark;
  site: Site;
  /** The page open right now, outlined. */
  current: boolean;
  onOpen: () => void;
  onRemove: () => void;
};

/** A bookmark as a card: screenshot preview (or the site's icon), title and address. */
export function BookmarkCard({ bookmark, site, current, onOpen, onRemove }: BookmarkCardProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        haptic('tap');
        onOpen();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Open ${bookmark.title}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View
        style={[
          styles.thumbnail,
          { backgroundColor: colors.surface, borderColor: current ? colors.accent : colors.separator },
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
        <View style={styles.remove}>
          <IconButton
            icon="delete"
            variant="overlay"
            size={18}
            accessibilityLabel={`Remove ${bookmark.title}`}
            onPress={onRemove}
            haptic="warning"
          />
        </View>
      </View>
      <Text variant="footnoteStrong" numberOfLines={2}>
        {bookmark.title}
      </Text>
      <Text variant="caption" color="textSecondary" numberOfLines={1}>
        {displayUrl(bookmark.url)}
      </Text>
    </Pressable>
  );
}

/** "https://www.youtube.com/watch?v=x" -> "youtube.com/watch?v=x" */
export function displayUrl(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    gap: space.xs,
  },
  thumbnail: {
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  current: {
    borderWidth: 2,
  },
  remove: {
    position: 'absolute',
    top: space.sm,
    right: space.sm,
  },
  pressed: {
    opacity: 0.6,
  },
});
