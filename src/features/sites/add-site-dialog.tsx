import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { fetchSiteInfo, normalizeUrl, type SiteInfo } from '@/features/sites/site-info';
import { SitePreviewForm } from '@/features/sites/site-preview-form';
import { useSites } from '@/features/sites/sites-store';
import { Button, Dialog, haptic, space, Text, TextField } from '@/ui';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string; fallback?: SiteInfo }
  | { kind: 'found'; info: SiteInfo };

/** The pop-up for adding a website: look it up, preview its icon and name, save. */
export function AddSiteDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  return (
    <Dialog visible={visible} title="Add website" onClose={onClose} dismissDisabled={loading}>
      <AddSiteForm onClose={onClose} onLoadingChange={setLoading} />
    </Dialog>
  );
}

function AddSiteForm({
  onClose,
  onLoadingChange,
}: {
  onClose: () => void;
  onLoadingChange: (loading: boolean) => void;
}) {
  const { addSite } = useSites();
  const [address, setAddress] = useState('');
  const [status, setStatusState] = useState<Status>({ kind: 'idle' });
  const loading = status.kind === 'loading';

  function setStatus(next: Status) {
    setStatusState(next);
    onLoadingChange(next.kind === 'loading');
  }

  async function lookUp() {
    let url: string;
    try {
      url = normalizeUrl(address);
    } catch (error) {
      haptic('error');
      setStatus({ kind: 'error', message: (error as Error).message });
      return;
    }

    setStatus({ kind: 'loading' });
    try {
      const info = await fetchSiteInfo(url);
      setStatus({ kind: 'found', info });
    } catch (error) {
      // The site might still work fine in the WebView (e.g. it blocks plain HTTP clients),
      // so let the user add it with basic details.
      haptic('warning');
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      setStatus({
        kind: 'error',
        message: (error as Error).message,
        fallback: { url, name: hostname, iconUrl: new URL('/favicon.ico', url).href },
      });
    }
  }

  function save(info: SiteInfo, name = info.name) {
    haptic('success');
    addSite({ ...info, name });
    onClose();
  }

  return (
    <>
      <View style={styles.row}>
        <TextField
          style={styles.flex}
          value={address}
          onChangeText={(text) => {
            setAddress(text);
            if (!loading) setStatus({ kind: 'idle' });
          }}
          onSubmitEditing={lookUp}
          placeholder="e.g. twitter.com"
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          editable={!loading}
          accessibilityLabel="Website address"
        />
        <Button title="Find" onPress={lookUp} disabled={!address.trim() || loading} />
      </View>

      {loading && (
        <View style={styles.message}>
          <ActivityIndicator />
          <Text variant="footnote" color="textSecondary">
            Looking up the website…
          </Text>
        </View>
      )}

      {status.kind === 'error' && (
        <View style={styles.message}>
          <Text variant="footnote" color="danger" align="center">
            {status.message}
          </Text>
          {status.fallback && (
            <Button
              title={`Add ${status.fallback.name} anyway`}
              variant="secondary"
              onPress={() => save(status.fallback!)}
              haptic={false}
            />
          )}
        </View>
      )}

      {status.kind === 'found' && (
        <SitePreviewForm info={status.info} onSave={(name) => save(status.info, name)} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  message: {
    alignItems: 'center',
    gap: space.md,
  },
});
