import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { useTheme } from '@/ui/theme/use-theme';
import type { ColorName } from '@/ui/theme/tokens';

/**
 * Every icon the app uses, by meaning: SF Symbols on iOS, Material Symbols on Android / web.
 * Add new icons here rather than spelling out platform names in screens.
 */
const ICONS = {
  add: { ios: 'plus', android: 'add', web: 'add' },
  apps: { ios: 'square.grid.2x2', android: 'apps', web: 'apps' },
  block: { ios: 'nosign', android: 'block', web: 'block' },
  blocked: { ios: 'hand.raised.fill', android: 'block', web: 'block' },
  bookmark: { ios: 'bookmark', android: 'bookmark_border', web: 'bookmark_border' },
  bookmarkFilled: { ios: 'bookmark.fill', android: 'bookmark_added', web: 'bookmark_added' },
  bookmarks: { ios: 'book', android: 'bookmarks', web: 'bookmarks' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  delete: { ios: 'trash', android: 'delete', web: 'delete' },
  haptics: { ios: 'iphone.radiowaves.left.and.right', android: 'vibration', web: 'vibration' },
  home: { ios: 'house', android: 'home', web: 'home' },
  lock: { ios: 'lock.fill', android: 'lock', web: 'lock' },
  popup: { ios: 'macwindow.badge.plus', android: 'open_in_new_off', web: 'open_in_new_off' },
  redirect: {
    ios: 'arrow.triangle.turn.up.right.circle',
    android: 'alt_route',
    web: 'alt_route',
  },
  reload: { ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
} satisfies Record<string, SymbolViewProps['name']>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  /** A theme color name, or any color (e.g. one computed against a site's theme color). */
  color?: ColorName | (string & {});
};

export function Icon({ name, size = 20, color = 'text' }: IconProps) {
  const { colors } = useTheme();
  const tint = color in colors ? colors[color as ColorName] : color;
  return <SymbolView name={ICONS[name]} tintColor={tint} size={size} />;
}
