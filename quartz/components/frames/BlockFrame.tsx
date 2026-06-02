import { PageFrame, PageFrameProps } from "./types"
import BlockA_FolderInfo from "../blocks/BlockA_FolderInfo"
import BlockA_NoteInfo from "../blocks/BlockA_NoteInfo"
import BlockB_Listing from "../blocks/BlockB_Listing"
import BlockB_Note from "../blocks/BlockB_Note"
import BlockB_Home from "../blocks/BlockB_Home"
import BlockC_Footnotes from "../blocks/BlockC_Footnotes"
import { BlockTemplate } from "../blocks/types"

/**
 * BlockFrame — the universal three-column layout for the whole site.
 *
 *   ┌─────────┬──────────────────┬───────────┐
 *   │ Block A │     Block B      │  Block C  │
 *   │ cols    │     cols         │  cols     │
 *   │ 1 – 2   │     3 – 6        │  7 – 9    │
 *   └─────────┴──────────────────┴───────────┘
 *
 * The blocks have fixed widths on every page. What goes in each block is
 * a template (BlockA_*.tsx / BlockB_*.tsx / BlockC_*.tsx) chosen below per
 * page type. Adding a new layout = writing one template + one branch here.
 */
export const BlockFrame: PageFrame = {
  name: "blocks",
  render(props: PageFrameProps) {
    const { componentData } = props
    const slug = (componentData.fileData as { slug?: string }).slug ?? ""

    const pageKind = classifyPage(slug)
    const { BlockA, BlockB, BlockC } = templatesFor(pageKind)

    return (
      <>
        <div class={`block block-a block-a--${pageKind}`}>
          {BlockA && <BlockA {...componentData} />}
        </div>
        <div class={`block block-b block-b--${pageKind}`}>
          {BlockB && <BlockB {...componentData} />}
        </div>
        <div class={`block block-c block-c--${pageKind}`}>
          {BlockC && <BlockC {...componentData} />}
        </div>
      </>
    )
  },
}

type PageKind = "home" | "folder" | "note"

function classifyPage(slug: string): PageKind {
  if (slug === "index") return "home"
  if (slug.endsWith("/index")) return "folder"
  return "note"
}

interface BlockSet {
  BlockA: BlockTemplate | null
  BlockB: BlockTemplate | null
  BlockC: BlockTemplate | null
}

/**
 * The puzzle assembly: pick a template for each block based on page kind.
 * To customise (e.g. a different Block B for the portfolio folder), extend
 * the branching here — keep this function the single source of truth.
 */
function templatesFor(kind: PageKind): BlockSet {
  switch (kind) {
    case "home":
      return {
        BlockA: null,
        BlockB: BlockB_Home,
        BlockC: BlockC_Footnotes,
      }
    case "folder":
      return {
        BlockA: BlockA_FolderInfo,
        BlockB: BlockB_Listing,
        BlockC: BlockC_Footnotes,
      }
    case "note":
      return {
        BlockA: BlockA_NoteInfo,
        BlockB: BlockB_Note,
        BlockC: BlockC_Footnotes,
      }
  }
}
