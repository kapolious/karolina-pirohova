import type { Root, Element, ElementContent } from "hast"

/**
 * Split a portfolio note body into its images and everything else.
 *
 * Works at the element level, not the block level: a paragraph that holds
 * BOTH an image and the brief text (which happens when they aren't
 * separated by a blank line in Obsidian) is handled correctly — the <img>
 * goes to the image panel (Block B) and the surrounding text stays in the
 * brief (Block A). Wrapper elements left empty after their image is pulled
 * out are dropped so no stray blank paragraphs remain.
 */
export function splitPortfolioBody(root: Root): { text: Root; images: Root } {
  const images: ElementContent[] = []

  const collect = (node: ElementContent): ElementContent | null => {
    if (node.type === "element") {
      if (node.tagName === "img") {
        // Wrap in a <p> so htmlToJsx block-renders it (a bare root-level
        // <img> is dropped by the converter).
        images.push({ type: "element", tagName: "p", properties: {}, children: [node] })
        return null
      }
      const kids: ElementContent[] = []
      for (const child of node.children ?? []) {
        const kept = collect(child)
        if (kept) kids.push(kept)
      }
      const meaningful = kids.some((k) => k.type !== "text" || k.value.trim() !== "")
      if (!meaningful) return null
      return { ...node, children: kids } as Element
    }
    return node
  }

  const textChildren: ElementContent[] = []
  for (const child of root.children as ElementContent[]) {
    const kept = collect(child)
    if (!kept) continue
    if (kept.type === "text" && kept.value.trim() === "") continue
    textChildren.push(kept)
  }

  return {
    text: { type: "root", children: textChildren },
    images: { type: "root", children: images },
  }
}

/** Display title for a piece: the `id` prefixed to the title, e.g. "001 …". */
export function pieceTitle(
  frontmatter: { title?: string; id?: string | number } | undefined,
  slug: string,
): string {
  const base = frontmatter?.title ?? lastSegment(slug)
  const id = frontmatter?.id != null ? String(frontmatter.id) : ""
  return id ? `${id} ${base}` : base
}

function lastSegment(slug: string): string {
  const parts = slug.split("/").filter(Boolean)
  return parts[parts.length - 1] ?? slug
}
