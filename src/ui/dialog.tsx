import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { IconButton } from '@/ui/icon-button';
import { ModalGestureRoot } from '@/ui/modal-gesture-root';
import { Pressable } from '@/ui/pressable';
import { Text } from '@/ui/text';
import { layout, radius, space } from '@/ui/theme/tokens';
import { useTheme } from '@/ui/theme/use-theme';

type DialogProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  /** While true, tapping outside and the close button do nothing (e.g. during a request). */
  dismissDisabled?: boolean;
  children: ReactNode;
};

/**
 * A centered pop-up card over a dimmed screen. Its content only mounts while open, so forms
 * inside start fresh every time.
 */
export function Dialog({ visible, title, onClose, dismissDisabled, children }: DialogProps) {
  const { colors } = useTheme();
  const close = dismissDisabled ? undefined : onClose;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close ?? (() => {})}>
      <ModalGestureRoot>
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            style={[styles.backdrop, { backgroundColor: colors.backdrop }]}
            onPress={close}
            accessible={false}>
            {/* Swallows taps so pressing inside the card doesn't close it. */}
            <Pressable style={styles.cardWrapper} onPress={() => {}} accessible={false}>
              <View style={[styles.card, { backgroundColor: colors.background }]}>
                <ScrollView
                  bounces={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.content}>
                  <View style={styles.header}>
                    <Text variant="headline" style={styles.title} accessibilityRole="header">
                      {title}
                    </Text>
                    <IconButton
                      icon="close"
                      variant="filled"
                      size={18}
                      accessibilityLabel="Close"
                      onPress={onClose}
                      disabled={dismissDisabled}
                      haptic={false}
                    />
                  </View>
                  {children}
                </ScrollView>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </ModalGestureRoot>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: layout.gutter,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: layout.dialogMaxWidth,
    maxHeight: '90%',
    alignSelf: 'center',
  },
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  content: {
    padding: space.xl,
    gap: space.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
});
