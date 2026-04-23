# Mobile Version — Plan & Assessment

## What We're Working With

The site is a three-panel desktop layout: fixed sidebar nav (230px left), main content column, fixed DM notes panel (280px right). No build step, no framework, pure HTML/CSS/JS served from GitHub Pages. The DM tools panel (combat tracker, tabbed notes) is a core part of the app, not decorative.

Target device: a phone or tablet a DM would hold at the table. The primary mobile use case is **reading** during a session, with secondary access to the **combat tracker**.

---

## Scope Clarification

There are two meaningfully different targets:

| Target | Notes |
|---|---|
| **Tablet (768px+)** | Sidebar can collapse to icons or a drawer; notes panel may still fit if narrowed |
| **Phone (<768px)** | All three panels must stack; DM notes becomes a modal/bottom sheet |

A tablet layout is achievable with moderate effort and no UI paradigm shifts. A phone layout requires rethinking the notes panel from scratch.

---

## Requirements

### Must-have
- Sidebar becomes a slide-in drawer on mobile (hamburger toggle)
- DM notes panel is hidden by default on mobile, accessible via a floating button
- All content is readable without horizontal scrolling
- NPC grids, outcome grids, adventure cards stack to single column on narrow screens
- Statblock abilities (6-column grid) stays readable at small sizes
- Images fit within viewport (no overflow)
- Tap targets are large enough (minimum ~44px) for combat tracker HP/init inputs

### Should-have
- Bottom sheet or modal for the DM notes panel on phone
- Hover interactions (game term tooltips, link previews, image hover preview) replaced with tap-to-open equivalents
- Sidebar nav auto-closes after a link is tapped
- Scroll-to-top button repositions to avoid overlap with floating notes button

### Nice-to-have
- Combat tracker gets a compact "portrait mode" layout for small screens
- Pinch-to-zoom on lightbox images (currently just fits within viewport)
- Swipe gestures for closing the sidebar drawer or notes sheet

---

## Problems and Obstacles

### 1. Three-panel layout is the whole design
The body is `display: flex` with both sidebars `position: fixed`. On mobile, the main content is sandwiched with `margin-left: 230px; margin-right: 280px`. If those margins aren't removed, content is invisible. The current responsive block (layout.css line 779) partially handles this — it removes the sidebar fixed positioning — but the notes panel gets zero treatment. This is the biggest structural issue.

### 2. DM notes panel has no mobile UX pattern
The panel is 280px wide, fixed right, with a drag-to-resize handle. On a 375px phone screen that's 75% of the viewport. Options:
- **Bottom sheet**: slides up from the bottom, covers content. Common on mobile apps. Requires JS to implement.
- **Full-screen modal**: simpler, less elegant.
- **Floating action button (FAB)** that opens the sheet.
The resize handle is meaningless on touch and should be hidden.

### 3. Hover-only interactions are dead on touch
Four interaction patterns rely entirely on `mouseover`/`mousemove`/`mouseout`:
- **Game term tooltips** (`.game-term` elements) — need tap-to-toggle
- **Wiki link preview popups** — need tap-to-toggle  
- **Statblock hover popup** in combat tracker — needs tap-to-show
- **Image hover preview** (NPC portrait zoom) — can be replaced by lightbox (which already exists)

These all live in `ui.js`. Each needs a touch equivalent. The tricky part: a touch "tap" on a link also navigates — so the tap-to-preview pattern needs to intercept the first tap, show the tooltip, and only navigate on a second tap (or provide a close button).

### 4. Statblock abilities: 6-column grid at small width
`.sb-abilities` is a 6-column grid with `repeat(6, 1fr)`. At 300px content width that's ~50px per cell with very small text. It's technically readable but borderline. May need to reflow to 3×2 at narrow widths.

