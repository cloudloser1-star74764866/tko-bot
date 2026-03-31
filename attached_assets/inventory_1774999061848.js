// ============================================================
//  TKO BOT — INVENTORY MANAGER
//  Handles loading/saving user inventories and shards to disk
// ============================================================

const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'inventory.json');

// ── Persistence ───────────────────────────────────────────

function loadInventory() {
  if (!fs.existsSync(DATA_FILE)) return { users: {} };
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { users: {} }; }
}

function saveInventory(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function ensureUser(inventory, userId) {
  if (!inventory.users[userId]) {
    inventory.users[userId] = { cards: [], shards: 0 };
  }
}

// ── Card Operations ───────────────────────────────────────

/**
 * Add a card to a user's inventory.
 * If duplicate, convert to shards using SHARD_VALUES from config.
 * Returns { isDupe, shardsAwarded }
 */
function addCardToInventory(inventory, userId, card, shardValues) {
  ensureUser(inventory, userId);
  const user = inventory.users[userId];

  if (user.cards.find(c => c.id === card.id)) {
    const awarded = (shardValues || {})[card.rarity] || 10;
    user.shards += awarded;
    return { isDupe: true, shardsAwarded: awarded };
  }

  user.cards.push({
    id:         card.id,
    name:       card.name,
    series:     card.series,
    rarity:     card.rarity,
    obtainedAt: new Date().toISOString(),
  });
  return { isDupe: false, shardsAwarded: 0 };
}

function removeCardFromInventory(inventory, userId, cardId) {
  ensureUser(inventory, userId);
  const user = inventory.users[userId];
  const idx  = user.cards.findIndex(c => c.id === cardId);
  if (idx === -1) return false;
  user.cards.splice(idx, 1);
  return true;
}

function hasCard(inventory, userId, cardId) {
  ensureUser(inventory, userId);
  return !!inventory.users[userId].cards.find(c => c.id === cardId);
}

function getCards(inventory, userId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].cards;
}

// ── Shard Operations ──────────────────────────────────────

function getShards(inventory, userId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].shards;
}

function addShards(inventory, userId, amount) {
  ensureUser(inventory, userId);
  inventory.users[userId].shards += amount;
}

/**
 * Remove shards from a user. Returns false if insufficient.
 */
function removeShards(inventory, userId, amount) {
  ensureUser(inventory, userId);
  if (inventory.users[userId].shards < amount) return false;
  inventory.users[userId].shards -= amount;
  return true;
}

module.exports = {
  loadInventory, saveInventory,
  addCardToInventory, removeCardFromInventory, hasCard, getCards,
  getShards, addShards, removeShards,
};
