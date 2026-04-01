// ============================================================
//  test BOT — MAIN
//  Commands:
//    ZP pull  (p)                           – pull a random card
//    ZP allpull  (ap)                       – pull all charges at once
//    ZP collection  (col)                   – browse your card collection
//    ZP collection [filter]                 – filter by rarity or name
//    ZP collection @user [filter]           – view someone else's cards
//    ZP all                                 – browse every card in the game
//    ZP all [filter]                        – filter all cards by rarity or name
//    ZP inventory  (inv)                    – view platings
//    ZP shards [filter]                     – view character shards (filter by rarity or name)
//    ZP card <id>  (c <id>)                 – inspect a card
//    ZP absorb shard:<id>:<count>           – level up a card using its shards
//    ZP team                                – view your battle team
//    ZP team add/remove <id>               – manage team cards
//    ZP team equip/unequip <id> <plating>  – equip platings to team cards
//    ZP fight @user                         – challenge a player to a team battle
//    ZP trade @user <offer> for <ask>       – offer a trade
//    ZP accept <tradeId>  (a)               – accept a trade offer
//    ZP decline <tradeId>  (dec)            – decline / cancel a trade
//    ZP trades                              – view trade offers sent to you
//    ZP help  (h)                           – show all commands
//  Admin-only (user 833025999897755689):
//    ZP setrarity <rarity|reset>
//    ZP setplating <tier|reset>
//    ZP resetcooldown
// ============================================================
//
//  TRADE ITEM FORMAT
//    shard:<cardId>:<amount>      e.g.  shard:naruto_r:3
//    plating:<tierId>:<amount>    e.g.  plating:gold:1
//  FULL EXAMPLE
//    ZP trade @Alice shard:naruto_r:3 for plating:gold:1
// ============================================================

require('dotenv').config();
const {
  Client, GatewayIntentBits, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');

const config      = require('./config');
const { CARDS, pullCard } = require('./cards');
const inv         = require('./inventory');
const trades      = require('./trades');
const imgCache    = require('./imageCache');
const emojiCache  = require('./emojiCache');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ── Admin ─────────────────────────────────────────────────
const ADMIN_ID = '833025999897755689';
let adminRarityOverride  = null;   // forced rarity key e.g. 'LT'
let adminPlatingOverride = null;   // forced plating tier object or null

function isAdmin(userId) { return userId === ADMIN_ID; }

function pullCardForced(rarity) {
  const pool = CARDS.filter(c => c.rarity === rarity);
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : CARDS[0];
}

// ── Pull charges (in-memory, persisted on change) ─────────
const pullCharges = new Map();

function initPullCharges() {
  const data = inv.loadInventory();
  for (const [userId, bucket] of Object.entries(data.pullCharges || {})) {
    pullCharges.set(userId, bucket);
  }
}

let persistTimer = null;
function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const data = inv.loadInventory();
    data.pullCharges = Object.fromEntries(pullCharges);
    inv.saveInventory(data);
    persistTimer = null;
  }, 500);
}

function getCharges(userId) {
  const now      = Date.now();
  const regenMs  = config.PULL_COOLDOWN_SECONDS * 1000;
  const max      = config.MAX_PULL_CHARGES;
  const bucket   = pullCharges.get(userId) ?? { charges: max, lastRefill: now };
  const elapsed  = now - bucket.lastRefill;
  const gained   = Math.floor(elapsed / regenMs);
  const charges  = Math.min(max, bucket.charges + gained);
  const lastRefill = bucket.lastRefill + gained * regenMs;
  return { charges, lastRefill };
}

function setCharges(userId, charges, lastRefill) {
  pullCharges.set(userId, { charges, lastRefill });
  schedulePersist();
}

// ── Plating ───────────────────────────────────────────────

function rollPlating() {
  if (Math.random() >= config.PLATING_CHANCE) return null;
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const tier of config.PLATING_TIERS) {
    cumulative += tier.weight;
    if (roll < cumulative) return tier;
  }
  return config.PLATING_TIERS[0];
}

function platingById(id) {
  return config.PLATING_TIERS.find(t => t.id === id) ?? null;
}

// ── Card stats ────────────────────────────────────────────

/**
 * Returns deterministic { hp, dmg } for a card based on its ID and level.
 * Base stats are fixed by the card ID; each level above 1 adds 2%.
 */
function getCardStats(card, level = 1) {
  // Simple deterministic hash of the card ID
  let hash = 0;
  for (const ch of card.id) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  const t = (hash >>> 0) % 1000 / 1000; // 0.000 – 0.999
  const range = config.STAT_RANGES[card.rarity] ?? config.STAT_RANGES['R'];
  const baseHp  = Math.round(range.hpMin  + t * (range.hpMax  - range.hpMin));
  const baseDmg = Math.round(range.dmgMin + t * (range.dmgMax - range.dmgMin));
  const lvl = Math.max(1, Math.min(inv.MAX_CARD_LEVEL, level ?? 1));
  const mult = 1 + 0.02 * (lvl - 1);
  return {
    hp:  Math.round(baseHp  * mult),
    dmg: Math.round(baseDmg * mult),
  };
}

// ── Trade item helpers ────────────────────────────────────

/**
 * Parse a single trade item token. Supported formats:
 *   shard:<cardId>:<amount>      e.g. shard:naruto_r:3
 *   plating:<tierId>:<amount>    e.g. plating:gold:1
 *   yen:<amount>                 e.g. yen:500
 *   stars:<amount>               e.g. stars:100
 * Returns { type, id?, amount } or null on bad input.
 */
function parseTradeItem(str) {
  const parts  = str.trim().split(':');
  const type   = parts[0]?.toLowerCase();
  const CURRENCY_TYPES = ['yen', 'stars'];
  const ID_TYPES       = ['shard', 'plating'];

  if (CURRENCY_TYPES.includes(type)) {
    if (parts.length !== 2) return null;
    const amount = parseInt(parts[1], 10);
    if (isNaN(amount) || amount <= 0) return null;
    return { type, amount };
  }

  if (ID_TYPES.includes(type)) {
    if (parts.length !== 3) return null;
    const amount = parseInt(parts[2], 10);
    if (isNaN(amount) || amount <= 0) return null;
    return { type, id: parts[1].toLowerCase(), amount };
  }

  return null;
}

/**
 * Parse a comma-separated list of trade item tokens.
 * Returns an array of items, or null if any token is invalid.
 */
function parseTradeItems(str) {
  const tokens = str.split(',').map(s => s.trim()).filter(Boolean);
  if (tokens.length === 0) return null;
  const items = tokens.map(parseTradeItem);
  if (items.some(i => i === null)) return null;
  return items;
}

/**
 * Validate that type + id refer to something real.
 */
function validateTradeItem(item) {
  if (item.type === 'shard')   return !!lookupCard(item.id);
  if (item.type === 'plating') return !!platingById(item.id);
  if (item.type === 'yen')     return true;
  if (item.type === 'stars')   return true;
  return false;
}

/**
 * Human-readable label for a single trade item.
 */
function describeItem(item) {
  if (item.type === 'shard') {
    const card      = lookupCard(item.id);
    const cardEmoji = emojiCache.getEmoji(item.id) ?? '';
    return `${cardEmoji ? cardEmoji + ' ' : ''}**×${item.amount}** ${card?.name ?? item.id} shard${item.amount === 1 ? '' : 's'}`;
  }
  if (item.type === 'plating') {
    const tier = platingById(item.id);
    return `**×${item.amount}** ${tier?.label ?? item.id} plating${item.amount === 1 ? '' : 's'}`;
  }
  if (item.type === 'yen')   return `**¥${item.amount.toLocaleString()}** Yen`;
  if (item.type === 'stars') return `**${item.amount.toLocaleString()}** Star${item.amount === 1 ? '' : 's'}`;
  return '?';
}

/**
 * Human-readable label for an array of trade items.
 */
function describeItems(items) {
  return items.map(describeItem).join('\n');
}

/**
 * Check whether a user currently holds enough of a trade item.
 */
function userHasItem(inventory, userId, item) {
  if (item.type === 'shard')   return (inv.getCharacterShards(inventory, userId)[item.id] ?? 0) >= item.amount;
  if (item.type === 'plating') return (inv.getPlatings(inventory, userId)[item.id] ?? 0) >= item.amount;
  if (item.type === 'yen')     return inv.getYen(inventory, userId) >= item.amount;
  if (item.type === 'stars')   return inv.getStars(inventory, userId) >= item.amount;
  return false;
}

/**
 * Check whether a user holds enough for every item in an array.
 * Returns the first missing item, or null if all are present.
 */
function findMissingItem(inventory, userId, items) {
  return items.find(item => !userHasItem(inventory, userId, item)) ?? null;
}

/**
 * Remove a single item from a user (returns false if insufficient).
 */
function removeItems(inventory, userId, item) {
  if (item.type === 'shard')   return inv.removeCharacterShards(inventory, userId, item.id, item.amount);
  if (item.type === 'plating') return inv.removePlating(inventory, userId, item.id, item.amount);
  if (item.type === 'yen')     return inv.removeYen(inventory, userId, item.amount);
  if (item.type === 'stars')   return inv.removeStars(inventory, userId, item.amount);
  return false;
}

/**
 * Remove every item in an array from a user.
 */
function removeAllItems(inventory, userId, items) {
  for (const item of items) removeItems(inventory, userId, item);
}

/**
 * Add a single item to a user.
 */
function addItems(inventory, userId, item) {
  if (item.type === 'shard')   inv.addCharacterShards(inventory, userId, item.id, item.amount);
  if (item.type === 'plating') inv.addPlatings(inventory, userId, item.id, item.amount);
  if (item.type === 'yen')     inv.addYen(inventory, userId, item.amount);
  if (item.type === 'stars')   inv.addStars(inventory, userId, item.amount);
}

/**
 * Add every item in an array to a user.
 */
function addAllItems(inventory, userId, items) {
  for (const item of items) addItems(inventory, userId, item);
}

// ── Fight cooldown ────────────────────────────────────────

const fightCooldowns = new Map(); // userId -> timestamp
const activeBattles  = new Map(); // battleId -> battleState

function getFightCooldownSecs(userId) {
  const last      = fightCooldowns.get(userId) ?? 0;
  const elapsed   = (Date.now() - last) / 1000;
  const remaining = config.FIGHT_COOLDOWN_SECONDS - elapsed;
  return remaining > 0 ? Math.ceil(remaining) : 0;
}

function setFightCooldown(userId) {
  fightCooldowns.set(userId, Date.now());
}

// ── Battle helpers ─────────────────────────────────────────

