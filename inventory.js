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
    inventory.users[userId] = { cards: [], characterShards: {}, platings: {}, team: [], yen: 0, stars: 0, candyTokens: 0 };
  }
  const u = inventory.users[userId];
  if (!u.characterShards)               u.characterShards = {};
  if (!u.platings)                      u.platings        = {};
  if (!u.team)                          u.team            = [];
  if (typeof u.yen          !== 'number') u.yen          = 0;
  if (typeof u.stars        !== 'number') u.stars        = 0;
  if (typeof u.candyTokens  !== 'number') u.candyTokens  = 0;
  if ('shards' in u)                    delete u.shards;
  for (const card of u.cards) {
    if (typeof card.level !== 'number') card.level = 1;
  }
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
    level:      1,
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

// ── Card Level Operations ─────────────────────────────────

const MAX_CARD_LEVEL = 100;

function getCardLevel(inventory, userId, cardId) {
  ensureUser(inventory, userId);
  const card = inventory.users[userId].cards.find(c => c.id === cardId);
  return card ? (card.level ?? 1) : null;
}

function setCardLevel(inventory, userId, cardId, level) {
  ensureUser(inventory, userId);
  const card = inventory.users[userId].cards.find(c => c.id === cardId);
  if (!card) return false;
  card.level = Math.max(1, Math.min(MAX_CARD_LEVEL, level));
  return true;
}

// ── Team Operations ───────────────────────────────────────

const TEAM_SIZE = 4;

function getTeam(inventory, userId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].team;
}

/** Add a card to the team. Returns 'added', 'full', or 'already_on_team'. */
function addToTeam(inventory, userId, cardId) {
  ensureUser(inventory, userId);
  const team = inventory.users[userId].team;
  if (team.find(s => s.cardId === cardId)) return 'already_on_team';
  if (team.length >= TEAM_SIZE) return 'full';
  team.push({ cardId, plating: null });
  return 'added';
}

/** Remove a card from the team. Returns the slot (with plating) or null. */
function removeFromTeam(inventory, userId, cardId) {
  ensureUser(inventory, userId);
  const team = inventory.users[userId].team;
  const idx  = team.findIndex(s => s.cardId === cardId);
  if (idx === -1) return null;
  const [slot] = team.splice(idx, 1);
  return slot;
}

/**
 * Equip a plating to a card on the team.
 * Consumes the plating from inventory.
 * Returns 'equipped', 'not_on_team', 'no_plating', or 'already_equipped'.
 */
function equipPlatingToTeam(inventory, userId, cardId, platingTier) {
  ensureUser(inventory, userId);
  const team = inventory.users[userId].team;
  const slot = team.find(s => s.cardId === cardId);
  if (!slot) return 'not_on_team';
  if (slot.plating) return 'already_equipped';
  const p = inventory.users[userId].platings;
  if ((p[platingTier] ?? 0) < 1) return 'no_plating';
  p[platingTier]--;
  if (p[platingTier] === 0) delete p[platingTier];
  slot.plating = platingTier;
  return 'equipped';
}

/**
 * Unequip a plating from a team card.
 * Returns the plating tier that was removed, or null.
 */
function unequipPlatingFromTeam(inventory, userId, cardId) {
  ensureUser(inventory, userId);
  const team = inventory.users[userId].team;
  const slot = team.find(s => s.cardId === cardId);
  if (!slot || !slot.plating) return null;
  const tier = slot.plating;
  slot.plating = null;
  const p = inventory.users[userId].platings;
  p[tier] = (p[tier] ?? 0) + 1;
  return tier;
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
  MAX_CARD_LEVEL, getCardLevel, setCardLevel,
  TEAM_SIZE, getTeam, addToTeam, removeFromTeam, equipPlatingToTeam, unequipPlatingFromTeam,
  getCharacterShards, addCharacterShards, removeCharacterShards,
  getPlatings, addPlating, addPlatings, removePlating,
  getYen, addYen, removeYen,
  getStars, addStars, removeStars,
  getCandyTokens, addCandyTokens, removeCandyTokens,
};
