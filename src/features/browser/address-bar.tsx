import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton, layout, radius, space, TextField, useTheme } from '@/ui';

type AddressBarProps = {
  /** The page shown, or '' on the start page. */
  url: string;
  /** The search engine's name, for the placeholder. */
  engineName: string;
  canGoBack: boolean;
  canGoForward: boolean;
  /** 0–1 page load progress; hidden once complete. */
  progress: number;
  /** Offer the "add as app" button. */
  installable: boolean;
  onSubmit: (text: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onInstall: () => void;
};

/**
 * The browser's top bar. The field shows just the site while browsing and the full address,
 * selected, while typing.
 */
export function AddressBar({
  url,
  engineName,
  canGoBack,
  canGoForward,
  progress,
  installable,
  onSubmit,
  onBack,
  onForward,
  onReload,
  onInstall,
}: AddressBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState('');
  const field = useRef<TextInput>(null);

  const loading = progress > 0 && progress < 1;

  return (
    <View
      style={[
        styles.bar,
        { paddingTop: insets.top + space.sm, backgroundColor: colors.background, borderBottomColor: colors.separator },
      ]}>
      <View style={styles.row}>
        {!focused && (
          <>
            <IconButton icon="back" accessibilityLabel="Back" onPress={onBack} disabled={!canGoBack} />
            <IconButton icon="forward" accessibilityLabel="Forward" onPress={onForward} disabled={!canGoForward} />
          </>
        )}
        <TextField
          ref={field}
          style={styles.field}
          value={focused ? text : displayAddress(url)}
          onChangeText={setText}
          onFocus={() => {
            setText(url);
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
          onSubmitEditing={() => {
            if (text.trim()) onSubmit(text);
          }}
          placeholder={`Search ${engineName} or type an address`}
          selectTextOnFocus
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="web-search"
          returnKeyType="go"
          accessibilityLabel="Address and search"
        />
        {focused ? (
          <Button title="Cancel" variant="plain" onPress={() => field.current?.blur()} haptic={false} />
        ) : (
          <>
            {installable && (
              <IconButton icon="install" color="accent" accessibilityLabel="Add as app" onPress={onInstall} />
            )}
            {url ? <IconButton icon="reload" accessibilityLabel="Reload" onPress={onReload} /> : null}
          </>
        )}
      </View>
      {loading && (
        <View style={[styles.progress, { width: `${Math.max(progress, 0.05) * 100}%`, backgroundColor: colors.accent }]} />
      )}
    </View>
  );
}

/** "https://www.youtube.com/watch?v=1" -> "youtube.com" while browsing. */
function displayAddress(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: space.sm,
    paddingBottom: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  field: {
    flex: 1,
    minHeight: layout.minTouch - 4,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
  },
  progress: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 2,
  },
});
