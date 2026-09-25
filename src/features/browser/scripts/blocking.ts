/**
 * Ad, pop-up and redirect blocking for sites running in the WebView.
 *
 * react-native-webview exposes neither Android's request interception nor iOS content rule
 * lists, so ads are blocked from inside the page: known ad-network scripts, frames and
 * requests are stopped before they load, and common ad slots are hidden with CSS. Pop-ups and
 * redirects are decided natively (onOpenWindow / onShouldStartLoadWithRequest) in
 * use-navigation-guard.
 */

import { POPUP_MESSAGE, POST_TO_APP } from '@/features/browser/scripts/bridge';

/**
 * Ad-serving, ad-tech and pop-up/pop-under networks (matched with subdomains). Deliberately
 * limited to hosts that exist to serve ads, so blocking them doesn't break sites; analytics and
 * tag managers are left alone. Compiled from the networks common to EasyList, Peter Lowe's list
 * and the HaGeZi lists.
 */
export const AD_HOSTS = [
  // Google ads
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'adservice.google.com',
  'googletagservices.com',
  '2mdn.net',
  // Ad exchanges and supply-side platforms
  'adnxs.com',
  'adsrvr.org',
  'amazon-adsystem.com',
  'pubmatic.com',
  'rubiconproject.com',
  'openx.net',
  'casalemedia.com',
  'indexww.com',
  '3lift.com',
  'triplelift.com',
  'criteo.com',
  'criteo.net',
  'smartadserver.com',
  'adform.net',
  'yieldmo.com',
  '33across.com',
  '360yield.com',
  'sharethrough.com',
  'teads.tv',
  'media.net',
  'contextweb.com',
  'bidswitch.net',
  'sonobi.com',
  'gumgum.com',
  'lijit.com',
  'sovrn.com',
  'undertone.com',
  'kargo.com',
  'spotxchange.com',
  'springserve.com',
  'serving-sys.com',
  'flashtalking.com',
  'adroll.com',
  'advertising.com',
  'yahoo-ads.com',
  'adtech.de',
  'moatads.com',
  'adsafeprotected.com',
  'doubleverify.com',
  'inmobi.com',
  // Native / "recommended for you" ad widgets
  'taboola.com',
  'outbrain.com',
  'revcontent.com',
  'mgid.com',
  'zergnet.com',
  'adblade.com',
  'content.ad',
  // Pop-up, pop-under and redirect networks
  'popads.net',
  'popcash.net',
  'propellerads.com',
  'propellerclick.com',
  'adsterra.com',
  'adsterratech.com',
  'exoclick.com',
  'exosrv.com',
  'juicyads.com',
  'trafficjunky.net',
  'trafficstars.com',
  'hilltopads.net',
  'adcash.com',
  'clickadu.com',
  'onclickads.net',
  'onclkds.com',
  'popmyads.com',
  'a-ads.com',
  'bidvertiser.com',
  'infolinks.com',
  'chitika.com',
  'zedo.com',
  'adspyglass.com',
  'richpartners.co',
  'galaksion.com',
  // Adult ad networks (from EasyList's adult ad-server list)
  'trafficjunky.com',
  'tsyndicate.com',
  'plugrush.com',
  'exoticads.com',
  'adxpansion.com',
  'hubtraffic.com',
  'clickaine.com',
  'eroadvertising.com',
  'adspector.io',
  'adsession.com',
];

/** Selectors for ad slots, hidden with CSS. Kept to names that are ads by convention. */
const AD_SELECTORS = [
  'ins.adsbygoogle',
  '.adsbygoogle',
  '[id^="google_ads_iframe"]',
  '[id^="div-gpt-ad"]',
  '[data-google-query-id]',
  'iframe[src*="doubleclick.net"]',
  'iframe[src*="googlesyndication.com"]',
  'iframe[id^="google_ads_"]',
  '[id^="taboola-"]',
  '.trc_related_container',
  '.OUTBRAIN',
  '[data-widget-src*="outbrain"]',
  'amp-ad',
  'amp-embed[type="taboola"]',
  '[data-ad-slot]',
  '[data-ad-unit]',
  '[aria-label="Advertisement"]',
  '.ad-slot',
  '.ad-banner',
  '.adBanner',
  '.ad-container',
  '.advertisement',
  // TrafficJunky, used across many adult sites
  'ins.adsbytrafficjunky',
  '.adsbytrafficjunky',
  'div:has(> ins.adsbytrafficjunky)',
  'a[href^="https://ads.trafficjunky.net/"]',
];

/**
 * Extra selectors for particular sites (matched with subdomains), for ads a generic rule can't
 * catch without breaking other sites. Taken from the uBlock Origin (uAssets) filters.
 */
