import { BlockTemplate } from "./types"
import { QuartzPluginData } from "../../plugins/vfile"
import { pieceTitle } from "./portfolioTree"
import type { Root, Element, ElementContent } from "hast"

type FileEntry = QuartzPluginData & {
  slug?: string
  htmlAst?: Root
  unlisted?: boolean
  frontmatter?: {
    title?: string
    id?: string | number
    unlisted?: boolean
    [key: string]: unknown
  }
}

/**
 * Block B for the portfolio index — a gallery grid.
 *
 * Three squares across; each is the first image found in a piece's own
 * markdown body (pulled from its `htmlAst`, so the src is already resolved
 * by Quartz), wrapped in a link to the piece's detail page. Hovering fades
 * the image to 50% (see .portfolio-item in custom.scss).
 *
 * The image is authored once, in the note body as `![[file.png]]` — no
 * separate frontmatter image field to keep in sync.
 */
const BlockB_PortfolioGrid: BlockTemplate = (props) => {
  const { fileData, allFiles } = props
  const folderSlug = (fileData as { slug?: string }).slug ?? ""
  const pieces = listPieces(allFiles as FileEntry[], folderSlug)

  if (pieces.length === 0) {
    return <p class="block-empty-state">No work here yet.</p>
  }

  return (
    <ul class="portfolio-grid">
      {pieces.map((piece) => {
        const title = pieceTitle(piece.frontmatter, piece.slug ?? "")
        const img = firstImage(piece.htmlAst, piece.slug ?? "")
        return (
          <li class="portfolio-item">
            <a href={`/${piece.slug}`} class="internal" aria-label={title}>
              {img ? (
                <img src={img.src} alt={img.alt || title} loading="lazy" />
              ) : (
                <span class="portfolio-item-missing">{title}</span>
              )}
            </a>
          </li>
        )
      })}
    </ul>
  )
}

/** Direct children of the portfolio folder, ordered by `id`, then title. */
function listPieces(allFiles: FileEntry[], folderSlug: string): FileEntry[] {
  const prefix = folderSlug.replace(/index$/, "")
  const out: FileEntry[] = []
  for (const f of allFiles) {
    if (f.unlisted === true) continue
    const s = f.slug
    if (!s || !s.startsWith(prefix)) continue
    const rel = s.slice(prefix.length)
    if (!rel || rel === "index" || rel.includes("/")) continue
    out.push(f)
  }
  return out.sort((a, b) => {
    const ai = String(a.frontmatter?.id ?? "")
    const bi = String(b.frontmatter?.id ?? "")
    if (ai && bi && ai !== bi) return ai.localeCompare(bi, undefined, { numeric: true })
    const at = (a.frontmatter?.title ?? a.slug ?? "").toLowerCase()
    const bt = (b.frontmatter?.title ?? b.slug ?? "").toLowerCase()
    return at.localeCompare(bt)
  })
}

/** First <img> anywhere in the note's HAST, with a root-absolute src. */
function firstImage(
  htmlAst: Root | undefined,
  slug: string,
): { src: string; alt: string } | null {
  if (!htmlAst) return null
  let found: Element | null = null
  const walk = (node: Root | ElementContent): void => {
    if (found) return
    if (node.type === "element") {
      if (node.tagName === "img") {
        found = node
        return
      }
    }
    const kids = (node as { children?: ElementContent[] }).children
    if (Array.isArray(kids)) {
      for (const k of kids) {
        walk(k)
        if (found) return
      }
    }
  }
  walk(htmlAst)
  if (!found) return null
  const properties = (found as Element).properties ?? {}
  const rawSrc = typeof properties.src === "string" ? properties.src : ""
  const alt = typeof properties.alt === "string" ? properties.alt : ""
  return { src: resolveSrc(rawSrc, slug), alt }
}

/**
 * Turn a note-relative image src into a root-absolute path so it resolves
 * correctly when rendered on the index page (a different route than the
 * note it came from).
 */
function resolveSrc(src: string, slug: string): string {
  if (!src) return src
  if (/^(https?:)?\/\//.test(src) || src.startsWith("/")) return src
  const dir = "/" + slug.split("/").slice(0, -1).join("/")
  const base = "https://_" + (dir.endsWith("/") ? dir : dir + "/")
  try {
    return decodeURI(new URL(src, base).pathname)
  } catch {
    return src
  }
}

function lastSegment(slug: string): string {
  const parts = slug.split("/").filter(Boolean)
  return parts[parts.length - 1] ?? slug
}

export default BlockB_PortfolioGrid
