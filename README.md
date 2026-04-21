# DnD Adventure Sites

A system for converting Obsidian campaign notes into hosted DM-reference websites. Each adventure is a self-contained folder served via GitHub Pages.

---

## Project Structure

```
/
├── index.html                        # Adventure listing homepage (not yet built)
│
├── assets/
│   ├── css/
│   │   ├── theme.css                 # Color tokens and base reset
│   │   ├── layout.css                # Sidebar, main column, page title block
│   │   └── components.css            # All reusable UI components
│   └── js/
│       └── ui.js                     # Sidebar nav, image toggles, hover previews
│
├── adventures/
│   └── statue-heist/
│       ├── index.html                # Generated adventure page
│       └── images/
│           ├── npcs/                 # NPC portrait images (copied from vault by build)
│           └── locations/            # Location art and battlemaps
│
├── _templates/
│   └── oneshot.html                  # Blank oneshot shell — copy for new adventures
│
├── _source/
│   └── statue-heist/                 # Copies of original Obsidian source files
│       ├── Statue Heist.md
│       └── Battlefield Actions.md
│
├── _build/                           # Node.js build tooling
│   ├── build.js                      # Entry point
│   ├── config.js                     # Vault path and settings
│   ├── package.json
│   └── lib/
│       ├── vault.js                  # Vault file search by filename
│       ├── links.js                  # Wiki link extraction and recursive collection
│       ├── statblock.js              # TTRPG-CLI statblock YAML → HTML renderer
│       ├── npc.js                    # Obsidian NPC note format → HTML renderer
│       └── render.js                 # Routes notes to renderers, builds Misc section
│
├── CLAUDE.md                         # Instructions for Claude Code (AI assistant)
└── README.md                         # This file
```

---

## How Pages Are Structured

Every adventure page follows this section order:

| # | Section | Description |
|---|---|---|
| 1 | Page Title | Adventure name, tagline, meta pills |
| 2 | Introduction | Player-facing read-aloud |
| 3 | DM Info | Hidden truth, villain motivation, win/fail conditions |
| 4 | Hook | Opening scene, how players are drawn in |
| 5 | NPCs | Character cards for all named NPCs |
| 6 | Clues & Investigation | Skill checks, what each reveals |
| 7 | Adventure Flow | 5-room structure |
| 8 | Outcome Branches | Early/late/fail scenario variants |
| 9 | Location Sections | One section per named location, with read-aloud, mechanics, images |
| 10 | Magic Items | d10 loot table |
| 11 | Battlefield Actions | Collapsible tell → resolve combat mechanics |
| 12 | Linked Notes | Auto-generated from wiki links (see build script below) |

---

## The Build Script

The build script resolves `[[wiki links]]` in your Obsidian source files, pulls the linked notes from the vault, renders them, and injects a **Linked Notes** section at the bottom of the adventure page.

### Setup (one time)

```bash
cd _build
npm install
```

### Running a build

```bash
cd _build
node build.js statue-heist
```

Replace `statue-heist` with the folder name of any adventure in `_source/`.

### What it does

1. Reads all `.md` files in `_source/<adventure>/`
2. Extracts every `[[wiki link]]` (skips `![[embedded]]` image syntax)
3. Searches the Obsidian vault for each linked file by filename — same way Obsidian resolves links, no path needed
4. Follows links recursively up to `MAX_LINK_DEPTH` (default: 2) to catch notes-within-notes
5. Detects note type and renders accordingly:
   - **Monster notes** (TTRPG-CLI statblock format) → full D&D 5e stat block card with lore
   - **NPC notes** (`**Field:** Value` format) → NPC card, portrait image copied to `images/npcs/`
   - **Other notes** → generic prose card
6. Assembles a **Linked Notes** section and injects it between `<!-- MISC-SECTION-START -->` and `<!-- MISC-SECTION-END -->` markers in `adventures/<adventure>/index.html`
7. Reports any wiki links it couldn't resolve

### Re-running

Running the build again on an existing adventure fully replaces the Linked Notes section — safe to re-run any time.

### Config

Edit `_build/config.js` to change:

```js
VAULT_ROOT    // Absolute path to your Obsidian vault
MAX_LINK_DEPTH // How many levels of links to follow (default: 2)
```

---

## Adding a New Adventure

1. **Copy source files** from Obsidian into `_source/<adventure-name>/`
   - Use the same folder naming convention as the adventure's page URL (kebab-case)
   - Do not move or edit the originals in the vault

2. **Create the adventure folder**
   ```
   adventures/<adventure-name>/
   ├── index.html
   └── images/
       ├── npcs/
       └── locations/
   ```

