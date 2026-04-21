/**
 * render.js
 * Routes a resolved linked note to the appropriate renderer and assembles
 * the full Misc / Linked Notes section HTML.
 */
const path       = require('path');
const statblock  = require('./statblock');
const npc        = require('./npc');
const imageLib   = require('./images');
const { slugify } = require('./links');

/**
 * Detect what kind of note this is.
 * Returns: 'statblock' | 'npc' | 'generic'
 */
function detectNoteType(content) {
  if (statblock.hasStatblock(content)) return 'statblock';
  if (npc.isNPCNote(content))          return 'npc';
  return 'generic';
}

/**
 * Render a single linked note to an HTML string for the Misc section.
 *
 * @param {string} noteName         e.g. "Crok Ruthesk"
 * @param {string} content          raw .md content of the note
 * @param {string} filePath         absolute path to the note (for context)
 * @param {string} vaultRoot        vault root for image resolution
 * @param {string} adventureDir     path to adventure folder (for image copying)
 */
function renderLinkedNote(noteName, content, filePath, vaultRoot, adventureDir) {
  const type = detectNoteType(content);
  const id   = `misc-${slugify(noteName)}`;
  const adventureImagesDir = adventureDir ? path.join(adventureDir, 'images') : null;

  let tagHtml    = '';
  let bodyHtml   = '';
  let previewTitle = noteName;
  let previewBody  = '';

  if (type === 'statblock') {
    const data = statblock.parseStatblock(content);
    const lore = statblock.extractLore(content);
    tagHtml  = '<span class="misc-tag misc-tag-monster">Monster</span>';
    bodyHtml = statblock.renderStatblock(data, lore);
    if (data) {
      const size = data.size || '';
      const tp   = data.type || '';
      previewTitle = data.name || noteName;
      previewBody  = `${size} ${tp}, CR ${data.cr || '?'}`.trim();
    }

  } else if (type === 'npc') {
    const data = npc.parseNPCNote(content, vaultRoot, adventureImagesDir);
    if (data.imageSource && adventureImagesDir) {
      npc.copyNPCImage(data.imageSource, adventureImagesDir);
    }
    tagHtml  = '<span class="misc-tag misc-tag-npc">NPC</span>';
    bodyHtml = npc.renderNPCCard(data, id);
    previewTitle = data.name || noteName;
    const roleField = data.fields.find(f => /role|occupation/i.test(f.label));
    previewBody = roleField ? roleField.value : '';

  } else {
    // Generic note: strip frontmatter and render as simple prose
    tagHtml  = '<span class="misc-tag misc-tag-note">Note</span>';
    bodyHtml = renderGenericNote(content, vaultRoot, adventureImagesDir);
    previewBody = extractFirstParagraph(content);
  }

  return `
<details class="misc-entry" id="${id}"
  data-preview-title="${escapeAttr(previewTitle)}"
  data-preview-body="${escapeAttr(previewBody)}">
  <summary class="misc-summary">
    ${tagHtml}
    ${escapeHtml(noteName)}
  </summary>
  <div class="misc-content">
    ${bodyHtml}
  </div>
</details>`;
}

/**
 * Generate the full Misc / Linked Notes section HTML from a Map of linked notes.
 *
 * @param {Map}    linkedNotes  result of collectLinkedNotes()
 * @param {string} vaultRoot
 * @param {string} adventureDir
 */
function generateMiscSection(linkedNotes, vaultRoot, adventureDir) {
  if (!linkedNotes.size) return '';

  const entries = Array.from(linkedNotes.values())
    // Sort: statblocks first, then NPCs, then generic
    .sort((a, b) => {
      const order = { statblock: 0, npc: 1, generic: 2 };
      const ta = detectNoteType(a.content);
      const tb = detectNoteType(b.content);
      if (order[ta] !== order[tb]) return order[ta] - order[tb];
      return a.noteName.localeCompare(b.noteName);
    });

  const entriesHtml = entries.map(({ noteName, content, filePath }) =>
    renderLinkedNote(noteName, content, filePath, vaultRoot, adventureDir)
  ).join('\n');

  return `<!-- MISC-SECTION-START -->
<div class="section" id="misc">
  <div class="section-header">
    <span class="icon">🔗</span>
    <h2>Linked Notes</h2>
  </div>
  <div class="section-body">
    <p style="font-size:0.85rem;color:var(--ink-light);margin-bottom:1rem;">
      Notes referenced in this adventure. Click to expand. Hover over any
      <a class="wiki-link" style="pointer-events:none">highlighted link</a>
      in the text to preview.
    </p>
    ${entriesHtml}
  </div>
</div>
<!-- MISC-SECTION-END -->`;
}

// ── Internal helpers ───────────────────────────────────────────────────────

function renderGenericNote(content, vaultRoot, adventureImagesDir) {
  // Strip frontmatter
  let text = content.replace(/^---[\s\S]*?---\n+/, '');
  // Replace ![[image.ext]] with <img> tags; strip non-image embeds
  text = text.replace(/!\[\[([^\]]+)\]\]/g, (match, inner) => {
    const filename = inner.split('|')[0].trim();
    const ext = require('path').extname(filename).toLowerCase();
    const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext);
    if (!isImage) return ''; // embedded note section — skip
    if (!vaultRoot || !adventureImagesDir) return ''; // no vault access
    const destFilename = imageLib.copyImage(filename, vaultRoot, adventureImagesDir);
    if (!destFilename) return `<!-- IMAGE: ${filename} -->`;
    return `<img src="images/${destFilename}" alt="${filename}" style="max-width:100%;border-radius:4px;margin:0.5rem 0;">`;
  });
  // Convert headings to h4
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '<h4>$1</h4>');
  // Convert **bold**
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Convert *italic*
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Convert paragraphs (double newline → </p><p>)
  text = '<p>' + text.trim().replace(/\n\n+/g, '</p><p>') + '</p>';
  // Clean up empty paragraphs
  text = text.replace(/<p>\s*<\/p>/g, '');
  return `<div class="generic-note">${text}</div>`;
}

function extractFirstParagraph(content) {
  const text = content.replace(/^---[\s\S]*?---\n+/, '').trim();
  const match = text.match(/^[^#\n].*$/m);
  return match ? match[0].replace(/[*_[\]]/g, '').slice(0, 160) : '';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return String(str)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { renderLinkedNote, generateMiscSection, detectNoteType };
