// @ts-expect-error — subpath export resolves at runtime (see BlockA_FolderInfo).
import { htmlToJsx } from "@quartz-community/utils/jsx"
import { Root } from "hast"
import { BlockTemplate } from "./types"

/**
 * Block B for the homepage.
 *
 * Renders the rendered markdown of `content/index.md` as-is. The folder-nav
 * list (the trailing `<ul>` with links to kisk / portfolio / etc.) is styled
 * by the SCSS rule `.block-home > ul` — no special handling needed here.
 *
 * Per-pixel image-link hit testing: the inlined PIXEL_LINK_SCRIPT below
 * intercepts clicks on any `<a><img></a>` and cancels the navigation when
 * the clicked pixel is transparent (alpha < 128/255). Lets `[![](me.png)](url)`
 * behave as if only the opaque silhouette is clickable.
 */
const BlockB_Home: BlockTemplate = (props) => {
  const { tree } = props
  const hastRoot = tree as Root

  return (
    <>
      <article class="block-home">{htmlToJsx(hastRoot)}</article>
      <script dangerouslySetInnerHTML={{ __html: PIXEL_LINK_SCRIPT }} />
    </>
  )
}

const PIXEL_LINK_SCRIPT = `
(function () {
  if (window.__pixelImageLinkInit) return;
  window.__pixelImageLinkInit = true;

  // Canvas cache keyed by image src so we only decode each image once.
  var canvasCache = Object.create(null);

  function isPixelOpaque(img, clientX, clientY) {
    if (!img.complete || img.naturalWidth === 0) return true;
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
      // CORS-tainted canvas or other read failure — fall back to allowing the click.
      return true;
    }
  }

  function setup() {
    var links = document.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      if (link.dataset.pixelLink === 'on') continue;
      var img = link.querySelector('img');
      if (!img) continue;
      // Only wire links that contain JUST an image (no text alongside).
      if (link.textContent && link.textContent.trim().length > 0) continue;
      link.dataset.pixelLink = 'on';

      (function (link, img) {
        link.addEventListener('click', function (e) {
          if (!isPixelOpaque(img, e.clientX, e.clientY)) {
            e.preventDefault();
            e.stopPropagation();
          }
        });
      })(link, img);
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
