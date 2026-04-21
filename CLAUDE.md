# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

---

## Keeping This File Up to Date

After any significant change, update CLAUDE.md to reflect it. **Significant** means:
- New files added to `assets/` (JS features, CSS components)
- New conventions or rules established (e.g. validation commands, escape rules)
- Changes to folder structure or workflow
- New components added to the design system
- Status changes to tracked files

**Not significant** (no update needed): minor bug fixes, adding a single spell/entry to a data file, wiring up an image, small CSS tweaks.

---

## Projects in This Repo

### 1. DnD Adventure Sites ← primary project
Converts D&D campaign notes (written in Obsidian markdown) into hosted adventure reference websites for DM use. Served via GitHub Pages. See full spec below.

### 2. Browser Games (legacy)
`pacman.html`, `tictactoe.html` — standalone single-file canvas games. No build step. Each file is self-contained.

---

## DnD Adventure Sites — Full Spec

### What It Is
A system for turning Obsidian markdown notes into polished, interactive DM-reference websites. Each adventure is a self-contained folder hosted on GitHub Pages. The design system is shared across all adventures via `assets/`.

### Hosting
GitHub Pages. All paths must be relative. No `fetch()` calls for local content. No server-side logic. No CDN dependencies (no Google Fonts, no external JS libraries).

---

### Folder Structure

```
/                               ← repo root (GitHub Pages root)
├── index.html                  ← adventure listing homepage
├── assets/
│   ├── css/
│   │   ├── theme.css           ← CSS custom properties (color tokens, typography)
│   │   ├── layout.css          ← sidebar, main column, page-title block
│   │   └── components.css      ← all reusable UI components
│   └── js/
│       ├── ui.js               ← sidebar nav active state, image modals, collapsibles, term tooltips
│       └── dnd-terms.js        ← SRD spell + condition data for hover tooltips
├── adventures/
│   └── [adventure-name]/       ← kebab-case folder name
│       ├── index.html          ← the adventure page
│       └── images/
│           ├── banner.jpg
│           ├── npcs/           ← [npc-name].jpg
│           └── locations/      ← [location-name].jpg
├── _templates/
│   └── oneshot.html            ← blank oneshot shell (no content, imports shared assets)
├── _source/                    ← original Obsidian MD files, versioned but not served
│   └── [adventure-name]/
├── _build/                     ← Node.js build tooling (not yet implemented)
├── CLAUDE.md
└── README.md
```

**Rule:** Adventure `index.html` files contain only content markup. No `<style>` blocks, no inline `<script>` blocks. All styles and behaviour live in `assets/`.

---

### Design System

#### Color Tokens (defined in `assets/css/theme.css`)
```
--parchment        main content background
--parchment-dark   section headers, card backgrounds, table alternate rows
--ink              body text
--ink-light        headings h3/h4, bold text, secondary emphasis
--red              section h2 headings, villain tags, danger callouts, page title
--gold             borders, rules, nav accents, table header alt
--gold-light       sidebar active links, ornaments
--blue             mechanic callouts, DC stat-pills
--green            success callouts, check stat-pills, ally tags
--sidebar-bg       sidebar background
--sidebar-text     sidebar base text
```

#### Typography
- Body / content: Georgia or Times New Roman (serif)
- Stat pills / code: Courier New (monospace)
- No external fonts

---

### Component Catalogue

All components are CSS classes defined in `assets/css/components.css`.

#### `.section`
Main content card with parchment background and gold border. Every major content block is a `.section`. Contains a `.section-header` and `.section-body`.

```html
<div class="section" id="hook">
  <div class="section-header">
    <span class="icon">🪝</span>
    <h2>Hook</h2>
    <!-- optional: <span class="badge">Hidden from Players</span> -->
  </div>
  <div class="section-body">
    <!-- content -->
  </div>
</div>
```

#### `.callout`
Colour-coded aside boxes. Always include a `.callout-title`.

