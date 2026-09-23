import { StatusBar } from 'expo-status-bar';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { readableTextOn } from '@/components/site-icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SiteTopBarProps = {
  title: string;
  /** Shown under the title, e.g. when the site navigated to another domain. */
  subtitle?: string;
  themeColor?: string;
  /** 0–1 page load progress; hidden once complete. */
  progress?: number;
  /** Whether the page currently shown is bookmarked; bookmark buttons are hidden when omitted. */
  bookmarked?: boolean;
  onClose: () => void;
  onReload: () => void;
  onToggleBookmark?: () => void;
  onShowBookmarks?: () => void;
};

/** A slim, theme-colored bar standing in for the OS chrome an installed PWA would get. */
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
  const theme = useTheme();
  const background = isHexColor(themeColor) ? themeColor : theme.background;
  const foreground = readableTextOn(background);

  return (
    <View style={[styles.bar, { paddingTop: insets.top, backgroundColor: background }]}>
      <StatusBar style={foreground === '#ffffff' ? 'light' : 'dark'} />
      <View style={styles.row}>
        <IconButton
          name={{ ios: 'xmark', android: 'close', web: 'close' }}
          color={foreground}
          label="Close"
          onPress={onClose}
        />
        <View style={styles.titles}>
          <Text style={[styles.title, { color: foreground }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: foreground }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {onToggleBookmark && (
          <IconButton
            name={
              bookmarked
                ? { ios: 'bookmark.fill', android: 'bookmark_added', web: 'bookmark_added' }
                : { ios: 'bookmark', android: 'bookmark_border', web: 'bookmark_border' }
            }
            color={foreground}
            label={bookmarked ? 'Remove bookmark' : 'Bookmark this page'}
            onPress={onToggleBookmark}
          />
        )}
        {onShowBookmarks && (
          <IconButton
            name={{ ios: 'book', android: 'bookmarks', web: 'bookmarks' }}
            color={foreground}
            label="Bookmarks"
            onPress={onShowBookmarks}
          />
        )}
        <IconButton
          name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
          color={foreground}
          label="Reload"
          onPress={onReload}
        />
      </View>
      {progress < 1 && (
        <View
          style={[styles.progress, { width: `${Math.max(progress, 0.05) * 100}%`, backgroundColor: foreground }]}
        />
      )}
    </View>
  );
}

function IconButton({
  name,
  color,
  label,
  onPress,
}: {
  name: SymbolViewProps['name'];
  color: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <SymbolView name={name} tintColor={color} size={20} />
    </Pressable>
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
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    gap: Spacing.one,
  },
  titles: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.one,
  },
  title: {
    fontSize: 15,
    fontWeight: 600,
  },
  subtitle: {
    fontSize: 11,
    opacity: 0.7,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.5,
  },
  progress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    opacity: 0.6,
  },
});
