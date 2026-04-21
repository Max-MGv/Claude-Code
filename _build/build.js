#!/usr/bin/env node
/**
 * build.js — Main entry point
 *
 * Usage:
 *   node build.js <adventure-name>
 *   node build.js statue-heist
 *
 * What it does:
 *   1. Reads source .md files from _source/<adventure>/
 *   2. Extracts [[wiki links]] and resolves them against the Obsidian vault
 *   3. Follows links recursively up to MAX_LINK_DEPTH
 *   4. Renders each linked note (statblock / NPC card / generic)
 *   5. Injects the Misc section into adventures/<adventure>/index.html
 *      between <!-- MISC-SECTION-START --> and <!-- MISC-SECTION-END --> markers
 */

const fs     = require('fs');
const path   = require('path');
const config = require('./config');
const links  = require('./lib/links');
const render = require('./lib/render');
const images = require('./lib/images');

// ── Entry point ────────────────────────────────────────────────────────────
const adventureName = process.argv[2];

if (!adventureName) {
  console.error('Usage: node build.js <adventure-name>');
  console.error('Example: node build.js statue-heist');
  process.exit(1);
}

build(adventureName);

// ── Main build function ────────────────────────────────────────────────────
function build(name) {
  console.log(`\nBuilding: ${name}`);
  console.log('─'.repeat(40));

  const sourceDir    = path.resolve(__dirname, config.SOURCE_DIR, name);
  const adventureDir = path.resolve(__dirname, config.ADVENTURES_DIR, name);
  const indexFile    = path.join(adventureDir, 'index.html');
  const vaultRoot    = config.VAULT_ROOT;

  // Validate paths
  if (!fs.existsSync(sourceDir)) {
    console.error(`✗ Source directory not found: ${sourceDir}`);
    process.exit(1);
  }
  if (!fs.existsSync(indexFile)) {
    console.error(`✗ Adventure index.html not found: ${indexFile}`);
    console.error('  Copy _templates/oneshot.html to that location first.');
    process.exit(1);
  }

  // Step 1: Collect all linked notes recursively
  console.log(`\nResolving wiki links (max depth: ${config.MAX_LINK_DEPTH})…`);
  const linkedNotes = links.collectLinkedNotes(sourceDir, vaultRoot, config.MAX_LINK_DEPTH);

  if (!linkedNotes.size) {
    console.log('  No linked notes found.');
  } else {
    console.log(`  Found ${linkedNotes.size} linked note(s):`);
    for (const [key, note] of linkedNotes) {
      const type = render.detectNoteType(note.content);
      console.log(`  • ${note.noteName} [${type}]`);
    }
  }

  // Step 1b: Copy embedded images from source files
  console.log('\nCopying embedded images from source files…');
  const { copied, missing } = images.copySourceImages(sourceDir, vaultRoot, adventureDir);
  if (copied.length) {
    copied.forEach(({ imgName, destFilename }) =>
      console.log(`  ✓ ${imgName} → images/${destFilename}`)
    );
  } else {
    console.log('  No embedded images found in source files.');
  }
  if (missing.length) {
    console.log('  ⚠ Could not find in vault:');
    missing.forEach(n => console.log(`    • ${n}`));
  }

  // Step 2: Generate Misc section HTML
  console.log('\nRendering Misc section…');
  const miscHtml = render.generateMiscSection(linkedNotes, vaultRoot, adventureDir);

  // Step 3: Inject into index.html
  console.log('\nInjecting into index.html…');
  let html = fs.readFileSync(indexFile, 'utf-8');

  const startMarker = '<!-- MISC-SECTION-START -->';
  const endMarker   = '<!-- MISC-SECTION-END -->';

  if (!html.includes(startMarker) || !html.includes(endMarker)) {
    // No markers yet — append before </main>
    console.log('  No markers found — appending before </main>');
    html = html.replace('</main>', `\n  ${miscHtml}\n\n</main>`);
  } else {
    // Replace everything between (and including) the markers
    const startIdx = html.indexOf(startMarker);
    const endIdx   = html.indexOf(endMarker) + endMarker.length;
    html = html.slice(0, startIdx) + miscHtml + html.slice(endIdx);
  }

  fs.writeFileSync(indexFile, html, 'utf-8');
  console.log('  ✓ index.html updated');

  // Step 4: Report unresolved links
  reportUnresolved(sourceDir, vaultRoot, linkedNotes);

  console.log('\n✓ Build complete.\n');
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Report wiki links in source files that could not be resolved to vault notes.
 */
function reportUnresolved(sourceDir, vaultRoot, resolved) {
  const vault = require('./lib/vault');
  const sourceFiles = fs.readdirSync(sourceDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(sourceDir, f));

  const internalNames = new Set(
    fs.readdirSync(sourceDir)
      .filter(f => f.endsWith('.md'))
      .map(f => path.basename(f, '.md').toLowerCase())
  );

  const unresolved = [];

  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const extracted = links.extractWikiLinks(content);
    for (const link of extracted) {
      const key = link.noteName.toLowerCase();
      if (resolved.has(key))       continue;
      if (internalNames.has(key))  continue;
      const found = vault.findNote(link.noteName, vaultRoot);
      if (!found) unresolved.push(link.noteName);
    }
  }

  if (unresolved.length) {
    console.log('\n⚠ Unresolved wiki links:');
    [...new Set(unresolved)].forEach(n => console.log(`  • [[${n}]]`));
  }
}
