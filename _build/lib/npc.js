/**
 * npc.js
 * Parses and renders Obsidian NPC note format into an HTML NPC card.
 *
 * Expected format:
 *   ![[Image - Name.png|right|250]]    (optional)
 *   **Field:** Value
 *   **Field:** Value
 *   ...
 */
const fs   = require('fs');
const path = require('path');
const vault = require('./vault');

/**
 * Returns true if the content looks like an NPC note
 * (has **Field:** value structure).
 */
function isNPCNote(content) {
  return /^\*\*\w[\w\s\/]*:\*\*/m.test(content);
}

/**
 * Parse an NPC note into a structured object.
 * @param {string} content  raw markdown content
 * @param {string} vaultRoot  for resolving ![[image]] embeds
 * @param {string} adventureImagesDir  where to copy the image (or null to skip)
 */
function parseNPCNote(content, vaultRoot, adventureImagesDir) {
  const result = {
    name:        null,
    imageSource: null, // absolute path to image file in vault
    imageDest:   null, // relative path for use in HTML (e.g. images/npcs/name.png)
    fields:      [],   // [{ label, value }]
  };

  // Extract embedded image: ![[Image - Name.png|right|250]]
  const imgMatch = content.match(/!\[\[([^\]]+)\]\]/);
  if (imgMatch && vaultRoot) {
    const imgRaw      = imgMatch[1].split('|')[0].trim(); // strip size/alignment
    const foundImg    = vault.findImage(imgRaw, vaultRoot);
    if (foundImg) {
      result.imageSource = foundImg;
      if (adventureImagesDir) {
        const destFilename = path.basename(foundImg);
        result.imageDest   = `images/npcs/${destFilename}`;
      }
    }
  }

  // Extract **Field:** Value lines
  const fieldPattern = /^\*\*([^*]+):\*\*\s*([\s\S]*?)(?=\n\*\*|\n!\[\[|\n#|$)/gm;
  let match;
  while ((match = fieldPattern.exec(content)) !== null) {
    const label = match[1].trim();
    const value = match[2].trim()
      // Strip Obsidian highlight syntax ==text==
      .replace(/==(.*?)==/g, '$1')
      // Collapse extra whitespace
      .replace(/\n\s+/g, ' ')
      .trim();

    if (!value || value === '—') continue; // skip empty fields

    if (label.toLowerCase() === 'name') {
      result.name = value;
    } else {
      result.fields.push({ label, value });
    }
  }

  return result;
}

/**
 * Copy an NPC's image from the vault to the adventure's images folder.
 * Safe to call even if source doesn't exist.
 */
function copyNPCImage(imageSource, adventureImagesDir) {
  if (!imageSource || !adventureImagesDir) return;
  try {
    const dest = path.join(adventureImagesDir, 'npcs', path.basename(imageSource));
    if (!fs.existsSync(path.dirname(dest))) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
    }
    fs.copyFileSync(imageSource, dest);
  } catch (e) {
    console.warn(`  [warn] Could not copy NPC image: ${e.message}`);
  }
}

/**
 * Render a parsed NPC object to an HTML string.
 * @param {object} data    result of parseNPCNote()
 * @param {string} id      the HTML element id (e.g. "misc-crok-ruthesk")
 */
function renderNPCCard(data, id) {
  const name = data.name || id;

  const imgHtml = data.imageDest
    ? `<img class="npc-img" src="${data.imageDest}" alt="${name}">`
    : `<!-- IMAGE: ${name} portrait -->`;

  // Try to extract role/race for the subtitle
  const roleField = data.fields.find(f =>
    /race|role|occupation/i.test(f.label)
  );
  const roleHtml = roleField
    ? `<div class="npc-role"><span class="tag tag-neutral">NPC</span> ${roleField.value}</div>`
    : '';

  // Remaining fields as a simple list (skip the role/race field we already used)
  const otherFields = data.fields.filter(f => f !== roleField);
  const fieldsHtml = otherFields.map(f => `
    <div class="npc-field">
      <span class="npc-field-label">${f.label}:</span> ${f.value}
    </div>
  `).join('');

  return `
<div class="npc-card neutral" style="max-width:none;">
  ${imgHtml}
  <div class="npc-name">${name}</div>
  ${roleHtml}
  <div class="npc-fields">${fieldsHtml}</div>
</div>`;
}

module.exports = { isNPCNote, parseNPCNote, copyNPCImage, renderNPCCard };
