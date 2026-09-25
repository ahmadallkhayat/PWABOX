import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';

import { useSettings } from '@/features/settings/settings-store';
import { useSites } from '@/features/sites/sites-store';

/** Where a visit happened: the Browser tab, or one saved app. */
export type HistorySource = 'browser' | `site:${string}`;

export const siteHistorySource = (siteId: string): HistorySource => `site:${siteId}`;

export type HistoryEntry = {
  id: string;
  url: string;
  title: string;
  visitedAt: number;
  source: HistorySource;
};

type HistoryContextValue = {
  entries: HistoryEntry[];
  /** Newest first, for one app or the browser. */
  entriesFor: (source: HistorySource) => HistoryEntry[];
  record: (source: HistorySource, page: { url: string; title: string }) => void;
  remove: (id: string) => void;
  /** Clears one app's / the browser's history, or everything when no source is given. */
  clear: (source?: HistorySource) => void;
  /** Replaces all history, e.g. from a backup. */
  replaceAll: (entries: HistoryEntry[]) => void;
};

const STORAGE_KEY = 'pwabox.history.v1';
const MAX_ENTRIES = 2000;
// Visits come in bursts (redirects, single-page apps); save once things settle.
const SAVE_DELAY_MS = 500;

const HistoryContext = createContext<HistoryContextValue | null>(null);

/**
 * Pages visited in apps and the browser, newest first, one entry per page per source (a revisit
 * moves it back to the top). Lives inside SitesProvider so a deleted app's history goes with it.
 */
export function HistoryProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const { sites, loaded: sitesLoaded } = useSites();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setEntries(JSON.parse(raw) as HistoryEntry[]);
      })
      .catch((error) => console.warn('Failed to load history', error))
      .finally(() => setLoaded(true));
  }, []);

  function update(next: (current: HistoryEntry[]) => HistoryEntry[]) {
    setEntries((current) => {
      const updated = next(current);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch((error) =>
          console.warn('Failed to save history', error)
        );
      }, SAVE_DELAY_MS);
      return updated;
    });
  }

  // Drop history of apps that were removed.
  useEffect(() => {
    if (!loaded || !sitesLoaded) return;
    const siteSources = new Set(sites.map((site) => siteHistorySource(site.id)));
    const orphaned = (entry: HistoryEntry) => entry.source !== 'browser' && !siteSources.has(entry.source);
    if (entries.some(orphaned)) update((current) => current.filter((entry) => !orphaned(entry)));
    // Only when the set of apps changes, not on every visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, sitesLoaded, sites]);

  function record(source: HistorySource, page: { url: string; title: string }) {
    if (!settings.saveHistory || !/^https?:\/\//i.test(page.url)) return;
    update((current) => {
      const previous = current.find((entry) => entry.source === source && entry.url === page.url);
      const entry: HistoryEntry = {
        id: previous?.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        url: page.url,
        title: betterTitle(page.title, previous?.title, page.url),
        visitedAt: Date.now(),
        source,
      };
      const rest = current.filter((item) => item !== previous);
      return [entry, ...rest].slice(0, MAX_ENTRIES);
    });
  }

  const value: HistoryContextValue = {
    entries,
    entriesFor: (source) => entries.filter((entry) => entry.source === source),
    record,
    remove: (id) => update((current) => current.filter((entry) => entry.id !== id)),
    clear: (source) =>
      update((current) => (source ? current.filter((entry) => entry.source !== source) : [])),
    replaceAll: (next) => update(() => [...next].sort((a, b) => b.visitedAt - a.visitedAt).slice(0, MAX_ENTRIES)),
  };

  return <HistoryContext value={value}>{children}</HistoryContext>;
}

export function useHistory() {
  const context = use(HistoryContext);
  if (!context) throw new Error('useHistory must be used inside <HistoryProvider>');
  return context;
}

/**
 * The page's real title if it has one. While loading, WebViews report the URL (or nothing) as
 * the title, which shouldn't overwrite a real one seen earlier.
 */
function betterTitle(title: string, previous: string | undefined, url: string) {
  const isReal = (value?: string) => !!value?.trim() && value.trim() !== url && !/^https?:\/\//i.test(value.trim());
  if (isReal(title)) return title.trim();
  if (isReal(previous)) return previous!;
  try {
    const { hostname, pathname } = new URL(url);
    return hostname.replace(/^www\./, '') + (pathname === '/' ? '' : pathname);
  } catch {
    return url;
  }
}
