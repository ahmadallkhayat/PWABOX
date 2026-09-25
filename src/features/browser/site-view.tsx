import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { BookmarksSheet } from '@/features/bookmarks/bookmarks-sheet';
import { useBookmarkActions } from '@/features/bookmarks/use-bookmark-actions';
import { PageError } from '@/features/browser/page-error';
import { FULLSCREEN_MESSAGE, parsePageMessage, POPUP_MESSAGE } from '@/features/browser/scripts/bridge';
import { buildPageScript } from '@/features/browser/scripts/page-script';
import { SiteTopBar } from '@/features/browser/site-top-bar';
import { useFullscreenVideo } from '@/features/browser/use-fullscreen-video';
import { useNavigationGuard } from '@/features/browser/use-navigation-guard';
import { useSettings } from '@/features/settings/settings-store';
import { useSites, type Site } from '@/features/sites/sites-store';
import { Toast, useTheme } from '@/ui';

/** Runs a saved site full screen in a WebView, like an installed PWA. */
export function SiteView({ site }: { site: Site }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { settings } = useSettings();

  const webView = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(site.url);
  const [currentTitle, setCurrentTitle] = useState('');
  const [progress, setProgress] = useState(0);
  const [showBookmarks, setShowBookmarks] = useState(false);

  const { currentBookmark, toggleBookmark, removeBookmark, pageView, onPageLayout } = useBookmarkActions({
    site,
    currentUrl,
    currentTitle,
    pageLoaded: progress >= 1,
  });
  const { allowRedirectsTo } = useSites();
  const guard = useNavigationGuard({
    homeUrl: site.url,
    currentUrl,
    webView,
    allowedSites: site.allowedRedirects,
    // Remembered for this app, so a login on another domain only needs allowing once.
    onAllowSite: (otherSite) => allowRedirectsTo(site.id, otherSite),
  });
  const handleFullscreenMessage = useFullscreenVideo(webView);

  // Android's back button walks back through the site's history before leaving it.
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

  function openPage(url: string) {
    setShowBookmarks(false);
    if (url !== currentUrl) guard.navigateTo(url);
  }

  const siteHost = displayHost(site.url);
  const currentHost = displayHost(currentUrl);
  const pageScript = buildPageScript(settings);

  return (
    // Keeps the site above Android's navigation bar / the iPhone home indicator, like an
    // installed PWA, with the strip below painted in the site's own background color.
    <View
      style={[
        styles.fill,
        { paddingBottom: insets.bottom, backgroundColor: site.backgroundColor ?? colors.background },
      ]}>
      <SiteTopBar
        title={site.name}
        subtitle={currentHost && currentHost !== siteHost ? currentHost : undefined}
        themeColor={site.themeColor}
        progress={progress}
        bookmarked={!!currentBookmark}
        onClose={() => router.back()}
        onReload={() => webView.current?.reload()}
        onToggleBookmark={toggleBookmark}
        onShowBookmarks={() => setShowBookmarks(true)}
      />
      <BookmarksSheet
        site={site}
        visible={showBookmarks}
        currentUrl={currentUrl}
        onOpen={openPage}
        onRemove={removeBookmark}
        onClose={() => setShowBookmarks(false)}
      />
      <View
        ref={pageView}
        // Android can only screenshot a WebView through a real (non-collapsed) parent view.
        collapsable={false}
        style={styles.fill}
        onTouchStart={guard.markTouch}
        onLayout={onPageLayout}>
        <WebView
          ref={webView}
          source={{ uri: site.url }}
          style={[styles.fill, site.backgroundColor ? { backgroundColor: site.backgroundColor } : null]}
          // Keep logins, local storage and service workers around between launches.
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          cacheEnabled
          // Feel like an app rather than a browser tab.
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          allowsPictureInPictureMediaPlayback
          overScrollMode="never"
          // See buildPageScript for why it's injected twice.
          injectedJavaScriptBeforeContentLoaded={pageScript}
          injectedJavaScriptBeforeContentLoadedForMainFrameOnly={false}
          injectedJavaScript={pageScript}
          onMessage={(event) => {
            const message = parsePageMessage(event.nativeEvent.data);
            if (message?.type === FULLSCREEN_MESSAGE) handleFullscreenMessage(message);
            else if (message?.type === POPUP_MESSAGE) guard.reportBlockedPopup(message.url);
          }}
          // Pop-ups come to onOpenWindow. (Turning multiple windows off instead would let a
          // malicious frame take over the page, per the react-native-webview docs.)
          setSupportMultipleWindows
          javaScriptCanOpenWindowsAutomatically={false}
          onOpenWindow={guard.handleOpenWindow}
          onShouldStartLoadWithRequest={guard.shouldStartLoad}
          onNavigationStateChange={(state) => {
            setCanGoBack(state.canGoBack);
            setCurrentUrl(state.url);
            setCurrentTitle(state.title);
          }}
          onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
          renderError={(_domain, _code, description) => (
            <PageError siteName={site.name} description={description} onRetry={() => webView.current?.reload()} />
          )}
        />
        {guard.blocked && (
          <Toast
            icon="blocked"
            title={guard.blocked.kind === 'popup' ? 'Pop-up blocked' : 'Redirect blocked'}
            subtitle={displayHost(guard.blocked.url)}
            action={{
              title: guard.blocked.kind === 'popup' ? 'Open' : 'Allow',
              onPress: () => guard.blocked && guard.allowBlocked(guard.blocked),
            }}
            onDismiss={guard.dismissBlocked}
            resetKey={guard.blocked.id}
          />
        )}
      </View>
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
});
