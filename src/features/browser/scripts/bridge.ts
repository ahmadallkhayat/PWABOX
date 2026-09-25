/**
 * Messages between the page scripts and the app. Every script that talks to the app includes
 * POST_TO_APP and sends `{ type, ... }` objects, which `parsePageMessage` reads back.
 */

export const FULLSCREEN_MESSAGE = 'pwabox:fullscreen';
export const POPUP_MESSAGE = 'pwabox:popup';

export type PageMessage =
  | { type: typeof FULLSCREEN_MESSAGE; on: false }
  | { type: typeof FULLSCREEN_MESSAGE; on: true; landscape: boolean; measured: boolean }
  | { type: typeof POPUP_MESSAGE; url: string };

/**
 * `postToApp(payload)` for page scripts. On iOS scripts also run inside frames, where only the
 * WebKit handler exists (`window.ReactNativeWebView` is main-frame only), so it tries that first.
 */
export const POST_TO_APP = `function postToApp(payload) {
    var message = JSON.stringify(payload);
    var webkit = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.ReactNativeWebView;
    if (webkit) webkit.postMessage(message);
    else if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(message);
  }`;

const TYPES = new Set<string>([FULLSCREEN_MESSAGE, POPUP_MESSAGE]);

/** One of our messages, or null for anything else a page posts. */
export function parsePageMessage(data: string): PageMessage | null {
  try {
    const message = JSON.parse(data);
    return message && typeof message === 'object' && TYPES.has(message.type) ? message : null;
  } catch {
    return null;
  }
}