| Class modifier | Use case |
|---|---|
| `.dm-note` | DM-only context, pacing notes |
| `.danger` | Failure conditions, warnings |
| `.success` | Rewards, positive outcomes |
| `.mechanic` | Rules explanations, DC tables |
| `.lore` | In-world quotes, inscriptions, read-aloud variants |

```html
<div class="callout dm-note">
  <div class="callout-title">DM Note</div>
  <p>...</p>
</div>
```

#### `.read-aloud`
Italicised, bordered block for text read directly to players.

```html
<div class="read-aloud">
  <div class="ra-label">Read aloud</div>
  <p>...</p>
</div>
```

#### `.stat-pill`
Inline mechanical tags. Combine base class with modifier.

| Modifier | Color | Use for |
|---|---|---|
| `.dc` | blue | Saving throw DCs |
| `.check` | green | Skill check types |
| `.damage` | red | Damage rolls |
| `.time` | gold | Durations, round counts |

```html
<span class="stat-pill dc">DEX DC 15</span>
<span class="stat-pill damage">3d8 fire</span>
```

#### `.npc-card`
Character cards in a `.npc-grid` (CSS grid, auto-fill 260px min).

| Border modifier | Use for |
|---|---|
| `.villain` | Antagonists |
| `.ally` | Helpful NPCs |
| `.neutral` | Merchants, bystanders |

```html
<div class="npc-grid">
  <div class="npc-card villain">
    <!-- optional: <img class="npc-img" src="images/npcs/gorrath.jpg" alt="Gorrath"> -->
    <div class="npc-name">Gorrath IronHand</div>
    <div class="npc-role">
      <span class="tag tag-villain">Villain</span>
      Stone Transporter
    </div>
    <p>Description...</p>
    <div class="stat-block">Mechanical notes...</div>
  </div>
</div>
```

If no image is available, omit the `<img>` tag entirely — do not use placeholders.

#### `.room` / `.room-number`
Used in the 5-room flow list inside a `.room-list` container.

```html
<div class="room-list">
  <div class="room">
    <div class="room-number">1</div>
    <div class="room-content">
      <div class="room-title">Entrance</div>
      <div class="room-body">...</div>
    </div>
  </div>
</div>
```

#### `.ba-card`
Collapsible `<details>` element for battlefield actions. Phases use `.ba-phase` with a `.ba-label` modifier:

| Modifier | Color |
|---|---|
| `.tell` | blue |
| `.neutralize` | green |
| `.mitigate` | gold |
| `.resolution` | red |

#### `.styled-table`
Standard data table. First `<td>` in each row renders bold + gold by default. Use `<strong>` inside cells for red emphasis.

---

### Oneshot Page — Section Order

Every oneshot `index.html` follows this section order. Omit a section only if the source material genuinely has nothing for it.

1. **Page title block** — adventure name, tagline, meta pills (location, level, session length, player count)
2. **Introduction** — player-facing read-aloud; what they know before play starts
3. **DM Info / The Truth** — `.badge="Hidden from Players"`; villain motivation, hidden mechanics, win/lose conditions
4. **Hook** — how players are drawn in; opening scene
5. **NPCs** — `.npc-grid` of `.npc-card` elements; one card per named NPC
6. **Clues & Investigation** — skill checks, what each reveals, NPC dialogue cues
7. **5-Room Flow** — `.room-list`; one `.room` per beat
8. **Outcome Branches** — `.outcome-grid`; early/late/fail/partial variants
9. **Location Sections** — one `.section` per named location; each contains read-aloud, mechanic callouts, developments, any images
10. **Magic Items** — `.styled-table` with d10 column, name, effect, charges
11. **Battlefield Actions** — collapsible `.ba-card` elements; tell → neutralize/mitigate → resolution
12. **References** — statblocks, external links, anything that doesn't fit above

---

### Images

- All images for an adventure live in `adventures/[name]/images/`
- NPC portraits: `images/npcs/[npc-name].jpg`
- Location art / battlemaps: `images/locations/[location-name].jpg`
- Banner: `images/banner.jpg`
- Reference in HTML as relative paths from the adventure folder: `images/npcs/gorrath.jpg`
- **Never embed images as base64**
- Show/hide mechanic: use a `.image-reveal` wrapper with a toggle button; lightbox for full-size view
- If an image file has not been provided yet, omit the image entirely — add a `<!-- IMAGE: description -->` comment as a placeholder

