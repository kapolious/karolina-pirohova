# karolinapirohova.blue — project guide

Personal website built on Quartz 5, authored in Obsidian, deployed via GitHub → Cloudflare Pages at [karolinapirohova.blue](https://karolinapirohova.blue).

This file is context for future chat sessions — it captures the architecture, conventions and design rules so any assistant walking in cold can act coherently.

---

## Stack

- **Quartz 5.0.0** — static-site generator that reads `content/` (Obsidian vault) and emits `public/`.
- **Preact + TypeScript** for custom components (Quartz's JSX conventions).
- **SCSS** for styling; single custom file at `quartz/styles/custom.scss`.
- **Cloudflare Pages** — builds on push to the `v5` branch, serves clean URLs (strips trailing slashes).
- **Font** — Switzer, self-hosted at `quartz/static/fonts/` (regular + italic, weight 400 only; bold is browser-synthesised).

## Deploy workflow

- Write in Obsidian → `npx quartz sync` from the terminal → Cloudflare rebuilds automatically.
- `npx quartz sync -m "message"` for a custom commit message; default is timestamped "Quartz sync: …".
- Local preview: `npx quartz build --serve` on `http://localhost:8080`.

---

## The three-block layout ("puzzle pieces")

Every page uses a custom frame called `BlockFrame` (`quartz/components/frames/BlockFrame.tsx`) that renders three fixed columns:

```
┌─────────┬──────────────┬─────────┬──────┐
│ Block A │    Block B   │ Block C │empty │
│  1 – 2  │    3 – 5     │  6 – 7  │ 8–9  │
└─────────┴──────────────┴─────────┴──────┘
40px outer margin · 9 columns · 40px column gap · cols 8–9 intentionally empty
```

Each block is filled by a small **template component** chosen by page kind + slug. Adding a new layout = writing one template + adding one branch in `templatesFor()` inside `BlockFrame.tsx`.

### What lives in each block, per page kind

| Page kind                | Block A                     | Block B                          | Block C                              |
|--------------------------|-----------------------------|----------------------------------|--------------------------------------|
| Homepage (`/`)           | —                           | `index.md` body + folder nav     | Footnotes                            |
| Default folder listing   | Folder info (name + intro)  | Flat list of notes               | Footnotes                            |
| Default note detail      | Breadcrumbs + title + props | Body                             | Footnotes                            |
| `/cv/`                   | Note info (title as page)   | Body (from `cv/index.md`)        | Footnotes                            |
| `/tags/`                 | Folder info ("tags")        | A–Z tag grid                     | Search field                         |
| `/tags/<tag>/`           | Breadcrumbs + title         | Inline list of notes (date desc) | Search field                         |
| `/friction/`             | Folder info                 | Force-directed graph             | (Block B takes cols 3–9, C hidden)   |
| `/thoughts/`             | Folder info                 | Notes grouped by month           | Search + tag filter                  |
| `/thoughts/<note>`       | Note info + date            | Body                             | Footnotes                            |
| `/kisk/`                 | Folder info                 | Listing grouped by semester      | Footnotes                            |
| `/kisk/<subject>`        | Breadcrumbs + title         | Body                             | Properties (orange) + footnotes      |

Templates live in `quartz/components/blocks/`.

---

## Design language

### Colors (all in `quartz.config.yaml` + `custom.scss :root`)

- **Cream** `#fffdf4` — background (`--light`)
- **Classic blue** `#0000ee` — text, links, dividers (`--secondary`, `--dark`, `--darkgray`, all mapped to same blue)
- **Orange** `#e85d00` — marginalia only (footnotes, frontmatter properties on kisk notes, search field, tag filter chips) (`--orange`)

### Typography

- 14px body, 1.4 line-height, Switzer regular everywhere.
- **No bold by default.** Bold only on: `.block-title` (24px), `.block-property-value`, `.tag-index-letter`.
- Titles/section headings that aren't "the" title use `font-weight: 400` at 24px (see month headings in thoughts).
- All text lowercase by convention — folder names, tags, titles.
- Czech single-letter prepositions (k, s, v, z, a, o, u, i) and English orphan letters get non-breaking spaces via JS in `BlockFrame.tsx`.
- `text-wrap: pretty` for graceful line breaks in supporting browsers.

### Layout philosophy

- Trust whitespace, no vertical dividers between blocks.
- Cols 8–9 are always empty — breathing room.
- Grid columns use `minmax(0, 1fr)` so content never expands columns.
- Reserved scrollbar gutter (`html { overflow-y: scroll }`) so grid alignment is identical page-to-page.

---

## Content organization

```
content/
  index.md            → homepage
  cv/index.md         → single-page CV (routed as a note, not a listing)
  friction/           → thesis-stage thoughts (graph view)
  kisk/               → school subjects with kód/semester/vyučujúci props
  portfolio/          → default folder listing
  thoughts/           → essays, sorted by date, grouped by month
  attachments/        → images (invisible; no listing, no folder page)
  private/            → git-ignored + Quartz-ignored, never published
```

- **Images**: put in `content/attachments/<note-slug>/…` and reference with `![[filename.png]]` (Obsidian wikilink). The folder never appears in listings because it has no markdown pages.
- **Private notes**: two options —
  - Move to `content/private/` → not pushed to git, not built.
  - Add `draft: true` to frontmatter → stays in git, dropped from build (via `remove-draft` plugin).

---

## Frontmatter conventions

### On notes

```yaml
---
title: my title            # optional; falls back to file name
date: 2026-06-12           # date-only, no time (used for sorting + display)
tags: [essay, orality]     # note tags — surface in listings and drive /tags/<tag>/
stub: true                 # optional: listed but non-clickable (no detail written)
draft: true                # optional: excluded from build entirely
unlisted: true             # optional: page still exists but hidden from listings
---
```

Reserved keys (never shown as visible properties): `title`, `tags`, `aliases`, `description`, `draft`, `created`, `modified`, `published`, `date`, `lang`, `cssclasses`, `cssClasses`, `permalink`, `comments`.

Anything else becomes a **visible property** in Block A (or Block C on kisk notes) — key + 10px + bold value, orange.

### On folder index pages (`<folder>/index.md`)

```yaml
---
title: <folder display name>
groupBy: <frontmatter key on child notes>   # optional
groupOrder:                                  # optional; groups in this order first
  - value one
  - value two
---
```

`groupBy` + `groupOrder` split a folder listing into groups separated by a 1px blue horizontal line. Used on `kisk/index.md` to split by semester.

---

## Routing conventions

All routing lives in `templatesFor(kind, slug)` inside `BlockFrame.tsx`. Kind is `home`, `folder`, or `note`:

- `home`: `slug === "index"`
- `folder`: `slug.endsWith("/index")`
- `note`: everything else (includes tag-page-plugin-generated `/tags/<tag>` pages)

Per-slug branches inside each case pick the right template trio. The pattern for adding a new layout:

1. Write a small `BlockX_Whatever.tsx` template
2. Import it in `BlockFrame.tsx`
3. Add a branch in `templatesFor` matching the slug

---

## Design rules — never reverse

1. **Three-block puzzle over CSS-only positioning.** Templates are small files with one responsibility.
2. **Grid: 9 cols, 40px outer margin, 40px column gap.** Block A cols 1–2, Block B cols 3–5, Block C cols 6–7. Per-folder overrides may widen Block B (friction takes cols 3–9).
3. **No vertical dividers between blocks.** Trust whitespace.
4. **`minmax(0, 1fr)` for grid cols** — prevents overflow from expanding columns.
5. **No bold by default** except the three explicit places above.
6. **Titles never take a colon-explainer.** The title is the title; explanations go in the body.
7. **Properties rendered per-row (key, 10px, bold value) with no column alignment.** No grid of aligned keys.
8. **Orange = marginalia only.** Never for primary content, never for accents/highlights outside of `.block-*` marginalia.
9. **Wikilink resolution: `markdownLinkResolution: shortest`.** Do NOT switch to `absolute` — it breaks bare-name wikilinks like `[[fish]]`.
10. **Cloudflare strips trailing slashes** for clean URLs — assume no trailing slash when reasoning about relative URLs.
11. **Any secret goes in Cloudflare dashboard env vars, never in the repo.** Repo is public.

---

## Response style preferences (for chat sessions)

- **Terse.** No filler, no "great question". State result, done.
- **File links as clickable paths**, format `[filename.tsx](path/to/filename.tsx)` or with `:line` when relevant.
- **Recommendation + tradeoff** for exploratory questions — not exhaustive surveys.
- **Don't create files unprompted** — no README, docs, or planning documents unless asked.
- **Comments in code**: default to none. Only add when the *why* is non-obvious.
- **No emojis** unless explicitly requested.

---

## Known open items

- Homepage folder nav is alphabetical auto-discovery — no manual order override yet.
- Friction graph filter mutates `fetchData` in place — dormant edge case if another page ever uses the graph plugin.
- The RSVP form for the festival (Cloudflare Pages Function + KV) is on the roadmap, not built.
