import { Fragment } from "preact"
import { BlockTemplate } from "./types"
import { QuartzPluginData } from "../../plugins/vfile"

type FileEntry = QuartzPluginData & {
  slug?: string
  frontmatter?: {
    title?: string
    tags?: string[]
    stub?: boolean
    [key: string]: unknown
  }
  unlisted?: boolean
}

/**
 * Block B for folder pages.
 *
 * Renders a flat list of every note directly inside this folder as:
 *
 *     <title link> ............................. [tag] [tag]
 *
 * Each row links to the note, and each tag links to /tags/<tag>.
 * No date, no read-time — those go in detail-page metadata if at all.
 */
const BlockB_Listing: BlockTemplate = (props) => {
  const { fileData, allFiles } = props
  const folderSlug = (fileData as { slug?: string }).slug ?? ""
  const pages = listChildPages(allFiles as FileEntry[], folderSlug)

  if (pages.length === 0) {
    return <p class="block-empty-state">No notes in this folder yet.</p>
  }

  // Optional grouping driven by the folder's own index.md frontmatter:
  //   groupBy: <frontmatter key on child notes>
  //   groupOrder: [<value>, <value>, ...]   (top-to-bottom)
  // Groups are separated by a thin <hr> rendered as a list item so the
  // surrounding flex/CSS targeting `.block-listing > li` keeps working.
  const folderFm = (fileData as { frontmatter?: Record<string, unknown> }).frontmatter ?? {}
  const groupBy = typeof folderFm.groupBy === "string" ? folderFm.groupBy : null
  const groupOrder = Array.isArray(folderFm.groupOrder)
    ? (folderFm.groupOrder as unknown[]).map(String)
    : []

  const groups = groupBy ? groupPages(pages, groupBy, groupOrder) : [pages]

  return (
    <ul class="block-listing">
      {groups.map((group, gi) => (
        <Fragment key={gi}>
          {gi > 0 && <li class="block-listing-divider-row" aria-hidden="true"></li>}
          {group.map((page) => {
            const title = page.frontmatter?.title ?? lastSegment(page.slug ?? "")
            const tags = page.frontmatter?.tags ?? []
            const isStub = page.frontmatter?.stub === true
            return (
              <li data-title={title} data-tags={tags.join(",")}>
                <span class="block-listing-title-cell">
                  {isStub ? (
                    <span class="block-listing-stub">{title}</span>
                  ) : (
                    <a href={`/${page.slug}`} class="internal">
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
        </Fragment>
      ))}
    </ul>
  )
}

/**
 * Partition `pages` by `page.frontmatter[key]`. Group order is:
 *   1. Values listed in `order` (in that order), even if no page has them.
 *   2. Any other observed values, alphabetically.
 *   3. Pages with no value for `key` last (no divider before them if they
 *      are the only group).
 * Empty groups are dropped from the output.
 */
function groupPages(pages: FileEntry[], key: string, order: string[]): FileEntry[][] {
  const buckets = new Map<string, FileEntry[]>()
  const noValue: FileEntry[] = []
  for (const p of pages) {
    const raw = (p.frontmatter as Record<string, unknown> | undefined)?.[key]
    const v = typeof raw === "string" ? raw : raw == null ? "" : String(raw)
    if (!v) {
      noValue.push(p)
      continue
    }
    if (!buckets.has(v)) buckets.set(v, [])
    buckets.get(v)!.push(p)
  }

  const orderedKeys: string[] = []
  for (const k of order) if (buckets.has(k)) orderedKeys.push(k)
  const leftover = [...buckets.keys()]
    .filter((k) => !order.includes(k))
    .sort((a, b) => a.localeCompare(b))
  orderedKeys.push(...leftover)

  const out: FileEntry[][] = orderedKeys.map((k) => buckets.get(k)!).filter((g) => g.length > 0)
  if (noValue.length > 0) out.push(noValue)
  return out
}

/**
 * Pull every direct (non-subfolder) child of `folderSlug` out of allFiles.
 * Mirrors the logic in @quartz-community/folder-page so the listing matches
 * what Quartz already considers "this folder's contents".
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
    if (rel.includes("/")) continue // skip nested subfolder contents
    out.push(f)
  }

  // Alphabetical by title (or slug fallback) — predictable order.
  return out.sort((a, b) => {
    const at = (a.frontmatter?.title ?? a.slug ?? "").toLowerCase()
    const bt = (b.frontmatter?.title ?? b.slug ?? "").toLowerCase()
    return at.localeCompare(bt)
  })
}

function lastSegment(slug: string): string {
  const parts = slug.split("/").filter(Boolean)
  return parts[parts.length - 1] ?? slug
}

export default BlockB_Listing
