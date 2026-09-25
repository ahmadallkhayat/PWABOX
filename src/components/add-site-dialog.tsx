import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { SiteIcon } from '@/components/site-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchSiteInfo, normalizeUrl, type SiteInfo } from '@/lib/site-info';
import { useSites } from '@/lib/sites';

const ACCENT = '#208AEF';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string; fallback?: SiteInfo }
  | { kind: 'found'; info: SiteInfo };

/** A pop-up over the home screen for adding a website. */
export function AddSiteDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      {/* A Modal only renders its children while open, so the form starts fresh every time. */}
      <AddSiteForm onClose={onClose} />
    </Modal>
  );
}

function AddSiteForm({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const { addSite } = useSites();

  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const loading = status.kind === 'loading';

  async function lookUp() {
    let url: string;
    try {
      url = normalizeUrl(address);
    } catch (error) {
      setStatus({ kind: 'error', message: (error as Error).message });
      return;
    }

    setStatus({ kind: 'loading' });
    try {
      const info = await fetchSiteInfo(url);
      setName(info.name);
      setStatus({ kind: 'found', info });
    } catch (error) {
      // The site might still work fine in the WebView (e.g. it blocks plain HTTP clients),
      // so let the user add it with basic details.
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      setStatus({
        kind: 'error',
        message: (error as Error).message,
        fallback: { url, name: hostname, iconUrl: new URL('/favicon.ico', url).href },
      });
    }
  }

  function save(info: SiteInfo, displayName = info.name) {
    addSite({ ...info, name: displayName.trim() || info.name });
    onClose();
  }

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable
        style={styles.backdrop}
        onPress={loading ? undefined : onClose}
        accessibilityLabel="Close"
        accessible={false}>
        {/* Swallows taps so pressing inside the card doesn't close it. */}
        <Pressable onPress={() => {}} style={styles.cardWrapper} accessible={false}>
          <ThemedView style={styles.card}>
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}>
              <View style={styles.header}>
                <ThemedText type="smallBold" style={styles.title}>
                  Add website
                </ThemedText>
                <Pressable
                  onPress={onClose}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  style={[styles.close, { backgroundColor: theme.backgroundElement }]}>
                  <SymbolView
                    name={{ ios: 'xmark', android: 'close', web: 'close' }}
                    tintColor={theme.textSecondary}
                    size={14}
                  />
                </Pressable>
              </View>

              <View style={styles.row}>
                <TextInput
                  style={[inputStyle, styles.flex]}
                  value={address}
                  onChangeText={(text) => {
                    setAddress(text);
                    if (!loading) setStatus({ kind: 'idle' });
                  }}
                  onSubmitEditing={lookUp}
                  placeholder="e.g. twitter.com"
                  placeholderTextColor={theme.textSecondary}
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="go"
                  editable={!loading}
                />
                <Button label="Find" onPress={lookUp} disabled={!address.trim() || loading} />
              </View>

              {loading && (
                <View style={styles.message}>
                  <ActivityIndicator />
                  <ThemedText type="small" themeColor="textSecondary">
                    Looking up the website…
                  </ThemedText>
                </View>
              )}

              {status.kind === 'error' && (
                <View style={styles.message}>
                  <ThemedText type="small" style={styles.error}>
                    {status.message}
                  </ThemedText>
                  {status.fallback && (
                    <Button
                      label={`Add ${status.fallback.name} anyway`}
                      variant="secondary"
                      onPress={() => save(status.fallback!)}
                    />
                  )}
                </View>
              )}

              {status.kind === 'found' && (
                <View style={styles.preview}>
                  <SiteIcon
                    name={name || status.info.name}
                    iconUrl={status.info.iconUrl}
                    themeColor={status.info.themeColor}
                    size={72}
                  />
                  <View style={styles.previewField}>
                    <ThemedText type="smallBold">Name</ThemedText>
                    <TextInput
                      style={inputStyle}
                      value={name}
                      onChangeText={setName}
                      placeholder={status.info.name}
                      placeholderTextColor={theme.textSecondary}
                      returnKeyType="done"
                      maxLength={40}
                    />
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                      {status.info.url}
                    </ThemedText>
                  </View>
                  <Button label="Add to PWABOX" onPress={() => save(status.info, name)} stretch />
                </View>
              )}
            </ScrollView>
          </ThemedView>
        </Pressable>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

function Button({
  label,
  onPress,
  disabled,
  stretch,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  stretch?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  const theme = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        stretch && styles.stretch,
        { backgroundColor: primary ? ACCENT : theme.backgroundSelected },
        (pressed || disabled) && styles.dimmed,
      ]}>
      <ThemedText style={[styles.buttonText, primary && styles.buttonTextPrimary]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    alignSelf: 'center',
  },
  card: {
    borderRadius: Spacing.four,
    overflow: 'hidden',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
  },
  close: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  input: {
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  message: {
    gap: Spacing.three,
    alignItems: 'center',
  },
  error: {
    color: '#E5484D',
    textAlign: 'center',
  },
  preview: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  previewField: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
  button: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  stretch: {
    alignSelf: 'stretch',
  },
  buttonText: {
    fontWeight: 600,
  },
  buttonTextPrimary: {
    color: '#ffffff',
  },
  dimmed: {
    opacity: 0.5,
  },
});
