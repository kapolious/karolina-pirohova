import { PageFrame, PageFrameProps } from "./types"
import BlockA_FolderInfo from "../blocks/BlockA_FolderInfo"
import BlockA_NoteInfo from "../blocks/BlockA_NoteInfo"
import BlockB_Listing from "../blocks/BlockB_Listing"
import BlockB_Note from "../blocks/BlockB_Note"
import BlockB_Home from "../blocks/BlockB_Home"
import BlockB_TagIndex from "../blocks/BlockB_TagIndex"
import BlockB_Friction from "../blocks/BlockB_Friction"
import BlockC_Footnotes from "../blocks/BlockC_Footnotes"
import BlockC_ThoughtsFilters from "../blocks/BlockC_ThoughtsFilters"
import BlockC_TagIndexSearch from "../blocks/BlockC_TagIndexSearch"
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
        // thoughts: search + tag list in C waiting for a custom B view.
        // BlockB_Listing is the placeholder until that view is designed —
        // it'll just show the notes as a list for now (filters won't act
        // on listing rows; they target `.thought-node` elements from the
        // constellation template).
        return {
          BlockA: BlockA_FolderInfo,
          BlockB: BlockB_Listing,
          BlockC: BlockC_ThoughtsFilters,
        }
      }
      return {
        BlockA: BlockA_FolderInfo,
        BlockB: BlockB_Listing,
        BlockC: BlockC_Footnotes,
      }
    case "note":
      return {
        BlockA: BlockA_NoteInfo,
        BlockB: BlockB_Note,
        BlockC: BlockC_Footnotes,
      }
  }
}
