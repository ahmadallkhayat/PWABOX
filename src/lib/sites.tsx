import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { deletePreview } from '@/lib/previews';
import type { SiteInfo } from '@/lib/site-info';

export type Bookmark = {
  id: string;
  url: string;
  title: string;
  addedAt: number;
  /** File name of a screenshot of the page, see `previews.ts`. */
  preview?: string;
};

export type Site = SiteInfo & {
  id: string;
  addedAt: number;
  /** Pages saved inside this site, newest first. Missing on sites saved before bookmarks existed. */
  bookmarks?: Bookmark[];
};

type SitesContextValue = {
  sites: Site[];
  loaded: boolean;
  addSite: (info: SiteInfo) => Site;
  removeSite: (id: string) => void;
  addBookmark: (siteId: string, page: { url: string; title: string }) => Bookmark;
  removeBookmark: (siteId: string, bookmarkId: string) => void;
  setBookmarkPreview: (siteId: string, bookmarkId: string, preview: string) => void;
};

const STORAGE_KEY = 'pwabox.sites.v1';

const SitesContext = createContext<SitesContextValue | null>(null);

export function SitesProvider({ children }: { children: ReactNode }) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setSites(JSON.parse(raw) as Site[]);
      })
      .catch((error) => console.warn('Failed to load saved sites', error))
      .finally(() => setLoaded(true));
  }, []);

  function update(next: (current: Site[]) => Site[]) {
    setSites((current) => {
      const updated = next(current);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch((error) =>
        console.warn('Failed to save sites', error)
      );
      return updated;
    });
  }

  function addSite(info: SiteInfo) {
    const site: Site = {
      ...info,
      id: newId(),
      addedAt: Date.now(),
    };
    update((current) => [...current, site]);
    return site;
  }

  function removeSite(id: string) {
    sites.find((site) => site.id === id)?.bookmarks?.forEach((b) => deletePreview(b.preview));
    update((current) => current.filter((site) => site.id !== id));
  }

  function updateBookmarks(siteId: string, next: (bookmarks: Bookmark[]) => Bookmark[]) {
    update((current) =>
      current.map((site) =>
        site.id === siteId ? { ...site, bookmarks: next(site.bookmarks ?? []) } : site
      )
    );
  }

  function addBookmark(siteId: string, page: { url: string; title: string }) {
    const bookmark: Bookmark = { ...page, id: newId(), addedAt: Date.now() };
    updateBookmarks(siteId, (bookmarks) => [
      bookmark,
      ...bookmarks.filter((b) => b.url !== page.url),
    ]);
    return bookmark;
  }

  function removeBookmark(siteId: string, bookmarkId: string) {
    deletePreview(findBookmark(siteId, bookmarkId)?.preview);
    updateBookmarks(siteId, (bookmarks) => bookmarks.filter((b) => b.id !== bookmarkId));
  }

  function setBookmarkPreview(siteId: string, bookmarkId: string, preview: string) {
    const previous = findBookmark(siteId, bookmarkId)?.preview;
    if (previous && previous !== preview) deletePreview(previous);
    updateBookmarks(siteId, (bookmarks) =>
      bookmarks.map((b) => (b.id === bookmarkId ? { ...b, preview } : b))
    );
  }

  function findBookmark(siteId: string, bookmarkId: string) {
    return sites.find((site) => site.id === siteId)?.bookmarks?.find((b) => b.id === bookmarkId);
  }

  return (
    <SitesContext
      value={{ sites, loaded, addSite, removeSite, addBookmark, removeBookmark, setBookmarkPreview }}>
      {children}
    </SitesContext>
  );
}

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useSites() {
  const context = use(SitesContext);
  if (!context) throw new Error('useSites must be used inside <SitesProvider>');
  return context;
}