const SITE_SELECTORS: Record<string, string[]> = {};
for (const site of ['pornhub.com', 'pornhubpremium.com', 'youporn.com', 'redtube.com', 'tube8.com', 'thumbzilla.com']) {
  // In-page ad slots and paid links. (Not the player's .mgp_overlayContainer: that layer also
  // holds the player's own controls, and hiding it makes every tap pause the video.)
  SITE_SELECTORS[site] = [
    '.watchpageAd',
    '.ad-tabSplit',
    '.eudsaLink',
    '.bottomNav > a[href][target="_blank"]',
    'a[data-event="header_paid_tabs"]',
  ];
}

export function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

export function isAdHost(url: string) {
  const host = hostnameOf(url);
  return !!host && AD_HOSTS.some((ad) => host === ad || host.endsWith(`.${ad}`));
}

// Second-level labels under country codes, e.g. bbc.co.uk, abc.net.au.
const COUNTRY_SECOND_LEVELS = new Set(['co', 'com', 'net', 'org', 'gov', 'ac', 'edu', 'ne', 'or']);

/**
 * The "site" a URL belongs to: m.youtube.com and www.youtube.com are both youtube.com.
 * An approximation of the registrable domain that's right for the vast majority of sites
 * without shipping the full public-suffix list.
 */
export function siteOf(url: string) {
  const host = hostnameOf(url);
  if (!host) return '';
  if (/^[\d.]+$/.test(host) || host.includes(':')) return host; // IP address
  const labels = host.split('.');
  if (labels.length <= 2) return host;
  const tld = labels[labels.length - 1];
  const second = labels[labels.length - 2];
  const keep = tld.length === 2 && COUNTRY_SECOND_LEVELS.has(second) ? 3 : 2;
  return labels.slice(-keep).join('.');
}

/**
 * Runs inside every page: stops ad-network scripts, frames, images and requests before they
 * load, removes any that slip through, and hides common ad slots.
 */
export const AD_BLOCK_SCRIPT = `(function () {
  if (window.__pwaboxAdBlock) return;
  window.__pwaboxAdBlock = true;

  var hosts = ${JSON.stringify(AD_HOSTS)};
  function isAd(url) {
    if (!url || typeof url !== 'string') return false;
    var host;
    try { host = new URL(url, location.href).hostname.toLowerCase(); } catch (e) { return false; }
    for (var i = 0; i < hosts.length; i++) {
      var ad = hosts[i];
      if (host === ad || host.slice(-ad.length - 1) === '.' + ad) return true;
    }
    return false;
  }
  function urlOf(node) {
    return node && (node.src || (node.getAttribute && node.getAttribute('src')) || '');
  }
  var TAGS = { SCRIPT: 1, IFRAME: 1, IMG: 1 };
  function isAdNode(node) {
    return !!node && node.nodeType === 1 && TAGS[node.tagName] && isAd(urlOf(node));
  }

  // A blocked script/frame/image reports failure like a blocked download would, so code
  // waiting on it (ad loaders, video players waiting for a pre-roll) moves on instead of hanging.
  function fail(node) {
    setTimeout(function () {
      try { node.dispatchEvent(new Event('error')); } catch (e) {}
    }, 0);
  }

  var setAttribute = Element.prototype.setAttribute;
  function markBlocked(element) {
    setAttribute.call(element, 'data-pwabox-blocked', '');
    fail(element);
  }

  // Dynamically inserted ad scripts/frames: never attach them.
  ['appendChild', 'insertBefore', 'replaceChild'].forEach(function (method) {
    var original = Node.prototype[method];
    Node.prototype[method] = function (node) {
      if (isAdNode(node)) {
        fail(node);
        return node;
      }
      return original.apply(this, arguments);
    };
  });

  // src set after creation, e.g. script.src = 'https://ads...': drop it and hide the (now empty)
  // element, so a blocked frame doesn't leave a blank box behind.
  [window.HTMLScriptElement, window.HTMLIFrameElement, window.HTMLImageElement].forEach(function (type) {
    if (!type) return;
    var descriptor = Object.getOwnPropertyDescriptor(type.prototype, 'src');
    if (!descriptor || !descriptor.set) return;
    Object.defineProperty(type.prototype, 'src', {
      configurable: true,
      enumerable: descriptor.enumerable,
      get: descriptor.get,
      set: function (value) {
        if (isAd(String(value))) return markBlocked(this);
        descriptor.set.call(this, value);
      },
    });
  });
  Element.prototype.setAttribute = function (name, value) {
    if (String(name).toLowerCase() === 'src' && TAGS[this.tagName] && isAd(String(value))) {
      return markBlocked(this);
    }
    return setAttribute.apply(this, arguments);
  };

  // Requests made from script fail like a network error.
  if (window.fetch) {
    var fetch = window.fetch;
    window.fetch = function (input) {
      var url = typeof input === 'string' ? input : input && input.url;
      if (isAd(url)) return Promise.reject(new TypeError('Failed to fetch'));
      return fetch.apply(this, arguments);
    };
  }
  var open = XMLHttpRequest.prototype.open;
  var send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__pwaboxBlocked = isAd(String(url));
    return open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    if (!this.__pwaboxBlocked) return send.apply(this, arguments);
    var xhr = this;
    setTimeout(function () {
      // What a real network error looks like: done (4), status 0, then error and loadend.
      Object.defineProperty(xhr, 'readyState', { configurable: true, value: 4 });
      Object.defineProperty(xhr, 'status', { configurable: true, value: 0 });
      ['readystatechange', 'error', 'loadend'].forEach(function (type) {
        try { xhr.dispatchEvent(new Event(type)); } catch (e) {}
      });
    }, 0);
  };
  if (navigator.sendBeacon) {
    var beacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (url) { return isAd(String(url)) ? true : beacon.apply(null, arguments); };
  }
  // Pop-ups to ad networks never even reach the app.
  var windowOpen = window.open;
  window.open = function (url) {
    if (isAd(String(url || ''))) return null;
    return windowOpen.apply(this, arguments);
  };

  // Anything already in the page's HTML.
  function sweep(root) {
    if (!root || !root.querySelectorAll) return;
    var nodes = root.querySelectorAll('script[src], iframe[src], img[src]');
    for (var i = 0; i < nodes.length; i++) {
      if (isAdNode(nodes[i])) {
        nodes[i].remove();
        fail(nodes[i]);
      }
    }
  }
  new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var added = mutations[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var node = added[j];
        if (isAdNode(node)) {
          node.remove();
          fail(node);
        } else if (node.nodeType === 1) {
          sweep(node);
        }
      }
    }
  }).observe(document.documentElement || document, { childList: true, subtree: true });
  sweep(document);

  // One rule per selector: a browser drops a whole selector list if it doesn't understand one
  // part of it (e.g. :has() on an older WebView), which would switch off every other rule too.
  var selectors = ${JSON.stringify(AD_SELECTORS)};
  var siteSelectors = ${JSON.stringify(SITE_SELECTORS)};
  var hostname = location.hostname;
  Object.keys(siteSelectors).forEach(function (site) {
    if (hostname === site || hostname.slice(-site.length - 1) === '.' + site) {
      selectors = selectors.concat(siteSelectors[site]);
    }
  });
  selectors.push('[data-pwabox-blocked]');
  var style = document.createElement('style');
  style.textContent = selectors.map(function (selector) {
    return selector + '{display:none!important}';
  }).join(' ');
  (document.head || document.documentElement).appendChild(style);
})();
true;`;


