import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback by meaning. Components say what happened; this picks the right feel per
 * platform: Taptic patterns on iOS, Android's own haptic presets on Android (which the Expo docs
 * recommend over the Vibrator API and which respect the system haptics setting).
 */
export type HapticEvent =
  | 'tap'
  | 'selection'
  | 'toggleOn'
  | 'toggleOff'
  | 'longPress'
  | 'dragStart'
  | 'drop'
  | 'success'
  | 'warning'
  | 'error';

const ANDROID: Record<HapticEvent, Haptics.AndroidHaptics> = {
  tap: Haptics.AndroidHaptics.Virtual_Key,
  selection: Haptics.AndroidHaptics.Clock_Tick,
  toggleOn: Haptics.AndroidHaptics.Toggle_On,
  toggleOff: Haptics.AndroidHaptics.Toggle_Off,
  longPress: Haptics.AndroidHaptics.Long_Press,
  dragStart: Haptics.AndroidHaptics.Drag_Start,
  drop: Haptics.AndroidHaptics.Gesture_End,
  success: Haptics.AndroidHaptics.Confirm,
  warning: Haptics.AndroidHaptics.Reject,
  error: Haptics.AndroidHaptics.Reject,
};

function playIOS(event: HapticEvent) {
  switch (event) {
    case 'tap':
    case 'drop':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    case 'selection':
    case 'toggleOn':
    case 'toggleOff':
      return Haptics.selectionAsync();
    case 'longPress':
    case 'dragStart':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    case 'success':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    case 'warning':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    case 'error':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}

let enabled = true;

/** Follows the user's "Haptic feedback" setting. */
export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

export function haptic(event: HapticEvent) {
  if (!enabled || Platform.OS === 'web') return;
  const played =
    Platform.OS === 'android' ? Haptics.performAndroidHapticsAsync(ANDROID[event]) : playIOS(event);
  // Haptics are a nicety: never let a device without them surface an error.
  played?.catch(() => {});
}
