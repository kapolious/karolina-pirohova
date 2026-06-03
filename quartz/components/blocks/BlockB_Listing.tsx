import { BlockTemplate } from "./types"
import { QuartzPluginData } from "../../plugins/vfile"

type FileEntry = QuartzPluginData & {
  slug?: string
  frontmatter?: { title?: string; tags?: string[] }
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

  return (
    <ul class="block-listing">
      {pages.map((page) => {
        const title = page.frontmatter?.title ?? lastSegment(page.slug ?? "")
        const tags = page.frontmatter?.tags ?? []
        return (
          <li data-title={title} data-tags={tags.join(",")}>
            <span class="block-listing-title-cell">
              <a href={`/${page.slug}`} class="internal">
                {title}
              </a>
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
