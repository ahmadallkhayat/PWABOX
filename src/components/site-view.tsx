import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { BookmarksSheet } from '@/components/bookmarks-sheet';
import { SiteTopBar } from '@/components/site-top-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppLock } from '@/lib/app-lock';
import { lockLandscape, lockPortrait } from '@/lib/orientation';
import { capturePreview } from '@/lib/previews';
import { useSites, type Site } from '@/lib/sites';

const FULLSCREEN_MESSAGE = 'pwabox:fullscreen';

type FullscreenMessage =
  | { type: typeof FULLSCREEN_MESSAGE; on: false }
  | { type: typeof FULLSCREEN_MESSAGE; on: true; landscape: boolean; measured: boolean };

/**
 * Reports when a video enters/leaves fullscreen and whether it is wide or tall, so the app
 * can rotate to match (the WebView alone only rotates if the phone's auto-rotate is on).
 *
 * On iOS this runs in every frame, so embedded players (e.g. YouTube iframes) can measure
 * their own video; it posts through the WebKit handler because `ReactNativeWebView` only
 * exists in the main frame there. Android only injects into the main frame, which sees an
 * embedded player as an <iframe> it can't look inside, so it reports an unmeasured guess.
 */
const FULLSCREEN_WATCHER = `(function () {
  if (window.__pwaboxFullscreen) return;
  window.__pwaboxFullscreen = true;

  function post(payload) {
    payload.type = '${FULLSCREEN_MESSAGE}';
    var message = JSON.stringify(payload);
    var webkit = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.ReactNativeWebView;
    if (webkit) webkit.postMessage(message);
    else if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(message);
  }
  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement;
  }
  function findVideo(el) {
    if (!el) return null;
    if (el.tagName === 'VIDEO') return el;
    var videos = el.querySelectorAll ? el.querySelectorAll('video') : [];
    for (var i = 0; i < videos.length; i++) if (videos[i].videoWidth) return videos[i];
    return videos[0] || null;
  }
  function report(video) {
    if (video && video.videoWidth && video.videoHeight) {
      post({ on: true, landscape: video.videoWidth > video.videoHeight, measured: true });
      return;
    }
    // Most videos are wide; correct it once the size is known.
    post({ on: true, landscape: true, measured: false });
    if (video) {
      video.addEventListener('loadedmetadata', function () {
        if (fullscreenElement() || video.webkitDisplayingFullscreen) report(video);
      }, { once: true });
    }
  }
  function onChange() {
    var el = fullscreenElement();
    if (el) report(findVideo(el));
    else post({ on: false });
  }
  document.addEventListener('fullscreenchange', onChange);
  document.addEventListener('webkitfullscreenchange', onChange);
  // iPhone plays fullscreen video in the native player, which only fires these.
  document.addEventListener('webkitbeginfullscreen', function (e) { report(e.target); }, true);
  document.addEventListener('webkitendfullscreen', function () { post({ on: false }); }, true);
})();
true;`;

/** Leaves any fullscreen video, so it can't stay visible on top of the lock screen. */
const EXIT_FULLSCREEN = `(function () {
  try {
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
    if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
    document.querySelectorAll('video').forEach(function (v) {
      if (v.webkitDisplayingFullscreen) v.webkitExitFullscreen();
    });
  } catch (e) {}
})();
true;`;

