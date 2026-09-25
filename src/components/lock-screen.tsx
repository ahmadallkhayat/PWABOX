import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';

const BRAND_BLUE = '#0D68F7';

type LockScreenProps = {
  visible: boolean;
  /** False while only hiding content (e.g. in the app switcher): no unlock button then. */
  locked: boolean;
  methodLabel: string;
  onUnlock: () => void;
};

/**
 * A Modal so it sits above everything else, including other modals and the Android
 * fullscreen video view.
 */
export function LockScreen({ visible, locked, methodLabel, onUnlock }: LockScreenProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent={false}
      statusBarTranslucent
      navigationBarTranslucent
      // Android's back button must not dismiss the lock.
      onRequestClose={() => {}}>
      <View style={styles.screen}>
        <Image
          source={require('@/assets/images/splash-icon.png')}
          style={styles.logo}
          contentFit="contain"
        />
        {locked && (
          <View style={styles.actions}>
            <Text style={styles.title}>PWABOX is locked</Text>
            <Pressable
              onPress={onUnlock}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
              <Text style={styles.buttonText}>Unlock with {methodLabel}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BRAND_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.five,
    padding: Spacing.five,
  },
  logo: {
    width: 160,
    height: 166,
  },
  actions: {
    alignItems: 'center',
    gap: Spacing.four,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 600,
  },
  button: {
    backgroundColor: '#ffffff',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.five,
  },
  buttonText: {
    color: BRAND_BLUE,
    fontSize: 16,
    fontWeight: 600,
  },
  pressed: {
    opacity: 0.7,
  },
});
