import { BlockTemplate } from "./types"
import { QuartzPluginData } from "../../plugins/vfile"

type FileEntry = QuartzPluginData & {
  slug?: string
  frontmatter?: { tags?: string[] }
  unlisted?: boolean
}

/**
 * Block B for the tag-index page (`/tags/`).
 *
 * Walks every file's frontmatter `tags:`, collects the unique set, and
 * groups them alphabetically by first letter. Renders a–z always (even
 * letters with no tags get their heading, so the visual rhythm stays
 * predictable), with each group's tags as a flex-wrapped row.
 *
 * Tag links go to `/tags/<tag>` — Quartz's tag-page plugin auto-generates
 * those, so each tag is already a real page.
 */
const BlockB_TagIndex: BlockTemplate = (props) => {
  const tags = collectAllTags(props.allFiles as FileEntry[])
  const groups = groupByFirstLetter(tags)
  const letters = "abcdefghijklmnopqrstuvwxyz".split("")

  return (
    <div class="block-tag-index">
      {letters.map((letter) => (
        <div class="tag-index-group" data-letter={letter}>
          <h3 class="tag-index-letter">{letter}</h3>
          {groups[letter] && groups[letter].length > 0 && (
            <ul class="tag-index-list">
              {groups[letter].map((tag) => (
                <li>
                  <a href={`/tags/${tag}`} class="internal tag-index-tag">
                    {tag}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

/** All unique tags across every published file, lower-cased + sorted. */
function collectAllTags(files: FileEntry[]): string[] {
  const seen = new Set<string>()
  for (const f of files) {
    if (f.unlisted === true) continue
    const tags = f.frontmatter?.tags ?? []
    for (const t of tags) {
      const trimmed = String(t).trim()
      if (trimmed) seen.add(trimmed)
    }
  }
  return Array.from(seen).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  )
}

/** Group by first character, lower-cased. Tags starting with a non-letter
 *  fall under a `#` bucket (currently not rendered, but kept for future). */
function groupByFirstLetter(tags: string[]): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const t of tags) {
    const first = t.charAt(0).toLowerCase()
    const bucket = /[a-z]/.test(first) ? first : "#"
    if (!out[bucket]) out[bucket] = []
    out[bucket].push(t)
  }
  return out
}

export default BlockB_TagIndex
