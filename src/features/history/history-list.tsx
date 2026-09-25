import { useState } from 'react';
import { Alert, FlatList, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { HistoryEntry } from '@/features/history/history-store';
import { Button, EmptyState, haptic, IconButton, layout, Pressable, Separator, space, Text, TextField, useTheme } from '@/ui';

type HistoryListProps = {
  entries: HistoryEntry[];
  onOpen: (url: string) => void;
  onRemove: (id: string) => void;
  /** Offer "Clear history" for exactly these entries (asks first). */
  onClear?: () => void;
};

type Row = { kind: 'day'; label: string; key: string } | { kind: 'entry'; entry: HistoryEntry; key: string };

/** Searchable history, newest first and grouped by day, with per-page delete. */
export function HistoryList({ entries, onOpen, onRemove, onClear }: HistoryListProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const matches = filterHistory(entries, query);
  const rows: Row[] = [];
  let lastDay = '';
  for (const entry of matches) {
    const day = dayLabel(entry.visitedAt);
    if (day !== lastDay) {
      rows.push({ kind: 'day', label: day, key: `day-${day}` });
      lastDay = day;
    }
    rows.push({ kind: 'entry', entry, key: entry.id });
  }

  function confirmClear() {
    if (!onClear) return;
    const clear = () => {
      haptic('success');
      onClear();
    };
    haptic('warning');
    if (Platform.OS === 'web') {
      if (window.confirm('Clear history?')) clear();
      return;
    }
    Alert.alert('Clear history?', 'The pages listed here will be removed from your history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clear },
    ]);
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(row) => row.key}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + space.xl }]}
      ListHeaderComponent={
        entries.length > 0 ? (
          <View style={styles.header}>
            <TextField
              style={styles.search}
              value={query}
              onChangeText={setQuery}
              placeholder="Search history"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Search history"
            />
            {onClear && !query && (
              <Button title="Clear history" icon="delete" variant="plain" onPress={confirmClear} haptic={false} />
            )}
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <EmptyState
            title={query ? 'No matches' : 'No history yet'}
            message={query ? `Nothing in your history matches “${query}”.` : 'Pages you visit will show up here.'}
          />
        </View>
      }
      renderItem={({ item, index }) =>
        item.kind === 'day' ? (
          <Text variant="footnoteStrong" color="textSecondary" style={styles.day}>
            {item.label.toUpperCase()}
          </Text>
        ) : (
          <>
            {rows[index - 1]?.kind === 'entry' && <Separator inset={layout.gutter} />}
            <HistoryRow entry={item.entry} onOpen={onOpen} onRemove={onRemove} highlight={colors.surfaceSelected} />
          </>
        )
      }
    />
  );
}

export function HistoryRow({
  entry,
  onOpen,
  onRemove,
  highlight,
}: {
  entry: HistoryEntry;
  onOpen: (url: string) => void;
  onRemove?: (id: string) => void;
  highlight: string;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => {
          haptic('tap');
          onOpen(entry.url);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Open ${entry.title}`}
        style={({ pressed }) => [styles.rowMain, pressed && { backgroundColor: highlight }]}>
        <Text numberOfLines={1}>{entry.title}</Text>
        <Text variant="footnote" color="textSecondary" numberOfLines={1}>
          {timeLabel(entry.visitedAt)} · {shortUrl(entry.url)}
        </Text>
      </Pressable>
      {onRemove && (
        <IconButton
          icon="close"
          size={16}
          color="textTertiary"
          accessibilityLabel={`Remove ${entry.title} from history`}
          onPress={() => onRemove(entry.id)}
        />
      )}
    </View>
  );
}

/** Entries whose title or address contains every word of the query. */
export function filterHistory(entries: HistoryEntry[], query: string) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return entries;
  return entries.filter((entry) => {
    const haystack = `${entry.title} ${entry.url}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}

export function shortUrl(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

function dayLabel(time: number) {
  const date = new Date(time);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}),
  });
}

function timeLabel(time: number) {
  return new Date(time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: layout.gutter,
    paddingBottom: space.sm,
    gap: space.sm,
    alignItems: 'flex-start',
  },
  search: {
    alignSelf: 'stretch',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: space.xxxl,
  },
  day: {
    paddingHorizontal: layout.gutter,
    paddingTop: space.xl,
    paddingBottom: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: space.sm,
  },
  rowMain: {
    flex: 1,
    paddingHorizontal: layout.gutter,
    paddingVertical: space.md,
    gap: space.xxs,
  },
});
