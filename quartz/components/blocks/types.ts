import { JSX } from "preact"
import { QuartzComponentProps } from "../types"

/**
 * A Block template is a small component that fills exactly one of the three
 * fixed page slots (Block A / B / C). Templates are picked per-page-type by
 * BlockFrame; switching to a different look for a slot is just swapping the
 * template, no layout changes needed.
 */
export type BlockTemplate = (props: QuartzComponentProps) => JSX.Element | null