/** Convert a resolved team slot into a live battle card with HP & DMG. */
function buildBattleCard(slot) {
  const card    = slot.card ?? lookupCard(slot.cardId);
  if (!card) return null;
  const level   = slot.level ?? 1;
  const stats   = getCardStats(card, level);
  const plating = slot.plating ? config.PLATING_TIERS.find(t => t.id === slot.plating) : null;
  const mult    = plating ? plating.statMult : 1;
  const hp      = Math.round(stats.hp  * mult);
  const dmg     = Math.round(stats.dmg * mult);
  const meta    = rarityMeta(card.rarity);
  return {
    cardId:   card.id,
    name:     card.name,
    level,
    plating:  slot.plating ?? null,
    platEmoji: plating?.emoji ?? '',
    rarEmoji: meta.emoji,
    hp,
    maxHp:    hp,
    dmgMin:   Math.round(dmg * 0.8),
    dmgMax:   Math.round(dmg * 1.2),
    dmg,
    alive:    true,
  };
}

/** Render a 10-block HP bar. */
function hpBar(current, max) {
  const pct    = max <= 0 ? 0 : Math.max(0, Math.min(1, current / max));
  const filled = Math.round(pct * 10);
  return '[' + '#'.repeat(filled) + '-'.repeat(10 - filled) + ']';
}

/** Render a single card's battle display lines. */
function cardBattleLine(bc) {
  if (!bc.alive) {
    return `~~=> **${bc.name}** | Lv. ${bc.level}~~\nDefeated`;
  }
  return [
    hpBar(bc.hp, bc.maxHp),
    `=> **${bc.name}** | Lv. ${bc.level}`,
    `HP ${bc.hp.toLocaleString()}/${bc.maxHp.toLocaleString()} | DMG ${bc.dmgMin}–${bc.dmgMax}`,
  ].join('\n');
}

/** Build the battle embed showing both teams' current state. */
function buildBattleEmbed(state, log = null) {
  const oppLines = state.defenderCards.map(cardBattleLine).join('\n\n');
  const atkLines = state.attackerCards.map(cardBattleLine).join('\n\n');
  const allAtkDead = state.attackerCards.every(b => !b.alive);
  const allDefDead = state.defenderCards.every(b => !b.alive);

  const parts = [
    `**═════ ${state.defenderName}'s Team ═════**`,
    oppLines,
    '',
    `**═════ ${state.attackerName}'s Team ═════**`,
    atkLines,
  ];
  if (log) parts.push('', log);
  if (!allAtkDead && !allDefDead) {
    parts.push('', '*Use the buttons to fight!*');
  }

  return new EmbedBuilder()
    .setColor(0xFF4757)
    .setTitle('⚔️ Team Battle')
    .setDescription(parts.join('\n'));
}

/** Build button rows for the attacker's alive cards + Run Away. */
function buildBattleComponents(state) {
  const rows = [];
  const alive = state.attackerCards
    .map((bc, i) => ({ bc, i }))
    .filter(({ bc }) => bc.alive);

  // Up to 4 card buttons per row
  for (let r = 0; r < alive.length; r += 4) {
    const row = new ActionRowBuilder().addComponents(
      alive.slice(r, r + 4).map(({ bc, i }) =>
        new ButtonBuilder()
          .setCustomId(`battle|${state.battleId}|${i}`)
          .setLabel(bc.name.length > 20 ? bc.name.slice(0, 18) + '…' : bc.name)
          .setStyle(ButtonStyle.Success)
      )
    );
    rows.push(row);
  }

  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`battle|${state.battleId}|run`)
        .setLabel('Run Away')
        .setStyle(ButtonStyle.Danger)
    )
  );
  return rows;
}

// ── Team / Fight helpers ──────────────────────────────────

/**
 * Calculate the combat power of a single team slot.
 * power = (hp + dmg) * levelMult * platingMult
 */
function slotPower(slot) {
  const card = lookupCard(slot.cardId);
  if (!card) return 0;
  const level     = slot.level ?? 1;
  const stats     = getCardStats(card, level);
  const plating   = slot.plating ? config.PLATING_TIERS.find(t => t.id === slot.plating) : null;
  const platMult  = plating ? plating.statMult : 1;
  return (stats.hp + stats.dmg) * platMult;
}

/**
 * Build a rich team snapshot for display / battle, merging team slots
 * with live inventory card data (level, etc.).
 */
function resolveTeamSlots(team, inventory, userId) {
  return team.map(slot => {
    const card     = lookupCard(slot.cardId);
    const invCard  = inv.getCards(inventory, userId).find(c => c.id === slot.cardId);
    const level    = invCard?.level ?? 1;
    return { ...slot, card, level };
  });
}

// ── Misc helpers ──────────────────────────────────────────

function rarityMeta(rarity) {
  return config.RARITY_META[rarity] ?? { label: rarity, emoji: '❔', color: 0xffffff, stars: '' };
}

function cardEmbed(card, title, footer, level = 1) {
  const meta  = rarityMeta(card.rarity);
  const lvl   = Math.max(1, Math.min(inv.MAX_CARD_LEVEL, level ?? 1));
  const stats = getCardStats(card, lvl);
  const levelLabel = lvl >= inv.MAX_CARD_LEVEL ? `✨ **MAX** (${lvl})` : `Lv. ${lvl}`;
  const embed = new EmbedBuilder()
    .setColor(meta.color)
    .setTitle(title ?? `${meta.emoji} ${card.name}`)
    .addFields(
      { name: 'Series',      value: card.series,                    inline: true },
      { name: 'Rarity',      value: `${meta.emoji} ${meta.label}`, inline: true },
      { name: 'Stars',       value: meta.stars || '—',              inline: true },
      { name: '📊 Level',    value: levelLabel,                     inline: true },
      { name: '❤️ Health',   value: `${stats.hp}`,                 inline: true },
      { name: '⚔️ Damage',   value: `${stats.dmg}`,                inline: true },
    );
  const img = imgCache.getImage(card.id) ?? card.image ?? null;
  if (img)    embed.setThumbnail(img);
  if (footer) embed.setFooter({ text: footer });
  return embed;
}

/**
 * Big-art pull embed for a single pull.
 * Uses setImage (full-width) so the card artwork dominates the embed.
 */
function singlePullEmbed(card, isDupe, plating, chargeInfo, authorUsername) {
  const meta  = rarityMeta(card.rarity);
  const stats = getCardStats(card, 1);
  const img   = imgCache.getImage(card.id) ?? card.image ?? null;

  const titlePrefix = isDupe ? '♻️' : meta.emoji;
  const titleSuffix = isDupe ? ` (Duplicate)` : '!';

  const descLines = [
    `${meta.emoji} **${meta.label}**  •  ${card.series}`,
  ];
  if (isDupe) {
    const cardEmoji = emojiCache.getEmoji(card.id) ?? '';
    descLines.push(`Already owned — **+1 ${cardEmoji ? cardEmoji + ' ' : ''}${card.name} Shard** obtained`);
  }
  if (plating) descLines.push(`${plating.emoji} **${plating.label} Plating** dropped!`);

  const embed = new EmbedBuilder()
    .setColor(plating?.color ?? (isDupe ? 0x888888 : meta.color))
    .setTitle(`${titlePrefix} ${card.name}${titleSuffix}`)
    .setDescription(descLines.join('\n'))
    .addFields(
      { name: '❤️ Health', value: `${stats.hp}`,  inline: true },
      { name: '⚔️ Damage', value: `${stats.dmg}`, inline: true },
    )
    .setFooter({ text: `Pulled by ${authorUsername} • ${chargeInfo}` });

  if (img) embed.setImage(img);
  return embed;
}

/**
 * Summary embed for allpull — numbered list in pull order.
 */
function allPullEmbed(results, charges, withReset, authorUsername, overrideNote) {
  // Numbered list lines
  // Group results by card so duplicates are shown as "x3 CardName"
  const grouped = new Map();
  for (const r of results) {
    if (!grouped.has(r.card.id)) {
      grouped.set(r.card.id, { card: r.card, newCount: 0, dupeCount: 0, platings: [] });
    }
    const g = grouped.get(r.card.id);
    if (r.isDupe) g.dupeCount++; else g.newCount++;
    if (r.plating) g.platings.push(r.plating);
  }

  const lines = [];
  let lineNum = 1;
  for (const [, g] of grouped) {
    const m         = rarityMeta(g.card.rarity);
    const cardEmoji = emojiCache.getEmoji(g.card.id) ?? '';
    const total     = g.newCount + g.dupeCount;
    const emojiSuffix = cardEmoji ? ` ${cardEmoji}` : '';

    const outcomeParts = [];
    if (g.newCount > 0)   outcomeParts.push('✨ New!');
    if (g.dupeCount > 0)  outcomeParts.push(`${cardEmoji ? cardEmoji + ' ' : ''}${g.dupeCount} Shard${g.dupeCount === 1 ? '' : 's'}`);
    const outcomeLine = outcomeParts.join(' • ');

    const platingStr = g.platings.map(p => `${p.emoji} ${p.label} Plating!`).join('  ');
    const platingPart = platingStr ? `  ${platingStr}` : '';

    lines.push(`**${lineNum}** ${m.emoji} x${total} **${g.card.name}**${emojiSuffix}\n${outcomeLine}${platingPart}`);
    lineNum++;
  }

  // Color: highest plating dropped, or teal
  const platings = results.map(r => r.plating).filter(Boolean);
  const rarityOrder = ['diamond', 'gold', 'silver', 'bronze'];
  const topPlating  = rarityOrder.map(id => platings.find(p => p.id === id)).find(Boolean);
  const color       = topPlating?.color ?? 0x00FFD1;

  const newCount  = results.filter(r => !r.isDupe).length;
  const dupeCount = results.filter(r =>  r.isDupe).length;
  const footerParts = [
    `Total Pulls: ${charges}/${charges}`,
    newCount  ? `✨ ${newCount} new` : null,
    dupeCount ? `${dupeCount} shard${dupeCount === 1 ? '' : 's'}` : null,
    platings.length ? `🪙 ${platings.length} plating${platings.length === 1 ? '' : 's'}` : null,
    withReset ? `🍬 Pulls reset to ${charges}` : null,
    overrideNote || null,
  ].filter(Boolean).join('  •  ');

  // Split description into chunks if needed (4096 char limit)
  const fullDesc = lines.join('\n\n');

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`🎴 ${authorUsername} Has Pulled ${charges} Card${charges === 1 ? '' : 's'}!`)
    .setDescription(fullDesc.length <= 4000 ? fullDesc : fullDesc.slice(0, 3990) + '\n…')
    .setFooter({ text: footerParts });

  return embed;
}

function lookupCard(cardId) {
  return CARDS.find(c => c.id.toLowerCase() === cardId.toLowerCase()) ?? null;
}

function applyFilter(cards, filter) {
  if (!filter) return cards;
  const upper = filter.toUpperCase();
  if (config.RARITY_META[upper]) return cards.filter(c => c.rarity === upper);
  const lower = filter.toLowerCase();
  return cards.filter(c =>
    c.name.toLowerCase().includes(lower) ||
    c.series.toLowerCase().includes(lower)
  );
}

// ── Collection page builder ───────────────────────────────

// customId format: col|authorId|targetId|expiry|page|filter
// Expiry is a ms Unix timestamp; filter may contain | so it is always last.
const COLLECTION_TIMEOUT_MS = 60_000;

// ── All Cards page builder ────────────────────────────────

