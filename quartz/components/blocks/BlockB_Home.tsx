// @ts-expect-error — subpath export resolves at runtime (see BlockA_FolderInfo).
import { htmlToJsx } from "@quartz-community/utils/jsx"
import { Root } from "hast"
import { BlockTemplate } from "./types"

/**
 * Block B for the homepage.
 *
 * Renders the markdown of `content/index.md` as-is, plus a hidden HTML5
 * <audio> element + small script that turns the homepage image into an
 * audio easter egg. Triggered only when the pointer is over an OPAQUE
 * pixel of the image (the blue silhouette); transparent corners are inert.
 *
 *   On hover-capable devices (desktop with mouse):
 *     – mouse moves into a blue pixel  → seek to 0 + play
 *     – mouse moves into transparency, or leaves entirely → pause
 *
 *   On touch-only devices (phone/tablet):
 *     – tap on a blue pixel  → seek to 0 + play
 *     – tap on a blue pixel again → pause
 *     – tap on transparency → ignored
 *
 * The <audio> tag uses `preload="auto"` so the file is fetched in the
 * background at page load — first play has zero perceptible delay.
 *
 * To change the audio, drop a new MP3 in quartz/static/ and update AUDIO_SRC.
 */

const AUDIO_SRC = "/static/hover.mp3"

const BlockB_Home: BlockTemplate = (props) => {
  const { tree } = props
  const hastRoot = tree as Root

  return (
    <>
      <article class="block-home">{htmlToJsx(hastRoot)}</article>
      <audio
        id="me-hover-player"
        src={AUDIO_SRC}
        preload="auto"
        style="display: none"
      />
      <script dangerouslySetInnerHTML={{ __html: HOVER_PLAYER_SCRIPT }} />
    </>
  )
}

const HOVER_PLAYER_SCRIPT = `
(function () {
  if (window.__hoverPlayerInit) return;
  window.__hoverPlayerInit = true;

  // ---- pixel-alpha hit testing (cached canvas per image src) ---------------
  var canvasCache = Object.create(null);

  function isPixelOpaque(img, clientX, clientY) {
    if (!img.complete || img.naturalWidth === 0) return false;
    var rect = img.getBoundingClientRect();
    var x = Math.floor((clientX - rect.left) * (img.naturalWidth / rect.width));
    var y = Math.floor((clientY - rect.top) * (img.naturalHeight / rect.height));
    if (x < 0 || y < 0 || x >= img.naturalWidth || y >= img.naturalHeight) return false;
    try {
      var c = canvasCache[img.src];
      if (!c) {
        c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        canvasCache[img.src] = c;
      }
      var pixel = c.getContext('2d').getImageData(x, y, 1, 1).data;
      return pixel[3] >= 128;
    } catch (e) {
      // CORS-tainted canvas or other read failure — fall back to allowing.
      return true;
    }
  }

  // ---- HTML5 audio control --------------------------------------------------
  function getAudio() {
    return document.getElementById('me-hover-player');
  }

  function playFromStart() {
    var a = getAudio();
    if (!a) return;
    try {
      a.currentTime = 0;
      var p = a.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    } catch (e) {}
  }

  function pauseAudio() {
    var a = getAudio();
    if (!a) return;
    try { a.pause(); } catch (e) {}
  }

  // ---- wire up the image ----------------------------------------------------
  function setup() {
    var img = document.querySelector('.block-home img');
    if (!img || img.dataset.hoverPlayer === 'on') return;
    img.dataset.hoverPlayer = 'on';

    var hoverCapable = window.matchMedia && window.matchMedia('(hover: hover)').matches;

    if (hoverCapable) {
      // Desktop: pixel-aware mousemove gates play state.
      var inOpaque = false;
      var rafId = null;

      img.addEventListener('mousemove', function (e) {
        var x = e.clientX, y = e.clientY;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(function () {
          var opaque = isPixelOpaque(img, x, y);
          if (opaque && !inOpaque) {
            playFromStart();
            inOpaque = true;
          } else if (!opaque && inOpaque) {
            pauseAudio();
            inOpaque = false;
          }
        });
      });

      img.addEventListener('mouseleave', function () {
        if (rafId) cancelAnimationFrame(rafId);
        if (inOpaque) {
          pauseAudio();
          inOpaque = false;
        }
      });
    } else {
      // Touch: tap on opaque toggles play/pause; tap on transparency ignored.
      var playing = false;
      img.addEventListener('click', function (e) {
        e.preventDefault();
        if (!isPixelOpaque(img, e.clientX, e.clientY)) return;
        if (playing) { pauseAudio(); playing = false; }
        else { playFromStart(); playing = true; }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
  document.addEventListener('nav', setup);
})();
`

export default BlockB_Home
