import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { BackHandler, Keyboard, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { AddressBar } from '@/features/browser/address-bar';
import { PageError } from '@/features/browser/page-error';
import {
  FULLSCREEN_MESSAGE,
  MANIFEST_MESSAGE,
  parsePageMessage,
  POPUP_MESSAGE,
} from '@/features/browser/scripts/bridge';
import { buildPageScript } from '@/features/browser/scripts/page-script';
import { findEngine, resolveAddressInput } from '@/features/browser/search-engines';
import { useFullscreenVideo } from '@/features/browser/use-fullscreen-video';
import { useInstallOffer } from '@/features/browser/use-install-offer';
import { useNavigationGuard } from '@/features/browser/use-navigation-guard';
import { HistoryList, HistoryRow } from '@/features/history/history-list';
import { useHistory } from '@/features/history/history-store';
import { HistorySuggestions } from '@/features/history/history-suggestions';
import { useHistoryRecorder } from '@/features/history/use-history-recorder';
import { useSettings } from '@/features/settings/settings-store';
import type { SiteInfo } from '@/features/sites/site-info';
import { InstallSiteDialog } from '@/features/sites/install-site-dialog';
import { EmptyState, haptic, Icon, layout, ListRow, Separator, Sheet, space, Text, Toast, useTheme } from '@/ui';

/** The Browser tab: an address/search bar over one web page, with the same protections as apps. */
export function BrowserView() {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const engine = findEngine(settings.searchEngineId, settings.customSearchEngines);

  const webView = useRef<WebView>(null);
  // What the WebView was told to load; later pages come from the user navigating inside it.
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [progress, setProgress] = useState(0);
  // Browsing isn't tied to an app, so "Allow" on a blocked redirect lasts for this session.
  const [allowedSites, setAllowedSites] = useState<string[]>([]);
  const [installing, setInstalling] = useState<SiteInfo | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [message, setMessage] = useState<{ title: string; id: number } | null>(null);
  const dismissMessage = useCallback(() => setMessage(null), [setMessage]);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const history = useHistory();
  const browserHistory = history.entriesFor('browser');
  const recordHistory = useHistoryRecorder('browser');

  const guard = useNavigationGuard({
    currentUrl,
    webView,
    allowedSites,
    onAllowSite: (site) => setAllowedSites((current) => [...current, site]),
  });
  const install = useInstallOffer();
  const handleFullscreenMessage = useFullscreenVideo(webView);

  // Android's back button goes back through the pages first.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!canGoBack) return false;
        webView.current?.goBack();
        return true;
      });
      return () => subscription.remove();
    }, [canGoBack])
  );

  /** Opens a page picked from history (suggestions, start page or the history sheet). */
  function openFromHistory(url: string) {
    Keyboard.dismiss();
    setShowHistory(false);
    open(url);
  }

  function open(input: string) {
    const url = resolveAddressInput(input, engine);
    if (!url) return;
    guard.allowNavigation(url);
    // Setting the same source again wouldn't reload it, so navigate from inside the page then.
    if (url === sourceUrl) guard.navigateTo(url);
    else setSourceUrl(url);
  }

  async function addCurrentPage() {
    if (install.isSaved(currentUrl)) {
      haptic('warning');
      setMessage({ title: `${displayHost(currentUrl)} is already in your Apps`, id: Date.now() });
      return;
    }
    if (install.offer) {
      setInstalling(install.offer);
      return;
    }
    setLookingUp(true);
    const info = await install.infoForPage(currentUrl);
    setLookingUp(false);
    setInstalling(info);
  }

  const pageScript = buildPageScript({ ...settings, detectManifest: true });
  const notice = guard.blocked
    ? {
        icon: 'blocked' as const,
        title: guard.blocked.kind === 'popup' ? 'Pop-up blocked' : 'Redirect blocked',
        subtitle: displayHost(guard.blocked.url),
        action: {
          title: guard.blocked.kind === 'popup' ? 'Open' : 'Allow',
          onPress: () => guard.blocked && guard.allowBlocked(guard.blocked),
        },
        onDismiss: guard.dismissBlocked,
        resetKey: `blocked-${guard.blocked.id}`,
      }
    : message
      ? { icon: 'apps' as const, title: message.title, onDismiss: dismissMessage, resetKey: `message-${message.id}` }
      : install.prompt
      ? {
          icon: 'install' as const,
          title: `Add ${install.prompt.name} as an app?`,
          subtitle: 'Open it from Apps, full screen',
          action: {
            title: 'Add',
            onPress: () => {
              setInstalling(install.prompt);
              install.dismissPrompt();
            },
          },
          onDismiss: install.dismissPrompt,
          resetKey: `install-${install.prompt.url}`,
        }
      : null;

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <AddressBar
        url={currentUrl}
        engineName={engine.name}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        progress={progress}
        install={lookingUp ? 'loading' : install.offer ? 'suggested' : 'available'}
        onSubmit={open}
        onEditingChange={setEditing}
        onQueryChange={setQuery}
        onBack={() => webView.current?.goBack()}
        onForward={() => webView.current?.goForward()}
        onReload={() => webView.current?.reload()}
        onInstall={addCurrentPage}
      />

      <View style={styles.fill} onTouchStart={guard.markTouch}>
        {sourceUrl ? (
          <WebView
            ref={webView}
            source={{ uri: sourceUrl }}
            style={styles.fill}
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            cacheEnabled
            allowsBackForwardNavigationGestures
            pullToRefreshEnabled
            allowsInlineMediaPlayback
            allowsFullscreenVideo
            allowsPictureInPictureMediaPlayback
            // iOS: keep pages clear of the tab bar, which sits over the bottom of the screen.
            contentInsetAdjustmentBehavior="automatic"
            // See buildPageScript for why it's injected twice.
            injectedJavaScriptBeforeContentLoaded={pageScript}
            injectedJavaScriptBeforeContentLoadedForMainFrameOnly={false}
            injectedJavaScript={pageScript}
            onMessage={(event) => {
              const message = parsePageMessage(event.nativeEvent.data);
              if (message?.type === FULLSCREEN_MESSAGE) handleFullscreenMessage(message);
              else if (message?.type === POPUP_MESSAGE) guard.reportBlockedPopup(message.url);
              else if (message?.type === MANIFEST_MESSAGE) install.manifestFound(message.pageUrl);
            }}
            setSupportMultipleWindows
            javaScriptCanOpenWindowsAutomatically={false}
            onOpenWindow={guard.handleOpenWindow}
            onShouldStartLoadWithRequest={guard.shouldStartLoad}
            onNavigationStateChange={(state) => {
              setCurrentUrl(state.url);
              setCanGoBack(state.canGoBack);
              setCanGoForward(state.canGoForward);
              install.pageChanged(state.url);
              recordHistory(state);
            }}
            onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
            renderError={(_domain, _code, description) => (
              <PageError
                siteName={displayHost(currentUrl || sourceUrl) ?? 'this page'}
                description={description}
                onRetry={() => webView.current?.reload()}
              />
            )}
          />
        ) : (
          <StartPage
            engineName={engine.name}
            recent={browserHistory.slice(0, 5)}
            onOpen={openFromHistory}
            onShowAll={() => setShowHistory(true)}
          />
        )}

        {editing && (
          <HistorySuggestions
            entries={browserHistory}
            query={query}
            onOpen={openFromHistory}
            onShowAll={() => {
              Keyboard.dismiss();
              setShowHistory(true);
            }}
          />
        )}

        {notice && <Toast {...notice} />}
      </View>

      <InstallSiteDialog info={installing} onClose={() => setInstalling(null)} />
      <Sheet visible={showHistory} title="History" onClose={() => setShowHistory(false)}>
        <HistoryList
          entries={browserHistory}
          onOpen={openFromHistory}
          onRemove={history.remove}
          onClear={() => history.clear('browser')}
        />
      </Sheet>
    </View>
  );
}

