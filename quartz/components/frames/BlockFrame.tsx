import { PageFrame, PageFrameProps } from "./types"
import BlockA_FolderInfo from "../blocks/BlockA_FolderInfo"
import BlockA_NoteInfo, { BlockA_NoteHeader } from "../blocks/BlockA_NoteInfo"
import BlockB_Listing from "../blocks/BlockB_Listing"
import BlockB_Note from "../blocks/BlockB_Note"
import BlockB_Home from "../blocks/BlockB_Home"
import BlockB_TagIndex from "../blocks/BlockB_TagIndex"
import BlockB_Friction from "../blocks/BlockB_Friction"
import BlockB_Thoughts from "../blocks/BlockB_Thoughts"
import BlockB_TagNotes from "../blocks/BlockB_TagNotes"
import BlockC_Footnotes from "../blocks/BlockC_Footnotes"
import BlockC_PropertiesFootnotes from "../blocks/BlockC_PropertiesFootnotes"
import BlockC_ThoughtsFilters from "../blocks/BlockC_ThoughtsFilters"
import BlockC_TagIndexSearch from "../blocks/BlockC_TagIndexSearch"
import BlockC_TagNotesSearch from "../blocks/BlockC_TagNotesSearch"
import { BlockTemplate } from "../blocks/types"

/**
 * BlockFrame — the universal three-column layout for the whole site.
 *
 *   ┌─────────┬──────────────────┬───────────┐
 *   │ Block A │     Block B      │  Block C  │
 *   │ cols    │     cols         │  cols     │
 *   │ 1 – 2   │     3 – 6        │  7 – 9    │
 *   └─────────┴──────────────────┴───────────┘
 *
 * The blocks have fixed widths on every page. What goes in each block is
 * a template (BlockA_*.tsx / BlockB_*.tsx / BlockC_*.tsx) chosen below per
 * page type. Adding a new layout = writing one template + one branch here.
 */
export const BlockFrame: PageFrame = {
  name: "blocks",
  render(props: PageFrameProps) {
    const { componentData } = props
    const slug = (componentData.fileData as { slug?: string }).slug ?? ""

    const pageKind = classifyPage(slug)
    const { BlockA, BlockB, BlockC } = templatesFor(pageKind, slug)

    return (
      <>
        <div class={`block block-a block-a--${pageKind}`}>
          {BlockA && <BlockA {...componentData} />}
        </div>
        <div class={`block block-b block-b--${pageKind}`}>
          {BlockB && <BlockB {...componentData} />}
        </div>
        <div class={`block block-c block-c--${pageKind}`}>
          {BlockC && <BlockC {...componentData} />}
        </div>
        <script dangerouslySetInnerHTML={{ __html: NO_ORPHANS_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: FRICTION_GRAPH_FILTER_SCRIPT }} />
      </>
    )
  },
}

/**
 * Typography polish — ties single-letter prepositions/conjunctions to the
 * next word so they never end up alone at the end of a line. Handles both:
 *
 *   Czech non-syllabic prepositions: k, s, v, z, a, o, u, i (+uppercase)
 *   English orphan single letters:   a, I (already covered by the Czech set)
 *
 * Implementation: walk text nodes inside `.block-a / .block-b / .block-c`
 * after the DOM is ready (and re-run on SPA navigation), replacing the
 * regular space that follows a single letter with a non-breaking space.
 *
 * Skips SCRIPT / STYLE / CODE / PRE / INPUT / TEXTAREA so we don't mangle
 * code samples or form controls.
 */
const NO_ORPHANS_SCRIPT = `
(function () {
  if (window.__noOrphansInit) return;
  window.__noOrphansInit = true;

  // Single letters that should never end a line.
  var SINGLES = 'aiouvszkAIOUVSZK';
  var PATTERN = new RegExp('(^|\\\\s)([' + SINGLES + '])\\\\s+', 'g');
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, CODE: 1, PRE: 1, INPUT: 1, TEXTAREA: 1 };

  function fixNode(node) {
    var orig = node.nodeValue;
    if (!orig) return;
    var fixed = orig.replace(PATTERN, '$1$2\\u00a0');
    if (fixed !== orig) node.nodeValue = fixed;
  }

  function walk(el) {
    if (!el) return;
    if (el.nodeType === 3) { fixNode(el); return; }
    if (el.nodeType !== 1) return;
    if (SKIP_TAGS[el.tagName]) return;
    if (el.dataset && el.dataset.noOrphans === 'done') return;
    for (var i = 0; i < el.childNodes.length; i++) walk(el.childNodes[i]);
    if (el.dataset) el.dataset.noOrphans = 'done';
  }

  function run() {
    var blocks = document.querySelectorAll('.block-a, .block-b, .block-c');
    for (var i = 0; i < blocks.length; i++) walk(blocks[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
  document.addEventListener('nav', run);
})();
`

/**
 * Filters the global `fetchData` (Quartz's content-index promise) down to
 * the friction folder + one-hop outgoing links — but ONLY when the user
 * is on `/friction/`. On any other page this script no-ops.
 *
 * Why it lives in BlockFrame and not BlockB_Friction.tsx: the script
 * needs to register a `nav` listener BEFORE the user navigates to
 * friction. Inline scripts inside SPA-swapped HTML don't auto-execute,
 * so if the script only existed in friction's own block, it'd never
 * fire on SPA nav into the page — you'd only see the filter take
 * effect after a hard refresh. Putting it in the frame guarantees
 * it runs once on whichever page is loaded first, registers the nav
 * listener, and that listener handles every subsequent navigation.
 *
 * Mechanics: `const fetchData = fetch(...).then(json)` is declared at
 * the top level of a head script. The binding can't be reassigned and
 * isn't on `window`, but the Promise it points to IS mutable when
 * resolved. We attach a `.then(mutate)` before the graph plugin's
 * `await fetchData` resolves; `.then` callbacks fire FIFO, so as long
 * as our listener is registered before the graph's, our mutation runs
 * first and the graph sees the filtered object.
 *
 * Side effect: the mutation persists for the session. If a future page
 * uses the graph plugin (currently none do besides friction), it'd see
 * the filtered data. This script needs revisiting when that happens.
 */
