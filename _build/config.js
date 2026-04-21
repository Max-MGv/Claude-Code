/**
 * config.js
 * Edit VAULT_ROOT if you move your Obsidian vault.
 * All other paths are relative to the repo root.
 */
module.exports = {
  // Absolute path to your Obsidian vault root
  VAULT_ROOT: 'C:/Users/Max/Desktop/Obsidian/DnD Backup/backup Golden Hour',

  // Relative to _build/: where generated adventures live
  ADVENTURES_DIR: '../adventures',

  // Relative to _build/: where source MD files live
  SOURCE_DIR: '../_source',

  // How many levels of wiki links to follow recursively.
  // 0 = only links in source files
  // 1 = also links found in those linked notes
  // 2 = one more level (recommended max to avoid pulling in the whole compendium)
  MAX_LINK_DEPTH: 2,
};
