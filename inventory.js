// ============================================================
//  test BOT — INVENTORY MANAGER
//  Handles loading/saving user inventories and shards to disk
// ============================================================

const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'inventory.json');

// ── Persistence ───────────────────────────────────────────

function loadInventory() {
  if (!fs.existsSync(DATA_FILE)) return { users: {}, pullCharges: {} };
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (!data.pullCharges) data.pullCharges = {};
    return data;
  }
  catch { return { users: {}, pullCharges: {} }; }
}

function saveInventory(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function ensureUser(inventory, userId) {
  if (!inventory.users[userId]) {
    inventory.users[userId] = { cards: [], shards: 0, characterShards: {} };
  }
  if (!inventory.users[userId].characterShards) {
    inventory.users[userId].characterShards = {};
  }
}

// ── Pull Charge Persistence ───────────────────────────────

/**
 * Load a user's stored pull charge bucket from disk.
 * Returns { charges, lastRefill } or null if no record exists yet.
 */
function loadPullCharges(inventory, userId) {
  return inventory.pullCharges[userId] ?? null;
}

/**
 * Save a user's pull charge bucket to inventory and write to disk immediately.
 */
function savePullCharges(inventory, userId, charges, lastRefill) {
  inventory.pullCharges[userId] = { charges, lastRefill };
  saveInventory(inventory);
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

function removeShards(inventory, userId, amount) {
  ensureUser(inventory, userId);
  if (inventory.users[userId].shards < amount) return false;
  inventory.users[userId].shards -= amount;
  return true;
}

module.exports = {
  loadInventory, saveInventory,
  loadPullCharges, savePullCharges,
  addCardToInventory, removeCardFromInventory, hasCard, getCards,
  getCharacterShards,
  getShards, addShards, removeShards,
};
