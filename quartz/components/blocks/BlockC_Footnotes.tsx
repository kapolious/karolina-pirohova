// @ts-expect-error — subpath export resolves at runtime (see BlockA_FolderInfo).
import { htmlToJsx } from "@quartz-community/utils/jsx"
import { Root, Element } from "hast"
import { BlockTemplate } from "./types"

/**
 * Block C: Footnotes.
 *
 * Reuses standard markdown footnote syntax — write `text[^1]` in the body and
 * `[^1]: definition` anywhere below, and the footnote text lands here in
 * orange marginalia. Multiple footnotes per page are supported; they render
 * in source order.
 *
 * Layout note: each footnote is absolutely positioned in JS so its top edge
 * aligns with the Y coordinate of its reference superscript in the body.
 * When two refs sit too close vertically, the later footnote is bumped down
 * to maintain a 20px gap. The script handles both initial load and Quartz's
 * SPA `nav` events.
 *
 * If a page has no footnotes, this template renders nothing.
 */
const BlockC_Footnotes: BlockTemplate = (props) => {
  const tree = props.tree as Root
  const section = findFootnotesSection(tree)
  if (!section) return null

  // The remark-gfm output wraps everything in <section data-footnotes>. We
  // skip the wrapper and the visually-hidden <h2> label, rendering only the
  // <ol> so styling is one container deeper.
  const body: Root = { type: "root", children: section.children }

  return (
    <div class="block-footnotes">
      {htmlToJsx(body)}
      <script
        dangerouslySetInnerHTML={{ __html: FOOTNOTE_POSITIONER_SCRIPT }}
      />
    </div>
  )
}

function findFootnotesSection(root: Root): Element | null {
  for (const child of root.children) {
    if (
      child.type === "element" &&
      child.tagName === "section" &&
      child.properties &&
      "dataFootnotes" in child.properties
    ) {
      return child as Element
    }
  }
  return null
}

/**
 * Client-side script. For each <li id="user-content-fn-N"> footnote in
 * Block C, finds the matching <a id="user-content-fnref-N"> reference in
 * Block B and absolutely positions the footnote so its top aligns with the
 * reference's Y. If two footnotes would overlap, the lower one is bumped
 * down to maintain a 20px gap.
 *
 * Re-runs on Quartz SPA `nav` events, viewport resize, and `load` (in case
 * images/fonts shift heights).
 */
export const FOOTNOTE_POSITIONER_SCRIPT = `
(function () {
  if (window.__footnotePositionerInit) return;
  window.__footnotePositionerInit = true;

  function position() {
    var block = document.querySelector('.block-footnotes');
    if (!block) return;
    var ol = block.querySelector('ol');
    if (!ol) return;
    var lis = Array.prototype.slice.call(ol.children);
    if (lis.length === 0) return;

    var containerTop = block.getBoundingClientRect().top + window.scrollY;
    var prevBottom = 0;
    var maxBottom = 0;

    lis.forEach(function (li, idx) {
      var refId = li.id.replace('user-content-fn-', 'user-content-fnref-');
      var ref = document.getElementById(refId);

      var desiredTop;
      if (ref) {
        var refTop = ref.getBoundingClientRect().top + window.scrollY;
        desiredTop = refTop - containerTop;
      } else {
        desiredTop = prevBottom;
      }

      if (idx > 0) desiredTop = Math.max(desiredTop, prevBottom + 20);
      if (desiredTop < 0) desiredTop = 0;

      li.style.top = desiredTop + 'px';
      var liHeight = li.offsetHeight;
      prevBottom = desiredTop + liHeight;
      if (prevBottom > maxBottom) maxBottom = prevBottom;
    });

    block.style.minHeight = maxBottom + 'px';
  }

  function schedule() {
    if (window.__footnotePositionerFrame) cancelAnimationFrame(window.__footnotePositionerFrame);
    window.__footnotePositionerFrame = requestAnimationFrame(position);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', position);
  } else {
    position();
  }
  document.addEventListener('nav', position);
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
})();
`

export default BlockC_Footnotes
