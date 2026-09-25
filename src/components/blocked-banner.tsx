import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';

const VISIBLE_MS = 6000;

export type BlockedItem = {
  kind: 'popup' | 'redirect';
  url: string;
  /** Changes for every block, so a repeat of the same URL restarts the timer. */
  id: number;
};

type BlockedBannerProps = {
  item: BlockedItem;
  /** Open the pop-up / follow the redirect after all. */
  onAllow: () => void;
  onDismiss: () => void;
};

/** A short notice at the bottom of the site that something was blocked, with a way past it. */
export function BlockedBanner({ item, onAllow, onDismiss }: BlockedBannerProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  const host = hostLabel(item.url);
  return (
    <Animated.View
      entering={FadeInDown.duration(180)}
      exiting={FadeOutDown.duration(180)}
      style={styles.wrapper}
      pointerEvents="box-none">
      <View style={styles.banner} accessibilityLiveRegion="polite">
        <SymbolView
          name={{ ios: 'hand.raised.fill', android: 'block', web: 'block' }}
          tintColor="#ffffff"
          size={18}
        />
        <View style={styles.text}>
          <Text style={styles.title}>
            {item.kind === 'popup' ? 'Pop-up blocked' : 'Redirect blocked'}
          </Text>
          {host ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {host}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={onAllow}
          hitSlop={8}
          accessibilityRole="button"
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Text style={styles.actionText}>{item.kind === 'popup' ? 'Open' : 'Allow'}</Text>
        </Pressable>
        <Pressable
          onPress={onDismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
          <SymbolView
            name={{ ios: 'xmark', android: 'close', web: 'close' }}
            tintColor="#ffffff"
            size={14}
          />
        </Pressable>
      </View>
    </Animated.View>
  );
}

function hostLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.three,
    alignItems: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    maxWidth: 480,
    width: '100%',
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
    backgroundColor: 'rgba(28, 28, 32, 0.94)',
  },
  text: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  action: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  actionText: {
    color: '#ffffff',
    fontWeight: 600,
  },
  close: {
    padding: Spacing.one,
  },
  pressed: {
    opacity: 0.6,
  },
});
