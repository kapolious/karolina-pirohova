import { BlockTemplate } from "./types"

/**
 * Block C for individual tag pages (`/tags/<tagname>`).
 *
 * Orange search field that live-filters the inline note list in Block B by
 * substring match against each item's `data-title`. Same visual pattern as
 * `BlockC_TagIndexSearch` — just aimed at `.tag-note-list > li` instead of
 * the alphabetised tag grid.
 */
const BlockC_TagNotesSearch: BlockTemplate = () => {
  return (
    <>
      <input
        class="block-search"
        type="text"
        placeholder="search"
        aria-label="search notes with this tag"
      />
      <script dangerouslySetInnerHTML={{ __html: TAG_NOTES_SEARCH_SCRIPT }} />
    </>
  )
}

const TAG_NOTES_SEARCH_SCRIPT = `
(function () {
  if (window.__tagNotesSearchInit) return;
  window.__tagNotesSearchInit = true;

  var searchInput = null;

  function applyFilter() {
    var q = (searchInput && searchInput.value ? searchInput.value.toLowerCase().trim() : '');
    var items = document.querySelectorAll('.tag-note-list > li');
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      var title = (el.dataset.title || el.textContent || '').toLowerCase().trim();
      el.style.display = (!q || title.indexOf(q) !== -1) ? '' : 'none';
    }
  }

  function setup() {
    searchInput = document.querySelector('.block-search');
    if (!searchInput || searchInput.dataset.tagNotesSearch === 'on') return;
    searchInput.dataset.tagNotesSearch = 'on';
    searchInput.addEventListener('input', applyFilter);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
  document.addEventListener('nav', setup);
})();
`

export default BlockC_TagNotesSearch
