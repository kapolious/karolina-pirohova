import { BlockTemplate } from "./types"

/**
 * Block A for detail / note pages.
 *
 * Layout (top → bottom):
 *   1. Breadcrumbs trail (`home — folder — note title`)
 *   2. Note title (24px bold)
 *   3. Properties list — every frontmatter field except the reserved
 *      Quartz/Obsidian metadata ones (title, tags, aliases, dates, etc.).
 *      Rendered as a two-column key/value grid: key in regular weight,
 *      value in bold, mirroring the look of Obsidian's Properties panel.
 *
 * Same shape as BlockA_FolderInfo's first two rows, plus the extra
 * properties block when frontmatter has any.
 */
const BlockA_NoteInfo: BlockTemplate = (props) => {
  const { fileData } = props
  const slug = (fileData as { slug?: string }).slug ?? ""
  const title = (fileData.frontmatter?.title as string | undefined) ?? lastSegment(slug)
  const properties = extractProperties(
    fileData.frontmatter as Record<string, unknown> | undefined,
  )

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
      {properties.length > 0 && (
        <dl class="block-properties">
          {properties.map((p) => (
            <div class="block-property">
              <dt class="block-property-key">{p.key}</dt>
              <dd class="block-property-value">{p.value}</dd>
            </div>
          ))}
        </dl>
      )}
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

/**
 * Reserved frontmatter keys that are either Quartz/Obsidian metadata or
 * structural info (the title is rendered as the heading; tags are used
 * by the tag index but not shown here; dates and lang are bookkeeping).
 * Anything outside this set is treated as a user-facing property.
 */
const RESERVED_KEYS = new Set([
  "title",
  "tags",
  "aliases",
  "description",
  "draft",
  "created",
  "modified",
  "published",
  "date",
  "lang",
  "cssclasses",
  "cssClasses",
  "permalink",
  "comments",
])

interface Property {
  key: string
  value: string
}

function extractProperties(frontmatter: Record<string, unknown> | undefined): Property[] {
  if (!frontmatter) return []
  const out: Property[] = []
  for (const key of Object.keys(frontmatter)) {
    if (RESERVED_KEYS.has(key)) continue
    const raw = frontmatter[key]
    if (raw === null || raw === undefined || raw === "") continue
    out.push({ key, value: formatValue(raw) })
  }
  return out
}

function formatValue(v: unknown): string {
  if (Array.isArray(v)) return v.map((x) => String(x)).join(", ")
  if (typeof v === "object") return JSON.stringify(v)
  return String(v)
}

export default BlockA_NoteInfo
