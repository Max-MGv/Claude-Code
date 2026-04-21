/**
 * statblock.js
 * Parses the TTRPG-CLI / Fantasy Statblocks Obsidian format and renders
 * it as a styled HTML statblock card.
 *
 * The source format is a ```statblock YAML code block inside a .md file.
 */
const yaml = require('js-yaml');

// ── Ability score names and order ──────────────────────────────────────────
const ABILITY_NAMES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

/**
 * Returns true if the markdown content contains a statblock code block.
 */
function hasStatblock(content) {
  return /^```statblock$/m.test(content);
}

/**
 * Extract and parse the statblock YAML from the .md file content.
 * Returns a plain object, or null on failure.
 */
function parseStatblock(content) {
  // Extract the YAML inside ```statblock ... ```
  const match = content.match(/^```statblock\n([\s\S]*?)^```/m);
  if (!match) return null;

  let raw = match[1];

  // The TTRPG-CLI format uses !!int and !!float type tags with quoted values,
  // e.g.  "ac": !!int "12"
  // Strip the type tags so js-yaml can parse cleanly.
  raw = raw.replace(/!!\w+\s+/g, '');

  try {
    return yaml.load(raw);
  } catch (e) {
    console.warn('  [warn] Failed to parse statblock YAML:', e.message);
    return null;
  }
}

/**
 * Extract lore text from the .md file — the descriptive paragraphs and
 * headings that appear between the title line and the statblock code block.
 */
function extractLore(content) {
  // Strip YAML frontmatter
  let text = content.replace(/^---[\s\S]*?---\n+/, '');

  // Strip the # [Name](path) title line
  text = text.replace(/^#+\s+\[.*?\]\(.*?\)\n/m, '');

  // Strip the *Source: ...* italic line
  text = text.replace(/^\*Source:[\s\S]*?\*\s*\n/m, '');

  // Take only the part before the statblock code block
  const statblockIdx = text.indexOf('```statblock');
  if (statblockIdx > -1) {
    text = text.substring(0, statblockIdx);
  }

  // Strip Obsidian block ID anchors (^statblock etc.)
  text = text.replace(/\^\w+\s*$/gm, '');

  return text.trim();
}

/**
 * Render a statblock data object to an HTML string.
 * @param {object} data — parsed statblock YAML
 * @param {string} [lore] — optional lore text (markdown)
 */
