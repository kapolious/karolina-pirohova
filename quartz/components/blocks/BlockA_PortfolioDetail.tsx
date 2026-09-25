// @ts-expect-error — subpath export resolves at runtime (see BlockA_FolderInfo).
import { htmlToJsx } from "@quartz-community/utils/jsx"
import type { Root } from "hast"
import { BlockTemplate } from "./types"
import { splitPortfolioBody, pieceTitle } from "./portfolioTree"

/**
 * Block A for a portfolio piece detail page — the info column (cols 1-2).
 *
 * Breadcrumbs + title (with the piece `id` prefixed) + the brief, which is
 * everything in the note body except the image (that goes to Block B). The
 * properties — dimensions, technique, date — live in Block C on the right.
 */
const BlockA_PortfolioDetail: BlockTemplate = (props) => {
  const { tree, fileData } = props
  const slug = (fileData as { slug?: string }).slug ?? ""
  const title = pieceTitle(
    fileData.frontmatter as { title?: string; id?: string | number } | undefined,
    slug,
  )
  const { text } = splitPortfolioBody(tree as Root)
  const hasText = text.children.length > 0

  return (
    <>
      <nav class="block-breadcrumbs" aria-label="breadcrumbs">
        <a href="/" class="internal">home</a>
        <span class="breadcrumb-sep"> — </span>
        <a href="/portfolio/" class="internal">portfolio</a>
        <span class="breadcrumb-sep"> — </span>
        <span class="breadcrumb-current">{title}</span>
      </nav>
      <h1 class="block-title">{title}</h1>
      {hasText && <div class="block-body portfolio-brief">{htmlToJsx(text)}</div>}
    </>
  )
}

export default BlockA_PortfolioDetail
