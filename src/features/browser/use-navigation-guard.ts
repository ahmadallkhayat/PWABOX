import { useCallback, useRef, useState, type RefObject } from 'react';
import { Linking, Platform } from 'react-native';
import type { WebView } from 'react-native-webview';
import type { ShouldStartLoadRequest, WebViewOpenWindowEvent } from 'react-native-webview/lib/WebViewTypes';

import { isAdHost, siteOf } from '@/features/browser/scripts/blocking';
import { useSettings } from '@/features/settings/settings-store';
import { useSites, type Site } from '@/features/sites/sites-store';

export type BlockedItem = {
  kind: 'popup' | 'redirect';
  url: string;
  /** Changes for every block, so a repeat of the same URL restarts the notice's timer. */
  id: number;
};

/** iOS navigation types that only happen when the user acts (link tap, form, back/forward). */
const USER_NAVIGATION_TYPES = new Set(['click', 'formsubmit', 'formresubmit', 'backforward', 'reload']);

// Android doesn't say whether a navigation came from the user, so a touch this recent counts.
const USER_ACTION_WINDOW_MS = 2000;

// A user-started navigation may bounce through a few server redirects; trust those too.
const REDIRECT_CHAIN_MS = 3000;

/**
 * Decides which navigations and pop-ups a site may make (per the blocking settings), and keeps
 * the last blocked one so the screen can offer to open it anyway.
 */
export function useNavigationGuard({
  site,
  currentUrl,
  webView,
}: {
  site: Site;
  currentUrl: string;
  webView: RefObject<WebView | null>;
}) {
  const { allowRedirectsTo } = useSites();
  const { blockAds, blockPopups, blockRedirects } = useSettings().settings;

  const lastTouchAt = useRef(0);
  const trustedUntil = useRef(0);
  // Navigations the app itself starts (bookmarks, "Open"/"Allow" on the notice).
  const allowOnce = useRef(new Set<string>());
  const blockCount = useRef(0);
  const [blocked, setBlocked] = useState<BlockedItem | null>(null);
  const dismissBlocked = useCallback(() => setBlocked(null), [setBlocked]);

  function navigateTo(url: string) {
    allowOnce.current.add(url);
    webView.current?.injectJavaScript(`window.location.href = ${JSON.stringify(url)}; true;`);
  }

  function reportBlocked(kind: BlockedItem['kind'], url: string) {
    blockCount.current += 1;
    setBlocked({ kind, url, id: blockCount.current });
  }

  /** The site itself, the site currently shown, or one the user already allowed. */
  function isKnownSite(url: string) {
    const target = siteOf(url);
    return (
      target === siteOf(site.url) ||
      target === siteOf(currentUrl) ||
      !!site.allowedRedirects?.includes(target)
    );
  }

  function handleOpenWindow(event: WebViewOpenWindowEvent) {
    const url = event.nativeEvent.targetUrl;
    if (!url) return;
    if (blockAds && isAdHost(url)) return reportBlocked('popup', url);
    if (blockPopups && !isKnownSite(url)) return reportBlocked('popup', url);
    // An app has one window: open it in place, like an installed PWA does.
    navigateTo(url);
  }

  function shouldStartLoad(request: ShouldStartLoadRequest) {
    const { url } = request;
    // mailto:, tel:, intent:, app deep links... belong to other apps.
    if (!/^(https?|about|data|blob):/i.test(url)) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    if (!/^https?:/i.test(url)) return true;

    // iOS also asks about frames inside the page; only the page itself can be redirected.
    const topFrame = request.isTopFrame !== false;
    if (blockAds && isAdHost(url)) {
      if (topFrame) reportBlocked('redirect', url);
      return false;
    }
    if (!topFrame) return true;

    if (allowOnce.current.delete(url)) {
      trustedUntil.current = Date.now() + REDIRECT_CHAIN_MS;
      return true;
    }
    if (!blockRedirects || isKnownSite(url)) return true;

    const byUser =
      Platform.OS === 'ios'
        ? USER_NAVIGATION_TYPES.has(request.navigationType)
        : Date.now() - lastTouchAt.current < USER_ACTION_WINDOW_MS;
    if (byUser || Date.now() < trustedUntil.current) {
      trustedUntil.current = Date.now() + REDIRECT_CHAIN_MS;
      return true;
    }
    reportBlocked('redirect', url);
    return false;
  }

  function allowBlocked(item: BlockedItem) {
    setBlocked(null);
    // Allowing a redirect is remembered for this app (e.g. a login on another domain).
    if (item.kind === 'redirect') allowRedirectsTo(site.id, siteOf(item.url));
    navigateTo(item.url);
  }

  return {
    blocked,
    dismissBlocked,
    allowBlocked,
    navigateTo,
    handleOpenWindow,
    shouldStartLoad,
    /** A pop-up the page's own script was talked out of (see POPUP_BLOCK_SCRIPT). */
    reportBlockedPopup: (url: string) => reportBlocked('popup', url),
    /** Call on every touch of the page: on Android, recent touches mark navigations as the user's. */
    markTouch: () => {
      lastTouchAt.current = Date.now();
    },
  };
}
