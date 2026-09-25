import { useEffect, useRef } from 'react';
import type { LayoutChangeEvent, View } from 'react-native';

import { capturePreview } from '@/features/bookmarks/previews';
import { useSites, type Site } from '@/features/sites/sites-store';
import { haptic } from '@/ui';

/**
 * Bookmarking the page open in a site, with a screenshot preview. Attach `pageView` and
 * `onPageLayout` to the view around the WebView: that's what gets screenshotted.
 */
export function useBookmarkActions({
  site,
  currentUrl,
  currentTitle,
  pageLoaded,
}: {
  site: Site;
  currentUrl: string;
  currentTitle: string;
  pageLoaded: boolean;
}) {
  const { addBookmark, removeBookmark, setBookmarkPreview } = useSites();
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
      haptic('toggleOff');
      removeBookmark(site.id, currentBookmark.id);
      return;
    }
    haptic('success');
    const bookmark = addBookmark(site.id, {
      url: currentUrl,
      title: pageTitle(currentTitle, currentUrl, site.name),
    });
    savePreview(bookmark.id);
  }

  // Bookmarks saved before previews existed (or whose capture failed) get one on their next
  // visit, once the page has had a moment to render.
  const missingPreviewId = currentBookmark && !currentBookmark.preview ? currentBookmark.id : null;
  useEffect(() => {
    if (!missingPreviewId || !pageLoaded) return;
    const timer = setTimeout(() => savePreview(missingPreviewId), 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- savePreview only reads refs and ids.
  }, [missingPreviewId, pageLoaded]);

  return {
    currentBookmark,
    toggleBookmark,
    removeBookmark: (bookmarkId: string) => removeBookmark(site.id, bookmarkId),
    pageView,
    onPageLayout: (event: LayoutChangeEvent) => {
      pageSize.current = event.nativeEvent.layout;
    },
  };
}

/** The page's own title, unless the WebView only knows the URL (it reports that while loading). */
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
