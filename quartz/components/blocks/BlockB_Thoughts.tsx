import { BlockTemplate } from "./types"
import { QuartzPluginData } from "../../plugins/vfile"

type FileEntry = QuartzPluginData & {
  slug?: string
  frontmatter?: {
    title?: string
    tags?: string[]
    date?: string | Date
    stub?: boolean
  }
  unlisted?: boolean
}

/**
 * Block B for the `thoughts/` folder.
 *
 * Reverse-chronological list of every note in `thoughts/`. Each row:
 *
 *   <date>      <title>      [tag] [tag]
 *
 * A thin 1px blue line separates each row. The title link is "stretched"
 * via a ::before pseudo so clicking anywhere on the row (date or empty
 * space) navigates to the note. The tag opts back in with z-index, so it
 * acts as its own separate click target — hovering anywhere on the row
 * highlights the whole row, hovering specifically on the tag highlights
 * just the tag. See .block-listing--thoughts in custom.scss.
 *
 * The `data-title` / `data-tags` attrs on each <li> keep the existing
 * BlockC_ThoughtsFilters search + tag-filter script working unchanged.
 */
const BlockB_Thoughts: BlockTemplate = (props) => {
  const { fileData, allFiles } = props
  const folderSlug = (fileData as { slug?: string }).slug ?? ""
  const pages = listChildPages(allFiles as FileEntry[], folderSlug)

  if (pages.length === 0) {
    return <p class="block-empty-state">No thoughts here yet.</p>
  }

  return (
    <ul class="block-listing block-listing--thoughts">
      {pages.map((page) => {
        const title = page.frontmatter?.title ?? lastSegment(page.slug ?? "")
        const tags = page.frontmatter?.tags ?? []
        const dateLabel = formatDate(page.frontmatter?.date)
        const isStub = page.frontmatter?.stub === true
        return (
          <li data-title={title} data-tags={tags.join(",")}>
            <span class="block-listing-date">{dateLabel}</span>
            <span class="block-listing-title-cell">
              {isStub ? (
                <span class="block-listing-stub">{title}</span>
              ) : (
                <a href={`/${page.slug}`} class="internal block-listing-row-link">
                  {title}
                </a>
              )}
            </span>
            {tags.length > 0 && (
              <span class="block-listing-tags">
                {tags.map((tag) => (
                  <a href={`/tags/${tag}`} class="internal block-listing-tag">
                    [{tag}]
                  </a>
                ))}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Direct children of `thoughts/`, sorted by `date` descending (newest first).
 * Notes without a parseable date drop to the bottom.
 */
function listChildPages(allFiles: FileEntry[], folderSlug: string): FileEntry[] {
  const folderPrefix = folderSlug.endsWith("/index")
    ? folderSlug.slice(0, -"index".length)
    : folderSlug.endsWith("/")
      ? folderSlug
      : folderSlug + "/"

  const out: FileEntry[] = []
  for (const f of allFiles) {
    if (f.unlisted === true) continue
    const s = f.slug
    if (!s || !s.startsWith(folderPrefix)) continue
    const rel = s.slice(folderPrefix.length)
    if (!rel || rel === "index") continue
    if (rel.includes("/")) continue
    out.push(f)
  }

  return out.sort((a, b) => {
    const at = parseDateMs(a.frontmatter?.date)
    const bt = parseDateMs(b.frontmatter?.date)
    if (at === bt) {
      // Tiebreak alphabetically so order is stable.
      const aTitle = (a.frontmatter?.title ?? a.slug ?? "").toLowerCase()
      const bTitle = (b.frontmatter?.title ?? b.slug ?? "").toLowerCase()
      return aTitle.localeCompare(bTitle)
    }
    // Pages without a valid date (NaN) sink to the bottom.
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

/**
 * "03 june 2026" — day with leading zero, full month name lowercased,
 * four-digit year. Empty string if the value is missing or unparseable.
 */
function formatDate(raw: unknown): string {
  if (!raw) return ""
  const d = raw instanceof Date ? raw : new Date(String(raw))
  if (Number.isNaN(d.getTime())) return ""
  return d
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .toLowerCase()
}

function lastSegment(slug: string): string {
  const parts = slug.split("/").filter(Boolean)
  return parts[parts.length - 1] ?? slug
}

export default BlockB_Thoughts
