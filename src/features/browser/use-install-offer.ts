import { useCallback, useRef, useState } from 'react';

import { siteOf } from '@/features/browser/scripts/blocking';
import { fetchSiteInfo, type SiteInfo } from '@/features/sites/site-info';
import { useSites } from '@/features/sites/sites-store';

/**
 * Offers to add the site being browsed as an app when its page links a web app manifest (the
 * page script reports that). Each site is looked up once per session, sites already in Apps are
 * skipped, and the "add as app?" notice shows only the first time a site is reached.
 */
export function useInstallOffer() {
  const { sites } = useSites();
  // What's installable, for the page currently shown.
  const [offer, setOffer] = useState<SiteInfo | null>(null);
  // Shown once per site per session.
  const [prompt, setPrompt] = useState<SiteInfo | null>(null);

  const lookups = useRef(new Map<string, Promise<SiteInfo | null>>());
  const prompted = useRef(new Set<string>());
  const currentSite = useRef('');

  const isSaved = (url: string) => sites.some((site) => siteOf(site.url) === siteOf(url));

  /** Call whenever the browser shows a new page. */
  function pageChanged(url: string) {
    const site = siteOf(url);
    if (site === currentSite.current) return;
    currentSite.current = site;
    setOffer(null);
    setPrompt(null);
  }

  /** The page script found a manifest on `pageUrl`. */
  async function manifestFound(pageUrl: string) {
    const site = siteOf(pageUrl);
    if (!site || isSaved(pageUrl)) return;

    let lookup = lookups.current.get(site);
    if (!lookup) {
      lookup = fetchSiteInfo(pageUrl).catch(() => null);
      lookups.current.set(site, lookup);
    }
    const info = await lookup;
    // Ignore it if the user has moved on to another site meanwhile.
    if (!info || siteOf(pageUrl) !== currentSite.current) return;

    setOffer(info);
    if (!prompted.current.has(site)) {
      prompted.current.add(site);
      setPrompt(info);
    }
  }

  const dismissPrompt = useCallback(() => setPrompt(null), [setPrompt]);

  return {
    /** Installable site for the current page (while it isn't in Apps yet). */
    offer: offer && !isSaved(offer.url) ? offer : null,
    prompt: prompt && !isSaved(prompt.url) ? prompt : null,
    dismissPrompt,
    pageChanged,
    manifestFound,
  };
}