function renderStatblock(data, lore = '') {
  if (!data) return '<p><em>Could not parse statblock.</em></p>';

  const name      = data.name || 'Unknown';
  const size      = capitalize(data.size || '');
  const type      = data.type || '';
  const subtype   = data.subtype ? ` (${data.subtype})` : '';
  const alignment = data.alignment || '';
  const typeLine  = [size, type + subtype, alignment].filter(Boolean).join(', ');

  const ac        = data.ac || '—';
  const acClass   = data.ac_class ? ` (${stripMarkdownLinks(data.ac_class)})` : '';
  const hp        = data.hp || '—';
  const hitDice   = data.hit_dice ? ` (${data.hit_dice})` : '';
  const speed     = data.speed || '—';

  // Ability scores — stored as array [STR, DEX, CON, INT, WIS, CHA]
  const stats = (data.stats || [10, 10, 10, 10, 10, 10]).map(s => parseInt(s, 10));
  const abilitiesHtml = ABILITY_NAMES.map((name, i) => {
    const score = stats[i] || 10;
    const mod   = abilityMod(score);
    return `<div class="sb-ability"><span>${name}</span><span>${score} (${mod})</span></div>`;
  }).join('');

  // Saving throws
  const saves = formatKeyValueList(data.saves);
  // Skills
  const skills = formatNameDescList(data.skillsaves);
  // Damage resistances / immunities / vulnerabilities
  const resistances  = data['damage-resistances'] ? `<div class="sb-prop"><span class="sb-prop-label">Damage Resistances</span> ${data['damage-resistances']}</div>` : '';
  const immunities   = data['damage-immunities']  ? `<div class="sb-prop"><span class="sb-prop-label">Damage Immunities</span> ${data['damage-immunities']}</div>` : '';
  const condImmune   = data['condition-immunities'] ? `<div class="sb-prop"><span class="sb-prop-label">Condition Immunities</span> ${data['condition-immunities']}</div>` : '';
  const senses       = data.senses    ? `<div class="sb-prop"><span class="sb-prop-label">Senses</span> ${data.senses}</div>` : '';
  const languages    = data.languages ? `<div class="sb-prop"><span class="sb-prop-label">Languages</span> ${data.languages || '—'}</div>` : '';
  const cr           = data.cr       ? `<div class="sb-prop"><span class="sb-prop-label">Challenge</span> ${data.cr}</div>` : '';

  // Traits
  const traits  = renderActionList(data.traits);
  // Actions
  const actions = renderActionList(data.actions);
  // Bonus actions
  const bonusActions = data['bonus-actions'] ? `
    <div class="sb-section-title">Bonus Actions</div>
    ${renderActionList(data['bonus-actions'])}
  ` : '';
  // Reactions
  const reactions = data.reactions ? `
    <div class="sb-section-title">Reactions</div>
    ${renderActionList(data.reactions)}
  ` : '';
  // Legendary actions
  const legendary = data['legendary-actions'] ? `
    <div class="sb-section-title">Legendary Actions</div>
    ${renderActionList(data['legendary-actions'])}
  ` : '';

  // Lore section
  const loreHtml = lore ? `
    <div class="sb-lore">
      ${convertLoreToHtml(lore)}
    </div>
  ` : '';

  return `
<div class="statblock">
  <div class="sb-name">${name}</div>
  <div class="sb-type">${typeLine}</div>
  <hr class="sb-divider">
  <div class="sb-props">
    <div class="sb-prop"><span class="sb-prop-label">Armor Class</span> ${ac}${acClass}</div>
    <div class="sb-prop"><span class="sb-prop-label">Hit Points</span> ${hp}${hitDice}</div>
    <div class="sb-prop"><span class="sb-prop-label">Speed</span> ${speed}</div>
  </div>
  <div class="sb-abilities">${abilitiesHtml}</div>
  <hr class="sb-divider">
  <div class="sb-props">
    ${saves    ? `<div class="sb-prop"><span class="sb-prop-label">Saving Throws</span> ${saves}</div>` : ''}
    ${skills   ? `<div class="sb-prop"><span class="sb-prop-label">Skills</span> ${skills}</div>` : ''}
    ${resistances}${immunities}${condImmune}${senses}${languages}${cr}
  </div>
  ${traits ? `<hr class="sb-divider">${traits}` : ''}
  ${actions ? `<div class="sb-section-title">Actions</div>${actions}` : ''}
  ${bonusActions}${reactions}${legendary}
</div>
${loreHtml}`;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function abilityMod(score) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

/** Strip markdown links like [text](url) → text */
function stripMarkdownLinks(str) {
  if (!str) return '';
  return String(str).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

/**
 * Format saves array: [{ intelligence: "+6" }, { wisdom: "+4" }]
 * → "Int +6, Wis +4"
 */
function formatKeyValueList(arr) {
  if (!arr || !arr.length) return '';
  return arr.map(obj => {
    const [key, val] = Object.entries(obj)[0];
    return `${capitalize(key.slice(0, 3))} ${val}`;
  }).join(', ');
}

/**
 * Format skillsaves array: [{ name: "[Arcana](...)", desc: "+6" }]
 * → "Arcana +6, History +6"
 */
function formatNameDescList(arr) {
  if (!arr || !arr.length) return '';
  return arr.map(obj => {
    const name = stripMarkdownLinks(obj.name || '');
    return `${name} ${obj.desc || ''}`.trim();
  }).join(', ');
}

/**
 * Render a list of { name, desc } action/trait objects to HTML.
 */
function renderActionList(arr) {
  if (!arr || !arr.length) return '';
  return arr.map(obj => {
    const name = obj.name || '';
    const desc = stripMarkdownLinks(obj.desc || '');
    return `<div class="sb-action"><span class="sb-action-name">${name}.</span> ${desc}</div>`;
  }).join('');
}

/**
 * Convert lore markdown to simple HTML.
 * Handles headings and paragraphs; strips Obsidian callouts.
 */
function convertLoreToHtml(lore) {
  // Strip Obsidian callout syntax > [!quote] etc.
  let text = lore.replace(/^>\s*\[!.*?\]\s*\n/gm, '');
  // Convert blockquote lines to <em>
  text = text.replace(/^>\s+(.+)$/gm, '<em>$1</em>');

  const lines = text.split('\n');
  const parts = [];
  let inParagraph = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inParagraph) { parts.push('</p>'); inParagraph = false; }
      continue;
    }
    const h2 = trimmed.match(/^##\s+(.+)/);
    const h3 = trimmed.match(/^###\s+(.+)/);
    if (h2) {
      if (inParagraph) { parts.push('</p>'); inParagraph = false; }
      parts.push(`<h4>${h2[1]}</h4>`);
    } else if (h3) {
      if (inParagraph) { parts.push('</p>'); inParagraph = false; }
      parts.push(`<h4>${h3[1]}</h4>`);
    } else {
      if (!inParagraph) { parts.push('<p>'); inParagraph = true; }
      else parts.push(' ');
      parts.push(trimmed);
    }
  }
  if (inParagraph) parts.push('</p>');
  return parts.join('');
}

module.exports = { hasStatblock, parseStatblock, extractLore, renderStatblock };
