/**
 * The PWABOX backup file: a JSON document with the user's apps (and their bookmarks), settings
 * and history. Pure data in and out, so it can be tested without the app.
 */

import type { HistoryEntry } from '@/features/history/history-store';
import type { Settings } from '@/features/settings/settings-store';
import type { Site } from '@/features/sites/sites-store';

export const BACKUP_FORMAT = 1;

/** Settings that aren't backed up: restoring the app lock on another phone could lock you out. */
const LOCAL_ONLY_SETTINGS = ['lockEnabled', 'lockTimeout'] as const;
type LocalOnlySetting = (typeof LOCAL_ONLY_SETTINGS)[number];
export type BackedUpSettings = Omit<Settings, LocalOnlySetting>;

export type Backup = {
  app: 'PWABOX';
  format: number;
  exportedAt: string;
  sites: Site[];
  settings: Partial<BackedUpSettings>;
  history: HistoryEntry[];
};

export function createBackup({
  sites,
  settings,
  history,
}: {
  sites: Site[];
  settings: Settings;
  history: HistoryEntry[];
}): Backup {
  const backedUpSettings: Partial<Settings> = { ...settings };
  for (const key of LOCAL_ONLY_SETTINGS) delete backedUpSettings[key];

  return {
    app: 'PWABOX',
    format: BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    // Preview screenshots are files on this phone; they're taken again on the next visit.
    sites: sites.map((site) => ({
      ...site,
      bookmarks: site.bookmarks?.map(({ preview: _preview, ...bookmark }) => bookmark),
    })),
    settings: backedUpSettings,
    history,
  };
}

export function backupFileName(date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  return `pwabox-backup-${day}.json`;
}

/** Reads a backup file's text; throws an Error with a user-facing message if it isn't one. */
export function parseBackup(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file isn’t a PWABOX backup.');
  }
  if (!isRecord(data) || data.app !== 'PWABOX' || !Array.isArray(data.sites)) {
    throw new Error('That file isn’t a PWABOX backup.');
  }
  if (typeof data.format !== 'number' || data.format > BACKUP_FORMAT) {
    throw new Error('This backup was made by a newer version of PWABOX. Update the app, then try again.');
  }

  const sites = data.sites.filter(isSite).map(cleanSite);
  const siteIds = new Set(sites.map((site) => site.id));
  const history = (Array.isArray(data.history) ? data.history : [])
    .filter(isHistoryEntry)
    // Entries for apps that aren't in the backup would never be shown.
    .filter((entry) => entry.source === 'browser' || siteIds.has(entry.source.slice('site:'.length)));

  return {
    app: 'PWABOX',
    format: data.format,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '',
    sites,
    settings: isRecord(data.settings) ? cleanSettings(data.settings) : {},
    history,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

const isHttpUrl = (value: unknown): value is string => typeof value === 'string' && /^https?:\/\//i.test(value);

function isSite(value: unknown): value is Site {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    isHttpUrl(value.url)
  );
}

/** Keeps only the fields PWABOX uses, with the right types. */
function cleanSite(site: Site): Site {
  const optionalString = (value: unknown) => (typeof value === 'string' ? value : undefined);
  return {
    id: site.id,
    name: site.name,
    url: site.url,
    iconUrl: optionalString(site.iconUrl),
    themeColor: optionalString(site.themeColor),
    backgroundColor: optionalString(site.backgroundColor),
    addedAt: typeof site.addedAt === 'number' ? site.addedAt : Date.now(),
    bookmarks: Array.isArray(site.bookmarks)
      ? site.bookmarks
          .filter((b) => isRecord(b) && typeof b.id === 'string' && isHttpUrl(b.url))
          .map((b) => ({
            id: b.id,
            url: b.url,
            title: typeof b.title === 'string' ? b.title : b.url,
            addedAt: typeof b.addedAt === 'number' ? b.addedAt : Date.now(),
          }))
      : undefined,
    allowedRedirects: Array.isArray(site.allowedRedirects)
      ? site.allowedRedirects.filter((s): s is string => typeof s === 'string')
      : undefined,
  };
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    isHttpUrl(value.url) &&
    typeof value.title === 'string' &&
    typeof value.visitedAt === 'number' &&
    typeof value.source === 'string' &&
    (value.source === 'browser' || value.source.startsWith('site:'))
  );
}

/** Only known settings with the right types; anything else in the file is ignored. */
function cleanSettings(raw: Record<string, unknown>): Partial<BackedUpSettings> {
  const settings: Partial<BackedUpSettings> = {};
  for (const key of ['blockAds', 'blockPopups', 'blockRedirects', 'haptics', 'saveHistory'] as const) {
    if (typeof raw[key] === 'boolean') settings[key] = raw[key];
  }
  if (raw.appearance === 'system' || raw.appearance === 'light' || raw.appearance === 'dark') {
    settings.appearance = raw.appearance;
  }
  if (typeof raw.searchEngineId === 'string') settings.searchEngineId = raw.searchEngineId;
  if (Array.isArray(raw.customSearchEngines)) {
    settings.customSearchEngines = raw.customSearchEngines.filter(
      (engine): engine is { id: string; name: string; url: string } =>
        isRecord(engine) &&
        typeof engine.id === 'string' &&
        typeof engine.name === 'string' &&
        isHttpUrl(engine.url)
    );
  }
  return settings;
}
