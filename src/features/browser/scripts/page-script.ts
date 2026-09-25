import { AD_BLOCK_SCRIPT, POPUP_BLOCK_SCRIPT } from '@/features/browser/scripts/blocking';
import { FULLSCREEN_WATCHER } from '@/features/browser/scripts/fullscreen';

/**
 * Everything the app injects into a page, per the user's settings. Each part guards against
 * running twice: Android's "before the page loads" injection is documented as unreliable (it can
 * run after the page's own scripts), so the WebView also injects it again when the page loads.
 */
export function buildPageScript({ blockAds, blockPopups }: { blockAds: boolean; blockPopups: boolean }) {
  return (blockAds ? AD_BLOCK_SCRIPT : '') + (blockPopups ? POPUP_BLOCK_SCRIPT : '') + FULLSCREEN_WATCHER;
}
