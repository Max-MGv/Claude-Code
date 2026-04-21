/**
 * vault.js
 * Searches the Obsidian vault for files by name, replicating how Obsidian
 * resolves wiki links (by filename only, ignoring path).
 */
const fs   = require('fs');
const path = require('path');

/**
 * Find a note (.md file) in the vault by its name (no path, no extension).
 * Returns the absolute path, or null if not found.
 *
 * @param {string} noteName  e.g. "mage", "Crok Ruthesk", "young-white-dragon"
 * @param {string} vaultRoot absolute path to vault root
 */
function findNote(noteName, vaultRoot) {
  const target = noteName.trim() + '.md';
  return searchDir(vaultRoot, target);
}

/**
 * Find an image file in the vault by filename.
 * Returns the absolute path, or null if not found.
 *
 * @param {string} filename  e.g. "Image - Crok Ruthesk.png"
 * @param {string} vaultRoot
 */
function findImage(filename, vaultRoot) {
  return searchDir(vaultRoot, filename);
}

/**
 * Recursively search `dir` for a file whose name matches `target` (case-insensitive).
 */
function searchDir(dir, target) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }

  for (const entry of entries) {
    // Skip hidden directories (.obsidian, .git, etc.)
    if (entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const found = searchDir(fullPath, target);
      if (found) return found;
    } else if (entry.name.toLowerCase() === target.toLowerCase()) {
      return fullPath;
    }
  }
  return null;
}

module.exports = { findNote, findImage };
