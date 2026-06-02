// @ts-expect-error — subpath export resolves at runtime (see BlockA_FolderInfo).
import { htmlToJsx } from "@quartz-community/utils/jsx"
import { Root } from "hast"
import { BlockTemplate } from "./types"

/**
 * Block B for detail / note pages.
 *
 * Layout (top → bottom):
 *   1. Note title (24px bold, from frontmatter `title` or filename)
 *   2. The note's body — the rendered markdown from the .md file
 */
const BlockB_Note: BlockTemplate = (props) => {
  const { fileData, tree } = props
  const slug = (fileData as { slug?: string }).slug ?? ""
  const title = (fileData.frontmatter?.title as string | undefined) ?? lastSegment(slug)

  const hastRoot = tree as Root

  return (
    <>
      <h1 class="block-title">{title}</h1>
      <article class="block-body">{htmlToJsx(hastRoot)}</article>
    </>
  )
}

function lastSegment(slug: string): string {
  const parts = slug.split("/").filter(Boolean)
  return parts[parts.length - 1] ?? slug
}

export default BlockB_Note
