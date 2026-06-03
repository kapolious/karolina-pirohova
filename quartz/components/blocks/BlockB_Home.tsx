// @ts-expect-error — subpath export resolves at runtime (see BlockA_FolderInfo).
import { htmlToJsx } from "@quartz-community/utils/jsx"
import { Root } from "hast"
import { BlockTemplate } from "./types"

/**
 * Block B for the homepage.
 *
 * Renders the markdown of `content/index.md` as-is, plus a hidden HTML5
 * <audio> element + small script that turns the homepage image into an
 * audio easter egg. The image behaves as a hyperlink — clicked/tapped
 * (not hovered) to activate. The blue silhouette is the click target;
 * transparent corners are inert on every device.
 *
 *   On every device:
 *     – click/tap on a blue pixel       → seek to 0 + play
 *     – click/tap on a blue pixel again → pause
 *     – click/tap on a transparent area → ignored
 *
 *   Hover-capable devices additionally get a pointer cursor when over the
 *   opaque silhouette, so the click affordance is discoverable.
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

    // Universal click/tap toggle: opaque pixel only, transparent ignored.
    var playing = false;
    img.addEventListener('click', function (e) {
      e.preventDefault();
      if (!isPixelOpaque(img, e.clientX, e.clientY)) return;
      if (playing) { pauseAudio(); playing = false; }
      else { playFromStart(); playing = true; }
    });

    // On hover-capable devices: cursor changes to pointer over the blue
    // silhouette and back to default over transparent corners. Throttled
    // via requestAnimationFrame so it's basically free even on fast swipes.
    if (hoverCapable) {
      var rafId = null;
      img.style.cursor = 'default';

      img.addEventListener('mousemove', function (e) {
        var x = e.clientX, y = e.clientY;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(function () {
          img.style.cursor = isPixelOpaque(img, x, y) ? 'pointer' : 'default';
        });
      });

      img.addEventListener('mouseleave', function () {
        if (rafId) cancelAnimationFrame(rafId);
        img.style.cursor = 'default';
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
