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
 * Reverse-chronological list of every note in `thoughts/`, grouped by month.
 * Each month gets a 24px heading (regular weight) followed by its rows:
 *
 *   july
 *      <title>       [tag] [tag]
 *      <title>       [tag]
 *   june
 *      <title>       [tag]
 *
 * A thin blue line separates rows within a group. The title link is
 * "stretched" via a ::before pseudo so clicking anywhere on the row navigates
 * to the note; the tag opts back in via z-index so it's an independent
 * target. Undated notes fall into a trailing "undated" group so nothing goes
 * missing without an obvious explanation.
 *
 * The `data-title` / `data-tags` attrs on each <li> keep the existing
 * BlockC_ThoughtsFilters search + tag-filter script working unchanged; empty
 * month sections auto-hide via `:has()` in custom.scss.
 */
const BlockB_Thoughts: BlockTemplate = (props) => {
  const { fileData, allFiles } = props
  const folderSlug = (fileData as { slug?: string }).slug ?? ""
  const pages = listChildPages(allFiles as FileEntry[], folderSlug)

  if (pages.length === 0) {
    return <p class="block-empty-state">No thoughts here yet.</p>
  }

  const groups = groupByMonth(pages)
  const currentYear = new Date().getFullYear()

  return (
    <div class="block-listing-months">
      {groups.map((group) => (
        <section class="block-listing-month">
          <h2 class="block-listing-month-heading">
            {formatMonthLabel(group.key, currentYear)}
          </h2>
          <ul class="block-listing block-listing--thoughts">
            {group.pages.map((page) => {
              const title = page.frontmatter?.title ?? lastSegment(page.slug ?? "")
              const tags = page.frontmatter?.tags ?? []
              const isStub = page.frontmatter?.stub === true
              return (
                <li data-title={title} data-tags={tags.join(",")}>
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
        </section>
      ))}
    </div>
  )
}

/**
 * Direct children of `thoughts/` in the order they'll be displayed:
 * newest date first, undated last.
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
      const aTitle = (a.frontmatter?.title ?? a.slug ?? "").toLowerCase()
      const bTitle = (b.frontmatter?.title ?? b.slug ?? "").toLowerCase()
      return aTitle.localeCompare(bTitle)
    }
    if (Number.isNaN(at)) return 1
    if (Number.isNaN(bt)) return -1
    return bt - at
  })
}

interface MonthGroup {
  /** `YYYY-MM` for dated notes, or the string `"undated"`. */
  key: string
  pages: FileEntry[]
}

/**
 * Partition `pages` into groups by year+month. Group order follows the
 * incoming order (which is already newest-first), so groups come out as
 * newest month first with an `undated` group at the end.
 */
function groupByMonth(pages: FileEntry[]): MonthGroup[] {
  const groups: MonthGroup[] = []
  const indexByKey = new Map<string, number>()
  for (const p of pages) {
    const key = monthKey(p.frontmatter?.date)
    let idx = indexByKey.get(key)
    if (idx === undefined) {
      idx = groups.length
      indexByKey.set(key, idx)
      groups.push({ key, pages: [] })
    }
    groups[idx]!.pages.push(p)
  }
  return groups
}

function monthKey(raw: unknown): string {
  if (!raw) return "undated"
  const d = raw instanceof Date ? raw : new Date(String(raw))
  if (Number.isNaN(d.getTime())) return "undated"
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

/**
 * Turn a group key into its display label:
 *   "2026-06" + currentYear=2026 → "june"
 *   "2025-12" + currentYear=2026 → "december 2025"
 *   "undated"                     → "undated"
 */
function formatMonthLabel(key: string, currentYear: number): string {
  if (key === "undated") return "undated"
  const [yStr, mStr] = key.split("-")
  const y = Number(yStr)
  const m = Number(mStr)
  if (!Number.isFinite(y) || !Number.isFinite(m)) return key
  const d = new Date(y, m - 1, 1)
  const monthName = d.toLocaleDateString("en-GB", { month: "long" }).toLowerCase()
  return y === currentYear ? monthName : `${monthName} ${y}`
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

export default BlockB_Thoughts
