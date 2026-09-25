import { Directory, File, Paths } from 'expo-file-system';
import type { RefObject } from 'react';
import { PixelRatio, Platform, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

/**
 * Bookmark previews are screenshots of the page, kept in the app's documents folder.
 * Bookmarks store only the file name: the folder's absolute path can change between
 * app updates on iOS, so it's resolved fresh each time.
 */
function previewFolder() {
  return new Directory(Paths.document, 'bookmark-previews');
}

const PREVIEW_WIDTH_PX = 600;

/**
 * Screenshots `view` (whose on-screen size is `size`, in points) into a new preview file and
 * returns its name, or undefined on failure.
 */
export async function capturePreview(
  view: RefObject<View | null>,
  size: { width: number; height: number },
  bookmarkId: string
): Promise<string | undefined> {
  if (Platform.OS === 'web' || !size.width || !size.height) return undefined;
  try {
    // Full-resolution screenshots are ~1 MB each; a preview only needs to be card-sized.
    const width = Math.min(PREVIEW_WIDTH_PX, Math.round(size.width * PixelRatio.get()));
    const height = Math.round((width * size.height) / size.width);
    const temporary = await captureRef(view, {
      format: 'jpg',
      quality: 0.7,
      width,
      height,
      result: 'tmpfile',
    });

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