3. **Copy the template**
   Copy `_templates/oneshot.html` to `adventures/<adventure-name>/index.html`

4. **Fill in the content**
   Open `index.html` and replace the `<!-- slot comments -->` with content following the section order above. The CSS paths (`../../assets/...`) are already correct for this folder depth.

5. **Run the build**
   ```bash
   cd _build
   node build.js <adventure-name>
   ```
   This injects the Linked Notes section automatically.

6. **Add images**
   Drop NPC portraits into `images/npcs/` and location art into `images/locations/`. The build script copies NPC images from the vault automatically if the source note references them with `![[image.png]]`.

---

## Shared Assets

The design system is split across three CSS files. **Edit the right file for the change you need:**

| File | Edit when you want to… |
|---|---|
| `assets/css/theme.css` | Change a color, font, or spacing token globally |
| `assets/css/layout.css` | Change the sidebar width, main column padding, or page title block |
| `assets/css/components.css` | Add or modify a UI component (callout, card, table, stat block…) |

**Rule:** Adventure `index.html` files must not contain `<style>` or `<script>` blocks. All styles go in `assets/css/`, all behaviour in `assets/js/ui.js`.

---

## Wiki Links and Hover Previews

Any `<a class="wiki-link" href="#misc-[slug]">` element in the adventure HTML gets a hover preview tooltip automatically. The tooltip reads `data-preview-title` and `data-preview-body` attributes that the build script sets on each linked note entry.

To manually add a wiki link in the HTML:

```html
<a class="wiki-link" href="#misc-mage">Mage</a>
```

The slug is the note name lowercased with spaces replaced by hyphens. The build script logs the generated IDs when it runs.

---

## Image Convention

| Image type | Location |
|---|---|
| NPC portraits | `adventures/<name>/images/npcs/<npc-name>.jpg` |
| Location art / battlemaps | `adventures/<name>/images/locations/<location-name>.jpg` |
| Banner | `adventures/<name>/images/banner.jpg` |

Use the `.image-reveal` component for show/hide on location images:

```html
<div class="image-reveal">
  <button class="image-toggle">Show Location Art — Temple Entrance</button>
  <div class="image-container">
    <img src="images/locations/temple-entrance.jpg" alt="Temple Entrance">
    <p class="image-caption">The vine-covered pillars at the cliff edge.</p>
  </div>
</div>
```

Images are never embedded as base64. If an image isn't ready yet, leave a `<!-- IMAGE: description -->` comment as a placeholder.

---

## Hosting on GitHub Pages

Push this repo to GitHub and enable Pages from the repo settings (serve from `main` branch, root `/`). No build step is needed for hosting — the `_build/` script runs locally and commits its output.

```
https://<username>.github.io/<repo-name>/adventures/statue-heist/
```

The `_build/`, `_source/`, and `_templates/` folders are prefixed with `_` so GitHub Pages ignores them by default. If you want to be explicit, add a `.nojekyll` file to the root to skip Jekyll processing entirely.

---

## Supported Note Formats

### TTRPG-CLI Monster Statblock

Detected by: presence of a ` ```statblock ``` ` code block.

```markdown
---
cssclasses: json5e-monster
---
# Monster Name
Lore text...

​```statblock
"name": "Owlbear"
"size": "Large"
"type": "monstrosity"
"ac": !!int "13"
"hp": !!int "59"
"stats": [!!int "20", !!int "12", !!int "17", !!int "3", !!int "12", !!int "7"]
"speed": "40 ft."
"cr": "3"
"traits": [{ "name": "Keen Sight", "desc": "..." }]
"actions": [{ "name": "Multiattack", "desc": "..." }]
​```
```

Rendered as: full D&D 5e stat block card (name, type, AC/HP/Speed, ability grid, traits, actions) with lore text below.

### Obsidian NPC Note

Detected by: `**Field:** Value` line structure.

```markdown
![[Image - Name.png|right|250]]
**Name:** Crok Ruthesk
**Race / Gender / Age:** Half-Crocodile Beastling
**Role / Occupation:** Magic item merchant
**Personality:** Playful, calculating
**Goal:** Start trading with the Ice Kingdom
**Secret:** Investigating secrets of Wysteria
```

Rendered as: NPC card with portrait image (copied from vault), role tag, and field list.

### Generic Note

Any `.md` file not matching the above formats. Rendered as styled prose with headings converted to `h4`.

---

## Current Adventures

| Adventure | Status | Source |
|---|---|---|
| [The Statue Heist](adventures/statue-heist/index.html) | ✅ Complete | `_source/statue-heist/` |
