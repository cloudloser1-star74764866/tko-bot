// ============================================================
//  test BOT — INVENTORY MANAGER
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
    inventory.users[userId] = { cards: [], characterShards: {}, platings: {}, yen: 0, stars: 0, candyTokens: 0 };
  }
  const u = inventory.users[userId];
  if (!u.characterShards)               u.characterShards = {};
  if (!u.platings)                      u.platings        = {};
  if (typeof u.yen          !== 'number') u.yen          = 0;
  if (typeof u.stars        !== 'number') u.stars        = 0;
  if (typeof u.candyTokens  !== 'number') u.candyTokens  = 0;
  if ('shards' in u)                    delete u.shards;
}

// ── Card Operations ───────────────────────────────────────

function addCardToInventory(inventory, userId, card) {
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

function addCharacterShards(inventory, userId, cardId, amount) {
  ensureUser(inventory, userId);
  const s = inventory.users[userId].characterShards;
  s[cardId] = (s[cardId] || 0) + amount;
}

function removeCharacterShards(inventory, userId, cardId, amount) {
  ensureUser(inventory, userId);
  const s       = inventory.users[userId].characterShards;
  const current = s[cardId] || 0;
  if (current < amount) return false;
  s[cardId] = current - amount;
  if (s[cardId] === 0) delete s[cardId];
  return true;
}

// ── Plating Operations ────────────────────────────────────

function getPlatings(inventory, userId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].platings;
}

function addPlating(inventory, userId, tierId) {
  ensureUser(inventory, userId);
  const p = inventory.users[userId].platings;
  p[tierId] = (p[tierId] || 0) + 1;
}

function addPlatings(inventory, userId, tierId, amount) {
  ensureUser(inventory, userId);
  const p = inventory.users[userId].platings;
  p[tierId] = (p[tierId] || 0) + amount;
}

function removePlating(inventory, userId, tierId, amount) {
  ensureUser(inventory, userId);
  const p       = inventory.users[userId].platings;
  const current = p[tierId] || 0;
  if (current < amount) return false;
  p[tierId] = current - amount;
  if (p[tierId] === 0) delete p[tierId];
  return true;
}

// ── Yen Operations ────────────────────────────────────────

function getYen(inventory, userId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].yen;
}

function addYen(inventory, userId, amount) {
  ensureUser(inventory, userId);
  inventory.users[userId].yen += amount;
}

function removeYen(inventory, userId, amount) {
  ensureUser(inventory, userId);
  if (inventory.users[userId].yen < amount) return false;
  inventory.users[userId].yen -= amount;
  return true;
}

// ── Stars Operations ──────────────────────────────────────

function getStars(inventory, userId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].stars;
}

function addStars(inventory, userId, amount) {
  ensureUser(inventory, userId);
  inventory.users[userId].stars += amount;
}

function removeStars(inventory, userId, amount) {
  ensureUser(inventory, userId);
  if (inventory.users[userId].stars < amount) return false;
  inventory.users[userId].stars -= amount;
  return true;
}

// ── Candy Token Operations ────────────────────────────────

function getCandyTokens(inventory, userId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].candyTokens;
}

function addCandyTokens(inventory, userId, amount) {
  ensureUser(inventory, userId);
  inventory.users[userId].candyTokens += amount;
}

function removeCandyTokens(inventory, userId, amount) {
  ensureUser(inventory, userId);
  if (inventory.users[userId].candyTokens < amount) return false;
  inventory.users[userId].candyTokens -= amount;
  return true;
}

// ── Pull Charge Helpers ───────────────────────────────────

function loadPullCharges(inventory, userId) {
  return inventory.pullCharges[userId] ?? null;
}

function savePullCharges(inventory, userId, charges, lastRefill) {
  inventory.pullCharges[userId] = { charges, lastRefill };
  saveInventory(inventory);
}

module.exports = {
  loadInventory, saveInventory,
  loadPullCharges, savePullCharges,
  addCardToInventory, removeCardFromInventory, hasCard, getCards,
  getCharacterShards, addCharacterShards, removeCharacterShards,
  getPlatings, addPlating, addPlatings, removePlating,
  getYen, addYen, removeYen,
  getStars, addStars, removeStars,
  getCandyTokens, addCandyTokens, removeCandyTokens,
};
