/** A search engine: `url` is a search address with `%s` where the search words go. */
export type SearchEngine = {
  id: string;
  name: string;
  url: string;
};

export const QUERY_PLACEHOLDER = '%s';

export const BUILT_IN_ENGINES: SearchEngine[] = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=%s' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=%s' },
  { id: 'brave', name: 'Brave Search', url: 'https://search.brave.com/search?q=%s' },
  { id: 'startpage', name: 'Startpage', url: 'https://www.startpage.com/do/search?q=%s' },
  { id: 'ecosia', name: 'Ecosia', url: 'https://www.ecosia.org/search?q=%s' },
];

export const DEFAULT_ENGINE_ID = 'google';

/** The chosen engine, falling back to the default if a custom one was deleted. */
export function findEngine(id: string, custom: SearchEngine[]) {
  return (
    [...BUILT_IN_ENGINES, ...custom].find((engine) => engine.id === id) ??
    BUILT_IN_ENGINES.find((engine) => engine.id === DEFAULT_ENGINE_ID)!
  );
}

/** Checks a custom engine's search address; returns an error message, or null if it's fine. */
export function validateEngineUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed.includes(QUERY_PLACEHOLDER)) {
    return `Put ${QUERY_PLACEHOLDER} where the search words go, e.g. https://example.com/search?q=${QUERY_PLACEHOLDER}`;
  }
  try {
    const parsed = new URL(trimmed.replace(QUERY_PLACEHOLDER, 'test'));
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return 'The address must start with https:// or http://';
    }
  } catch {
    return 'That doesn’t look like a web address.';
  }
  return null;
}

/**
 * What the address bar should open: a web address if the text looks like one (with or without
 * https://), otherwise a search with the chosen engine.
 */
export function resolveAddressInput(input: string, engine: SearchEngine): string | null {
  const text = input.trim();
  if (!text) return null;

  if (/^https?:\/\//i.test(text)) {
    try {
      return new URL(text).href;
    } catch {
      // Not a valid address after all: search for it.
    }
  } else if (!/\s/.test(text) && looksLikeHost(text)) {
    try {
      return new URL(`https://${text}`).href;
    } catch {
      // Fall through to search.
    }
  }
  return engine.url.replace(QUERY_PLACEHOLDER, encodeURIComponent(text));
}

/** "example.com", "sub.example.co.uk/path", "localhost:8081", "192.168.1.5". */
function looksLikeHost(text: string) {
  const host = text.split(/[/?#]/)[0].replace(/:\d+$/, '');
  if (host === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  // A dot with a letter-only ending of 2+ characters: example.com yes, "3.5" or "e.g" no.
  return /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(host);
}