---

### Game Term Tooltips (`assets/js/dnd-terms.js`)

Spells and conditions referenced in adventure pages get hover tooltips via `assets/js/dnd-terms.js`. The data is structured as:

- `SPELLS`: key → `[name, level/school, castTime, range, components, duration, summary]`
- `CONDITIONS`: key → `[name, description]`

**Rule — add as you go:** Whenever a spell, condition, or other game term is referenced in an adventure page that is not yet in `dnd-terms.js`, add it. Only add what is actually needed; do not bulk-add terms that aren't referenced anywhere. Check before adding to avoid duplicates.

Auto-detection is scoped to `.sb-action`, `.sb-props`, `.stat-block`, and `.ba-text` elements. If a term isn't being detected, check that it lives inside one of those containers.

**Apostrophe rule:** Summary strings in `dnd-terms.js` use single quotes. Any apostrophe inside a summary (`can't`, `doesn't`, etc.) must be escaped as `\'` or the string switched to double quotes. After editing the file, validate syntax with:
```
node --check assets/js/dnd-terms.js
```

Every adventure `index.html` must load scripts in this order:
```html
<script src="links.js"></script>
<script src="../../assets/js/dnd-terms.js"></script>
<script src="../../assets/js/ui.js"></script>
```

---

### Purchase / Source Links (`links.js`)

Each adventure has its own `adventures/[name]/links.js` that maps image IDs to purchase or attribution URLs. `ui.js` reads `window.AdventureLinks` and appends a "Source ↗" badge to any matching image container.

**How to add a link:**
1. Ensure the target `.image-container` has a `data-link-id="some-id"` attribute in the HTML.
2. Add an entry to `links.js`:
```js
window.AdventureLinks = {
  'some-id': { url: 'https://...', credit: 'Artist or Marketplace Name' },
};
```
3. The badge appears automatically over the image when the reveal is opened. No other changes needed.

`credit` is shown on the badge (e.g. `Source: Czepeku ↗`). Omit it and the badge just says `Source ↗`.

---

### Adding a New Adventure (current workflow — build script not yet implemented)

1. Create `adventures/[adventure-name]/` and `images/npcs/`, `images/locations/` subfolders
2. Copy `_templates/oneshot.html` to `adventures/[adventure-name]/index.html`
3. Create `adventures/[adventure-name]/links.js` (copy from an existing adventure and clear the entries)
4. Read all source MD files from `_source/[adventure-name]/`
5. Fill in content following the Section Order above
6. Add `data-link-id` attributes to all `.image-container` elements
7. Add a link to `index.html` (homepage adventure listing)
8. Add any referenced spells/conditions not yet in `dnd-terms.js` (add only what's needed)

---

### What Not to Do

- Do not inline `<style>` or `<script>` in adventure pages — edit shared files in `assets/` instead
- Do not use external CDN links for fonts, icons, or scripts
- Do not use `position: fixed` for anything other than the sidebar and scroll-to-top button
- Do not add sections not listed in the Section Order without confirming with the user
- Do not add placeholder/dummy images — omit and comment instead

---

### Feature Roadmap
See `FEATURES.md` for the living feature checklist — what's done, in progress, and planned.

---

### Current Status

| File | Status |
|---|---|
| `assets/css/theme.css` | ✅ Done |
| `assets/css/layout.css` | ✅ Done |
| `assets/css/components.css` | ✅ Done |
| `assets/js/ui.js` | ✅ Done |
| `_templates/oneshot.html` | ✅ Done |
| `adventures/statue-heist/index.html` | ✅ Done — uses shared assets |
| `_source/statue-heist/` | ✅ Done — source MD files copied from Obsidian |
| `statue-heist.html` | Deleted — legacy flat prototype |
| `index.html` | ✅ Done — homepage adventure listing |
| `_build/` | Not yet created — future build script |