const FRICTION_GRAPH_FILTER_SCRIPT = `
(function () {
  if (window.__frictionFilterInit) return;
  window.__frictionFilterInit = true;

  function isFrictionIndex() {
    return (document.body.dataset.slug || '') === 'friction/index';
  }

  function normaliseSlug(s) {
    return String(s || '').replace(/^\\/+/, '').replace(/\\/+$/, '');
  }

  function attach() {
    if (!isFrictionIndex()) return;
    if (typeof fetchData === 'undefined') {
      console.warn('[FrictionFilter] fetchData binding not visible');
      return;
    }
    fetchData.then(function (data) {
      if (!data || typeof data !== 'object') return;
      var keep = Object.create(null);
      Object.keys(data).forEach(function (slug) {
        var n = normaliseSlug(slug);
        if (n === 'friction/index' || n.indexOf('friction/') === 0) {
          keep[slug] = true;
        }
      });
      Object.keys(keep).forEach(function (slug) {
        var entry = data[slug];
        var links = (entry && entry.links) || [];
        links.forEach(function (link) {
          if (link in data && !keep[link]) keep[link] = true;
        });
      });
      Object.keys(data).forEach(function (slug) {
        if (!keep[slug]) delete data[slug];
      });
    }).catch(function (e) {
      console.error('[FrictionFilter] filter failed:', e);
    });
  }

  attach();
  document.addEventListener('nav', attach);
})();
`

type PageKind = "home" | "folder" | "note"

function classifyPage(slug: string): PageKind {
  if (slug === "index") return "home"
  if (slug.endsWith("/index")) return "folder"
  return "note"
}

interface BlockSet {
  BlockA: BlockTemplate | null
  BlockB: BlockTemplate | null
  BlockC: BlockTemplate | null
}

/**
 * The puzzle assembly: pick a template for each block based on page kind
 * (and slug, when a specific folder gets its own layout).
 *
 * To customise: add a slug-based branch inside the relevant case. For
 * example, the `thoughts/` folder swaps the standard listing for a star
 * constellation. The rest of the folders fall through to the default.
 */
function templatesFor(kind: PageKind, slug: string): BlockSet {
  switch (kind) {
    case "home":
      return {
        BlockA: null,
        BlockB: BlockB_Home,
        BlockC: BlockC_Footnotes,
      }
    case "folder":
      if (slug === "cv/index") {
        // cv is a single-page CV, not a listing of notes. The markdown
        // body in cv/index.md IS the content — route to detail templates
        // so the body lands in Block B as the page itself.
        return {
          BlockA: BlockA_NoteInfo,
          BlockB: BlockB_Note,
          BlockC: BlockC_Footnotes,
        }
      }
      if (slug === "tags/index") {
        // tag index: alphabetical a–z grid of every tag site-wide,
        // with an orange search field in Block C.
        return {
          BlockA: BlockA_FolderInfo,
          BlockB: BlockB_TagIndex,
          BlockC: BlockC_TagIndexSearch,
        }
      }
      if (slug.startsWith("friction/")) {
        // friction: Obsidian-style force-directed graph view of the whole
        // site (wikilinks become edges). Better signal-to-aesthetic ratio
        // for thesis-stage work than the static constellation.
        return {
          BlockA: BlockA_FolderInfo,
          BlockB: BlockB_Friction,
          BlockC: BlockC_Footnotes,
        }
      }
      if (slug.startsWith("thoughts/")) {
        // thoughts: reverse-chronological list with date, title, tags;
        // each row divided by a thin blue line; hovering anywhere on a
        // row highlights only the title. Search + tag-filter live in C
        // (same `data-title` / `data-tags` contract on each <li> so the
        // filter script doesn't change).
        return {
          BlockA: BlockA_FolderInfo,
          BlockB: BlockB_Thoughts,
          BlockC: BlockC_ThoughtsFilters,
        }
      }
      return {
        BlockA: BlockA_FolderInfo,
        BlockB: BlockB_Listing,
        BlockC: BlockC_Footnotes,
      }
    case "note":
      if (slug.startsWith("kisk/")) {
        // kisk subject details: move frontmatter properties out of Block A
        // and into Block C so they pick up the orange marginalia treatment
        // alongside the footnotes. Block A is just crumbs + title.
        return {
          BlockA: BlockA_NoteHeader,
          BlockB: BlockB_Note,
          BlockC: BlockC_PropertiesFootnotes,
        }
      }
      if (slug.startsWith("tags/")) {
        // Individual tag page — auto-generated by tag-page plugin. The
        // plugin gives us an empty body, so we fill Block B with an inline
        // list of every note carrying this tag (newest first). Block C
        // gets the same orange search field as the tag index, aimed at
        // the note list instead.
        return {
          BlockA: BlockA_NoteHeader,
          BlockB: BlockB_TagNotes,
          BlockC: BlockC_TagNotesSearch,
        }
      }
      return {
        BlockA: BlockA_NoteInfo,
        BlockB: BlockB_Note,
        BlockC: BlockC_Footnotes,
      }
  }
}
