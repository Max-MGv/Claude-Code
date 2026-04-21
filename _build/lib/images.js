/**
 * images.js
 * Handles extraction and copying of embedded images from Obsidian markdown.
 *
 * Obsidian syntax:  ![[filename.png]]
 *                   ![[filename.png|right|250]]   (with alignment/size options)
 *
 * Images embedded in NPC notes are handled separately by npc.js.
 * This module handles images found in source adventure files and generic notes.
 */

const fs   = require('fs');
const path = require('path');
const vault = require('./vault');

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);

/**
 * Extract all embedded image filenames from a markdown string.
 * Filters out non-image embeds (e.g. ![[OtherNote#Section]]).
 *
 * Returns array of filename strings, e.g. ["Temple Exterior.jpg", "Banner.png"]
 */
function extractEmbeddedImages(content) {
  const pattern = /!\[\[([^\]]+)\]\]/g;
  const images  = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    const raw = match[1].split('|')[0].trim(); // strip |right|250 etc.
    const ext = path.extname(raw).toLowerCase();
    if (IMAGE_EXTENSIONS.has(ext)) {
      images.push(raw);
    }
  }

  return images;
}

/**
 * Find an image in the vault and copy it to the destination directory.
 * Returns the relative path used in HTML (e.g. "images/temple-exterior.jpg"),
 * or null if the image couldn't be found.
 *
 * @param {string} filename      e.g. "Temple Exterior.jpg"
 * @param {string} vaultRoot     absolute vault root path
 * @param {string} destDir       absolute path to destination folder (e.g. .../images/)
 */
function copyImage(filename, vaultRoot, destDir) {
  const src = vault.findImage(filename, vaultRoot);
  if (!src) return null;

  try {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const destFilename = path.basename(src);
    const dest = path.join(destDir, destFilename);
    fs.copyFileSync(src, dest);
    return destFilename; // just the filename; caller constructs the relative path
  } catch (e) {
    console.warn(`  [warn] Could not copy image "${filename}": ${e.message}`);
    return null;
  }
}

/**
 * Scan all source .md files in sourceDir for embedded images, find them in the
 * vault, and copy them to adventureDir/images/.
 *
 * Called once per build, after linked notes are collected.
 *
 * @param {string} sourceDir     path to _source/[adventure]/
 * @param {string} vaultRoot     absolute vault root
 * @param {string} adventureDir  path to adventures/[adventure]/
 */
function copySourceImages(sourceDir, vaultRoot, adventureDir) {
  const destDir = path.join(adventureDir, 'images');

  const sourceFiles = fs.readdirSync(sourceDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(sourceDir, f));

  const copied  = [];
  const missing = [];

  for (const file of sourceFiles) {
    let content;
    try { content = fs.readFileSync(file, 'utf-8'); } catch { continue; }

    for (const imgName of extractEmbeddedImages(content)) {
      const destFilename = copyImage(imgName, vaultRoot, destDir);
      if (destFilename) {
        copied.push({ imgName, destFilename });
      } else {
        missing.push(imgName);
      }
    }
  }

  return { copied, missing };
}

module.exports = { extractEmbeddedImages, copyImage, copySourceImages };
