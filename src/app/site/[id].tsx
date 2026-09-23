import { Link, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { SiteView } from '@/components/site-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSites } from '@/lib/sites';

export default function SiteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sites, loaded } = useSites();
  const site = sites.find((s) => s.id === id);

  if (site) return <SiteView site={site} />;

  return (
    <ThemedView style={styles.missing}>
      {loaded ? (
        <>
          <ThemedText type="subtitle">App not found</ThemedText>
          <Link href="/" dismissTo>
            <ThemedText type="linkPrimary">Back to PWABOX</ThemedText>
          </Link>
        </>
      ) : (
        <ActivityIndicator />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
});
