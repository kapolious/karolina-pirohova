// @ts-expect-error — subpath export resolves at runtime; tsc's "node" resolver
// can't see it but esbuild and Node ESM both honour the package.json exports.
import { htmlToJsx } from "@quartz-community/utils/jsx"
import { Root } from "hast"
import { BlockTemplate } from "./types"

/**
 * Block A for folder pages.
 *
 * Layout (top → bottom):
 *   1. Breadcrumbs trail
 *   2. Folder name (24px bold, from frontmatter `title` or folder slug)
 *   3. Folder description — the markdown body of `<folder>/index.md`
 *
 * The intro markdown is read from `componentData.tree` (the HAST parsed
 * by Quartz at build time), so anything you write in `kisk/index.md` will
 * land here automatically.
 */
const BlockA_FolderInfo: BlockTemplate = (props) => {
  const { fileData, tree } = props
  const slug = (fileData as { slug?: string }).slug ?? ""
  const title =
    (fileData.frontmatter?.title as string | undefined) ?? folderNameFromSlug(slug)

  const hastRoot = tree as Root
  const hasContent = hastRoot?.children && hastRoot.children.length > 0

  return (
    <>
      <BreadcrumbsTrail slug={slug} title={title} />
      <h1 class="block-title">{title}</h1>
      {hasContent && <div class="block-intro">{htmlToJsx(hastRoot)}</div>}
    </>
  )
}

function folderNameFromSlug(slug: string): string {
  // For "kisk/index" → "kisk"; for "kisk" → "kisk"
  const trimmed = slug.replace(/\/index$/, "")
  const parts = trimmed.split("/")
  return parts[parts.length - 1] ?? slug
}

interface BreadcrumbsTrailProps {
  slug: string
  title: string
}

/**
 * A tiny breadcrumbs render — `home — folder name`. For folder pages this is
 * always 2 segments; we render it inline rather than calling the breadcrumbs
 * plugin so this block is self-contained.
 */
function BreadcrumbsTrail({ slug: _slug, title }: BreadcrumbsTrailProps) {
  return (
    <nav class="block-breadcrumbs" aria-label="breadcrumbs">
      <a href="/" class="internal">home</a>
      <span class="breadcrumb-sep"> — </span>
      <span class="breadcrumb-current">{title}</span>
    </nav>
  )
}

export default BlockA_FolderInfo
