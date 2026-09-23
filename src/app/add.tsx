import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string; fallback?: SiteInfo }
  | { kind: 'found'; info: SiteInfo };

export default function AddSiteScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { addSite } = useSites();

  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

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
    router.back();
  }

  const inputStyle = [
    styles.input,
    { color: theme.text, backgroundColor: theme.backgroundElement },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic">
          <ThemedText type="smallBold">Website address</ThemedText>
          <View style={styles.row}>
            <TextInput
              style={[inputStyle, styles.flex]}
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                if (status.kind !== 'loading') setStatus({ kind: 'idle' });
              }}
              onSubmitEditing={lookUp}
              placeholder="e.g. twitter.com"
              placeholderTextColor={theme.textSecondary}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              editable={status.kind !== 'loading'}
            />
            <Button
              label="Find"
              onPress={lookUp}
              disabled={!address.trim() || status.kind === 'loading'}
            />
          </View>

          {status.kind === 'loading' && (
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
            <ThemedView type="backgroundElement" style={styles.preview}>
              <SiteIcon
                name={name || status.info.name}
                iconUrl={status.info.iconUrl}
                themeColor={status.info.themeColor}
                size={88}
              />
              <View style={styles.previewField}>
                <ThemedText type="smallBold">Name</ThemedText>
                <TextInput
                  style={[inputStyle, { backgroundColor: theme.background }]}
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
              <Button label="Add to PWABOX" onPress={() => save(status.info, name)} />
            </ThemedView>
          )}
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

function Button({
  label,
  onPress,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
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
        { backgroundColor: primary ? '#208AEF' : theme.backgroundSelected },
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
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
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
    marginTop: Spacing.three,
    gap: Spacing.three,
    alignItems: 'center',
  },
  error: {
    color: '#E5484D',
    textAlign: 'center',
  },
  preview: {
    marginTop: Spacing.four,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    alignItems: 'center',
    gap: Spacing.four,
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
