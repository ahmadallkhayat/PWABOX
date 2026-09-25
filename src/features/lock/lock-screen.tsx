import { Image } from 'expo-image';
import { Modal, StyleSheet, View } from 'react-native';

import { BRAND, Button, ModalGestureRoot, space, Text } from '@/ui';

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
      statusBarTranslucent
      navigationBarTranslucent
      // Android's back button must not dismiss the lock.
      onRequestClose={() => {}}>
      <ModalGestureRoot>
        <View style={styles.screen}>
          <Image
            source={require('@/assets/images/splash-icon.png')}
            style={styles.logo}
            contentFit="contain"
          />
          {locked && (
            <View style={styles.actions}>
              <Text variant="title2" color="#FFFFFF">
                PWABOX is locked
              </Text>
              <Button title={`Unlock with ${methodLabel}`} variant="inverse" onPress={onUnlock} />
            </View>
          )}
        </View>
      </ModalGestureRoot>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xxl,
    padding: space.xxl,
  },
  logo: {
    width: 120,
    height: 116,
  },
  actions: {
    alignItems: 'center',
    gap: space.xl,
  },
});