/** What the Browser shows before any page: a hint and the most recent pages. */
function StartPage({
  engineName,
  recent,
  onOpen,
  onShowAll,
}: {
  engineName: string;
  recent: ReturnType<typeof useHistory>['entries'];
  onOpen: (url: string) => void;
  onShowAll: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.start}>
      <View style={styles.startHero}>
        <Icon name="globe" size={48} color="textTertiary" />
        <EmptyState
          title="Browse the web"
          message={`Search with ${engineName} or type a web address above. Sites that can be installed can be added to your Apps.`}
        />
      </View>
      {recent.length > 0 && (
        <View>
          <Text variant="footnoteStrong" color="textSecondary" style={styles.recentHeading}>
            RECENT
          </Text>
          {recent.map((entry, index) => (
            <View key={entry.id}>
              {index > 0 && <Separator inset={layout.gutter} />}
              <HistoryRow entry={entry} onOpen={onOpen} highlight={colors.surfaceSelected} />
            </View>
          ))}
          <ListRow icon="history" title="Show all history" accessory={{ type: 'link' }} onPress={onShowAll} />
        </View>
      )}
    </View>
  );
}

function displayHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  start: {
    flex: 1,
    justifyContent: 'center',
    gap: space.xl,
    paddingBottom: space.xl,
  },
  startHero: {
    alignItems: 'center',
    gap: space.lg,
  },
  recentHeading: {
    paddingHorizontal: layout.gutter,
    paddingBottom: space.sm,
  },
});
