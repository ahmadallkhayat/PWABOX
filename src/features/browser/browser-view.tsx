import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
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
import { useSettings } from '@/features/settings/settings-store';
import type { SiteInfo } from '@/features/sites/site-info';
import { InstallSiteDialog } from '@/features/sites/install-site-dialog';
import { EmptyState, Icon, space, Toast, useTheme } from '@/ui';

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

  function open(input: string) {
    const url = resolveAddressInput(input, engine);
    if (!url) return;
    guard.allowNavigation(url);
    // Setting the same source again wouldn't reload it, so navigate from inside the page then.
    if (url === sourceUrl) guard.navigateTo(url);
    else setSourceUrl(url);
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
        installable={!!install.offer}
        onSubmit={open}
        onBack={() => webView.current?.goBack()}
        onForward={() => webView.current?.goForward()}
        onReload={() => webView.current?.reload()}
        onInstall={() => setInstalling(install.offer)}
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
          <View style={styles.start}>
            <Icon name="globe" size={48} color="textTertiary" />
            <EmptyState
              title="Browse the web"
              message={`Search with ${engine.name} or type a web address above. Sites that can be installed can be added to your Apps.`}
            />
          </View>
        )}

        {notice && <Toast {...notice} />}
      </View>

      <InstallSiteDialog info={installing} onClose={() => setInstalling(null)} />
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    paddingBottom: space.xxxl,
  },
});