// Rarity display order for ZP all
const RARITY_ORDER = ['R', 'E', 'L', 'MY', 'UR', 'LT'];

function getSortedAllCards() {
  return [...CARDS].sort((a, b) => {
    const ra = RARITY_ORDER.indexOf(a.rarity);
    const rb = RARITY_ORDER.indexOf(b.rarity);
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });
}

// customId format: zpa|authorId|expiry|page|filter
function buildAllCardsPage(authorId, allCards, page, filter, expiry) {
  const filtered = applyFilter(allCards, filter);

  if (filtered.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(0x888888)
      .setTitle('📋 All Cards')
      .setDescription(filter
        ? `No cards matching **"${filter}"**.`
        : 'No cards found.');
    return { embed, components: [] };
  }

  page = Math.max(0, Math.min(page, filtered.length - 1));
  const card      = filtered[page];
  const meta      = rarityMeta(card.rarity);
  const stats     = getCardStats(card);
  const filterTag = filter ? ` • Filter: "${filter}"` : '';

  const embed = new EmbedBuilder()
    .setColor(meta.color)
    .setTitle(`${meta.emoji} ${card.name}`)
    .setDescription('📋 **All Cards**')
    .addFields(
      { name: 'Series',      value: card.series,                    inline: true },
      { name: 'Rarity',      value: `${meta.emoji} ${meta.label}`, inline: true },
      { name: 'Stars',       value: meta.stars || '—',              inline: true },
      { name: '❤️ Health',   value: `${stats.hp}`,                 inline: true },
      { name: '⚔️ Damage',   value: `${stats.dmg}`,                inline: true },
      { name: '🪪 Card ID',  value: `\`${card.id}\``,              inline: true },
    )
    .setFooter({ text: `Card ${page + 1} of ${filtered.length}${filterTag}` });

  const allImg = imgCache.getImage(card.id) ?? card.image ?? null;
  if (allImg) embed.setThumbnail(allImg);

  const base = `zpa|${authorId}|${expiry}|%page%|${filter}`;
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(base.replace('%page%', page - 1))
      .setLabel('◀ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`zpa|${authorId}|${expiry}|close|${filter}`)
      .setLabel('✕ Close')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(base.replace('%page%', page + 1))
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === filtered.length - 1),
  );

  return { embed, components: [row] };
}

function buildCollectionPage(authorId, targetUser, cards, page, filter, inventory, expiry) {
  const filtered = applyFilter(cards, filter);

  if (filtered.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(0x888888)
      .setTitle(`🗂️ ${targetUser.username}'s Collection`)
      .setDescription(filter
        ? `No cards matching **"${filter}"**.`
        : 'No cards in this collection yet.');
    return { embed, components: [] };
  }

  page = Math.max(0, Math.min(page, filtered.length - 1));
  const card      = filtered[page];
  const meta      = rarityMeta(card.rarity);
  const cardLevel = card.level ?? 1;
  const stats     = getCardStats(card, cardLevel);
  const shards    = inv.getCharacterShards(inventory, targetUser.id)[card.id] ?? 0;
  const filterTag = filter ? ` • Filter: "${filter}"` : '';
  const cardEmojiTag = emojiCache.getEmoji(card.id) ?? '';
  const shardTag  = shards > 0 ? ` • ${cardEmojiTag ? cardEmojiTag + ' ' : ''}×${shards} shard${shards === 1 ? '' : 's'}` : '';
  const levelLabel = cardLevel >= inv.MAX_CARD_LEVEL ? `✨ MAX (${cardLevel})` : `Lv. ${cardLevel}`;

  const embed = new EmbedBuilder()
    .setColor(meta.color)
    .setTitle(`${meta.emoji} ${card.name}`)
    .setDescription(`🗂️ **${targetUser.username}'s Collection**`)
    .addFields(
      { name: 'Series',      value: card.series,                    inline: true },
      { name: 'Rarity',      value: `${meta.emoji} ${meta.label}`, inline: true },
      { name: 'Stars',       value: meta.stars || '—',              inline: true },
      { name: '📊 Level',    value: levelLabel,                     inline: true },
      { name: '❤️ Health',   value: `${stats.hp}`,                 inline: true },
      { name: '⚔️ Damage',   value: `${stats.dmg}`,                inline: true },
      { name: '🪪 Card ID',  value: `\`${card.id}\``,              inline: true },
    )
    .setFooter({ text: `Card ${page + 1} of ${filtered.length}${filterTag}${shardTag}` });

  const colImg = imgCache.getImage(card.id) ?? card.image ?? null;
  if (colImg) embed.setThumbnail(colImg);

  // Carry the same expiry forward so the 60s window doesn't reset on each click
  const base = `col|${authorId}|${targetUser.id}|${expiry}|%page%|${filter}`;
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(base.replace('%page%', page - 1))
      .setLabel('◀ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`col|${authorId}|${targetUser.id}|${expiry}|close|${filter}`)
      .setLabel('✕ Close')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(base.replace('%page%', page + 1))
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === filtered.length - 1),
  );

  return { embed, components: [row] };
}

// ── Ready ─────────────────────────────────────────────────

// ── Help pages ────────────────────────────────────────────

const HELP_TIMEOUT_MS = 120_000;

