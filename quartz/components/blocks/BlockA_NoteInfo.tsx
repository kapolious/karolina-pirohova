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
 *
 * For routes that show properties in Block C instead (kisk note details),
 * use `BlockA_NoteHeader` below — same crumbs + title, no properties.
 */
const BlockA_NoteInfo: BlockTemplate = (props) => {
  const { fileData } = props
  const properties = extractProperties(
    fileData.frontmatter as Record<string, unknown> | undefined,
  )
  return (
    <>
      <NoteHeader {...props} />
      <NotePropertiesList properties={properties} />
    </>
  )
}

/**
 * Block A variant for routes that move properties to Block C — renders the
 * crumbs + title only.
 */
export const BlockA_NoteHeader: BlockTemplate = (props) => <NoteHeader {...props} />

/**
 * Shared inner: breadcrumbs + 24px title. Reads the slug + title from
 * fileData, like the original component did.
 */
const NoteHeader: BlockTemplate = (props) => {
  const { fileData } = props
  const slug = (fileData as { slug?: string }).slug ?? ""
  const fallbackName = slug.endsWith("/index")
    ? slug.split("/").filter(Boolean).slice(-2, -1)[0] ?? lastSegment(slug)
    : lastSegment(slug)
  const title = (fileData.frontmatter?.title as string | undefined) ?? fallbackName
  const segments = buildBreadcrumbs(slug, title)
  // If the note declares a `date` frontmatter, render it under the title
  // as small blue marginalia ("12 june 2026"). Kicks in automatically for
  // thoughts notes and any other note that opts in.
  const dateLabel = formatDetailDate(fileData.frontmatter?.date)

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
      {dateLabel && <p class="block-note-date">{dateLabel}</p>}
    </>
  )
}

/** "12 june 2026" — day with leading zero, month name lowercased. */
function formatDetailDate(raw: unknown): string {
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

/**
 * Shared properties list — the `<dl class="block-properties">` block.
 * Renders nothing if there are no properties.
 */
export function NotePropertiesList({ properties }: { properties: Property[] }) {
  if (properties.length === 0) return null
  return (
    <dl class="block-properties">
      {properties.map((p) => (
        <div class="block-property">
          <dt class="block-property-key">{p.key}</dt>
          <dd class="block-property-value">{p.value}</dd>
        </div>
      ))}
    </dl>
  )
}

interface Crumb {
  label: string
  href: string | null
}

function buildBreadcrumbs(slug: string, currentTitle: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: "home", href: "/" }]
  const parts = slug.split("/").filter(Boolean)

  // Folder-as-page (slug like "cv/index"): the second-to-last segment IS
  // the page. Walk earlier dir segments, then drop the literal "index" and
  // use the folder name as the current crumb.
  if (parts[parts.length - 1] === "index" && parts.length >= 2) {
    for (let i = 0; i < parts.length - 2; i++) {
      const path = "/" + parts.slice(0, i + 1).join("/") + "/"
      crumbs.push({ label: parts[i]!, href: path })
    }
    crumbs.push({ label: currentTitle, href: null })
    return crumbs
  }

  // Detail page: walk every directory segment except the last (the file).
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

export interface Property {
  key: string
  value: string
}

export function extractProperties(
  frontmatter: Record<string, unknown> | undefined,
): Property[] {
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
