import { BlockTemplate } from "./types"

/**
 * Block A for detail / note pages.
 *
 * Layout (top → bottom):
 *   1. Breadcrumbs trail (`home — folder — note title`)
 *   2. Note title (24px bold, styled by `.block-title` in SCSS)
 *
 * Same shape as BlockA_FolderInfo's first two rows — keeps the heading
 * position consistent across folder index pages and individual notes.
 */
const BlockA_NoteInfo: BlockTemplate = (props) => {
  const { fileData } = props
  const slug = (fileData as { slug?: string }).slug ?? ""
  const title = (fileData.frontmatter?.title as string | undefined) ?? lastSegment(slug)

  const segments = buildBreadcrumbs(slug, title)

  return (
    <>
      <nav class="block-breadcrumbs" aria-label="breadcrumbs">
        {segments.map((seg, i) => (
          <>
            {i > 0 && <span class="breadcrumb-sep"> — </span>}
            {seg.href ? (
              <a href={seg.href} class="internal">{seg.label}</a>
            ) : (
              <span class="breadcrumb-current">{seg.label}</span>
            )}
          </>
        ))}
      </nav>
      <h1 class="block-title">{title}</h1>
    </>
  )
}

interface Crumb {
  label: string
  href: string | null
}

function buildBreadcrumbs(slug: string, currentTitle: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: "home", href: "/" }]
  const parts = slug.split("/").filter(Boolean)

  // Walk every directory segment except the last (which is the file itself).
  for (let i = 0; i < parts.length - 1; i++) {
    const path = "/" + parts.slice(0, i + 1).join("/") + "/"
    crumbs.push({ label: parts[i]!, href: path })
  }

  // Final segment is the current page — render as plain text (no link).
  crumbs.push({ label: currentTitle, href: null })

  return crumbs
}

function lastSegment(slug: string): string {
  const parts = slug.split("/").filter(Boolean)
  return parts[parts.length - 1] ?? slug
}

export default BlockA_NoteInfo
