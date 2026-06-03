import { BlockTemplate } from "./types"
import { QuartzPluginData } from "../../plugins/vfile"

type FileEntry = QuartzPluginData & {
  slug?: string
  frontmatter?: { tags?: string[] }
  unlisted?: boolean
}

/**
 * Block C for the `thoughts/` folder.
 *
 * Lives in the right-hand column and houses the two filtering controls for
 * the BlockB_ThoughtsStar constellation:
 *
 *   1. Search field — live-filters by title substring.
 *   2. Tag filter list — every unique tag used by a note in this folder,
 *      rendered in orange. Hovering a tag dims the others (CSS only).
 *      Clicking a tag filters the star to only thoughts carrying that tag;
 *      clicking the same tag again clears the filter.
 *
 * Search + tag filters combine (both must match). All filtering is DOM-side —
 * the script toggles `.thought-hidden` on the star's thought nodes.
 */
const BlockC_ThoughtsFilters: BlockTemplate = (props) => {
  const folderSlug = ((props.fileData as { slug?: string }).slug ?? "").replace(/\/index$/, "")
  const tags = collectTags(props.allFiles as FileEntry[], folderSlug)

  return (
    <>
      <input
        class="block-search"
        type="text"
        placeholder="search"
        aria-label="search thoughts"
      />
      <ul class="block-tag-filter">
        {tags.map((tag) => (
          <li>
            <button type="button" class="block-tag-filter-item" data-tag={tag}>
              {tag}
            </button>
          </li>
        ))}
      </ul>
      <script dangerouslySetInnerHTML={{ __html: FILTER_SCRIPT }} />
    </>
  )
}

/** All unique tags used by notes directly in this folder, sorted alphabetically. */
function collectTags(allFiles: FileEntry[], folderSlug: string): string[] {
  const prefix = folderSlug.endsWith("/") ? folderSlug : folderSlug + "/"
  const seen = new Set<string>()
  for (const f of allFiles) {
    if (f.unlisted === true) continue
    const s = f.slug
    if (!s || !s.startsWith(prefix)) continue
    const rel = s.slice(prefix.length)
    if (!rel || rel === "index" || rel.includes("/")) continue
    const fileTags = f.frontmatter?.tags ?? []
    for (const t of fileTags) seen.add(t)
  }
  return Array.from(seen).sort()
}

const FILTER_SCRIPT = `
(function () {
  if (window.__thoughtsFilterInit) return;
  window.__thoughtsFilterInit = true;

  var activeTag = null;
  var searchInput = null;

  function applyFilters() {
    var q = (searchInput && searchInput.value ? searchInput.value.toLowerCase().trim() : '');
    // Matches BOTH the constellation thought nodes AND the default listing
    // rows — same data-title / data-tags contract on both.
    var items = document.querySelectorAll('.thought-node, .block-listing > li');
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      var title = (el.dataset.title || '').toLowerCase();
      var tags = (el.dataset.tags || '').split(',');

      var matchesSearch = !q || title.indexOf(q) !== -1;
      var matchesTag = !activeTag || tags.indexOf(activeTag) !== -1;

      if (matchesSearch && matchesTag) {
        el.classList.remove('thought-hidden');
      } else {
        el.classList.add('thought-hidden');
      }
    }
  }

  function setup() {
    searchInput = document.querySelector('.block-search');
    var tagButtons = document.querySelectorAll('.block-tag-filter-item');
    if (!searchInput && tagButtons.length === 0) return;

    if (searchInput && !searchInput.dataset.thoughtsFilter) {
      searchInput.dataset.thoughtsFilter = 'on';
      searchInput.addEventListener('input', applyFilters);
    }

    for (var i = 0; i < tagButtons.length; i++) {
      var btn = tagButtons[i];
      if (btn.dataset.thoughtsFilter) continue;
      btn.dataset.thoughtsFilter = 'on';
      btn.addEventListener('click', (function (btn) {
        return function () {
          if (btn.classList.contains('active')) {
            btn.classList.remove('active');
            activeTag = null;
          } else {
            var others = document.querySelectorAll('.block-tag-filter-item.active');
            for (var j = 0; j < others.length; j++) others[j].classList.remove('active');
            btn.classList.add('active');
            activeTag = btn.dataset.tag;
          }
          applyFilters();
        };
      })(btn));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
  document.addEventListener('nav', function () {
    activeTag = null;
    setup();
    applyFilters();
  });
})();
`

export default BlockC_ThoughtsFilters
