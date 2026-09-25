// @ts-expect-error — subpath export resolves at runtime (see BlockA_FolderInfo).
import { htmlToJsx } from "@quartz-community/utils/jsx"
import type { Root } from "hast"
import { BlockTemplate } from "./types"
import { splitPortfolioBody } from "./portfolioTree"

/**
 * Block B for a portfolio piece detail page — just the image.
 *
 * Renders only the image-bearing nodes from the note body (the rest, the
 * brief text, lands in Block A). The panel spans 4 columns; see
 * .portfolio-detail-image in custom.scss.
 */
const BlockB_PortfolioImage: BlockTemplate = (props) => {
  const { tree } = props
  const { images } = splitPortfolioBody(tree as Root)
  return <div class="portfolio-detail-image">{htmlToJsx(images)}</div>
}

export default BlockB_PortfolioImage
