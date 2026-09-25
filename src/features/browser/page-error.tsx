import { StyleSheet, View } from 'react-native';

import { EmptyState, useTheme } from '@/ui';

/** Shown in place of a page that failed to load. */
export function PageError({ siteName, description, onRetry }: { siteName: string; description: string; onRetry: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <EmptyState
        title={`Can’t open ${siteName}`}
        message={description}
        action={{ title: 'Try again', onPress: onRetry }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
  },
});
