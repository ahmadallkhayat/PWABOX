import type { WebViewNavigation } from 'react-native-webview';

import { useHistory, type HistorySource } from '@/features/history/history-store';

/**
 * Pass the result to a WebView's navigation-state handler: records each page once it has
 * loaded (so redirect hops aren't saved) and again when its title arrives.
 */
export function useHistoryRecorder(source: HistorySource) {
  const { record } = useHistory();
  return (state: WebViewNavigation) => {
    if (state.loading) return;
    record(source, { url: state.url, title: state.title ?? '' });
  };
}
