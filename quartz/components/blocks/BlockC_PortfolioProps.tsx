import { BlockTemplate } from "./types"
import { NotePropertiesList, extractProperties, Property } from "./BlockA_NoteInfo"

/**
 * Block C for a portfolio piece detail page (cols 7-8) — the orange
 * marginalia: the frontmatter properties (dimensions, technique, …) plus a
 * month-year `date` appended last, matching the order on the detail mock.
 */
const BlockC_PortfolioProps: BlockTemplate = (props) => {
  const fm = props.fileData.frontmatter as Record<string, unknown> | undefined
  const properties: Property[] = extractProperties(fm)
  const dateLabel = formatMonthYear(fm?.date)
  if (dateLabel) properties.push({ key: "date", value: dateLabel })
  return <NotePropertiesList properties={properties} />
}

/** "september 2026" — month name + year, lowercased, no day. */
function formatMonthYear(raw: unknown): string {
  if (!raw) return ""
  const d = raw instanceof Date ? raw : new Date(String(raw))
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }).toLowerCase()
}

export default BlockC_PortfolioProps
