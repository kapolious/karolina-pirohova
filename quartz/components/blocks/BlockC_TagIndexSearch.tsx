import { BlockTemplate } from "./types"

/**
 * Block C for the tag-index page (`/tags/`).
 *
 * Orange search field that live-filters the alphabetical tag list in
 * Block B. Typing narrows visible tags by substring match; letter
 * groups whose tags are all hidden collapse out of view too, so the
 * remaining results stay tidy.
 *
 * Clear the input to restore the full a–z grid.
 */
const BlockC_TagIndexSearch: BlockTemplate = () => {
  return (
    <>
      <input
        class="block-search"
        type="text"
        placeholder="search"
        aria-label="search tags"
      />
      <script dangerouslySetInnerHTML={{ __html: TAG_INDEX_SEARCH_SCRIPT }} />
    </>
  )
}

const TAG_INDEX_SEARCH_SCRIPT = `
(function () {
  if (window.__tagIndexSearchInit) return;
  window.__tagIndexSearchInit = true;

  var searchInput = null;

  function applyFilter() {
    var q = (searchInput && searchInput.value ? searchInput.value.toLowerCase().trim() : '');

    // Show or hide each individual tag <li>.
    var tags = document.querySelectorAll('.tag-index-list > li');
    for (var i = 0; i < tags.length; i++) {
      var el = tags[i];
      var text = (el.textContent || '').toLowerCase().trim();
      el.style.display = (!q || text.indexOf(q) !== -1) ? '' : 'none';
    }

    // Hide letter groups whose tags are all filtered out (only while
    // searching — empty letters always show in the default view).
    var groups = document.querySelectorAll('.tag-index-group');
    for (var g = 0; g < groups.length; g++) {
      var group = groups[g];
      if (!q) {
        group.style.display = '';
        continue;
      }
      var visible = false;
      var items = group.querySelectorAll('.tag-index-list > li');
      for (var j = 0; j < items.length; j++) {
        if (items[j].style.display !== 'none') { visible = true; break; }
      }
      group.style.display = visible ? '' : 'none';
    }
  }

  function setup() {
    searchInput = document.querySelector('.block-search');
    if (!searchInput || searchInput.dataset.tagIndexSearch === 'on') return;
    searchInput.dataset.tagIndexSearch = 'on';
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

export default BlockC_TagIndexSearch
