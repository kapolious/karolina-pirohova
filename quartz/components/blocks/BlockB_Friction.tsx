import { BlockTemplate } from "./types"
import { componentRegistry } from "../registry"
import { QuartzComponent, QuartzComponentConstructor } from "../types"

/**
 * Block B for the friction folder index.
 *
 * Mounts Quartz's built-in Graph component (a force-directed graph powered
 * by D3 + Pixi), configured to show the GLOBAL graph of the site rather
 * than the default local-only neighbours-of-current-page. This gives the
 * friction landing page an interactive map of all the notes and their
 * wikilink relationships — same primitive as Obsidian's graph view.
 *
 * The component itself is provided by the `graph` Quartz plugin (already
 * enabled in quartz.config.yaml). We pull it out of the component registry
 * at render time rather than importing it directly, because Quartz plugins
 * live in `.quartz/plugins/` (not node_modules) and the registry is the
 * supported way to reference them.
 */
const BlockB_Friction: BlockTemplate = (props) => {
  const entry = componentRegistry.get("Graph") ?? componentRegistry.get("graph")
  if (!entry) {
    return (
      <p class="block-empty-state">
        Graph plugin not loaded — check that <code>graph</code> is enabled in quartz.config.yaml.
      </p>
    )
  }

  // The plugin's "global graph" is actually a modal overlay (position:
  // fixed, hidden until you click an icon button). The "local graph" is
  // what renders inline. Setting depth: -1 on it means "include the whole
  // site, not just neighbours of the current page" — so the inline graph
  // becomes the global graph in everything but name.
  const ctor = entry.component as QuartzComponentConstructor
  const Graph: QuartzComponent =
    typeof ctor === "function" && !("displayName" in ctor)
      ? componentRegistry.instantiate(ctor, {
          localGraph: {
            drag: true,
            zoom: true,
            depth: -1,            // whole site, not just neighbours
            scale: 1.0,
            repelForce: 0.5,
            centerForce: 0.3,
            linkDistance: 30,
            fontSize: 0.6,
            opacityScale: 1,
            showTags: false,
            removeTags: [],
            focusOnHover: true,
            enableRadial: false,
          },
        })
      : (ctor as unknown as QuartzComponent)

  return (
    <div class="block-friction-graph">
      {/* Filter must run before the graph plugin's afterDOMLoaded script
          reads fetchData — placed before <Graph> so it parses first. */}
      <script dangerouslySetInnerHTML={{ __html: FRICTION_DATA_FILTER }} />
      <Graph {...props} />
    </div>
  )
}

/**
 * Filters the content-index data the graph plugin reads, so the friction
 * graph only contains:
 *
 *   1. Every note in the `friction/` folder.
 *   2. Anything those friction notes link out to (one hop).
 *
 * Mechanics: Quartz declares `const fetchData = fetch(...).then(json)`
 * in a head script. That binding can't be re-assigned (const) and isn't
 * on `window` (top-level `const` doesn't attach to it). What we CAN do
 * is attach our own `.then` callback to the same Promise — when it
 * resolves, we mutate the resulting object in place. Both our callback
 * and the graph plugin's `await fetchData` receive the same object
 * reference, and Promise `.then` callbacks fire in FIFO order, so as
 * long as we attach before the graph's render code is called we mutate
 * first.
 *
 * Side effect to know about: the mutation persists for the page session.
 * If another page used the graph plugin (currently none do), it'd see
 * the filtered data. When friction stops being the only graph consumer
 * this script needs revisiting.
 */
const FRICTION_DATA_FILTER = `
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
    // fetchData is a top-level \`const\` in another script tag — reachable
    // by bare name as a global binding (not via window.*).
    if (typeof fetchData === 'undefined') {
      console.warn('[FrictionFilter] fetchData binding not visible');
      return;
    }
    fetchData.then(function (data) {
      if (!data || typeof data !== 'object') return;
      // Re-running on SPA nav is a no-op: once filtered, the friction-only
      // keys are all that's left, so the loop simply re-keeps them.
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

export default BlockB_Friction