/**
 * Runs inside every page while the pop-up blocker is on. Cross-site window.open() calls get a
 * stand-in window instead of a real one, and the app is told so it can offer "Open".
 *
 * Returning a stand-in (rather than null, or blocking natively) matters: pop-under scripts that
 * see their pop-up fail try again on every tap and swallow it, so taps never reach the page, e.g.
 * a video player. uBlock Origin's `no-window-open-if` does the same for the same reason.
 */
export const POPUP_BLOCK_SCRIPT = `(function () {
  if (window.__pwaboxPopups) return;
  window.__pwaboxPopups = true;

  var secondLevels = ${JSON.stringify([...COUNTRY_SECOND_LEVELS])};
  function siteOf(host) {
    host = String(host || '').toLowerCase();
    if (/^[\d.]+$/.test(host) || host.indexOf(':') !== -1) return host;
    var labels = host.split('.');
    if (labels.length <= 2) return host;
    var tld = labels[labels.length - 1];
    var second = labels[labels.length - 2];
    var keep = tld.length === 2 && secondLevels.indexOf(second) !== -1 ? 3 : 2;
    return labels.slice(-keep).join('.');
  }
  ${POST_TO_APP}
  function post(url) {
    postToApp({ type: '${POPUP_MESSAGE}', url: url });
  }
  function noop() {}
  function standIn() {
    var fake = {
      closed: false,
      opener: null,
      name: '',
      close: function () { fake.closed = true; },
      focus: noop,
      blur: noop,
      postMessage: noop,
      addEventListener: noop,
      removeEventListener: noop,
      location: { href: 'about:blank', assign: noop, replace: noop, reload: noop },
      document: { write: noop, writeln: noop, open: noop, close: noop },
    };
    return fake;
  }

  var realOpen = window.open;
  window.open = function (url) {
    var target = null;
    try { target = new URL(String(url || ''), location.href); } catch (e) {}
    if (target && /^https?:$/.test(target.protocol) && siteOf(target.hostname) === siteOf(location.hostname)) {
      return realOpen.apply(this, arguments);
    }
    if (target && /^https?:$/.test(target.protocol)) post(target.href);
    return standIn();
  };
})();
true;`;