### 5. Tables have no mobile strategy
`.styled-table` uses fixed padding and `white-space: nowrap` on the first column. On small screens these overflow. Standard options: horizontal scroll wrapper (`overflow-x: auto` on a parent), or card-style reflow. The magic items table and riddle tables are the main offenders.

### 6. The sb-popup is hard-coded to desktop position
`#sb-popup` is positioned `right: 284px; top: 60px` — hardcoded to sit left of the notes panel. On mobile this would be off-screen. It needs to reposition to center or bottom of the viewport.

### 7. Font sizes are tuned for desktop
Body text at `0.92rem`, sidebar labels at `0.65rem`, combat tracker elements at `0.65–0.82rem`. These are fine on desktop but hit usability limits on mobile, especially for a DM reading in dim lighting at a table. A slight scale-up for mobile body text would help.

### 8. `position: fixed` elements interact badly with mobile keyboards
When a `<textarea>` or `<input>` is focused on iOS, the viewport shrinks and fixed-position elements jump. The notes panel textarea and combat tracker HP inputs will trigger this. iOS in particular has notorious bugs around fixed positioning with virtual keyboards. Mitigation: set `position: sticky` where possible, or use `env(safe-area-inset-bottom)` for bottom sheet positioning.

### 9. No build step means no PostCSS/autoprefixer
All CSS must be written with manual vendor prefixes for anything that needs them. Not a blocker — modern mobile browsers have excellent CSS support — but worth noting for anything like `env()` safe area insets.

