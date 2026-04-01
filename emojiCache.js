const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'data', 'emoji_cache.json');

function load() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
  catch { return {}; }
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

/** Return the <:name:id> string for a card, or null if not registered. */
function getEmoji(cardId) {
  const cache = load();
  const entry = cache[cardId];
  if (!entry) return null;
  return `<:${entry.name}:${entry.id}>`;
}

/** Persist a new emoji entry. */
function setEmoji(cardId, name, id) {
  const cache = load();
  cache[cardId] = { name, id };
  save(cache);
}

/** Remove an entry (for cleanup). */
function removeEmoji(cardId) {
  const cache = load();
  delete cache[cardId];
  save(cache);
}

module.exports = { load, save, getEmoji, setEmoji, removeEmoji };
