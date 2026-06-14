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
      <Graph {...props} />
    </div>
  )
}

// Note: the data filter that scopes the graph to friction-only notes
// lives in BlockFrame.tsx, not here. It needs to be present on every
// page (so the listener registers on first page load regardless of
// where the user lands), not just on friction itself — otherwise SPA
// navigation to /friction/ would arrive after the listener could have
// been wired up.

export default BlockB_Friction
