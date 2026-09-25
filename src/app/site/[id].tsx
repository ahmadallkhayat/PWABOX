import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { SiteView } from '@/features/browser/site-view';
import { useSites } from '@/features/sites/sites-store';
import { EmptyState, Screen } from '@/ui';

export default function SiteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { sites, loaded } = useSites();
  const site = sites.find((s) => s.id === id);

  if (site) return <SiteView site={site} />;

  return (
    <Screen scroll={false} centered edges={['top', 'bottom']}>
      {loaded ? (
        <EmptyState
          title="App not found"
          message="It may have been removed from PWABOX."
          action={{ title: 'Back to PWABOX', onPress: () => router.dismissTo('/') }}
        />
      ) : (
        <ActivityIndicator />
      )}
    </Screen>
  );
}
