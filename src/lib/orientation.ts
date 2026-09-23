import * as ScreenOrientation from 'expo-screen-orientation';
import { Platform } from 'react-native';

export function lockPortrait() {
  if (Platform.OS === 'web') return;
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
}

/** Either landscape side, following the sensor, even when the user has auto-rotate off. */
export function lockLandscape() {
  if (Platform.OS === 'web') return;
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
}
