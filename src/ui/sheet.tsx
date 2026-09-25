import type { ReactNode } from 'react';
import { Modal, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/ui/button';
import { ModalGestureRoot } from '@/ui/modal-gesture-root';
import { Text } from '@/ui/text';
import { layout, space } from '@/ui/theme/tokens';
import { useTheme } from '@/ui/theme/use-theme';

type SheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * A page that slides up over the current screen, with a title and Done. iOS shows it as a card
 * sheet; Android as a full-screen page. Put a list or Screen-like content inside.
 */
export function Sheet({ visible, title, onClose, children }: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <ModalGestureRoot>
        <View
          style={[
            styles.sheet,
            // iOS page sheets sit below the status bar by themselves; Android's modal is edge to edge.
            {
              backgroundColor: colors.background,
              paddingTop: Platform.OS === 'ios' ? 0 : insets.top,
            },
          ]}>
          <View style={styles.header}>
            <Text
              variant="headline"
              numberOfLines={1}
              style={styles.title}
              accessibilityRole="header">
              {title}
            </Text>
            <Button title="Done" variant="plain" onPress={onClose} haptic={false} />
          </View>
          {children}
        </View>
      </ModalGestureRoot>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: layout.gutter,
    paddingVertical: space.lg,
  },
  title: {
    flex: 1,
  },
});
