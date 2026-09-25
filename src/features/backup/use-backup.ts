import { Directory, File } from 'expo-file-system';

import { backupFileName, createBackup, parseBackup, type Backup } from '@/features/backup/backup-file';
import { siteOf } from '@/features/browser/scripts/blocking';
import { useHistory } from '@/features/history/history-store';
import { useSettings } from '@/features/settings/settings-store';
import { useSites } from '@/features/sites/sites-store';

export type RestoreMode = 'merge' | 'replace';

/** Pickers report the user backing out as an error; that isn't one worth showing. */
function isCancellation(error: unknown) {
  return /cancel/i.test(String((error as Error)?.message ?? error));
}

/**
 * Backing up to a file the user saves anywhere on the phone (Downloads, Files, a cloud folder),
 * and restoring from one they pick.
 */
export function useBackup() {
  const { sites, replaceSites, mergeSites } = useSites();
  const { settings, updateSettings } = useSettings();
  const history = useHistory();

  /** Asks for a folder and writes the backup there. Returns the file name, or null if cancelled. */
  async function saveBackup(): Promise<string | null> {
    let folder: Directory;
    try {
      folder = await Directory.pickDirectoryAsync();
    } catch (error) {
      if (isCancellation(error)) return null;
      throw new Error('Couldn’t open the folder picker.');
    }
    const name = backupFileName();
    const backup = createBackup({ sites, settings, history: history.entries });
    try {
      const file = folder.createFile(name, 'application/json');
      file.write(JSON.stringify(backup, null, 2));
    } catch {
      throw new Error('Couldn’t save the backup in that folder. Try another one, like Downloads.');
    }
    return name;
  }

  /** Asks for a backup file and reads it. Returns null if cancelled; throws if it isn't a backup. */
  async function pickBackup(): Promise<Backup | null> {
    let text: string;
    try {
      // Any type: phones label .json files inconsistently, so the content decides instead.
      const picked = await File.pickFileAsync({ mimeTypes: '*/*' });
      if (picked.canceled) return null;
      text = await picked.result.text();
    } catch (error) {
      if (isCancellation(error)) return null;
      throw new Error('Couldn’t read that file.');
    }
    return parseBackup(text);
  }

  /** Applies a backup. Merge adds apps that aren't here yet; replace makes everything match it. */
  function restore(backup: Backup, mode: RestoreMode) {
    if (mode === 'replace') {
      replaceSites(backup.sites);
      updateSettings(backup.settings);
      history.replaceAll(backup.history);
      return { apps: backup.sites.length };
    }
    return { apps: mergeSites(backup.sites, (a, b) => siteOf(a) === siteOf(b)) };
  }

  return { saveBackup, pickBackup, restore };
}

/** "3 apps, 12 bookmarks, 240 history pages" for the restore prompt. */
export function describeBackup(backup: Backup) {
  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const bookmarks = backup.sites.reduce((total, site) => total + (site.bookmarks?.length ?? 0), 0);
  return [
    count(backup.sites.length, 'app', 'apps'),
    count(bookmarks, 'bookmark', 'bookmarks'),
    count(backup.history.length, 'history page', 'history pages'),
  ].join(', ');
}
