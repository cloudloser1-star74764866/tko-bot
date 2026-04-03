// ============================================================
//  test BOT — INVENTORY MANAGER
// ============================================================

const { Pool } = require('pg');

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

db.query(`
    CREATE TABLE IF NOT EXISTS global_inventory (
      id   TEXT PRIMARY KEY,
      data JSONB NOT NULL
    )
  `).catch(err => console.error('[Inventory DB] Setup error:', err));

// ── Persistence ───────────────────────────────────────────

async function loadInventory() {
  try {
    const res = await db.query(`SELECT data FROM global_inventory WHERE id = 'main'`);
    if (res.rows.length === 0) {
      return { users: {}, pullCharges: {}, clans: {}, duos: {}, guilds: {}, redeemCodes: {} };
    }
    const data = res.rows[0].data;
    if (!data.pullCharges)  data.pullCharges  = {};
    if (!data.clans)        data.clans        = {};
    if (!data.duos)         data.duos         = {};
    if (!data.guilds)       data.guilds       = {};
    if (!data.redeemCodes)  data.redeemCodes  = {};
    return data;
  }
  catch { return { users: {}, pullCharges: {}, clans: {}, duos: {}, guilds: {}, redeemCodes: {} }; }
}

async function saveInventory(data) {
  await db.query(
    `INSERT INTO global_inventory (id, data) VALUES ('main', $1)
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
    [data]
  );
}

function ensureUser(inventory, userId) {
  if (!inventory.users[userId]) {
    inventory.users[userId] = {
      cards: [], characterShards: {}, platings: {}, team: [],
      yen: 0, stars: 0, candyTokens: 0,
      wish: null, levelCaps: {}, prestigePoints: {},
      privacy: false, clanId: null, duoId: null,
      totalPulls: 0, totalKills: 0, items: {},
    };
  }
  const u = inventory.users[userId];
  if (!u.characterShards)               u.characterShards = {};
  if (!u.platings)                      u.platings        = {};
  if (!u.team)                          u.team            = [];
  if (!u.items)                         u.items           = {};
  if (typeof u.yen          !== 'number') u.yen          = 0;
  if (typeof u.stars        !== 'number') u.stars        = 0;
  if (typeof u.candyTokens  !== 'number') u.candyTokens  = 0;
  if (typeof u.limitBreakers !== 'number') u.limitBreakers = 0;
  if (!u.wish)                          u.wish           = null;
  if (!u.levelCaps)                     u.levelCaps      = {};
  if (!u.prestigePoints)                u.prestigePoints = {};
  if (typeof u.privacy      !== 'boolean') u.privacy     = false;
  if (u.clanId === undefined)           u.clanId         = null;
  if (u.duoId === undefined)            u.duoId          = null;
  if (typeof u.totalPulls   !== 'number') u.totalPulls  = 0;
  if (typeof u.totalKills   !== 'number') u.totalKills  = 0;
  if (u.conquest === undefined)              u.conquest           = null;
  if (u.conquest2 === undefined)             u.conquest2          = null;
  if (typeof u.dailyStreak  !== 'number')    u.dailyStreak        = 0;
  if (u.lastDailyDate === undefined)         u.lastDailyDate      = null;
  if (!u.weapons)                            u.weapons            = {};
  if (typeof u.lockedCandyTokens !== 'number') u.lockedCandyTokens = 0;
  if ('shards' in u)                         delete u.shards;
  for (const card of u.cards) {
    if (typeof card.level !== 'number') card.level = 1;
  }
  return u;
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
  const cap  = getPersonalLevelCap(inventory, userId, cardId);
  const card = inventory.users[userId].cards.find(c => c.id === cardId);
  if (!card) return false;
  card.level = Math.max(1, Math.min(cap, level));
  return true;
}

// ── Personal Level Cap ────────────────────────────────────

function getPersonalLevelCap(inventory, userId, cardId) {
  ensureUser(inventory, userId);
  const extra = inventory.users[userId].levelCaps[cardId] ?? 0;
  return MAX_CARD_LEVEL + extra;
}

function increaseLevelCap(inventory, userId, cardId, amount) {
  ensureUser(inventory, userId);
  inventory.users[userId].levelCaps[cardId] = (inventory.users[userId].levelCaps[cardId] ?? 0) + amount;
}

// ── Prestige Points ───────────────────────────────────────

function getPrestigePoints(inventory, userId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].prestigePoints;
}

function addPrestigePoints(inventory, userId, cardId, amount) {
  ensureUser(inventory, userId);
  const pp = inventory.users[userId].prestigePoints;
  pp[cardId] = (pp[cardId] ?? 0) + amount;
}

function removePrestigePoints(inventory, userId, cardId, amount) {
  ensureUser(inventory, userId);
  const pp = inventory.users[userId].prestigePoints;
  const current = pp[cardId] ?? 0;
  if (current < amount) return false;
  pp[cardId] = current - amount;
  if (pp[cardId] === 0) delete pp[cardId];
  return true;
}

// ── Limit Breaker Operations ──────────────────────────────

function getLimitBreakers(inventory, userId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].limitBreakers;
}

function addLimitBreakers(inventory, userId, amount) {
  ensureUser(inventory, userId);
  inventory.users[userId].limitBreakers += amount;
}

function removeLimitBreaker(inventory, userId, amount = 1) {
  ensureUser(inventory, userId);
  if (inventory.users[userId].limitBreakers < amount) return false;
  inventory.users[userId].limitBreakers -= amount;
  return true;
}

// ── Conquest Operations ───────────────────────────────────

function getConquest(inventory, userId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].conquest;
}

function setConquest(inventory, userId, cardId) {
  ensureUser(inventory, userId);
  inventory.users[userId].conquest = { cardId, sentAt: Date.now() };
}

function clearConquest(inventory, userId) {
  ensureUser(inventory, userId);
  inventory.users[userId].conquest = null;
}

// ── Second Conquest Slot (Epic Support Card) ──────────────

function getConquest2(inventory, userId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].conquest2;
}

function setConquest2(inventory, userId, cardId) {
  ensureUser(inventory, userId);
  inventory.users[userId].conquest2 = { cardId, sentAt: Date.now() };
}

function clearConquest2(inventory, userId) {
  ensureUser(inventory, userId);
  inventory.users[userId].conquest2 = null;
}

// ── Weapon System ─────────────────────────────────────────

function getWeaponData(inventory, userId, weaponId) {
  ensureUser(inventory, userId);
  const u = inventory.users[userId];
  if (!u.weapons[weaponId]) {
    u.weapons[weaponId] = { prestige: 0, evolutionTier: 1 };
  }
  return u.weapons[weaponId];
}

function addWeaponPrestige(inventory, userId, weaponId, amount) {
  const data = getWeaponData(inventory, userId, weaponId);
  data.prestige = (data.prestige ?? 0) + amount;
}

function getWeaponPrestige(inventory, userId, weaponId) {
  return getWeaponData(inventory, userId, weaponId).prestige ?? 0;
}

function getWeaponEvolutionTier(inventory, userId, weaponId) {
  return getWeaponData(inventory, userId, weaponId).evolutionTier ?? 1;
}

/**
 * Evolve a weapon one tier. Returns { success, reason } or { success: true }.
 * Costs WEAPON_EVOLVE_SHARDS weapon shards + WEAPON_EVOLVE_PRESTIGE weapon prestige.
 * Config must be passed in since inventory.js doesn't require config.js.
 */
function evolveWeapon(inventory, userId, weaponId, config) {
  ensureUser(inventory, userId);
  const u      = inventory.users[userId];
  const data   = getWeaponData(inventory, userId, weaponId);
  const tier   = data.evolutionTier ?? 1;
  const maxTier = config.WEAPON_EVOLUTION_TIERS.length;

  if (tier >= maxTier) return { success: false, reason: `**${weaponId}** is already at max evolution tier (Tier ${maxTier}).` };

  const shards    = u.characterShards[weaponId] ?? 0;
  const prestige  = data.prestige ?? 0;

  if (shards < config.WEAPON_EVOLVE_SHARDS) {
    return { success: false, reason: `Not enough weapon shards. Need **${config.WEAPON_EVOLVE_SHARDS}**, have **${shards}**.` };
  }
  if (prestige < config.WEAPON_EVOLVE_PRESTIGE) {
    return { success: false, reason: `Not enough weapon prestige. Need **${config.WEAPON_EVOLVE_PRESTIGE}**, have **${prestige}**.` };
  }

  u.characterShards[weaponId] = shards - config.WEAPON_EVOLVE_SHARDS;
  data.prestige  = prestige - config.WEAPON_EVOLVE_PRESTIGE;
  data.evolutionTier = tier + 1;
  return { success: true, newTier: tier + 1 };
}

/**
 * Equip a weapon card to a card slot. Stores equippedWeapon on the invCard object.
 * Returns false if the card or weapon is not found in user's collection.
 * Returns 'already_in_use' if the weapon is already equipped to another card.
 */
function equipWeapon(inventory, userId, cardId, weaponId) {
  ensureUser(inventory, userId);
  const u = inventory.users[userId];
  const card   = u.cards.find(c => c.id === cardId);
  const weapon = u.cards.find(c => c.id === weaponId);
  if (!card || !weapon) return false;
  const alreadyOn = u.cards.find(c => c.id !== cardId && c.equippedWeapon === weaponId);
  if (alreadyOn) return 'already_in_use';
  card.equippedWeapon = weaponId;
  return true;
}

function unequipWeapon(inventory, userId, cardId) {
  ensureUser(inventory, userId);
  const u    = inventory.users[userId];
  const card = u.cards.find(c => c.id === cardId);
  if (!card) return false;
  card.equippedWeapon = null;
  return true;
}

function getEquippedWeapon(inventory, userId, cardId) {
  ensureUser(inventory, userId);
  const u    = inventory.users[userId];
  const card = u.cards.find(c => c.id === cardId);
  return card?.equippedWeapon ?? null;
}

// ── Daily Streak ──────────────────────────────────────────

const DAILY_SCROLL_CAP = 10;

function getDailyInfo(inventory, userId) {
  ensureUser(inventory, userId);
  const u = inventory.users[userId];
  return { streak: u.dailyStreak, lastDate: u.lastDailyDate };
}

/**
 * Attempt to claim the daily reward.
 * Returns { success: false, hoursLeft } if on cooldown,
 * or { success: true, streak, scrolls } with the rewards applied.
 */
function claimDaily(inventory, userId, giveScrolls = false) {
  ensureUser(inventory, userId);
  const u    = inventory.users[userId];
  const now  = Date.now();
  const MS24 = 24 * 60 * 60 * 1000;
  const MS48 = 48 * 60 * 60 * 1000;

  if (u.lastDailyDate) {
    const elapsed = now - u.lastDailyDate;
    if (elapsed < MS24) {
      return { success: false, hoursLeft: Math.ceil((MS24 - elapsed) / 3600000) };
    }
    if (elapsed >= MS48) {
      u.dailyStreak = 0;
    }
  }

  u.dailyStreak   = (u.dailyStreak ?? 0) + 1;
  u.lastDailyDate = now;

  const scrolls = Math.min(u.dailyStreak, DAILY_SCROLL_CAP);
  u.yen          = (u.yen         ?? 0) + 100000;
  u.stars        = (u.stars       ?? 0) + 1000;
  u.candyTokens  = (u.candyTokens ?? 0) + 5;

  if (giveScrolls && scrolls > 0) {
    u.items        = u.items ?? {};
    u.items['level_scroll'] = (u.items['level_scroll'] ?? 0) + scrolls;
  }

  return { success: true, streak: u.dailyStreak, scrolls: giveScrolls ? scrolls : 0 };
}

// ── Wish System ───────────────────────────────────────────

const WISH_THRESHOLD = 200;

function getWish(inventory, userId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].wish;
}

function setWish(inventory, userId, cardId) {
  ensureUser(inventory, userId);
  inventory.users[userId].wish = { cardId, pullCount: 0 };
}

function clearWish(inventory, userId) {
  ensureUser(inventory, userId);
  inventory.users[userId].wish = null;
}

/**
 * Increment the wish pull counter for a user.
 * Returns the new pull count, or null if no wish is set.
 */
function incrementWishPulls(inventory, userId) {
  ensureUser(inventory, userId);
  const wish = inventory.users[userId].wish;
  if (!wish) return null;
  wish.pullCount += 1;
  inventory.users[userId].totalPulls = (inventory.users[userId].totalPulls ?? 0) + 1;
  return wish.pullCount;
}

function getTotalPulls(inventory, userId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].totalPulls;
}

function incrementTotalPulls(inventory, userId, amount = 1) {
  ensureUser(inventory, userId);
  inventory.users[userId].totalPulls = (inventory.users[userId].totalPulls ?? 0) + amount;
}

// ── Kill Stats ────────────────────────────────────────────

function incrementTotalKills(inventory, userId, amount = 1) {
  ensureUser(inventory, userId);
  inventory.users[userId].totalKills = (inventory.users[userId].totalKills ?? 0) + amount;
}

// ── Privacy ───────────────────────────────────────────────

function getPrivacy(inventory, userId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].privacy === true;
}

function setPrivacy(inventory, userId, value) {
  ensureUser(inventory, userId);
  inventory.users[userId].privacy = !!value;
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
 * Swap two cards' positions in the team.
 * Returns true on success, false if either card is not on the team.
 */
function swapTeamPositions(inventory, userId, cardId1, cardId2) {
  ensureUser(inventory, userId);
  const team  = inventory.users[userId].team;
  const idx1  = team.findIndex(s => s.cardId === cardId1);
  const idx2  = team.findIndex(s => s.cardId === cardId2);
  if (idx1 === -1 || idx2 === -1) return false;
  [team[idx1], team[idx2]] = [team[idx2], team[idx1]];
  return true;
}

/**
 * Normalise a team slot's plating data into an array.
 * Handles both the old { plating: 'gold' } format and the new { platings: ['gold', 'diamond'] } format.
 */
function getSlotPlatings(slot) {
  if (Array.isArray(slot.platings)) return slot.platings;
  if (slot.plating) return [slot.plating];
  return [];
}

/**
 * Equip a plating to a card on the team.
 * Consumes the plating from inventory.
 * A card can have multiple platings but each tier can only be equipped once per card.
 * Returns 'equipped', 'not_on_team', 'no_plating', or 'already_equipped'.
 */
function equipPlatingToTeam(inventory, userId, cardId, platingTier) {
  ensureUser(inventory, userId);
  const team = inventory.users[userId].team;
  const slot = team.find(s => s.cardId === cardId);
  if (!slot) return 'not_on_team';
  const current = getSlotPlatings(slot);
  if (current.includes(platingTier)) return 'already_equipped';
  const p = inventory.users[userId].platings;
  if ((p[platingTier] ?? 0) < 1) return 'no_plating';
  p[platingTier]--;
  if (p[platingTier] === 0) delete p[platingTier];
  slot.platings = [...current, platingTier];
  delete slot.plating;
  return 'equipped';
}

/**
 * Unequip a specific plating tier from a team card and return it to inventory.
 * If platingTier is omitted, all platings are removed.
 * Returns an array of removed tiers (may be empty).
 */
function unequipPlatingFromTeam(inventory, userId, cardId, platingTier) {
  ensureUser(inventory, userId);
  const team = inventory.users[userId].team;
  const slot = team.find(s => s.cardId === cardId);
  if (!slot) return [];
  const current = getSlotPlatings(slot);
  if (current.length === 0) return [];
  const p = inventory.users[userId].platings;

  let removed;
  if (platingTier) {
    if (!current.includes(platingTier)) return [];
    removed = [platingTier];
    slot.platings = current.filter(t => t !== platingTier);
  } else {
    removed = [...current];
    slot.platings = [];
  }
  delete slot.plating;

  for (const tier of removed) {
    p[tier] = (p[tier] ?? 0) + 1;
  }
  return removed;
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
  const u = inventory.users[userId];
  return (u.candyTokens ?? 0) + (u.lockedCandyTokens ?? 0);
}

function addCandyTokens(inventory, userId, amount) {
  ensureUser(inventory, userId);
  inventory.users[userId].candyTokens += amount;
}

function removeCandyTokens(inventory, userId, amount) {
  ensureUser(inventory, userId);
  const u = inventory.users[userId];
  const total = (u.candyTokens ?? 0) + (u.lockedCandyTokens ?? 0);
  if (total < amount) return false;
  let remaining = amount;
  const fromTradeable = Math.min(u.candyTokens ?? 0, remaining);
  u.candyTokens = (u.candyTokens ?? 0) - fromTradeable;
  remaining -= fromTradeable;
  if (remaining > 0) {
    u.lockedCandyTokens = (u.lockedCandyTokens ?? 0) - remaining;
  }
  return true;
}

function getLockedCandyTokens(inventory, userId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].lockedCandyTokens ?? 0;
}

function addLockedCandyTokens(inventory, userId, amount) {
  ensureUser(inventory, userId);
  inventory.users[userId].lockedCandyTokens = (inventory.users[userId].lockedCandyTokens ?? 0) + amount;
}

function getTradableCandyTokens(inventory, userId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].candyTokens ?? 0;
}

function removeTradableCandyTokens(inventory, userId, amount) {
  ensureUser(inventory, userId);
  if ((inventory.users[userId].candyTokens ?? 0) < amount) return false;
  inventory.users[userId].candyTokens -= amount;
  return true;
}

// ── Item Operations ───────────────────────────────────────

function getItems(inventory, userId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].items;
}

function addItem(inventory, userId, itemId) {
  ensureUser(inventory, userId);
  const items = inventory.users[userId].items;
  items[itemId] = (items[itemId] || 0) + 1;
}

function addItemAmount(inventory, userId, itemId, amount) {
  ensureUser(inventory, userId);
  const items = inventory.users[userId].items;
  items[itemId] = (items[itemId] || 0) + amount;
}

function removeItem(inventory, userId, itemId) {
  ensureUser(inventory, userId);
  const items = inventory.users[userId].items;
  if (!items[itemId] || items[itemId] <= 0) return false;
  items[itemId] -= 1;
  if (items[itemId] === 0) delete items[itemId];
  return true;
}

function removeItemAmount(inventory, userId, itemId, amount) {
  ensureUser(inventory, userId);
  const items = inventory.users[userId].items;
  if (!items[itemId] || items[itemId] < amount) return false;
  items[itemId] -= amount;
  if (items[itemId] === 0) delete items[itemId];
  return true;
}

function getItemCount(inventory, userId, itemId) {
  ensureUser(inventory, userId);
  return inventory.users[userId].items[itemId] ?? 0;
}

// ── Pull Charge Helpers ───────────────────────────────────

function loadPullCharges(inventory, userId) {
  return inventory.pullCharges[userId] ?? null;
}

async function savePullCharges(inventory, userId, charges, lastRefill) {
  inventory.pullCharges[userId] = { charges, lastRefill };
  await saveInventory(inventory);
}

// ── Clan Operations ───────────────────────────────────────

function getClan(inventory, clanId) {
  return inventory.clans[clanId] ?? null;
}

function getUserClan(inventory, userId) {
  ensureUser(inventory, userId);
  const clanId = inventory.users[userId].clanId;
  if (!clanId) return null;
  return inventory.clans[clanId] ?? null;
}

function createClan(inventory, userId, name) {
  ensureUser(inventory, userId);
  if (inventory.users[userId].clanId) return null;
  const clanId = `clan_${userId}_${Date.now()}`;
  inventory.clans[clanId] = { id: clanId, name, ownerId: userId, members: [userId], fund: 0 };
  inventory.users[userId].clanId = clanId;
  return clanId;
}

function addToClan(inventory, clanId, userId) {
  ensureUser(inventory, userId);
  const clan = inventory.clans[clanId];
  if (!clan) return false;
  if (clan.members.includes(userId)) return false;
  if (inventory.users[userId].clanId) return false;
  clan.members.push(userId);
  inventory.users[userId].clanId = clanId;
  return true;
}

function removeFromClan(inventory, clanId, userId) {
  const clan = inventory.clans[clanId];
  if (!clan) return false;
  const idx = clan.members.indexOf(userId);
  if (idx === -1) return false;
  clan.members.splice(idx, 1);
  if (inventory.users[userId]) {
    inventory.users[userId].clanId = null;
  }
  return true;
}

function deleteClan(inventory, clanId) {
  const clan = inventory.clans[clanId];
  if (!clan) return false;
  for (const memberId of clan.members) {
    if (inventory.users[memberId]) {
      inventory.users[memberId].clanId = null;
    }
  }
  delete inventory.clans[clanId];
  return true;
}

// ── Duo Operations ────────────────────────────────────────

function getDuo(inventory, duoId) {
  return inventory.duos[duoId] ?? null;
}

function getUserDuo(inventory, userId) {
  ensureUser(inventory, userId);
  const duoId = inventory.users[userId].duoId;
  if (!duoId) return null;
  return inventory.duos[duoId] ?? null;
}

function createDuo(inventory, userId, partnerId) {
  ensureUser(inventory, userId);
  ensureUser(inventory, partnerId);
  if (inventory.users[userId].duoId || inventory.users[partnerId].duoId) return null;
  const duoId = `duo_${Date.now()}`;
  inventory.duos[duoId] = { id: duoId, members: [userId, partnerId] };
  inventory.users[userId].duoId   = duoId;
  inventory.users[partnerId].duoId = duoId;
  return duoId;
}

function disbandDuo(inventory, duoId) {
  const duo = inventory.duos[duoId];
  if (!duo) return false;
  for (const memberId of duo.members) {
    if (inventory.users[memberId]) {
      inventory.users[memberId].duoId = null;
    }
  }
  delete inventory.duos[duoId];
  return true;
}

// ── Redeem Code Operations ────────────────────────────────

function createRedeemCode(inventory, name, code, rewards) {
  const key = name.toLowerCase();
  if (inventory.redeemCodes[key]) return false;
  inventory.redeemCodes[key] = {
    name: name,
    code: code.toUpperCase(),
    rewards: rewards || {},
    redeemedBy: [],
  };
  return true;
}

function updateRedeemCode(inventory, name, rewards) {
  const key = name.toLowerCase();
  if (!inventory.redeemCodes[key]) return false;
  inventory.redeemCodes[key].rewards = rewards;
  return true;
}

function deleteRedeemCode(inventory, name) {
  const key = name.toLowerCase();
  if (!inventory.redeemCodes[key]) return false;
  delete inventory.redeemCodes[key];
  return true;
}

function getRedeemCodes(inventory) {
  return inventory.redeemCodes;
}

function findRedeemCodeByCode(inventory, code) {
  const upper = code.toUpperCase();
  return Object.values(inventory.redeemCodes).find(c => c.code === upper) ?? null;
}

function hasRedeemedCode(inventory, userId, codeName) {
  const key = codeName.toLowerCase();
  return inventory.redeemCodes[key]?.redeemedBy.includes(userId) ?? false;
}

function markCodeRedeemed(inventory, userId, codeName) {
  const key = codeName.toLowerCase();
  if (!inventory.redeemCodes[key]) return false;
  if (inventory.redeemCodes[key].redeemedBy.includes(userId)) return false;
  inventory.redeemCodes[key].redeemedBy.push(userId);
  return true;
}

// ── Guild Settings ────────────────────────────────────────

function ensureGuild(inventory, guildId) {
  if (!inventory.guilds[guildId]) {
    inventory.guilds[guildId] = { allowedChannels: [], disallowedCommands: [] };
  }
  const g = inventory.guilds[guildId];
  if (!g.allowedChannels)      g.allowedChannels      = [];
  if (!g.disallowedCommands)   g.disallowedCommands   = [];
  return g;
}

function getGuildSettings(inventory, guildId) {
  return ensureGuild(inventory, guildId);
}

function addAllowedChannel(inventory, guildId, channelId) {
  const g = ensureGuild(inventory, guildId);
  if (!g.allowedChannels.includes(channelId)) g.allowedChannels.push(channelId);
}

function removeAllowedChannel(inventory, guildId, channelId) {
  const g   = ensureGuild(inventory, guildId);
  g.allowedChannels = g.allowedChannels.filter(id => id !== channelId);
}

function clearAllowedChannels(inventory, guildId) {
  const g = ensureGuild(inventory, guildId);
  g.allowedChannels = [];
}

function disallowCommand(inventory, guildId, cmd) {
  const g = ensureGuild(inventory, guildId);
  if (!g.disallowedCommands.includes(cmd)) g.disallowedCommands.push(cmd);
}

function allowCommand(inventory, guildId, cmd) {
  const g = ensureGuild(inventory, guildId);
  g.disallowedCommands = g.disallowedCommands.filter(c => c !== cmd);
}

module.exports = {
  loadInventory, saveInventory,
  loadPullCharges, savePullCharges,
  addCardToInventory, removeCardFromInventory, hasCard, getCards,
  MAX_CARD_LEVEL,
  getCardLevel, setCardLevel,
  getPersonalLevelCap, increaseLevelCap,
  getPrestigePoints, addPrestigePoints, removePrestigePoints,
  getLimitBreakers, addLimitBreakers, removeLimitBreaker,
  getConquest, setConquest, clearConquest,
  getConquest2, setConquest2, clearConquest2,
  getWeaponData, addWeaponPrestige, getWeaponPrestige, getWeaponEvolutionTier,
  evolveWeapon, equipWeapon, unequipWeapon, getEquippedWeapon,
  getDailyInfo, claimDaily, DAILY_SCROLL_CAP,
  getWish, setWish, clearWish, incrementWishPulls, WISH_THRESHOLD,
  getTotalPulls, incrementTotalPulls, incrementTotalKills,
  getPrivacy, setPrivacy,
  TEAM_SIZE, getTeam, addToTeam, removeFromTeam, swapTeamPositions,
  getSlotPlatings, equipPlatingToTeam, unequipPlatingFromTeam,
  getCharacterShards, addCharacterShards, removeCharacterShards,
  getPlatings, addPlating, addPlatings, removePlating,
  getYen, addYen, removeYen,
  getStars, addStars, removeStars,
  getCandyTokens, addCandyTokens, removeCandyTokens,
  getLockedCandyTokens, addLockedCandyTokens, getTradableCandyTokens, removeTradableCandyTokens,
  getItems, addItem, addItemAmount, removeItem, removeItemAmount, getItemCount,
  getClan, getUserClan, createClan, addToClan, removeFromClan, deleteClan,
  getDuo, getUserDuo, createDuo, disbandDuo,
  getGuildSettings, addAllowedChannel, removeAllowedChannel, clearAllowedChannels,
  disallowCommand, allowCommand,
  createRedeemCode, updateRedeemCode, deleteRedeemCode, getRedeemCodes,
  findRedeemCodeByCode, hasRedeemedCode, markCodeRedeemed,
};
