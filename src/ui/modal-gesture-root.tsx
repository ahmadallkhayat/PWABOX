import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

/**
 * A Modal on Android is a separate window, outside the app's gesture root, so gesture-handler
 * components (like the app's Pressable) inside it need a root of their own.
 */
export function ModalGestureRoot({ children }: { children: ReactNode }) {
  return <GestureHandlerRootView style={styles.fill}>{children}</GestureHandlerRootView>;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
