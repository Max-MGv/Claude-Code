/**
 * links.js
 * Extracts [[wiki links]] from markdown content and recursively collects
 * all linked notes from the vault.
 */
const fs   = require('fs');
const path = require('path');
const vault = require('./vault');

/**
 * Parse all [[wiki links]] from a markdown string.
 * Skips ![[embedded]] (images, other embedded files).
 *
 * Handles all Obsidian wiki link formats:
 *   [[Note]]
 *   [[Note|Display Text]]
 *   [[Note#Heading]]
 *   [[Note#Heading|Display Text]]
 *
 * Returns array of { noteName, anchor, displayText, raw }
 */
function extractWikiLinks(content) {
  // Negative lookbehind: skip ![[embedded]] syntax
  const pattern = /(?<!!)(?<!!)\[\[([^\]]+)\]\]/g;
  const links = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    const raw = match[1]; // e.g. "owlbear#Owlbear Origins|Owlbear"
    const [noteAndAnchor, displayText] = raw.split('|');
    const [noteName, anchor] = noteAndAnchor.split('#');

    links.push({
      raw,
      noteName:    noteName.trim(),
      anchor:      anchor ? anchor.trim() : null,
      displayText: displayText ? displayText.trim() : noteName.trim(),
    });
  }

  return links;
}

/**
 * Collect all linked notes referenced (directly or transitively) by the
 * source files in `sourceDir`, searching the vault recursively.
 *
 * Returns a Map keyed by lowercase note name:
 *   { noteName, filePath, content, depth }
 *
 * Notes that are themselves in `sourceDir` are treated as "internal" — they
 * already have their own sections in the adventure page and are NOT added to
 * the Misc collection. Links to them will resolve as in-page anchors.
 *
 * @param {string}   sourceDir   path to _source/[adventure]/
 * @param {string}   vaultRoot   absolute path to vault root
 * @param {number}   maxDepth    max recursion depth (0 = source files only)
 */
function collectLinkedNotes(sourceDir, vaultRoot, maxDepth = 2) {
  const result   = new Map();   // key: lowercase note name
  const visited  = new Set();   // keys already seen (prevent cycles)

  // Names of files already in the adventure source (internal — skip these)
  const internalNames = new Set(
    fs.readdirSync(sourceDir)
      .filter(f => f.endsWith('.md'))
      .map(f => path.basename(f, '.md').toLowerCase())
  );

  function processFile(filePath, depth) {
    if (depth > maxDepth) return;

    let content;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      return;
    }

    const links = extractWikiLinks(content);

    for (const link of links) {
      const key = link.noteName.toLowerCase();
      if (visited.has(key))    continue;   // already handled
      if (internalNames.has(key)) continue; // adventure-internal file

      visited.add(key);

      const resolvedPath = vault.findNote(link.noteName, vaultRoot);
      if (!resolvedPath) {
        console.warn(`  [warn] Could not resolve: [[${link.noteName}]]`);
        continue;
      }

      let linkedContent;
      try {
        linkedContent = fs.readFileSync(resolvedPath, 'utf-8');
      } catch {
        continue;
      }

      result.set(key, {
        noteName:  link.noteName,
        filePath:  resolvedPath,
        content:   linkedContent,
        depth,
      });

      // Recurse into this note's own wiki links
      processFile(resolvedPath, depth + 1);
    }
  }

  // Start from every source file in the adventure
  const sourceFiles = fs.readdirSync(sourceDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(sourceDir, f));

  for (const f of sourceFiles) {
    processFile(f, 0);
  }

  return result;
}

/**
 * Build a map of note name (lowercase) → in-page anchor ID,
 * for all adventure-internal notes (they already have sections on the page).
 *
 * @param {string} sourceDir
 */
function buildInternalAnchorMap(sourceDir) {
  const map = new Map();

  // The main adventure file's sections are identified by their h2/h3 headings.
  // We return a simple filename → slug mapping for now.
  // The adventure HTML uses id="[section]" attributes that are set manually.
  const sourceFiles = fs.readdirSync(sourceDir)
    .filter(f => f.endsWith('.md'));

  for (const f of sourceFiles) {
    const name = path.basename(f, '.md').toLowerCase();
    const slug = slugify(path.basename(f, '.md'));
    map.set(name, slug);
  }

  return map;
}

/**
 * Convert a note name to a URL-safe slug.
 */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

module.exports = { extractWikiLinks, collectLinkedNotes, buildInternalAnchorMap, slugify };
