import { Link, Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { SiteIcon } from '@/components/site-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSites, type Site } from '@/lib/sites';

const TILE_WIDTH = 88;
const ICON_SIZE = 64;

export default function HomeScreen() {
  const { sites, loaded, removeSite } = useSites();
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const contentWidth = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const columns = Math.max(3, Math.floor(contentWidth / TILE_WIDTH));

  function confirmRemove(site: Site) {
    const remove = () => removeSite(site.id);
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${site.name}?`)) remove();
      return;
    }
    Alert.alert(site.name, new URL(site.url).hostname, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: remove },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link href="/add" asChild>
              <Pressable hitSlop={12} accessibilityLabel="Add website">
                <SymbolView
                  name={{ ios: 'plus', android: 'add', web: 'add' }}
                  tintColor={theme.text}
                  size={24}
                />
              </Pressable>
            </Link>
          ),
        }}
      />

      {!loaded ? (
        <ActivityIndicator style={styles.loading} />
      ) : sites.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          key={columns}
          data={sites}
          numColumns={columns}
          keyExtractor={(site) => site.id}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.tile, { width: contentWidth / columns }, pressed && styles.pressed]}
              onPress={() => router.push({ pathname: '/site/[id]', params: { id: item.id } })}
              onLongPress={() => confirmRemove(item)}
              accessibilityLabel={`Open ${item.name}`}
              accessibilityHint="Long press to remove">
              <SiteIcon
                name={item.name}
                iconUrl={item.iconUrl}
                themeColor={item.themeColor}
                size={ICON_SIZE}
              />
              <ThemedText type="small" numberOfLines={1} style={styles.tileLabel}>
                {item.name}
              </ThemedText>
            </Pressable>
          )}
          ListFooterComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
              Long press an app to remove it
            </ThemedText>
          }
        />
      )}
    </ThemedView>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <ThemedText type="subtitle" style={styles.centered}>
        No apps yet
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.centered}>
        Add any website and it opens here as an app, with its own icon and name.
      </ThemedText>
      <Link href="/add" asChild>
        <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <ThemedText style={styles.primaryButtonText}>Add a website</ThemedText>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    marginTop: Spacing.six,
  },
  grid: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  tile: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  tileLabel: {
    maxWidth: TILE_WIDTH,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  hint: {
    textAlign: 'center',
    marginTop: Spacing.three,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  centered: {
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: Spacing.two,
    backgroundColor: '#208AEF',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.five,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: 600,
  },
});
