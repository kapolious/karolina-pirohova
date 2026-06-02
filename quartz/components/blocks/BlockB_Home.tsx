// @ts-expect-error — subpath export resolves at runtime (see BlockA_FolderInfo).
import { htmlToJsx } from "@quartz-community/utils/jsx"
import { Root } from "hast"
import { BlockTemplate } from "./types"

/**
 * Block B for the homepage.
 *
 * Renders the rendered markdown of `content/index.md` as-is. The folder-nav
 * list (the trailing `<ul>` with links to kisk / portfolio / etc.) is styled
 * by the SCSS rule `.block-home article ul` — no special handling needed
 * here, it's just markdown.
 */
const BlockB_Home: BlockTemplate = (props) => {
  const { tree } = props
  const hastRoot = tree as Root

  return <article class="block-home">{htmlToJsx(hastRoot)}</article>
}

export default BlockB_Home
