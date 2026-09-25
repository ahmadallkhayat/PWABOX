import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AddressBar } from '@/features/browser/address-bar';
import { findEngine, resolveAddressInput } from '@/features/browser/search-engines';
import { useSettings } from '@/features/settings/settings-store';
import { EmptyState, useTheme } from '@/ui';

/**
 * Web has no WebView, so pages load in an iframe. Many sites refuse to be framed and there's
 * no install offer here; the phone apps have neither limitation.
 */
export function BrowserView() {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const engine = findEngine(settings.searchEngineId, settings.customSearchEngines);
  const [url, setUrl] = useState('');

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <AddressBar
        url={url}
        engineName={engine.name}
        canGoBack={false}
        canGoForward={false}
        progress={1}
        installable={false}
        onSubmit={(input) => setUrl(resolveAddressInput(input, engine) ?? url)}
        onBack={() => {}}
        onForward={() => {}}
        onReload={() => setUrl((current) => current)}
        onInstall={() => {}}
      />
      {url ? (
        <iframe src={url} title="Browser" style={{ flex: 1, border: 'none', width: '100%' }} />
      ) : (
        <View style={[styles.fill, styles.start]}>
          <EmptyState title="Browse the web" message={`Search with ${engine.name} or type a web address above.`} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  start: {
    justifyContent: 'center',
  },
});