### 10. localStorage keys are per-adventure (good) but panel state isn't persisted
If the DM notes panel becomes a sheet that opens/closes, the open/closed state should probably NOT be persisted (they'll want it closed by default each session). But the tab contents and combat state already persist, which is correct.

---

## Stages

### Stage 1 — Structural Foundation
**Goal:** Content is readable on all screen sizes. No functionality yet, just layout.

- Add `<meta name="viewport">` to the template (already present in existing pages — verify it's in `_templates/oneshot.html`)
- In `layout.css`, write a proper mobile breakpoint (`@media (max-width: 767px)`) that:
  - Removes `margin-left` and `margin-right` from `#main`
  - Hides `#sidebar` and `#notes-panel` by default (they'll reappear in Stage 2)
  - Collapses `.adventure-grid` to single column
  - Wraps `.styled-table` in an overflow-x scroll container (CSS-only via `.styled-table` parent)
- Add a tablet breakpoint (`@media (max-width: 1100px)`) that narrows the notes panel or allows the main content to flex better
- Verify no horizontal overflow anywhere on 375px wide viewport

Deliverable: all pages readable on a phone, panels hidden, no JS yet.

---

### Stage 2 — Sidebar Drawer
**Goal:** Sidebar nav accessible on mobile via a hamburger button.

- Add a `<button id="sidebar-toggle">` to the adventure HTML template (and existing adventure pages)
- CSS: on mobile, sidebar becomes `position: fixed; left: -100%; transition: left 0.25s` — slides in when toggled
- Add a semi-transparent backdrop (`#sidebar-backdrop`) that closes the drawer on tap
- JS in `ui.js`:
  - Toggle button shows/hides sidebar by adding a class
  - Clicking a nav link auto-closes the drawer (on mobile only)
  - Swipe-left on the drawer closes it (optional)
- The toggle button only appears on mobile (hidden via CSS on wider screens)

Deliverable: full sidebar nav accessible on mobile via a tap.

---

### Stage 3 — DM Notes Panel as Bottom Sheet
**Goal:** DM notes panel accessible on mobile without consuming screen real estate.

- CSS: on mobile, `#notes-panel` becomes `position: fixed; bottom: -100%; left: 0; width: 100%; height: 60vh; transition: bottom 0.3s` with a drag handle at the top
- A floating action button (`#notes-fab`, positioned bottom-right) opens the sheet
- The resize handle becomes a visual-only top bar (no resize on mobile)
- Sheet can be closed by tapping above it (backdrop) or tapping FAB again
- `#sb-popup` repositioned to center of viewport on mobile
- `#top-btn` repositioned to avoid overlap with FAB

Deliverable: DM notes panel accessible as a bottom sheet on mobile.

---

### Stage 4 — Touch Interaction Replacements
**Goal:** All hover-only interactions have touch equivalents.

- **Game term tooltips**: on touch devices, convert `mouseover` listener to a `click` toggle. First tap shows tooltip with a close button (×). Second tap or outside-click closes it. This requires detecting touch vs. pointer device.
- **Wiki link previews**: same pattern — first tap shows the preview popup (not the link), close button or outside-tap dismisses, second tap (or a button inside the preview) follows the link.
- **Combat tracker statblock popup**: convert from `mouseenter`/`mouseleave` on the name to a tap that shows `#sb-popup` centered on mobile.
- **Image hover preview**: on touch devices, the hover preview is skipped entirely — tap goes directly to the existing lightbox. (Hover preview is redundant when lightbox exists.)

Detection strategy: `window.matchMedia('(hover: none)')` or a `touchstart` flag set once on first touch. Do not use user-agent sniffing.

Deliverable: all interactive elements work with touch without relying on hover.

---

### Stage 5 — Component Polish
**Goal:** Individual components are properly sized and legible on mobile.

- **Statblock abilities**: add `@media (max-width: 400px)` breakpoint to reflow `.sb-abilities` to 3×2 grid instead of 6×1
- **Stat pills in npc-card grids**: verify they don't overflow at minimum card width
- **BA cards** (battlefield actions): verify summary row doesn't truncate on small screens
- **Read-aloud blocks**: font size and padding may want a slight bump on mobile for readability
- **Page title `h1`**: currently `2.6rem` — reduce to ~1.8rem on mobile so it doesn't wrap awkwardly
- **Note tab pills**: tap targets are small (the × delete button especially) — enlarge hit area with padding
- **Combat tracker inputs**: HP and initiative inputs need `min-height: 44px` or equivalent tap target

Deliverable: all components look correct and are comfortably usable at 375px width.

---

### Stage 6 — iOS/Android QA
**Goal:** Verify there are no platform-specific regressions.

Key things to test:
- Virtual keyboard appearance doesn't break the bottom sheet or notes panel layout
- `position: fixed` elements don't jump when inputs are focused (use `env(safe-area-inset-bottom)` for bottom sheet if needed)
- Lightbox images are zoomable (pinch-to-zoom not blocked by `touch-action: none`)
- `localStorage` reads/writes work in Safari private mode (they fail silently — existing code may not guard this)
- Smooth scroll works on Safari (it does since iOS 15.4)
- The sidebar drawer transition doesn't flicker on older Android WebView

---

## Effort Estimate

| Stage | Complexity | Notes |
|---|---|---|
| 1 — Structural | Low | Mostly CSS media queries |
| 2 — Sidebar Drawer | Low–Medium | Simple CSS + ~30 lines JS |
| 3 — Notes Bottom Sheet | Medium | More JS, positioning edge cases |
| 4 — Touch Interactions | Medium–High | Requires careful event handling, touch detection |
| 5 — Component Polish | Low | CSS tweaks across multiple components |
| 6 — QA | Medium | Needs real device testing or BrowserStack |

Total: 1–2 focused sessions to get to a solid Stage 1–3. Stages 4–6 are more incremental and can ship independently.

---

## What NOT to Do

- Don't add a mobile-specific stylesheet — keep all responsive rules co-located with the components they affect in the existing CSS files
- Don't replace hover with `title` attributes — they're useless on touch
- Don't make the notes panel a separate page or route — it needs to stay in-page for the combat tracker to work
- Don't add a framework just for the drawer/sheet — vanilla JS + CSS transitions handle this fine
- Don't change the desktop layout to accommodate mobile — the desktop DM experience is the primary use case
