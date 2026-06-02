import { BlockTemplate } from "./types"

/**
 * Block A for detail / note pages.
 *
 * Layout: just the breadcrumbs trail (`home — folder — note title`).
 * The note's own title belongs in Block B above the body, not here.
 */
const BlockA_NoteInfo: BlockTemplate = (props) => {
  const { fileData } = props
  const slug = (fileData as { slug?: string }).slug ?? ""
  const title = (fileData.frontmatter?.title as string | undefined) ?? lastSegment(slug)

  const segments = buildBreadcrumbs(slug, title)

  return (
    <nav class="block-breadcrumbs" aria-label="breadcrumbs">
      {segments.map((seg, i) => (
        <>
          {i > 0 && <span class="breadcrumb-sep"> — </span>}
          {seg.href ? (
            <a href={seg.href} class="internal">{seg.label}</a>
          ) : (
            <span>{seg.label}</span>
          )}
        </>
      ))}
    </nav>
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
