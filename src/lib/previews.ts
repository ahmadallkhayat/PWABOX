import { Directory, File, Paths } from 'expo-file-system';
import type { RefObject } from 'react';
import { Platform, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

/**
 * Bookmark previews are screenshots of the page, kept in the app's documents folder.
 * Bookmarks store only the file name: the folder's absolute path can change between
 * app updates on iOS, so it's resolved fresh each time.
 */
function previewFolder() {
  return new Directory(Paths.document, 'bookmark-previews');
}

/** Screenshots `view` into a new preview file and returns its name, or undefined on failure. */
export async function capturePreview(
  view: RefObject<View | null>,
  bookmarkId: string
): Promise<string | undefined> {
  if (Platform.OS === 'web') return undefined;
  try {
    const temporary = await captureRef(view, { format: 'jpg', quality: 0.6, result: 'tmpfile' });

    const folder = previewFolder();
    folder.create({ intermediates: true, idempotent: true });
    // A fresh name per capture, so image caches never show an older screenshot.
    const name = `${bookmarkId}-${Date.now().toString(36)}.jpg`;
    await new File(temporary).move(new File(folder, name));
    return name;
  } catch (error) {
    console.warn('Could not capture bookmark preview', error);
    return undefined;
  }
}

export function previewUri(name: string) {
  return new File(previewFolder(), name).uri;
}

export function deletePreview(name: string | undefined) {
  if (!name || Platform.OS === 'web') return;
  try {
    const file = new File(previewFolder(), name);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('Could not delete bookmark preview', error);
  }
}
