import { BlockTemplate } from "./types"
import { QuartzPluginData } from "../../plugins/vfile"

type FileEntry = QuartzPluginData & {
  slug?: string
  frontmatter?: {
    title?: string
    tags?: string[]
    date?: string | Date
  }
  unlisted?: boolean
}

/**
 * Block B for individual tag pages (`/tags/<tagname>`).
 *
 * Renders every note carrying this tag as an inline list of title links,
 * newest-first by `frontmatter.date`. Same visual pattern as the tag chips
 * on the /tags/ index — a wrapping row of small clickable items — just
 * with note titles instead of tag names, and no alphabetical grouping.
 *
 * The `data-title` on each <li> lets `BlockC_TagNotesSearch` live-filter
 * this list by substring.
 */
const BlockB_TagNotes: BlockTemplate = (props) => {
  const { fileData, allFiles } = props
  const slug = (fileData as { slug?: string }).slug ?? ""
  const tag = slug.replace(/^tags\//, "")

  const notes = collectNotes(allFiles as FileEntry[], tag)

  if (notes.length === 0) {
    return <p class="block-empty-state">No notes with this tag yet.</p>
  }

  return (
    <ul class="tag-note-list">
      {notes.map((note) => {
        const title = note.frontmatter?.title ?? lastSegment(note.slug ?? "")
        return (
          <li data-title={title}>
            <a href={`/${note.slug}`} class="internal">{title}</a>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * All non-tag pages that carry `tag` in their frontmatter tags array,
 * sorted by date descending (undated fall to the end).
 */
function collectNotes(allFiles: FileEntry[], tag: string): FileEntry[] {
  const matching: FileEntry[] = []
  for (const f of allFiles) {
    if (f.unlisted === true) continue
    const s = f.slug
    if (!s || s.startsWith("tags/")) continue
    const tags = f.frontmatter?.tags ?? []
    if (tags.includes(tag)) matching.push(f)
  }

  return matching.sort((a, b) => {
    const at = parseDateMs(a.frontmatter?.date)
    const bt = parseDateMs(b.frontmatter?.date)
    if (at === bt) {
      const aTitle = (a.frontmatter?.title ?? a.slug ?? "").toLowerCase()
      const bTitle = (b.frontmatter?.title ?? b.slug ?? "").toLowerCase()
      return aTitle.localeCompare(bTitle)
    }
    if (Number.isNaN(at)) return 1
    if (Number.isNaN(bt)) return -1
    return bt - at
  })
}

function parseDateMs(raw: unknown): number {
  if (!raw) return NaN
  const d = raw instanceof Date ? raw : new Date(String(raw))
  return d.getTime()
}

function lastSegment(slug: string): string {
  const parts = slug.split("/").filter(Boolean)
  return parts[parts.length - 1] ?? slug
}

export default BlockB_TagNotes
