import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { readableTextOn } from '@/features/sites/site-icon';
import { IconButton, space, Text, useTheme } from '@/ui';

const BAR_HEIGHT = 44;

type SiteTopBarProps = {
  title: string;
  /** Shown under the title, e.g. when the site navigated to another domain. */
  subtitle?: string;
  themeColor?: string;
  /** 0–1 page load progress; hidden once complete. */
  progress?: number;
  /** Whether the page currently shown is bookmarked. Bookmark buttons show when their handlers are given. */
  bookmarked?: boolean;
  onClose: () => void;
  onReload: () => void;
  onToggleBookmark?: () => void;
  onShowBookmarks?: () => void;
};

/** A slim bar in the site's theme color, standing in for the OS chrome an installed PWA gets. */
export function SiteTopBar({
  title,
  subtitle,
  themeColor,
  progress = 1,
  bookmarked,
  onClose,
  onReload,
  onToggleBookmark,
  onShowBookmarks,
}: SiteTopBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const background = isHexColor(themeColor) ? themeColor : colors.background;
  // Icons and text are contrasted against the site's color, not the app theme.
  const foreground = readableTextOn(background);

  return (
    <View style={[styles.bar, { paddingTop: insets.top, backgroundColor: background }]}>
      <StatusBar style={foreground === '#ffffff' ? 'light' : 'dark'} />
      <View style={styles.row}>
        <IconButton icon="close" color={foreground} accessibilityLabel="Close" onPress={onClose} />
        <View style={styles.titles}>
          <Text variant="subhead" color={foreground} numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" color={foreground} numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {onToggleBookmark && (
          <IconButton
            icon={bookmarked ? 'bookmarkFilled' : 'bookmark'}
            color={foreground}
            accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Bookmark this page'}
            onPress={onToggleBookmark}
            // The bookmark actions play their own success / removal feedback.
            haptic={false}
          />
        )}
        {onShowBookmarks && (
          <IconButton icon="bookmarks" color={foreground} accessibilityLabel="Bookmarks" onPress={onShowBookmarks} />
        )}
        <IconButton icon="reload" color={foreground} accessibilityLabel="Reload" onPress={onReload} />
      </View>
      {progress < 1 && (
        <View
          style={[styles.progress, { width: `${Math.max(progress, 0.05) * 100}%`, backgroundColor: foreground }]}
        />
      )}
    </View>
  );
}

function isHexColor(color: string | undefined): color is string {
  return !!color && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color.trim());
}

const styles = StyleSheet.create({
  bar: {
    zIndex: 1,
  },
  row: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.xs,
  },
  titles: {
    flex: 1,
    paddingHorizontal: space.xs,
  },
  title: {
    fontWeight: '600',
  },
  subtitle: {
    opacity: 0.7,
  },
  progress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    opacity: 0.6,
  },
});