/** Runs the saved site full-screen in a WebView, like an installed PWA. */
export function SiteView({ site }: { site: Site }) {
  const router = useRouter();
  const webView = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(site.url);
  const [currentTitle, setCurrentTitle] = useState('');
  const [progress, setProgress] = useState(0);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const { addBookmark, removeBookmark, setBookmarkPreview } = useSites();
  const { locked, setActivityHold } = useAppLock();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // The WebView's wrapper, screenshotted for bookmark previews.
  const pageView = useRef<View>(null);
  const pageSize = useRef({ width: 0, height: 0 });

  const currentBookmark = site.bookmarks?.find((b) => b.url === currentUrl);

  function savePreview(bookmarkId: string) {
    capturePreview(pageView, pageSize.current, bookmarkId).then((preview) => {
      if (preview) setBookmarkPreview(site.id, bookmarkId, preview);
    });
  }

  function toggleBookmark() {
    if (currentBookmark) {
      removeBookmark(site.id, currentBookmark.id);
      return;
    }
    const bookmark = addBookmark(site.id, {
      url: currentUrl,
      title: pageTitle(currentTitle, currentUrl, site.name),
    });
    savePreview(bookmark.id);
  }

  // Bookmarks saved before previews existed (or whose capture failed) get one on their next visit,
  // once the page has had a moment to render.
  const missingPreviewId = currentBookmark && !currentBookmark.preview ? currentBookmark.id : null;
  const pageLoaded = progress >= 1;
  useEffect(() => {
    if (!missingPreviewId || !pageLoaded) return;
    const timer = setTimeout(() => savePreview(missingPreviewId), 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- savePreview only reads refs and ids.
  }, [missingPreviewId, pageLoaded]);

  function openPage(url: string) {
    setShowBookmarks(false);
    if (url === currentUrl) return;
    webView.current?.injectJavaScript(`window.location.href = ${JSON.stringify(url)}; true;`);
  }

  // Android back button walks back through the site's history before leaving it.
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

  // Closing the site mid-video must not leave the launcher sideways.
  useEffect(() => lockPortrait, []);

  // A measured report (e.g. from inside an embedded player) beats a guess, whichever arrives first.
  const fullscreenMeasured = useRef(false);
  const fullscreenOn = useRef(false);

  useEffect(() => {
    if (locked) webView.current?.injectJavaScript(EXIT_FULLSCREEN);
  }, [locked]);

  // Watching a fullscreen video without touching the screen isn't "inactive".
  useEffect(() => () => setActivityHold(false), [setActivityHold]);

  function handleMessage(event: WebViewMessageEvent) {
    let message: FullscreenMessage;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (message?.type !== FULLSCREEN_MESSAGE) return;

    if (!message.on) {
      fullscreenOn.current = false;
      fullscreenMeasured.current = false;
      setActivityHold(false);
      lockPortrait();
      return;
    }
    if (!message.measured && fullscreenMeasured.current) return;
    fullscreenOn.current = true;
    setActivityHold(true);
    fullscreenMeasured.current = message.measured;

    const lock = message.landscape ? lockLandscape : lockPortrait;
    lock();
    // Android's WebView resets the orientation as it opens its fullscreen view, which can
    // land just after this message; apply ours again once that has happened.
    if (Platform.OS === 'android') {
      setTimeout(() => fullscreenOn.current && lock(), 300);
    }
  }

  const siteHost = hostnameOf(site.url);
  const currentHost = hostnameOf(currentUrl);

  return (
    // Keeps the site above Android's navigation bar / the iPhone home indicator, like an
    // installed PWA, with the strip below painted in the site's own background color.
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom,
          backgroundColor: site.backgroundColor ?? theme.background,
        },
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
        onRemove={(bookmarkId) => removeBookmark(site.id, bookmarkId)}
        onClose={() => setShowBookmarks(false)}
      />
      <View
        ref={pageView}
        // Android can only screenshot a WebView through a real (non-collapsed) parent view.
        collapsable={false}
        style={styles.webView}
        onLayout={(event) => {
          pageSize.current = event.nativeEvent.layout;
        }}>
        <WebView
          ref={webView}
          source={{ uri: site.url }}
          style={[styles.webView, site.backgroundColor ? { backgroundColor: site.backgroundColor } : null]}
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
          injectedJavaScriptBeforeContentLoaded={FULLSCREEN_WATCHER}
          injectedJavaScriptBeforeContentLoadedForMainFrameOnly={false}
          onMessage={handleMessage}
          setSupportMultipleWindows={false}
          overScrollMode="never"
          onNavigationStateChange={(state) => {
            setCanGoBack(state.canGoBack);
            setCurrentUrl(state.url);
            setCurrentTitle(state.title);
          }}
          onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
          onShouldStartLoadWithRequest={(request) => {
            // mailto:, tel:, intent:, app deep links... belong to other apps.
            if (/^(https?|about|data|blob):/i.test(request.url)) return true;
            Linking.openURL(request.url).catch(() => {});
            return false;
          }}
          renderError={(_domain, _code, description) => (
            <ThemedView style={styles.error}>
              <ThemedText type="subtitle">Can’t open {site.name}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.centered}>
                {description}
              </ThemedText>
              <Pressable onPress={() => webView.current?.reload()} style={styles.retry}>
                <ThemedText style={styles.retryText}>Try again</ThemedText>
              </Pressable>
            </ThemedView>
          )}
        />
      </View>
    </View>
  );
}

/** The page's own title, unless the WebView only knows the URL (it reports that as the title while loading). */
function pageTitle(title: string, url: string, fallback: string) {
  const trimmed = title.trim();
  if (trimmed && trimmed !== url && !/^https?:\/\//.test(trimmed)) return trimmed;
  try {
    const path = decodeURIComponent(new URL(url).pathname.replace(/\/$/, ''));
    return path ? `${fallback} ${path}` : fallback;
  } catch {
    return fallback;
  }
}

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  error: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    gap: Spacing.three,
  },
  centered: {
    textAlign: 'center',
  },
  retry: {
    backgroundColor: '#208AEF',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.five,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: 600,
  },
});
