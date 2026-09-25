import { ScrollView, StyleSheet, View } from 'react-native';

import { filterHistory, HistoryRow } from '@/features/history/history-list';
import type { HistoryEntry } from '@/features/history/history-store';
import { layout, ListRow, Separator, space, Text, useTheme } from '@/ui';

const MAX_SUGGESTIONS = 8;

type HistorySuggestionsProps = {
  entries: HistoryEntry[];
  /** What's typed in the address bar; empty shows the most recent pages. */
  query: string;
  onOpen: (url: string) => void;
  onShowAll: () => void;
};

/** Pages from history that match what's being typed, shown under the address bar. */
export function HistorySuggestions({ entries, query, onOpen, onShowAll }: HistorySuggestionsProps) {
  const { colors } = useTheme();
  const matches = filterHistory(entries, query).slice(0, MAX_SUGGESTIONS);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {matches.length > 0 && (
          <Text variant="footnoteStrong" color="textSecondary" style={styles.heading}>
            {query.trim() ? 'FROM YOUR HISTORY' : 'RECENT'}
          </Text>
        )}
        {matches.map((entry, index) => (
          <View key={entry.id}>
            {index > 0 && <Separator inset={layout.gutter} />}
            <HistoryRow entry={entry} onOpen={onOpen} highlight={colors.surfaceSelected} />
          </View>
        ))}
        {entries.length > 0 && (
          <View style={styles.showAll}>
            <ListRow icon="history" title="Show all history" accessory={{ type: 'link' }} onPress={onShowAll} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: space.xl,
  },
  heading: {
    paddingHorizontal: layout.gutter,
    paddingTop: space.lg,
    paddingBottom: space.sm,
  },
  showAll: {
    marginTop: space.md,
  },
});
