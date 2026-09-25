import { useEffect, useRef, type RefObject } from 'react';
import { Platform } from 'react-native';
import type { WebView } from 'react-native-webview';

import type { FULLSCREEN_MESSAGE, PageMessage } from '@/features/browser/scripts/bridge';
import { EXIT_FULLSCREEN } from '@/features/browser/scripts/fullscreen';
import { useAppLock } from '@/features/lock/app-lock';
import { lockLandscape, lockPortrait } from '@/lib/orientation';

type FullscreenMessage = Extract<PageMessage, { type: typeof FULLSCREEN_MESSAGE }>;

/**
 * Fullscreen video in a site: rotates to match the video's shape, keeps the app lock from
 * counting a film as inactivity, and leaves fullscreen when the app locks. Returns the handler
 * for the page's fullscreen messages.
 */
export function useFullscreenVideo(webView: RefObject<WebView | null>) {
  const { locked, setActivityHold } = useAppLock();
  // A measured report (e.g. from inside an embedded player) beats a guess, whichever arrives first.
  const measured = useRef(false);
  const active = useRef(false);

  // Closing the site mid-video must not leave the launcher sideways, or the lock paused.
  useEffect(() => lockPortrait, []);
  useEffect(() => () => setActivityHold(false), [setActivityHold]);

  useEffect(() => {
    if (locked) webView.current?.injectJavaScript(EXIT_FULLSCREEN);
  }, [locked, webView]);

  return function handleFullscreenMessage(message: FullscreenMessage) {
    if (!message.on) {
      active.current = false;
      measured.current = false;
      setActivityHold(false);
      lockPortrait();
      return;
    }
    if (!message.measured && measured.current) return;
    active.current = true;
    measured.current = message.measured;
    setActivityHold(true);

    const lock = message.landscape ? lockLandscape : lockPortrait;
    lock();
    // Android's WebView resets the orientation as it opens its fullscreen view, which can land
    // just after this message; apply ours again once that has happened.
    if (Platform.OS === 'android') {
      setTimeout(() => active.current && lock(), 300);
    }
  };
}