function buildHelpPage(authorId, page, showAdmin, expiry) {
  const rarityList  = Object.entries(config.RARITY_META)
    .map(([k, v]) => `${v.emoji} **${v.label}** \`${k}\``)
    .join('\n');
  const platingList = config.PLATING_TIERS
    .map(t => `${t.emoji} **${t.label}** — ×${t.statMult} battle stats (+${Math.round((t.statMult - 1) * 100)}%)`)
    .join('\n');

  const pages = [
    // ── Page 0: Pulling ──────────────────────────────────
    new EmbedBuilder()
      .setColor(0x00FFD1)
      .setTitle('📖 Help — 🎴 Pulling (1/5)')
      .setDescription('Pull random character cards from anime, manga, and games!')
      .addFields(
        { name: '`ZP pull` / `ZP p`',              value: `Pull a random card. You have up to **${config.MAX_PULL_CHARGES}** charges; +1 regenerates every **${config.PULL_COOLDOWN_SECONDS}s**.`, inline: false },
        { name: '`ZP allpull` / `ZP ap`',           value: 'Spend **all** your current pull charges at once and see a full summary of results.', inline: false },
        { name: '`ZP allpull reset` / `ZP ap reset`', value: '🍬 Spend all charges then instantly refill back to max. Costs **1 Candy Token**.', inline: false },
        { name: '`ZP reset`',                        value: '🍬 Use a **Candy Token** to instantly refill your pulls to max without spending them first.', inline: false },
      )
      .setFooter({ text: 'Page 1 of 5 • ZP help' }),

    // ── Page 1: Collection & Cards ────────────────────────
    new EmbedBuilder()
      .setColor(0x4A90D9)
      .setTitle('📖 Help — 🗂️ Collection & Cards (2/5)')
      .setDescription('Browse your collection, inspect cards, level them up, and check your currencies.')
      .addFields(
        { name: '`ZP collection` / `ZP col`',        value: 'Browse your card collection one card at a time with Prev/Next buttons.', inline: false },
        { name: '`ZP col [rarity or keyword]`',       value: 'Filter by rarity code (e.g. `LT`, `MY`) or a name/series keyword.', inline: false },
        { name: '`ZP col @user [filter]`',            value: "Browse another player's collection.", inline: false },
        { name: '`ZP all` / `ZP all [filter]`',      value: 'Browse **every card in the game**, sorted by rarity then name. Same filter options as `col`.', inline: false },
        { name: '`ZP card <cardId>` / `ZP c <id>`',  value: 'Inspect a specific card — shows level, stats, shards, and an absorb hint.', inline: false },
        { name: '`ZP absorb shard:<id>:<count>`',     value: 'Spend character shards to level up a card. **1 shard = 1 level**, max **Lv. 100**. Each level gives **+2% stats**.', inline: false },
        { name: '`ZP inventory` / `ZP inv`',         value: 'View your 🪙 platings. Add `@user` to check someone else.', inline: false },
        { name: '`ZP shards [rarity or name]`',      value: 'View your character shards. Filter by rarity (`R`, `E`, `L`, `MY`, `UR`, `LT`) or by character name. Add `@user` to check someone else.', inline: false },
        { name: '`ZP items`',                        value: 'View your special items. Items are granted by admins and can be used to obtain Limited cards.', inline: false },
        { name: '`ZP use <itemId>`',                 value: `Use a special item to claim its Limited card. Current items: ${config.ITEMS.map(i => `\`${i.id}\` → ${i.name}`).join(', ')}.`, inline: false },
        { name: '`ZP balance` / `ZP bal`',           value: 'Check your 💴 Yen, ⭐ Stars, and 🍬 Candy Tokens. Add `@user` to check someone else.', inline: false },
      )
      .setFooter({ text: 'Page 2 of 5 • ZP help' }),

    // ── Page 2: Team & Battle ─────────────────────────────
    new EmbedBuilder()
      .setColor(0xFF4757)
      .setTitle('📖 Help — ⚔️ Team & Battle (3/5)')
      .setDescription(`Build a team of **${inv.TEAM_SIZE} cards** and fight other players for Yen and Stars!\n\n**Plating battle bonuses:**\n${platingList}`)
      .addFields(
        { name: '`ZP team`',                              value: 'View your battle team. Shows each card\'s level, equipped plating, and power score. Add `@user` to see someone else\'s team.', inline: false },
        { name: '`ZP team add <cardId>`',                 value: `Add one of your owned cards to your team (max ${inv.TEAM_SIZE}).`, inline: false },
        { name: '`ZP team remove <cardId>`',              value: 'Remove a card from your team. Any equipped plating is returned to your inventory.', inline: false },
        { name: '`ZP team equip <cardId> <plating>`',    value: 'Equip a plating from your inventory onto a team card. The plating is **consumed** until unequipped. Valid: `bronze` `silver` `gold` `diamond`', inline: false },
        { name: '`ZP team unequip <cardId>`',             value: 'Remove a plating from a team card and return it to your inventory.', inline: false },
        { name: '`ZP fight @user`',                       value: `Start a **turn-based battle**! Both players need a full **${inv.TEAM_SIZE}-card team**. Click your card buttons to attack — each card hits the opponent's frontline card. The opponent retaliates automatically. Last team standing wins **100–1,000 💴 Yen** and **10–100 ⭐ Stars**. ${config.FIGHT_COOLDOWN_SECONDS}s cooldown.`, inline: false },
      )
      .setFooter({ text: 'Page 3 of 5 • ZP help' }),

    // ── Page 3: Trading ───────────────────────────────────
    new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle('📖 Help — 🤝 Trading (4/5)')
      .setDescription('Trade shards, platings, Yen, and Stars with other players. Omit `for <ask>` to send a free gift.')
      .addFields(
        {
          name: '`ZP trade @user <offer> [for <ask>]`',
          value: [
            'Send a trade offer or instant gift.',
            '**Item formats:** `shard:<cardId>:<amount>` • `plating:<tier>:<amount>` • `yen:<amount>` • `stars:<amount>`',
            '**Multiple items:** separate with commas — e.g. `shard:naruto_r:3,yen:200`',
            '**Examples:**',
            '`ZP trade @Alice shard:naruto_r:5` — free gift',
            '`ZP trade @Alice yen:500 for stars:100` — currency swap',
            '`ZP trade @Alice shard:goku_r:3 for plating:gold:1` — shard for plating',
          ].join('\n'),
          inline: false,
        },
        { name: '`ZP accept <tradeId>` / `ZP a <id>`',    value: 'Accept a pending trade offer sent to you.', inline: false },
        { name: '`ZP decline <tradeId>` / `ZP dec <id>`', value: 'Decline or cancel a trade (works for both sides).', inline: false },
        { name: '`ZP trades`',                             value: 'List all pending trade/gift offers currently addressed to you.', inline: false },
      )
      .setFooter({ text: 'Page 4 of 5 • Trades expire after 5 minutes' }),

    // ── Page 4: Reference ─────────────────────────────────
    new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('📖 Help — 📚 Reference (5/5)')
      .setDescription('Quick reference for rarities, platings, and currencies.')
      .addFields(
        { name: '✨ Rarities', value: rarityList, inline: false },
        {
          name: '🪙 Platings',
          value: config.PLATING_TIERS.map(t => `${t.emoji} **${t.label}** — 0.1% pull drop`).join('\n') +
            '\nEquip to team cards for combat bonuses. Tradeable.',
          inline: false,
        },
        {
          name: '💰 Currencies',
          value: [
            '💴 **Yen** — earned from fights & events. Traded between players.',
            '⭐ **Stars** — earned from fights & events. Traded between players.',
            '🍬 **Candy Tokens** — given by admins. Resets pull charges.',
          ].join('\n'),
          inline: false,
        },
        {
          name: '📊 Card Power Formula',
          value: 'Power = (HP + DMG) × level bonus × plating multiplier\nLevel bonus: ×(1 + 0.02 × (level − 1)) — so Lv.50 = ×1.98, Lv.100 = ×2.98',
          inline: false,
        },
      )
      .setFooter({ text: 'Page 5 of 5 • ZP help' }),
  ];

  // Admin page appended only for admins
  if (showAdmin) {
    const tierIds = config.PLATING_TIERS.map(t => t.id).join(' | ');
    pages.push(
      new EmbedBuilder()
        .setColor(0xFF6B35)
        .setTitle('📖 Help — 🔧 Admin Commands (6/6)')
        .addFields({
          name: 'Admin-only',
          value: [
            `\`ZP setrarity <${Object.keys(config.RARITY_META).join(' | ')}>\` — Force all pulls to a specific rarity`,
            `\`ZP setrarity reset\` — Clear rarity override`,
            `\`ZP setplating <${tierIds}>\` — Force every pull to drop a specific plating`,
            `\`ZP setplating reset\` — Clear plating override`,
            `\`ZP resetcooldown\` — Restore your pull charges to max`,
            `\`ZP giveyen [@user] <amount>\` — Add Yen to yourself or a user`,
            `\`ZP givestars [@user] <amount>\` — Add Stars to yourself or a user`,
            `\`ZP givecandytokens [@user] <amount>\` — Give 🍬 Candy Tokens to yourself or a user`,
            `\`ZP giveitem @user <itemId>\` — Give a limited item to a player (${config.ITEMS.map(i => `\`${i.id}\``).join(', ')})`,
          ].join('\n'),
          inline: false,
        })
        .setFooter({ text: `Page ${pages.length + 1} of ${pages.length + 1} • Admin only` })
    );
  }

  const totalPages = pages.length;
  const p = Math.max(0, Math.min(page, totalPages - 1));
  const embed = pages[p];

  const base = `help|${authorId}|${expiry}|%p%|${showAdmin ? '1' : '0'}`;
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(base.replace('%p%', p - 1))
      .setLabel('◀ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(p === 0),
    new ButtonBuilder()
      .setCustomId(`help|${authorId}|${expiry}|close|${showAdmin ? '1' : '0'}`)
      .setLabel('✕ Close')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(base.replace('%p%', p + 1))
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(p === totalPages - 1),
  );

  return { embed, components: [row] };
}

client.once('ready', () => {
  initPullCharges();
  console.log(`✅ test Bot online as ${client.user.tag}`);
  client.user.setActivity('ZP help', { type: 0 });
  // Fetch missing character images in the background (no await — non-blocking)
  imgCache.refreshMissing().catch(err => console.error('Image cache refresh error:', err));
  // Upload card images as custom emojis across the 3 emoji servers
  emojiCache.syncEmojis(client, CARDS, imgCache).catch(err => console.error('Emoji sync error:', err));
});

// ── Button Interactions ───────────────────────────────────

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const parts = interaction.customId.split('|');

  // ── Battle button handler ─────────────────────────────────
  if (parts[0] === 'battle') {
    const [, battleId, action] = parts;
    const state = activeBattles.get(battleId);

    if (!state) {
      return interaction.update({ components: [], embeds: interaction.message.embeds });
    }
    if (interaction.user.id !== state.attackerId) {
      return interaction.reply({ content: '❌ Only the challenger controls this battle.', ephemeral: true });
    }
    if (Date.now() > state.expiry) {
      activeBattles.delete(battleId);
      return interaction.update({ components: [], embeds: interaction.message.embeds });
    }

    // ── Run Away ──────────────────────────────────────────
    if (action === 'run') {
      activeBattles.delete(battleId);
      const embed = buildBattleEmbed(state, `🏃 **${state.attackerName}** ran away from the battle!`);
      return interaction.update({ embeds: [embed], components: [] });
    }

    // ── Attack ────────────────────────────────────────────
    const atkIdx   = parseInt(action, 10);
    const attacker = state.attackerCards[atkIdx];
    if (!attacker?.alive) {
      return interaction.reply({ content: '❌ That card is already defeated!', ephemeral: true });
    }

    const target = state.defenderCards.find(bc => bc.alive);
    if (!target) {
      activeBattles.delete(battleId);
      return interaction.update({ components: [], embeds: interaction.message.embeds });
    }

    // Player attacks first alive defender card
    const dmgDealt  = Math.round(attacker.dmg * (0.8 + Math.random() * 0.4));
    target.hp       = Math.max(0, target.hp - dmgDealt);
    if (target.hp === 0) target.alive = false;

    let log = `⚔️ **${attacker.name}** attacked **${target.name}** for **${dmgDealt.toLocaleString()}** damage!`;
    if (!target.alive) log += ` **${target.name}** was defeated! 💀`;

    // Check if attacker wins
    if (state.defenderCards.every(bc => !bc.alive)) {
      activeBattles.delete(battleId);
      const inventory   = inv.loadInventory();
      const yenEarned   = Math.floor(config.FIGHT_YEN_MIN  + Math.random() * (config.FIGHT_YEN_MAX  - config.FIGHT_YEN_MIN + 1));
      const starsEarned = Math.floor(config.FIGHT_STAR_MIN + Math.random() * (config.FIGHT_STAR_MAX - config.FIGHT_STAR_MIN + 1));
      inv.addYen(inventory, state.attackerId, yenEarned);
      inv.addStars(inventory, state.attackerId, starsEarned);
      inv.saveInventory(inventory);
      log += `\n\n🏆 **${state.attackerName}** wins!\n💴 +¥${yenEarned.toLocaleString()} Yen  ⭐ +${starsEarned.toLocaleString()} Stars`;
      const embed = buildBattleEmbed(state, log);
      return interaction.update({ embeds: [embed], components: [] });
    }

    // Defender retaliation — first alive defender hits first alive attacker
    const retaliator = state.defenderCards.find(bc => bc.alive);
    const atkTarget  = state.attackerCards.find(bc => bc.alive);
    if (retaliator && atkTarget) {
      const retDmg  = Math.round(retaliator.dmg * (0.8 + Math.random() * 0.4));
      atkTarget.hp  = Math.max(0, atkTarget.hp - retDmg);
      if (atkTarget.hp === 0) atkTarget.alive = false;
      log += `\n💥 **${retaliator.name}** retaliated against **${atkTarget.name}** for **${retDmg.toLocaleString()}** damage!`;
      if (!atkTarget.alive) log += ` **${atkTarget.name}** was defeated! 💀`;
    }

    // Check if defender wins
    if (state.attackerCards.every(bc => !bc.alive)) {
      activeBattles.delete(battleId);
      log += `\n\n💀 **${state.defenderName}** wins! **${state.attackerName}** was defeated!`;
      const embed = buildBattleEmbed(state, log);
      return interaction.update({ embeds: [embed], components: [] });
    }

    // Battle continues
    const embed      = buildBattleEmbed(state, log);
    const components = buildBattleComponents(state);
    return interaction.update({ embeds: [embed], components });
  }

  // ── Help button handler ───────────────────────────────────
  if (parts[0] === 'help') {
    // Format: help|authorId|expiry|page|showAdmin
    const [, authorId, expiryStr, pageStr, adminFlag] = parts;
    const expiry    = parseInt(expiryStr, 10);
    const showAdmin = adminFlag === '1';

    if (interaction.user.id !== authorId) {
      return interaction.reply({ content: '❌ These buttons are not for you.', ephemeral: true });
    }
    if (Date.now() > expiry) {
      return interaction.update({ components: [], embeds: interaction.message.embeds });
    }
    if (pageStr === 'close') {
      return interaction.update({ components: [] });
    }
    const page = parseInt(pageStr, 10);
    const { embed, components } = buildHelpPage(authorId, page, showAdmin, expiry);
    return interaction.update({ embeds: [embed], components });
  }

  // ── ZP all button handler ─────────────────────────────────
  if (parts[0] === 'zpa') {
    // Format: zpa|authorId|expiry|page|...filter
    const [, authorId, expiryStr, pageStr, ...filterParts] = parts;
    const filter = filterParts.join('|');
    const expiry = parseInt(expiryStr, 10);

    if (interaction.user.id !== authorId) {
      return interaction.reply({ content: '❌ These buttons are not for you.', ephemeral: true });
    }

    if (Date.now() > expiry) {
      return interaction.update({
        components: [],
        embeds: interaction.message.embeds,
        content: interaction.message.content || null,
      });
    }

    if (pageStr === 'close') {
      return interaction.update({ components: [] });
    }

    const page     = parseInt(pageStr, 10);
    const allCards = getSortedAllCards();
    const { embed, components } = buildAllCardsPage(authorId, allCards, page, filter, expiry);
    return interaction.update({ embeds: [embed], components });
  }

  if (parts[0] !== 'col') return;

  // Format: col|authorId|targetId|expiry|page|...filter
  const [, authorId, targetId, expiryStr, pageStr, ...filterParts] = parts;
  const filter = filterParts.join('|');
  const expiry = parseInt(expiryStr, 10);

  if (interaction.user.id !== authorId) {
    return interaction.reply({ content: '❌ These buttons are not for you.', ephemeral: true });
  }

  // Expired — strip buttons so nobody can click them again
  if (Date.now() > expiry) {
    return interaction.update({
      components: [],
      embeds: interaction.message.embeds,
      content: interaction.message.content || null,
    });
  }

  if (pageStr === 'close') {
    return interaction.update({ components: [] });
  }

  const page       = parseInt(pageStr, 10);
  const targetUser = await client.users.fetch(targetId).catch(() => null);
  if (!targetUser) return interaction.reply({ content: '❌ Could not find that user.', ephemeral: true });

  const inventory = inv.loadInventory();
  const cards     = inv.getCards(inventory, targetId);
  const { embed, components } = buildCollectionPage(authorId, targetUser, cards, page, filter, inventory, expiry);

  await interaction.update({ embeds: [embed], components });
});

// ── Message Handler ───────────────────────────────────────

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const prefix = config.PREFIX.toLowerCase();
  if (!message.content.toLowerCase().startsWith(prefix)) return;

  const args    = message.content.slice(config.PREFIX.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();
  const userId  = message.author.id;

  // ── help | h ─────────────────────────────────────────────
  if (!command || command === 'help' || command === 'h') {
    const expiry    = Date.now() + HELP_TIMEOUT_MS;
    const showAdmin = isAdmin(userId);
    const { embed, components } = buildHelpPage(userId, 0, showAdmin, expiry);
    return message.reply({ embeds: [embed], components });
  }

  // ── Shared pull logic ────────────────────────────────────

  function executeSinglePull(inventory, userId) {
    const card    = (isAdmin(userId) && adminRarityOverride)
      ? pullCardForced(adminRarityOverride)
      : pullCard();
    const { isDupe } = inv.addCardToInventory(inventory, userId, card);
    const plating    = (isAdmin(userId) && adminPlatingOverride)
      ? adminPlatingOverride
      : rollPlating();
    if (plating) inv.addPlating(inventory, userId, plating.id);
    return { card, isDupe, plating };
  }

  // ── pull | p ─────────────────────────────────────────────
  if (command === 'pull' || command === 'p') {
    const { charges, lastRefill } = getCharges(userId);

    if (charges <= 0) {
      const secsUntilNext = Math.ceil(config.PULL_COOLDOWN_SECONDS - (Date.now() - lastRefill) / 1000);
      return message.reply(`⏳ No pulls left! Next charge in **${secsUntilNext}s**. Charges refill 1 every **${config.PULL_COOLDOWN_SECONDS}s** (max **${config.MAX_PULL_CHARGES}**).`);
    }

    setCharges(userId, charges - 1, lastRefill);

    const inventory                 = inv.loadInventory();
    const { card, isDupe, plating } = executeSinglePull(inventory, userId);
    inv.saveInventory(inventory);

    const meta       = rarityMeta(card.rarity);
    const remaining  = charges - 1;
    const chargeInfo = remaining > 0
      ? `${remaining} pull${remaining === 1 ? '' : 's'} remaining`
      : `No pulls left — next charge in ${config.PULL_COOLDOWN_SECONDS}s`;

    const embed = singlePullEmbed(card, isDupe, plating, chargeInfo, message.author.username);
    return message.reply({ embeds: [embed] });
  }

  // ── allpull | ap ──────────────────────────────────────────
  if (command === 'allpull' || command === 'ap') {
    const withReset = args[0]?.toLowerCase() === 'reset';
    const { charges, lastRefill } = getCharges(userId);

    if (charges <= 0) {
      const secsUntilNext = Math.ceil(config.PULL_COOLDOWN_SECONDS - (Date.now() - lastRefill) / 1000);
      return message.reply(`⏳ No pulls left! Next charge in **${secsUntilNext}s**. Charges refill 1 every **${config.PULL_COOLDOWN_SECONDS}s** (max **${config.MAX_PULL_CHARGES}**).`);
    }

    // If reset flag given, consume a Candy Token before pulling
    if (withReset) {
      const inventory = inv.loadInventory();
      if (!inv.removeCandyTokens(inventory, userId, 1)) {
        return message.reply(`❌ You need a 🍬 **Candy Token** to use \`ZP ap reset\`. You currently have none.`);
      }
      inv.saveInventory(inventory);
    }

    setCharges(userId, 0, lastRefill);

    const inventory = inv.loadInventory();
    const results   = [];

    for (let i = 0; i < charges; i++) {
      results.push(executeSinglePull(inventory, userId));
    }

    inv.saveInventory(inventory);

    if (withReset) {
      setCharges(userId, config.MAX_PULL_CHARGES, Date.now());
    }

    const overrideNote = (isAdmin(userId) && adminRarityOverride)
      ? `🔧 Rarity locked to ${rarityMeta(adminRarityOverride).label}` : '';

    const embed = allPullEmbed(results, charges, withReset, message.author.username, overrideNote);
    return message.reply({ embeds: [embed] });
  }

  // ── reset ─────────────────────────────────────────────────
  if (command === 'reset') {
    const inventory = inv.loadInventory();
    const tokens = inv.getCandyTokens(inventory, userId);
    if (tokens <= 0) {
      return message.reply(`❌ You have no 🍬 **Candy Tokens**. Ask an admin to give you one!`);
    }
    inv.removeCandyTokens(inventory, userId, 1);
    inv.saveInventory(inventory);
    setCharges(userId, config.MAX_PULL_CHARGES, Date.now());
    return message.reply(`🍬 **Candy Token** used! Your pulls have been reset to **${config.MAX_PULL_CHARGES}**. You have **${tokens - 1}** token${tokens - 1 === 1 ? '' : 's'} remaining.`);
  }

  // ── collection | col ─────────────────────────────────────
  if (command === 'collection' || command === 'col') {
    const target  = message.mentions.users.first() ?? message.author;
    const filter  = args.filter(a => !a.startsWith('<@')).join(' ').trim();

    const inventory = inv.loadInventory();
    const cards     = inv.getCards(inventory, target.id);

    if (cards.length === 0) {
      return message.reply(`${target.id === userId ? 'You have' : `**${target.username}** has`} no cards yet. Use \`ZP pull\` to get started!`);
    }

    const expiry = Date.now() + COLLECTION_TIMEOUT_MS;
    const { embed, components } = buildCollectionPage(userId, target, cards, 0, filter, inventory, expiry);
    return message.reply({ embeds: [embed], components });
  }

  // ── all ──────────────────────────────────────────────────
  if (command === 'all') {
    const filter   = args.join(' ').trim();
    const allCards = getSortedAllCards();
    const expiry   = Date.now() + COLLECTION_TIMEOUT_MS;
    const { embed, components } = buildAllCardsPage(userId, allCards, 0, filter, expiry);
    return message.reply({ embeds: [embed], components });
  }

  // ── inventory | inv ───────────────────────────────────────
  if (command === 'inventory' || command === 'inv') {
    const target    = message.mentions.users.first() ?? message.author;
    const inventory = inv.loadInventory();

    const platingsObj    = inv.getPlatings(inventory, target.id);
    const platingEntries = Object.entries(platingsObj).filter(([, n]) => n > 0);

    if (platingEntries.length === 0) {
      return message.reply(
        `${target.id === userId ? 'You have' : `**${target.username}** has`} no platings yet. Hope for a 0.1% plating drop on your next pull!`
      );
    }

    const totalPlatings = platingEntries.reduce((s, [, n]) => s + n, 0);
    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle(`🎒 ${target.username}'s Inventory`)
      .addFields({
        name: `🪙 Platings (${totalPlatings} total)`,
        value: config.PLATING_TIERS
          .filter(t => platingsObj[t.id] > 0)
          .map(t => `${t.emoji} **${t.label}** — ×${platingsObj[t.id]}`)
          .join('\n'),
        inline: false,
      })
      .setFooter({ text: 'Platings drop at 0.1% chance per pull • Use ZP equip to apply one' });
    return message.reply({ embeds: [embed] });
  }

  // ── shards ────────────────────────────────────────────────
  if (command === 'shards') {
    const target    = message.mentions.users.first() ?? message.author;
    const filterArg = args.filter(a => !a.startsWith('<@')).join(' ').trim();

    const inventory  = inv.loadInventory();
    const charShards = inv.getCharacterShards(inventory, target.id);
    const allEntries = Object.entries(charShards).filter(([, n]) => n > 0);

    if (allEntries.length === 0) {
      return message.reply(`${target.id === userId ? 'You have' : `**${target.username}** has`} no character shards yet. Pull duplicates to earn shards!`);
    }

    const rarityKeys = Object.keys(config.RARITY_META);
    let filtered;
    if (filterArg) {
      const upperFilter = filterArg.toUpperCase();
      if (rarityKeys.includes(upperFilter)) {
        filtered = allEntries.filter(([cardId]) => (lookupCard(cardId)?.rarity ?? 'R') === upperFilter);
      } else {
        filtered = allEntries.filter(([cardId]) => {
          const card = lookupCard(cardId);
          return (card?.name ?? cardId).toLowerCase().includes(filterArg.toLowerCase());
        });
      }
    } else {
      filtered = allEntries;
    }

    if (filtered.length === 0) {
      return message.reply(`No shards found matching **"${filterArg}"**.`);
    }

    const grouped = {};
    for (const [key] of Object.entries(config.RARITY_META)) grouped[key] = [];
    for (const [cardId, count] of filtered) {
      const card   = lookupCard(cardId);
      const rarity = card?.rarity ?? 'R';
      const emoji  = emojiCache.getEmoji(cardId) ?? '';
      if (!grouped[rarity]) grouped[rarity] = [];
      grouped[rarity].push({ name: card?.name ?? cardId, count, emoji });
    }

    const totalShards = filtered.reduce((s, [, n]) => s + n, 0);
    const titleSuffix = filterArg ? ` — "${filterArg}"` : '';
    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle(`✨ ${target.username}'s Shards${titleSuffix}`)
      .setDescription(`**${totalShards}** shard${totalShards === 1 ? '' : 's'} total`);

    for (const [rarity, group] of Object.entries(grouped)) {
      if (group.length === 0) continue;
      const meta = rarityMeta(rarity);
      let value  = group.map(s => `${s.emoji ? s.emoji + ' ' : ''}${s.name} — ×${s.count}`).join('\n');
      if (value.length > 1024) value = value.slice(0, 1020) + '\n…';
      embed.addFields({ name: `${meta.emoji} ${meta.label}`, value, inline: true });
    }

    embed.setFooter({ text: 'Filter by rarity: ZP shards R  •  By name: ZP shards naruto' });
    return message.reply({ embeds: [embed] });
  }

  // ── items ─────────────────────────────────────────────────
  if (command === 'items') {
    const target    = message.mentions.users.first() ?? message.author;
    const inventory = inv.loadInventory();
    const userItems = inv.getItems(inventory, target.id);
    const entries   = Object.entries(userItems).filter(([, n]) => n > 0);

    if (entries.length === 0) {
      return message.reply(`${target.id === userId ? 'You have' : `**${target.username}** has`} no items. Items are granted by admins for special events!`);
    }

    const lines = entries.map(([itemId, count]) => {
      const item = config.ITEMS.find(i => i.id === itemId);
      if (!item) return `\`${itemId}\` — ×${count}`;
      return `${item.emoji} **${item.name}** — ×${count}\n*${item.desc}*\nUse: \`ZP use ${item.id}\``;
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(0xFF69B4)
      .setTitle(`${target.username}'s Items`)
      .setDescription(lines)
      .setFooter({ text: 'Use an item with: ZP use <itemId>' });
    return message.reply({ embeds: [embed] });
  }

  // ── use ───────────────────────────────────────────────────
  if (command === 'use') {
    const itemId = args[0]?.toLowerCase();
    if (!itemId) return message.reply('Usage: `ZP use <itemId>` — check `ZP items` to see what you have.');

    const item = config.ITEMS.find(i => i.id === itemId);
    if (!item) return message.reply(`❌ Unknown item \`${itemId}\`. Check \`ZP items\` for your available items.`);

    const inventory = inv.loadInventory();

    if (!inv.removeItem(inventory, userId, itemId)) {
      return message.reply(`❌ You don't have **${item.emoji} ${item.name}**. Items are granted by admins for special events!`);
    }

    const card     = CARDS.find(c => c.id === item.cardId);
    const { isDupe } = inv.addCardToInventory(inventory, userId, card);
    inv.saveInventory(inventory);

    const meta    = rarityMeta(card.rarity);
    const img     = imgCache.getImage(card.id) ?? card.image ?? null;
    const outcome = isDupe
      ? `You already own **${card.name}** — **+1 Shard** added instead.`
      : `**${card.name}** has been added to your collection!`;

    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`${item.emoji} ${item.name} used!`)
      .setDescription(`${meta.emoji} **${meta.label}** — ${card.series}\n\n${outcome}`)
      .setFooter({ text: `${item.name} consumed` });
    if (img) embed.setImage(img);
    return message.reply({ embeds: [embed] });
  }

  // ── card | c ─────────────────────────────────────────────
  if (command === 'card' || command === 'c') {
    const cardId = args[0];
    if (!cardId) return message.reply('Usage: `ZP card <cardId>` or `ZP c <cardId>`');

    const card = lookupCard(cardId);
    if (!card) return message.reply(`❌ No card found with id \`${cardId}\`. Check \`ZP col\` for your card IDs.`);

    const inventory = inv.loadInventory();
    const owned     = inv.hasCard(inventory, userId, card.id);
    const shards    = inv.getCharacterShards(inventory, userId)[card.id] ?? 0;
    const level     = owned ? (inv.getCardLevel(inventory, userId, card.id) ?? 1) : 1;
    const embed     = cardEmbed(card, undefined, undefined, level);

    // Check if the card is on the user's team with a plating equipped
    if (owned) {
      const team     = inv.getTeam(inventory, userId);
      const slot     = team.find(s => s.cardId === card.id);
      const tierData = slot?.plating ? config.PLATING_TIERS.find(t => t.id === slot.plating) : null;
      if (tierData) {
        const base       = getCardStats(card, level);
        const platedHp   = Math.round(base.hp  * tierData.statMult);
        const platedDmg  = Math.round(base.dmg * tierData.statMult);
        embed.addFields({
          name: `${tierData.emoji} ${tierData.label} Plating (in battle)`,
          value: `❤️ **${platedHp}** HP  ⚔️ **${platedDmg}** DMG  *(×${tierData.statMult} boost)*`,
          inline: false,
        });
      }
    }

    const shardEmoji = emojiCache.getEmoji(card.id) ?? '';
    const shardInfo = shards > 0 ? ` • ${shardEmoji ? shardEmoji + ' ' : ''}×${shards} shard${shards === 1 ? '' : 's'}` : '';
    const lvlInfo   = owned ? ` • 📊 Lv. ${level}` : '';
    const absorbHint = owned && shards > 0 && level < inv.MAX_CARD_LEVEL
      ? ` • Use \`ZP absorb shard:${card.id}:${shards}\` to level up!`
      : '';
    const status    = owned
      ? `✅ In your collection${lvlInfo}${shardInfo}${absorbHint}`
      : '❌ Not in your collection';
    embed.setFooter({ text: status });
    return message.reply({ embeds: [embed] });
  }

  // ── absorb ───────────────────────────────────────────────
  if (command === 'absorb') {
    const raw = args[0];
    if (!raw) {
      return message.reply(
        '❌ Usage: `ZP absorb shard:<cardId>:<count>`\n' +
        'Example: `ZP absorb shard:naruto_r:5` — spend 5 Naruto shards to gain 5 levels.'
      );
    }

    const parts = raw.split(':');
    if (parts.length !== 3 || parts[0].toLowerCase() !== 'shard') {
      return message.reply('❌ Invalid format. Usage: `ZP absorb shard:<cardId>:<count>`');
    }

    const cardId = parts[1].toLowerCase();
    const count  = parseInt(parts[2], 10);
    if (isNaN(count) || count < 1) {
      return message.reply('❌ Count must be a positive number.');
    }

    const card = lookupCard(cardId);
    if (!card) {
      return message.reply(`❌ No card found with id \`${cardId}\`. Check \`ZP col\` for valid IDs.`);
    }

    const inventory = inv.loadInventory();

    if (!inv.hasCard(inventory, userId, card.id)) {
      return message.reply(`❌ You don't own **${card.name}**. You must collect the card before levelling it up.`);
    }

    const currentLevel = inv.getCardLevel(inventory, userId, card.id) ?? 1;

    if (currentLevel >= inv.MAX_CARD_LEVEL) {
      return message.reply(`✨ **${card.name}** is already at the maximum level (${inv.MAX_CARD_LEVEL})!`);
    }

    const shards = inv.getCharacterShards(inventory, userId)[card.id] ?? 0;
    if (shards < count) {
      return message.reply(`❌ You only have **${shards}** ${card.name} shard${shards === 1 ? '' : 's'} but tried to absorb **${count}**.`);
    }

    const levelsGained  = Math.min(count, inv.MAX_CARD_LEVEL - currentLevel);
    const shardsSpent   = levelsGained;
    const newLevel      = currentLevel + levelsGained;

    inv.removeCharacterShards(inventory, userId, card.id, shardsSpent);
    inv.setCardLevel(inventory, userId, card.id, newLevel);
    inv.saveInventory(inventory);

    const meta     = rarityMeta(card.rarity);
    const oldStats = getCardStats(card, currentLevel);
    const newStats = getCardStats(card, newLevel);
    const maxNote  = newLevel >= inv.MAX_CARD_LEVEL ? '\n✨ **MAX LEVEL REACHED!**' : '';

    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`📈 ${card.name} levelled up!`)
      .setDescription(
        `**${currentLevel}** → **${newLevel}** *(+${levelsGained} level${levelsGained === 1 ? '' : 's'})*${maxNote}`
      )
      .addFields(
        { name: 'Shards Spent',  value: `${shardsSpent}`,                                              inline: true },
        { name: 'Shards Left',   value: `${shards - shardsSpent}`,                                     inline: true },
        { name: '\u200b',           value: '\u200b',                                                      inline: true },
        { name: '❤️ HP',            value: `${oldStats.hp} → **${newStats.hp}**`,                        inline: true },
        { name: '⚔️ Damage',        value: `${oldStats.dmg} → **${newStats.dmg}**`,                      inline: true },
      );

    const img = imgCache.getImage(card.id) ?? card.image ?? null;
    if (img) embed.setThumbnail(img);

    if (levelsGained < count) {
      embed.setFooter({ text: `Only ${levelsGained} of ${count} shards used — card is now at max level.` });
    } else {
      const remaining = inv.MAX_CARD_LEVEL - newLevel;
      embed.setFooter({ text: remaining > 0 ? `${remaining} more level${remaining === 1 ? '' : 's'} to MAX` : 'MAX LEVEL!' });
    }

    return message.reply({ embeds: [embed] });
  }

  // ── team ─────────────────────────────────────────────────
  if (command === 'team') {
    const sub = args[0]?.toLowerCase();

    // ── ZP team (view) ─────────────────────────────────────
    if (!sub || sub === 'view') {
      const target    = message.mentions.users.first() ?? message.author;
      const inventory = inv.loadInventory();
      const team      = inv.getTeam(inventory, target.id);
      const resolved  = resolveTeamSlots(team, inventory, target.id);

      const embed = new EmbedBuilder()
        .setColor(0x00FFD1)
        .setTitle(`⚔️ ${target.username}'s Team`);

      if (resolved.length === 0) {
        embed.setDescription(`No cards on this team yet.\nUse \`ZP team add <cardId>\` to add up to ${inv.TEAM_SIZE} cards.`);
      } else {
        let totalPower = 0;
        const lines = resolved.map((slot, i) => {
          if (!slot.card) return `${i + 1}. ~~${slot.cardId}~~ *(missing card)*`;
          const meta    = rarityMeta(slot.card.rarity);
          const power   = slotPower(slot);
          totalPower   += power;
          const plating = slot.plating ? config.PLATING_TIERS.find(t => t.id === slot.plating) : null;
          const platStr = plating ? ` ${plating.emoji}` : '';
          return `${i + 1}. ${meta.emoji} **${slot.card.name}**${platStr} — Lv.${slot.level} • ⚡ ${Math.round(power).toLocaleString()} power`;
        });
        embed.setDescription(lines.join('\n'));
        embed.addFields({ name: '⚡ Total Power', value: Math.round(totalPower).toLocaleString(), inline: true });
        if (resolved.length < inv.TEAM_SIZE) {
          embed.addFields({ name: '📋 Slots', value: `${resolved.length} / ${inv.TEAM_SIZE}`, inline: true });
        } else {
          embed.addFields({ name: '✅ Ready to Fight!', value: `Use \`ZP fight @user\``, inline: true });
        }
      }
      embed.setFooter({ text: `team add <id> • team remove <id> • team equip <id> <plating> • team unequip <id>` });
      return message.reply({ embeds: [embed] });
    }

    // ── ZP team add <cardId> ────────────────────────────────
    if (sub === 'add') {
      const cardId = args[1]?.toLowerCase();
      if (!cardId) return message.reply('Usage: `ZP team add <cardId>`');

      const card = lookupCard(cardId);
      if (!card) return message.reply(`❌ No card found with id \`${cardId}\`.`);

      const inventory = inv.loadInventory();
      if (!inv.hasCard(inventory, userId, card.id)) {
        return message.reply(`❌ You don't own **${card.name}**. Pull it first!`);
      }

      const result = inv.addToTeam(inventory, userId, card.id);
      inv.saveInventory(inventory);

      if (result === 'already_on_team') return message.reply(`❌ **${card.name}** is already on your team.`);
      if (result === 'full') return message.reply(`❌ Your team is full (${inv.TEAM_SIZE}/${inv.TEAM_SIZE}). Remove a card first with \`ZP team remove <cardId>\`.`);

      const team = inv.getTeam(inventory, userId);
      const meta = rarityMeta(card.rarity);
      return message.reply(`✅ ${meta.emoji} **${card.name}** added to your team! (${team.length}/${inv.TEAM_SIZE})`);
    }

    // ── ZP team remove <cardId> ─────────────────────────────
    if (sub === 'remove') {
      const cardId = args[1]?.toLowerCase();
      if (!cardId) return message.reply('Usage: `ZP team remove <cardId>`');

      const card = lookupCard(cardId);
      const name = card?.name ?? cardId;

      const inventory = inv.loadInventory();
      const removed   = inv.removeFromTeam(inventory, userId, cardId);
      if (!removed) return message.reply(`❌ **${name}** is not on your team.`);

      inv.saveInventory(inventory);
      const platReturn = removed.plating
        ? ` Your ${config.PLATING_TIERS.find(t => t.id === removed.plating)?.emoji ?? ''} **${removed.plating}** plating was returned to your inventory.`
        : '';
      return message.reply(`✅ **${name}** removed from your team.${platReturn}`);
    }

    // ── ZP team equip <cardId> <platingTier> ───────────────
    if (sub === 'equip') {
      const cardId = args[1]?.toLowerCase();
      const tierId = args[2]?.toLowerCase();
      if (!cardId || !tierId) return message.reply('Usage: `ZP team equip <cardId> <bronze|silver|gold|diamond>`');

      const card = lookupCard(cardId);
      if (!card) return message.reply(`❌ No card found with id \`${cardId}\`.`);

      const tier = config.PLATING_TIERS.find(t => t.id === tierId);
      if (!tier) return message.reply(`❌ Unknown plating tier \`${tierId}\`. Valid: ${config.PLATING_TIERS.map(t => t.id).join(', ')}`);

      const inventory = inv.loadInventory();
      const result    = inv.equipPlatingToTeam(inventory, userId, card.id, tier.id);
      inv.saveInventory(inventory);

      if (result === 'not_on_team')      return message.reply(`❌ **${card.name}** is not on your team. Add it first with \`ZP team add ${card.id}\`.`);
      if (result === 'no_plating')       return message.reply(`❌ You don't have a **${tier.label}** plating in your inventory.`);
      if (result === 'already_equipped') {
        const existSlot = inv.getTeam(inventory, userId).find(s => s.cardId === card.id);
        const existing  = config.PLATING_TIERS.find(t => t.id === existSlot?.plating);
        return message.reply(`❌ **${card.name}** already has a ${existing?.emoji ?? ''} **${existing?.label ?? 'plating'}** equipped. Unequip it first with \`ZP team unequip ${card.id}\`.`);
      }

      const mult = tier.statMult;
      return message.reply(`${tier.emoji} **${tier.label}** plating equipped to **${card.name}**! Stats in battle: ×${mult} (+${Math.round((mult - 1) * 100)}%)`);
    }

    // ── ZP team unequip <cardId> ────────────────────────────
    if (sub === 'unequip') {
      const cardId = args[1]?.toLowerCase();
      if (!cardId) return message.reply('Usage: `ZP team unequip <cardId>`');

      const card = lookupCard(cardId);
      const name = card?.name ?? cardId;

      const inventory = inv.loadInventory();
      const returned  = inv.unequipPlatingFromTeam(inventory, userId, cardId);
      inv.saveInventory(inventory);

      if (!returned) return message.reply(`❌ **${name}** has no plating equipped (or is not on your team).`);

      const tier = config.PLATING_TIERS.find(t => t.id === returned);
      return message.reply(`✅ ${tier?.emoji ?? ''} **${tier?.label ?? returned}** plating unequipped from **${name}** and returned to your inventory.`);
    }

    return message.reply('Usage: `ZP team` • `ZP team add <id>` • `ZP team remove <id>` • `ZP team equip <id> <plating>` • `ZP team unequip <id>`');
  }

  // ── fight ─────────────────────────────────────────────────
  if (command === 'fight') {
    const opponent = message.mentions.users.first();
    if (!opponent) return message.reply('Usage: `ZP fight @user` — challenge another player to a team battle!');
    if (opponent.id === userId) return message.reply('❌ You cannot fight yourself.');
    if (opponent.bot)           return message.reply('❌ You cannot fight a bot.');

    const coolSecs = getFightCooldownSecs(userId);
    if (coolSecs > 0) {
      return message.reply(`⏳ You're on cooldown! You can fight again in **${coolSecs}s**.`);
    }

    const existing = [...activeBattles.values()].find(b => b.attackerId === userId);
    if (existing) return message.reply('❌ You already have an active battle in progress! Finish it first.');

    const inventory  = inv.loadInventory();
    const atkTeamRaw = inv.getTeam(inventory, userId);
    const defTeamRaw = inv.getTeam(inventory, opponent.id);

    if (atkTeamRaw.length < inv.TEAM_SIZE) {
      return message.reply(`❌ Your team only has **${atkTeamRaw.length}/${inv.TEAM_SIZE}** cards. Use \`ZP team add <cardId>\` to fill it up.`);
    }
    if (defTeamRaw.length < inv.TEAM_SIZE) {
      return message.reply(`❌ **${opponent.username}** only has **${defTeamRaw.length}/${inv.TEAM_SIZE}** cards on their team.`);
    }

    const atkTeam = resolveTeamSlots(atkTeamRaw, inventory, userId);
    const defTeam = resolveTeamSlots(defTeamRaw, inventory, opponent.id);

    const battleId = `${userId}_${Date.now()}`;
    const state = {
      battleId,
      attackerId:    userId,
      defenderId:    opponent.id,
      attackerName:  message.author.username,
      defenderName:  opponent.username,
      attackerCards: atkTeam.map(buildBattleCard).filter(Boolean),
      defenderCards: defTeam.map(buildBattleCard).filter(Boolean),
      expiry:        Date.now() + 5 * 60 * 1000,
    };

    setFightCooldown(userId);
    activeBattles.set(battleId, state);

    const embed      = buildBattleEmbed(state, `⚔️ **${message.author.username}** challenged **${opponent.username}**! Click a card button to attack!`);
    const components = buildBattleComponents(state);
    return message.reply({ content: `${opponent}`, embeds: [embed], components });
  }

  // ── trade ─────────────────────────────────────────────────
  if (command === 'trade') {
    const toUser = message.mentions.users.first();
    if (!toUser) {
      return message.reply(
        '❌ You must mention a user.\n' +
        'Usage: `ZP trade @user <offer>` (free gift) or `ZP trade @user <offer> for <ask>`\n' +
        'Item formats: `shard:<cardId>:<amount>` • `plating:<tier>:<amount>` • `yen:<amount>` • `stars:<amount>`\n' +
        'Examples:\n' +
        '`ZP trade @Alice shard:naruto_r:3` — free gift\n' +
        '`ZP trade @Alice yen:500 for stars:100` — currency swap\n' +
        '`ZP trade @Alice shard:naruto_r:3 for plating:gold:1` — shard for plating'
      );
    }
    if (toUser.id === userId) return message.reply('❌ You cannot trade with yourself.');
    if (toUser.bot)           return message.reply('❌ You cannot trade with a bot.');

    // Strip mention tokens and find optional "for" separator
    // Rejoin with spaces so comma-separated items with spaces work
    const tradeArgs = args.filter(a => !a.startsWith('<@'));
    const forIndex  = tradeArgs.findIndex(a => a.toLowerCase() === 'for');
    const isFree    = forIndex === -1;

    if (tradeArgs.length === 0) {
      return message.reply('❌ You need to specify what you are offering.');
    }
    if (!isFree && (forIndex === 0 || forIndex === tradeArgs.length - 1)) {
      return message.reply('❌ Invalid format — you wrote "for" but left one side empty.');
    }

    const offerStr = (isFree ? tradeArgs : tradeArgs.slice(0, forIndex)).join(' ');
    const askStr   = isFree ? null : tradeArgs.slice(forIndex + 1).join(' ');

    const offer = parseTradeItems(offerStr);
    if (!offer) return message.reply(`❌ Couldn't parse offer \`${offerStr}\`.\nFormat: \`shard:<cardId>:<amount>\` • \`plating:<tier>:<amount>\` • \`yen:<amount>\` • \`stars:<amount>\`\nSeparate multiple items with commas: \`shard:naruto_r:3,yen:500\``);

    const ask = askStr ? parseTradeItems(askStr) : null;
    if (askStr && !ask) return message.reply(`❌ Couldn't parse ask \`${askStr}\`.\nFormat: \`shard:<cardId>:<amount>\` • \`plating:<tier>:<amount>\` • \`yen:<amount>\` • \`stars:<amount>\`\nSeparate multiple items with commas: \`plating:gold:1,stars:100\``);

    for (const item of offer) {
      if (!validateTradeItem(item)) {
        return message.reply(item.type === 'shard'
          ? `❌ Unknown card ID \`${item.id}\`. Check \`ZP col\` for valid IDs.`
          : `❌ Unknown plating tier \`${item.id}\`. Valid tiers: ${config.PLATING_TIERS.map(t => t.id).join(', ')}`
        );
      }
    }
    if (ask) {
      for (const item of ask) {
        if (!validateTradeItem(item)) {
          return message.reply(item.type === 'shard'
            ? `❌ Unknown card ID \`${item.id}\`. Check \`ZP col\` for valid IDs.`
            : `❌ Unknown plating tier \`${item.id}\`. Valid tiers: ${config.PLATING_TIERS.map(t => t.id).join(', ')}`
          );
        }
      }
    }

    const inventory = inv.loadInventory();
    const missingOffer = findMissingItem(inventory, userId, offer);
    if (missingOffer) {
      return message.reply(`❌ You don't have enough to offer. You need ${describeItem(missingOffer)}.`);
    }

    // Free gifts auto-complete immediately — no pending trade needed
    if (isFree) {
      removeAllItems(inventory, userId, offer);
      addAllItems(inventory, toUser.id, offer);
      inv.saveInventory(inventory);

      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('🎁 Gift Sent!')
        .setDescription(`**${message.author.username}** → **${toUser.username}**`)
        .addFields(
          { name: `${toUser.username} received`, value: describeItems(offer), inline: true },
        )
        .setFooter({ text: 'Gift delivered instantly!' });

      return message.reply({ content: `${toUser}`, embeds: [embed] });
    }

    const tradeId = trades.createTrade({ fromUserId: userId, toUserId: toUser.id, offer, ask });

    const embed = new EmbedBuilder()
      .setColor(0x4A90D9)
      .setTitle('🤝 Trade Offer Sent')
      .setDescription(`**${message.author.username}** → **${toUser.username}**`)
      .addFields(
        { name: 'Offering',   value: describeItems(offer),  inline: true },
        { name: 'Asking for', value: describeItems(ask),    inline: true },
        { name: 'Trade ID',   value: `\`${tradeId}\``,      inline: true },
      )
      .setFooter({ text: `${toUser.username}: use  ZP a ${tradeId}  or  ZP dec ${tradeId}  • Expires in 5 min` });

    const sentMsg = await message.reply({ content: `${toUser}`, embeds: [embed] });
    trades.setOfferMessage(tradeId, sentMsg);
    return;
  }

  // ── accept | a ────────────────────────────────────────────
  if (command === 'accept' || command === 'a') {
    const tradeId = args[0];
    if (!tradeId) return message.reply('Usage: `ZP accept <tradeId>` or `ZP a <tradeId>`');

    const trade = trades.getTrade(tradeId);
    if (!trade) return message.reply(`❌ Trade \`${tradeId}\` not found or has expired.`);
    if (trade.toUserId !== userId) return message.reply('❌ That trade is not addressed to you.');

    const inventory = inv.loadInventory();

    // Check sender still has everything they offered
    const missingSenderItem = findMissingItem(inventory, trade.fromUserId, trade.offer);
    if (missingSenderItem) {
      trades.cancelTrade(tradeId);
      return message.reply(`❌ The sender no longer has ${describeItem(missingSenderItem)}. Trade cancelled.`);
    }

    // Check receiver has everything being asked (skip for free trades)
    if (trade.ask) {
      const missingReceiverItem = findMissingItem(inventory, userId, trade.ask);
      if (missingReceiverItem) {
        return message.reply(`❌ You don't have enough: you need ${describeItem(missingReceiverItem)} to accept this trade.`);
      }
    }

    // Execute the transfer / swap
    removeAllItems(inventory, trade.fromUserId, trade.offer);
    if (trade.ask) {
      removeAllItems(inventory, userId,           trade.ask);
      addAllItems(inventory,    trade.fromUserId, trade.ask);
    }
    addAllItems(inventory, userId, trade.offer);
    inv.saveInventory(inventory);
    const offerMsg = trade.offerMessage;
    trades.cancelTrade(tradeId);

    const fromUser = await client.users.fetch(trade.fromUserId).catch(() => ({ username: trade.fromUserId }));
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle(trade.ask ? '✅ Trade Complete!' : '🎁 Gift Accepted!')
      .setDescription(`**${fromUser.username}** → **${message.author.username}**`)
      .addFields(
        { name: `${message.author.username} received`, value: describeItems(trade.offer),                        inline: true },
        { name: `${fromUser.username} received`,       value: trade.ask ? describeItems(trade.ask) : '🆓 Nothing', inline: true },
      );

    if (offerMsg) {
      const updatedEmbed = EmbedBuilder.from(offerMsg.embeds[0])
        .setFooter({ text: `✅ Trade accepted by ${message.author.username}` })
        .setColor(0x2ecc71);
      offerMsg.edit({ embeds: [updatedEmbed] }).catch(() => {});
    }

    return message.reply({ embeds: [embed] });
  }

  // ── decline | dec ─────────────────────────────────────────
  if (command === 'decline' || command === 'dec') {
    const tradeId = args[0];
    if (!tradeId) return message.reply('Usage: `ZP decline <tradeId>` or `ZP dec <tradeId>`');

    const trade = trades.getTrade(tradeId);
    if (!trade) return message.reply(`❌ Trade \`${tradeId}\` not found or already expired.`);
    if (trade.toUserId !== userId && trade.fromUserId !== userId) {
      return message.reply('❌ You are not part of that trade.');
    }

    const offerMsg = trade.offerMessage;
    trades.cancelTrade(tradeId);

    if (offerMsg) {
      const updatedEmbed = EmbedBuilder.from(offerMsg.embeds[0])
        .setFooter({ text: `🚫 Trade cancelled` })
        .setColor(0x888888);
      offerMsg.edit({ embeds: [updatedEmbed] }).catch(() => {});
    }

    return message.reply(`🚫 Trade \`${tradeId}\` has been cancelled.`);
  }

  // ── trades ────────────────────────────────────────────────
  if (command === 'trades') {
    const pending = trades.getTradesForUser(userId);
    if (pending.length === 0) {
      return message.reply('📭 You have no pending trade offers.');
    }

    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle('📬 Pending Trade Offers');

    for (const trade of pending) {
      const fromUser = await client.users.fetch(trade.fromUserId).catch(() => ({ username: trade.fromUserId }));
      embed.addFields({
        name:  `${trade.ask ? 'Trade' : 'Gift'} \`${trade.tradeId}\` — from ${fromUser.username}`,
        value: [
          `They offer: ${describeItem(trade.offer)}`,
          `They want:  ${trade.ask ? describeItem(trade.ask) : '🆓 Nothing (free gift)'}`,
          `\`ZP a ${trade.tradeId}\`  •  \`ZP dec ${trade.tradeId}\``,
        ].join('\n'),
        inline: false,
      });
    }

    return message.reply({ embeds: [embed] });
  }

  // ── balance | bal ─────────────────────────────────────────
  if (command === 'balance' || command === 'bal') {
    const target      = message.mentions.users.first() ?? message.author;
    const inventory   = inv.loadInventory();
    const yen         = inv.getYen(inventory, target.id);
    const stars       = inv.getStars(inventory, target.id);
    const candyTokens = inv.getCandyTokens(inventory, target.id);
    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle(`💰 ${target.username}'s Balance`)
      .addFields(
        { name: '💴 Yen',          value: `¥${yen.toLocaleString()}`,         inline: true },
        { name: '⭐ Stars',        value: `${stars.toLocaleString()}`,         inline: true },
        { name: '🍬 Candy Tokens', value: `${candyTokens.toLocaleString()}`,   inline: true },
      )
      .setFooter({ text: 'Use ZP trade to exchange currencies with other players' });
    return message.reply({ embeds: [embed] });
  }

  // ── Admin-only commands ───────────────────────────────────
  if (isAdmin(userId)) {
    if (command === 'setrarity') {
      const target = args[0]?.toUpperCase();
      if (!target) {
        const current = adminRarityOverride
          ? `Currently locked to **${rarityMeta(adminRarityOverride).label}**`
          : 'Currently using normal rates';
        return message.reply(`Usage: \`ZP setrarity <${Object.keys(config.RARITY_META).join(' | ')} | reset>\`\n${current}`);
      }
      if (target === 'RESET') {
        adminRarityOverride = null;
        return message.reply('🔧 Rarity override cleared — back to normal pull rates.');
      }
      if (!config.RARITY_META[target]) {
        return message.reply(`❌ Unknown rarity. Valid options: ${Object.keys(config.RARITY_META).join(', ')}`);
      }
      adminRarityOverride = target;
      return message.reply(`🔧 Rarity locked to **${rarityMeta(target).emoji} ${rarityMeta(target).label}** — use \`ZP setrarity reset\` to clear.`);
    }

    if (command === 'setplating') {
      const input = args[0]?.toLowerCase();
      if (!input) {
        const current = adminPlatingOverride
          ? `Currently forcing **${adminPlatingOverride.emoji} ${adminPlatingOverride.label}** platings`
          : 'Currently using normal 0.1% plating odds';
        const tierIds = config.PLATING_TIERS.map(t => t.id).join(' | ');
        return message.reply(`Usage: \`ZP setplating <${tierIds} | reset>\`\n${current}`);
      }
      if (input === 'reset') {
        adminPlatingOverride = null;
        return message.reply('🔧 Plating override cleared — back to normal 0.1% drop rate.');
      }
      const tier = platingById(input);
      if (!tier) {
        return message.reply(`❌ Unknown plating tier \`${input}\`. Valid tiers: ${config.PLATING_TIERS.map(t => t.id).join(', ')}`);
      }
      adminPlatingOverride = tier;
      return message.reply(`🔧 Plating override set to **${tier.emoji} ${tier.label}** — every pull will now drop this plating. Use \`ZP setplating reset\` to clear.`);
    }

    if (command === 'giveyen') {
      const target = message.mentions.users.first() ?? message.author;
      const amount = parseInt(args.find(a => !a.startsWith('<@')), 10);
      if (isNaN(amount) || amount <= 0) return message.reply('Usage: `ZP giveyen <amount>` or `ZP giveyen @user <amount>`');
      const inventory = inv.loadInventory();
      inv.addYen(inventory, target.id, amount);
      inv.saveInventory(inventory);
      return message.reply(`🔧 Added **¥${amount.toLocaleString()} Yen** to **${target.username}**. New balance: ¥${inv.getYen(inventory, target.id).toLocaleString()}`);
    }

    if (command === 'givestars') {
      const target = message.mentions.users.first() ?? message.author;
      const amount = parseInt(args.find(a => !a.startsWith('<@')), 10);
      if (isNaN(amount) || amount <= 0) return message.reply('Usage: `ZP givestars <amount>` or `ZP givestars @user <amount>`');
      const inventory = inv.loadInventory();
      inv.addStars(inventory, target.id, amount);
      inv.saveInventory(inventory);
      return message.reply(`🔧 Added **⭐ ${amount.toLocaleString()} Stars** to **${target.username}**. New balance: ${inv.getStars(inventory, target.id).toLocaleString()}`);
    }

    if (command === 'givecandytokens' || command === 'givecandy') {
      const target = message.mentions.users.first() ?? message.author;
      const amount = parseInt(args.find(a => !a.startsWith('<@')), 10);
      if (isNaN(amount) || amount <= 0) return message.reply('Usage: `ZP givecandytokens <amount>` or `ZP givecandytokens @user <amount>`');
      const inventory = inv.loadInventory();
      inv.addCandyTokens(inventory, target.id, amount);
      inv.saveInventory(inventory);
      return message.reply(`🔧 Given **🍬 ×${amount.toLocaleString()} Candy Token${amount === 1 ? '' : 's'}** to **${target.username}**. They now have ${inv.getCandyTokens(inventory, target.id).toLocaleString()}.`);
    }

    if (command === 'giveitem') {
      const target = message.mentions.users.first() ?? message.author;
      const itemId = args.find(a => !a.startsWith('<@'))?.toLowerCase();
      if (!itemId) return message.reply(`Usage: \`ZP giveitem @user <itemId>\`\nAvailable items: ${config.ITEMS.map(i => `\`${i.id}\``).join(', ')}`);
      const item = config.ITEMS.find(i => i.id === itemId);
      if (!item) return message.reply(`❌ Unknown item \`${itemId}\`. Valid items: ${config.ITEMS.map(i => `\`${i.id}\``).join(', ')}`);
      const inventory = inv.loadInventory();
      inv.addItem(inventory, target.id, itemId);
      inv.saveInventory(inventory);
      return message.reply(`🔧 Gave **${item.emoji} ${item.name}** to **${target.username}**. They can use it with \`ZP use ${itemId}\`.`);
    }

    if (command === 'resetcooldown') {
      setCharges(userId, config.MAX_PULL_CHARGES, Date.now());
      return message.reply(`🔧 Pull charges restored to **${config.MAX_PULL_CHARGES}**.`);
    }
  }

  // ── Unknown command ───────────────────────────────────────
  return message.reply(`❓ Unknown command. Use \`ZP help\` or \`ZP h\` to see all commands.`);
});

// ── Login ─────────────────────────────────────────────────
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ DISCORD_TOKEN not set in environment!');
  process.exit(1);
}
client.login(token);
