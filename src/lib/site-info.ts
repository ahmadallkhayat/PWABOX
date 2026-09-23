/**
 * Reads a website's PWA metadata (web app manifest, icons, theme color) the same way a
 * browser does when you "install" a site. Falls back to plain HTML tags and /favicon.ico
 * for sites that don't ship a manifest.
 */

export type SiteInfo = {
  /** The URL to open, the manifest's `start_url` when there is one. */
  url: string;
  name: string;
  iconUrl?: string;
  themeColor?: string;
  backgroundColor?: string;
};

type ManifestIcon = { src?: string; sizes?: string; purpose?: string; type?: string };

type Manifest = {
  name?: string;
  short_name?: string;
  start_url?: string;
  theme_color?: string;
  background_color?: string;
  icons?: ManifestIcon[];
};

type Tag = Record<string, string>;

const REQUEST_TIMEOUT_MS = 10000;

const COMMON_MANIFEST_PATHS = ['/manifest.json', '/manifest.webmanifest', '/site.webmanifest'];

/** Turns whatever the user typed ("github.com", "http://x.org/app") into an absolute URL. */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Type a website address.');

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error("That doesn't look like a website address.");
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Only http and https websites are supported.');
  }
  if (!url.hostname.includes('.') && url.hostname !== 'localhost') {
    throw new Error("That doesn't look like a website address.");
  }
  return url.href;
}

export async function fetchSiteInfo(input: string): Promise<SiteInfo> {
  const requestedUrl = normalizeUrl(input);

  const response = await fetchWithTimeout(requestedUrl);
  // Follow redirects so relative links resolve against the page we actually got.
  const pageUrl = response.url || requestedUrl;
  // Some sites refuse the page request but still serve a manifest at a common path.
  const html = response.ok ? await response.text() : '';

  const links = findTags(html, 'link');
  const metas = findTags(html, 'meta');

  const manifestHref = links.find((l) => hasRel(l, 'manifest'))?.href;
  let manifestUrl = manifestHref ? resolve(manifestHref, pageUrl) : undefined;
  let manifest = manifestUrl ? await fetchManifest(manifestUrl) : undefined;

  if (!manifest) {
    for (const path of COMMON_MANIFEST_PATHS) {
      const candidate = resolve(path, pageUrl);
      manifest = await fetchManifest(candidate);
      if (manifest) {
        manifestUrl = candidate;
        break;
      }
    }
  }

  if (!response.ok && !manifest) {
    throw new Error(`The website answered with an error (${response.status}).`);
  }

  const metaContent = (name: string) =>
    metas.find((m) => (m.name ?? m.property)?.toLowerCase() === name)?.content?.trim();

  const name =
    manifest?.short_name?.trim() ||
    manifest?.name?.trim() ||
    metaContent('apple-mobile-web-app-title') ||
    metaContent('application-name') ||
    metaContent('og:site_name') ||
    findTitle(html) ||
    new URL(pageUrl).hostname.replace(/^www\./, '');

  const startUrl =
    manifest?.start_url && manifestUrl ? resolve(manifest.start_url, manifestUrl) : undefined;

  return {
    url: startUrl && sameOrigin(startUrl, pageUrl) ? startUrl : pageUrl,
    name,
    iconUrl:
      (manifest && manifestUrl && pickManifestIcon(manifest.icons, manifestUrl)) ||
      pickHtmlIcon(links, pageUrl),
    themeColor: manifest?.theme_color || metaContent('theme-color'),
    backgroundColor: manifest?.background_color,
  };
}

async function fetchWithTimeout(url: string, accept = 'text/html,application/xhtml+xml') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: accept },
    });
  } catch {
    if (controller.signal.aborted) throw new Error('The website took too long to answer.');
    throw new Error("Couldn't reach that website. Check the address and your connection.");
  } finally {
    clearTimeout(timer);
  }
}

async function fetchManifest(url: string): Promise<Manifest | undefined> {
  try {
    const response = await fetchWithTimeout(url, 'application/manifest+json,application/json');
    if (!response.ok) return undefined;
    const manifest = (await response.json()) as Manifest;
    const looksValid =
      manifest && typeof manifest === 'object' && (manifest.name || manifest.short_name || manifest.icons);
    return looksValid ? manifest : undefined;
  } catch {
    // A broken manifest shouldn't stop the site from being added.
    return undefined;
  }
}

/** Prefers the largest square "any" icon; maskable icons look cropped outside a mask. */
function pickManifestIcon(icons: ManifestIcon[] | undefined, manifestUrl: string) {
  if (!Array.isArray(icons)) return undefined;

  const candidates = icons
    .filter((icon) => typeof icon.src === 'string' && icon.src)
    .map((icon) => {
      const purposes = (icon.purpose ?? 'any').split(/\s+/);
      return {
        src: icon.src!,
        size: largestSize(icon.sizes),
        isAny: purposes.includes('any'),
      };
    })
    .sort((a, b) => Number(b.isAny) - Number(a.isAny) || b.size - a.size);

  return candidates[0] ? resolve(candidates[0].src, manifestUrl) : undefined;
}

function pickHtmlIcon(links: Tag[], pageUrl: string) {
  const byRel = (rel: string) =>
    links
      // `data:,` is a common "no favicon" placeholder.
      .filter((l) => hasRel(l, rel) && l.href && !/^data:[^,]*,$/i.test(l.href.trim()))
      .sort((a, b) => largestSize(b.sizes) - largestSize(a.sizes))[0]?.href;

  const href =
    byRel('apple-touch-icon') ||
    byRel('apple-touch-icon-precomposed') ||
    byRel('icon') ||
    byRel('shortcut');

  return href ? resolve(href, pageUrl) : resolve('/favicon.ico', pageUrl);
}

/** "48x48 192x192" -> 192, "any" (SVG) -> treated as very large. */
function largestSize(sizes: string | undefined) {
  if (!sizes) return 0;
  if (sizes.toLowerCase().includes('any')) return 10000;
  return Math.max(0, ...sizes.split(/\s+/).map((s) => parseInt(s.split(/x/i)[0], 10) || 0));
}

function hasRel(tag: Tag, rel: string) {
  return (tag.rel ?? '').toLowerCase().split(/\s+/).includes(rel);
}

function findTitle(html: string) {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? decodeEntities(match[1]).trim() || undefined : undefined;
}

/** Minimal tag scanner: good enough for <link>/<meta>, which are flat and attribute-only. */
function findTags(html: string, tagName: string): Tag[] {
  const tags: Tag[] = [];
  const tagPattern = new RegExp(`<${tagName}\\b([^>]*)>`, 'gi');
  const attrPattern = /([^\s=/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;

  for (const [, attrs] of html.matchAll(tagPattern)) {
    const tag: Tag = {};
    for (const [, key, dq, sq, bare] of attrs.matchAll(attrPattern)) {
      tag[key.toLowerCase()] = decodeEntities(dq ?? sq ?? bare ?? '');
    }
    tags.push(tag);
  }
  return tags;
}

function decodeEntities(text: string) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function resolve(href: string, base: string) {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

function sameOrigin(a: string, b: string) {
  try {
    return new URL(a).origin === new URL(b).origin;
  } catch {
    return false;
  }
}
