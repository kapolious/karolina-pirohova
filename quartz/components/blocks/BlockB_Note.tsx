// @ts-expect-error — subpath export resolves at runtime (see BlockA_FolderInfo).
import { htmlToJsx } from "@quartz-community/utils/jsx"
import { Root } from "hast"
import { BlockTemplate } from "./types"

/**
 * Block B for detail / note pages.
 *
 * Just the rendered note body. The title lives in Block A (alongside the
 * breadcrumbs) so it sits consistently across folder pages and notes.
 */
const BlockB_Note: BlockTemplate = (props) => {
  const { tree } = props
  const hastRoot = tree as Root

  return <article class="block-body">{htmlToJsx(hastRoot)}</article>
}

export default BlockB_Note
