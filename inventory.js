// ============================================================
//  test BOT — INVENTORY MANAGER
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
    inventory.users[userId] = { cards: [], shards: 0, characterShards: {} };
  }
  // Migrate older users who don't have characterShards yet
  if (!inventory.users[userId].characterShards) {
    inventory.users[userId].characterShards = {};
  }
}

// ── Card Operations ───────────────────────────────────────

/**
 * Add a card to a user's inventory.
 * If duplicate, award 1 character shard for that specific card.
 * Returns { isDupe, cardName }
 */
function addCardToInventory(inventory, userId, card, shardValues) {
  ensureUser(inventory, userId);
  const user = inventory.users[userId];

  if (user.cards.find(c => c.id === card.id)) {
    user.characterShards[card.id] = (user.characterShards[card.id] || 0) + 1;
    return { isDupe: true, cardName: card.name };
  }

  user.cards.push({
    id:         card.id,
    name:       card.name,
    series:     card.series,
    rarity:     card.rarity,
    obtainedAt: new Date().toISOString(),
  });
  return { isDupe: false, cardName: card.name };
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

// ── Character Shard Operations ────────────────────────────

/**
 * Returns a map of { cardId: count } for all character shards a user owns.
 */
function getCharacterShards(inventory, userId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].characterShards;
}

// ── Trade Shard Operations ────────────────────────────────

function getShards(inventory, userId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].shards;
}

function addShards(inventory, userId, amount) {
  ensureUser(inventory, userId);
  inventory.users[userId].shards += amount;
}

/**
 * Remove trade shards from a user. Returns false if insufficient.
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
  getCharacterShards,
  getShards, addShards, removeShards,
};
