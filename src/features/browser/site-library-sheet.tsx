import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BookmarksGrid } from '@/features/bookmarks/bookmarks-grid';
import { HistoryList } from '@/features/history/history-list';
import { siteHistorySource, useHistory } from '@/features/history/history-store';
import type { Site } from '@/features/sites/sites-store';
import { layout, SegmentedControl, Sheet, space } from '@/ui';

type Tab = 'bookmarks' | 'history';

type SiteLibrarySheetProps = {
  site: Site;
  visible: boolean;
  currentUrl: string;
  onOpen: (url: string) => void;
  onRemoveBookmark: (bookmarkId: string) => void;
  onClose: () => void;
};

/** One app's saved pages and the pages visited in it, in a single sheet. */
export function SiteLibrarySheet({
  site,
  visible,
  currentUrl,
  onOpen,
  onRemoveBookmark,
  onClose,
}: SiteLibrarySheetProps) {
  const [tab, setTab] = useState<Tab>('bookmarks');
  const history = useHistory();
  const source = siteHistorySource(site.id);

  return (
    <Sheet visible={visible} title={site.name} onClose={onClose}>
      <View style={styles.tabs}>
        <SegmentedControl
          options={[
            { value: 'bookmarks', label: 'Bookmarks' },
            { value: 'history', label: 'History' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      {tab === 'bookmarks' ? (
        <BookmarksGrid site={site} currentUrl={currentUrl} onOpen={onOpen} onRemove={onRemoveBookmark} />
      ) : (
        <HistoryList
          entries={history.entriesFor(source)}
          onOpen={onOpen}
          onRemove={history.remove}
          onClear={() => history.clear(source)}
        />
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  tabs: {
    paddingHorizontal: layout.gutter,
    paddingBottom: space.lg,
  },
});
