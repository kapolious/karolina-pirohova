// @ts-expect-error — subpath export resolves at runtime (see BlockA_FolderInfo).
import { htmlToJsx } from "@quartz-community/utils/jsx"
import { Root, Element } from "hast"
import { BlockTemplate } from "./types"
import { NotePropertiesList, extractProperties } from "./BlockA_NoteInfo"
import { FOOTNOTE_POSITIONER_SCRIPT } from "./BlockC_Footnotes"

/**
 * Block C variant for kisk note details.
 *
 * Renders the note's frontmatter properties on top (in orange marginalia)
 * and the standard footnotes section underneath. Used when Block A is the
 * lighter `BlockA_NoteHeader` (crumbs + title only) — see BlockFrame
 * routing for kisk notes.
 *
 * Footnotes use the same absolute-positioning script as `BlockC_Footnotes`
 * — that script is idempotent (window.__footnotePositionerInit guard), so
 * including it here too is safe and ensures it runs even on a direct hit
 * to a kisk page (no `BlockC_Footnotes` mount on that route).
 */
const BlockC_PropertiesFootnotes: BlockTemplate = (props) => {
  const { fileData } = props
  const properties = extractProperties(
    fileData.frontmatter as Record<string, unknown> | undefined,
  )
  const tree = props.tree as Root
  const section = findFootnotesSection(tree)
  const footnotes: Root | null = section
    ? { type: "root", children: section.children }
    : null

  if (properties.length === 0 && !footnotes) return null

  return (
    <>
      <NotePropertiesList properties={properties} />
      {footnotes && (
        <div class="block-footnotes">
          {htmlToJsx(footnotes)}
          <script dangerouslySetInnerHTML={{ __html: FOOTNOTE_POSITIONER_SCRIPT }} />
        </div>
      )}
    </>
  )
}

function findFootnotesSection(root: Root): Element | null {
  for (const child of root.children) {
    if (
      child.type === "element" &&
      child.tagName === "section" &&
      child.properties &&
      "dataFootnotes" in child.properties
    ) {
      return child as Element
    }
  }
  return null
}

export default BlockC_PropertiesFootnotes
