import { MANIFEST_MESSAGE, POST_TO_APP } from '@/features/browser/scripts/bridge';

/**
 * Runs in the page (top frame only): tells the app when the page links a web app manifest, i.e.
 * it can be installed like a PWA. Re-checks a little after loading (some sites add the manifest
 * link with JavaScript) and after in-app navigations on single-page sites, which change the URL
 * without a new page load.
 */
export const MANIFEST_DETECTOR = `(function () {
  if (window.top !== window || window.__pwaboxManifest) return;
  window.__pwaboxManifest = true;

  ${POST_TO_APP}
  var reported = '';
  function check() {
    var link = document.querySelector('link[rel~="manifest"][href]');
    if (!link || reported === location.href) return;
    reported = location.href;
    postToApp({ type: '${MANIFEST_MESSAGE}', pageUrl: location.href });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check);
  else check();
  window.addEventListener('load', function () {
    check();
    setTimeout(check, 1500);
    setTimeout(check, 4000);
  });
  window.addEventListener('popstate', check);
  var pushState = history.pushState;
  history.pushState = function () {
    var result = pushState.apply(this, arguments);
    setTimeout(check, 500);
    return result;
  };
})();
true;`;
