import { BlockTemplate } from "./types"
import { QuartzPluginData } from "../../plugins/vfile"

type FileEntry = QuartzPluginData & {
  slug?: string
  frontmatter?: { title?: string; tags?: string[] }
  unlisted?: boolean
}

/**
 * Block B for the `thoughts/` folder.
 *
 * Renders a SVG "constellation" — a star at centre, with each thought drawn
 * as a line + clickable title at a deterministic position around it.
 *
 * Positioning: a tiny hash of the slug picks an angle (0–360°) and a
 * distance (within an inner / outer bound). Same slug → same spot on every
 * visit, but the constellation looks random and scattered.
 *
 * Filtering: each thought is wrapped in a `<g class="thought-node">` with
 * `data-title` and `data-tags`. BlockA_ThoughtsInfo's filter script toggles
 * `.thought-hidden` on these groups; CSS fades them out + disables hits.
 */
const BlockB_ThoughtsStar: BlockTemplate = (props) => {
  const folderSlug = ((props.fileData as { slug?: string }).slug ?? "").replace(/\/index$/, "")
  const thoughts = listThoughts(props.allFiles as FileEntry[], folderSlug)

  // SVG canvas: square, scales with the column. Centre = (W/2, H/2).
  const W = 800
  const H = 800
  const cx = W / 2
  const cy = H / 2
  const minDistance = 200
  const maxDistance = 340

  // Label foreignObject box — in SVG units. Wide enough for typical titles,
  // tall enough for one 18px line plus underline. GAP is the empty space
  // between the dot and the label's near edge.
  const FO_WIDTH = 280
  const FO_HEIGHT = 32
  const GAP = 14
  // xmlns spread cast — required at runtime to switch the inner div to the
  // HTML namespace inside <foreignObject>, but Preact's HTMLAttributes types
  // don't include `xmlns`. Spread-with-cast lets us pass it through.
  const HTML_NS = { xmlns: "http://www.w3.org/1999/xhtml" }

  const positioned = thoughts.map((t) => {
    const h = hash(t.slug ?? "")
    const angle = (h % 360) * (Math.PI / 180)
    const dist = minDistance + ((h >>> 8) % (maxDistance - minDistance))
    const x = cx + Math.cos(angle) * dist
    const y = cy + Math.sin(angle) * dist
    // Anchor the text away from the star: left side gets right-anchored text, etc.
    const textAnchor = x < cx ? "end" : "start"
    return { ...t, x, y, textAnchor }
  })

  return (
    <div class="block-thoughts-star">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        {/* The central star — an 11-pointed sparkle */}
        <polygon
          class="thoughts-star-shape"
          points={starPoints(cx, cy, 90, 30, 11)}
        />

        {positioned.map((t) => (
          <g
            class="thought-node"
            data-title={t.title}
            data-tags={(t.tags ?? []).join(",")}
          >
            <line
              class="thought-line"
              x1={cx}
              y1={cy}
              x2={t.x}
              y2={t.y}
            />
            <circle class="thought-dot" cx={t.x} cy={t.y} r={5} />
            <foreignObject
              x={t.textAnchor === "end" ? t.x - FO_WIDTH - GAP : t.x + GAP}
              y={t.y - FO_HEIGHT / 2}
              width={FO_WIDTH}
              height={FO_HEIGHT}
            >
              <div
                {...(HTML_NS as { xmlns: string })}
                class={`thought-label-wrap thought-label-wrap--${t.textAnchor}`}
              >
                <a href={`/${t.slug}`} class="thought-label">
                  {t.title}
                </a>
              </div>
            </foreignObject>
          </g>
        ))}
      </svg>
    </div>
  )
}

type Thought = {
  slug: string
  title: string
  tags: string[]
}

function listThoughts(allFiles: FileEntry[], folderSlug: string): Thought[] {
  const prefix = folderSlug.endsWith("/") ? folderSlug : folderSlug + "/"
  const out: Thought[] = []
  for (const f of allFiles) {
    if (f.unlisted === true) continue
    const s = f.slug
    if (!s || !s.startsWith(prefix)) continue
    const rel = s.slice(prefix.length)
    if (!rel || rel === "index" || rel.includes("/")) continue
    out.push({
      slug: s,
      title: f.frontmatter?.title ?? lastSegment(s),
      tags: f.frontmatter?.tags ?? [],
    })
  }
  return out.sort((a, b) => a.title.localeCompare(b.title))
}

function lastSegment(slug: string): string {
  const parts = slug.split("/").filter(Boolean)
  return parts[parts.length - 1] ?? slug
}

/** Tiny non-crypto hash, just enough variance for visual scatter. */
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Generate SVG polygon points for an N-pointed star.
 * Alternates between outer and inner radius for each vertex.
 */
function starPoints(cx: number, cy: number, rOuter: number, rInner: number, points: number): string {
  const verts: string[] = []
  const step = Math.PI / points
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner
    const a = i * step - Math.PI / 2
    verts.push(`${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`)
  }
  return verts.join(" ")
}

export default BlockB_ThoughtsStar
