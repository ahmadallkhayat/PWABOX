import { FULLSCREEN_MESSAGE, POST_TO_APP } from '@/features/browser/scripts/bridge';

/**
 * Runs inside every page: reports when a video enters/leaves fullscreen and whether it is wide
 * or tall, so the app can rotate to match (the WebView alone only rotates if the phone's
 * auto-rotate is on).
 *
 * On iOS this runs in every frame, so embedded players (e.g. YouTube iframes) measure their own
 * video. Android only injects into the main frame, which sees an embedded player as an <iframe>
 * it can't look inside, so it reports an unmeasured guess.
 */
export const FULLSCREEN_WATCHER = `(function () {
  if (window.__pwaboxFullscreen) return;
  window.__pwaboxFullscreen = true;

  ${POST_TO_APP}
  function post(payload) {
    payload.type = '${FULLSCREEN_MESSAGE}';
    postToApp(payload);
  }
  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement;
  }
  function findVideo(el) {
    if (!el) return null;
    if (el.tagName === 'VIDEO') return el;
    var videos = el.querySelectorAll ? el.querySelectorAll('video') : [];
    for (var i = 0; i < videos.length; i++) if (videos[i].videoWidth) return videos[i];
    return videos[0] || null;
  }
  function report(video) {
    if (video && video.videoWidth && video.videoHeight) {
      post({ on: true, landscape: video.videoWidth > video.videoHeight, measured: true });
      return;
    }
    // Most videos are wide; correct it once the size is known.
    post({ on: true, landscape: true, measured: false });
    if (video) {
      video.addEventListener('loadedmetadata', function () {
        if (fullscreenElement() || video.webkitDisplayingFullscreen) report(video);
      }, { once: true });
    }
  }
  // Android can move a fullscreen video onto a separate layer behind the page as soon as
  // nothing is drawn over it (i.e. when the player's controls fade), and inside this WebView
  // that layer ends up hidden behind the fullscreen view's black background: the picture goes
  // black. A practically invisible layer over the video keeps it composited with the page, as
  // it is while the controls show. It lets every touch through to the player.
  var shield = null;
  function addShield(el) {
    removeShield();
    if (!el || el.tagName === 'VIDEO' || el.tagName === 'IFRAME' || !el.appendChild) return;
    shield = document.createElement('div');
    shield.setAttribute('data-pwabox-shield', '');
    shield.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;' +
      'background:rgba(0,0,0,0.01);z-index:2147483647;';
    el.appendChild(shield);
  }
  function removeShield() {
    if (shield && shield.parentNode) shield.parentNode.removeChild(shield);
    shield = null;
  }
  function onChange() {
    var el = fullscreenElement();
    if (el) {
      addShield(el);
      report(findVideo(el));
    } else {
      removeShield();
      post({ on: false });
    }
  }
  document.addEventListener('fullscreenchange', onChange);
  document.addEventListener('webkitfullscreenchange', onChange);
  // iPhone plays fullscreen video in the native player, which only fires these.
  document.addEventListener('webkitbeginfullscreen', function (e) { report(e.target); }, true);
  document.addEventListener('webkitendfullscreen', function () { post({ on: false }); }, true);
})();
true;`;

/** Leaves any fullscreen video, so it can't stay visible on top of the lock screen. */
export const EXIT_FULLSCREEN = `(function () {
  try {
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
    if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
    document.querySelectorAll('video').forEach(function (v) {
      if (v.webkitDisplayingFullscreen) v.webkitExitFullscreen();
    });
  } catch (e) {}
})();
true;`;
