import { StyleSheet, View } from 'react-native';

import { Button } from '@/ui/button';
import { Text } from '@/ui/text';
import { space } from '@/ui/theme/tokens';

type EmptyStateProps = {
  title: string;
  message?: string;
  action?: { title: string; onPress: () => void };
};

/** A centered message for screens with nothing to show yet. */
export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text variant="title2" align="center">
        {title}
      </Text>
      {message && (
        <Text color="textSecondary" align="center">
          {message}
        </Text>
      )}
      {action && <Button title={action.title} onPress={action.onPress} style={styles.action} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
  },
  action: {
    marginTop: space.sm,
  },
});
