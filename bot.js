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
//    ZP inventory  (inv)                    – view character shards & platings
//    ZP card <id>  (c <id>)                 – inspect a card
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

const config    = require('./config');
const { CARDS, pullCard } = require('./cards');
const inv       = require('./inventory');
const trades    = require('./trades');
const imgCache  = require('./imageCache');

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
 * Returns deterministic { hp, dmg } for a card based on its ID.
 * Same card always gets the same stats; they scale within the
 * rarity's range defined in config.STAT_RANGES.
 */
function getCardStats(card) {
  // Simple deterministic hash of the card ID
  let hash = 0;
  for (const ch of card.id) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  const t = (hash >>> 0) % 1000 / 1000; // 0.000 – 0.999
  const range = config.STAT_RANGES[card.rarity] ?? config.STAT_RANGES['R'];
  const hp  = Math.round(range.hpMin  + t * (range.hpMax  - range.hpMin));
  const dmg = Math.round(range.dmgMin + t * (range.dmgMax - range.dmgMin));
  return { hp, dmg };
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
    const card = lookupCard(item.id);
    return `🔮 **×${item.amount}** ${card?.name ?? item.id} shard${item.amount === 1 ? '' : 's'}`;
  }
  if (item.type === 'plating') {
    const tier = platingById(item.id);
    return `${tier?.emoji ?? '🪙'} **×${item.amount}** ${tier?.label ?? item.id} plating${item.amount === 1 ? '' : 's'}`;
  }
  if (item.type === 'yen')   return `💴 **¥${item.amount.toLocaleString()}** Yen`;
  if (item.type === 'stars') return `⭐ **${item.amount.toLocaleString()}** Star${item.amount === 1 ? '' : 's'}`;
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

// ── Misc helpers ──────────────────────────────────────────

function rarityMeta(rarity) {
  return config.RARITY_META[rarity] ?? { label: rarity, emoji: '❔', color: 0xffffff, stars: '' };
}

function cardEmbed(card, title, footer) {
  const meta  = rarityMeta(card.rarity);
  const stats = getCardStats(card);
  const embed = new EmbedBuilder()
    .setColor(meta.color)
    .setTitle(title ?? `${meta.emoji} ${card.name}`)
    .addFields(
      { name: 'Series', value: card.series,                    inline: true },
      { name: 'Rarity', value: `${meta.emoji} ${meta.label}`, inline: true },
      { name: 'Stars',  value: meta.stars || '—',              inline: true },
      { name: '❤️ Health', value: `${stats.hp}`,              inline: true },
      { name: '⚔️ Damage', value: `${stats.dmg}`,             inline: true },
    );
  const img = imgCache.getImage(card.id) ?? card.image ?? null;
  if (img)    embed.setThumbnail(img);
  if (footer) embed.setFooter({ text: footer });
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
  const stats     = getCardStats(card);
  const shards    = inv.getCharacterShards(inventory, targetUser.id)[card.id] ?? 0;
  const filterTag = filter ? ` • Filter: "${filter}"` : '';
  const shardTag  = shards > 0 ? ` • 🔮 ×${shards} shard${shards === 1 ? '' : 's'}` : '';

  const embed = new EmbedBuilder()
    .setColor(meta.color)
    .setTitle(`${meta.emoji} ${card.name}`)
    .setDescription(`🗂️ **${targetUser.username}'s Collection**`)
    .addFields(
      { name: 'Series',      value: card.series,                    inline: true },
      { name: 'Rarity',      value: `${meta.emoji} ${meta.label}`, inline: true },
      { name: 'Stars',       value: meta.stars || '—',              inline: true },
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

client.once('ready', () => {
  initPullCharges();
  console.log(`✅ test Bot online as ${client.user.tag}`);
  client.user.setActivity('ZP help', { type: 0 });
  // Fetch missing character images in the background (no await — non-blocking)
  imgCache.refreshMissing().catch(err => console.error('Image cache refresh error:', err));
});

// ── Button Interactions ───────────────────────────────────

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const parts = interaction.customId.split('|');

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
    const rarityList = Object.entries(config.RARITY_META)
      .map(([k, v]) => `${v.emoji} **${v.label}** (${k})`)
      .join('  •  ');
    const platingList = config.PLATING_TIERS.map(t => `${t.emoji} **${t.label}**`).join('  •  ');

    const embed = new EmbedBuilder()
      .setColor(0x00FFD1)
      .setTitle('📖 test Bot — Commands')
      .setDescription('Pull anime & game character cards, collect them, and trade shards, platings & currencies!')
      .addFields(
        { name: '`ZP pull` / `ZP p`',                          value: `Pull a random card (${config.MAX_PULL_CHARGES} charges, +1 every ${config.PULL_COOLDOWN_SECONDS}s)`, inline: false },
        { name: '`ZP allpull` / `ZP ap`',                      value: 'Spend all pull charges at once and see a full summary',                          inline: false },
        { name: '`ZP allpull reset` / `ZP ap reset`',          value: '🍬 Spend all charges then instantly reset to 20 (costs 1 Candy Token)',          inline: false },
        { name: '`ZP reset`',                                   value: '🍬 Use a Candy Token to instantly reset your pulls back to 20',                  inline: false },
        { name: '`ZP collection` / `ZP col`',                  value: 'Browse your card collection one card at a time',                                 inline: false },
        { name: '`ZP col [rarity or name]`',                   value: 'Filter by rarity code (e.g. `LT`) or name/series keyword',                       inline: false },
        { name: '`ZP col @user [filter]`',                     value: "Browse another player's collection",                                              inline: false },
        { name: '`ZP all` / `ZP all [filter]`',               value: 'Browse every card in the game (sorted by rarity, then name). Filter by rarity code or name/series keyword', inline: false },
        { name: '`ZP inventory` / `ZP inv`',                   value: 'View your character shards, platings, Yen and Stars',                             inline: false },
        { name: '`ZP balance` / `ZP bal`',                     value: 'Check your 💴 Yen and ⭐ Stars balance (add @user to check theirs)',              inline: false },
        { name: '`ZP card <cardId>` / `ZP c <cardId>`',        value: 'Inspect a specific card by ID',                                                   inline: false },
        {
          name: '`ZP trade @user <offer> [for <ask>]`',
          value: [
            'Send a trade or instant gift. Omit `for <ask>` to gift instantly. Separate multiple items with commas.',
            '**Item formats:** `shard:<cardId>:<amount>` • `plating:<tier>:<amount>` • `yen:<amount>` • `stars:<amount>`',
            '**Examples:**',
            '`ZP trade @Alice shard:naruto_r:3,yen:200` — instant gift of multiple items',
            '`ZP trade @Alice yen:500 for stars:100` — single-item swap (requires acceptance)',
            '`ZP trade @Alice shard:naruto_r:3,plating:gold:1 for yen:1000,stars:50` — multi-item trade',
          ].join('\n'),
          inline: false,
        },
        { name: '`ZP accept <tradeId>` / `ZP a <tradeId>`',    value: 'Accept a trade offer addressed to you',                                          inline: false },
        { name: '`ZP decline <tradeId>` / `ZP dec <tradeId>`', value: 'Decline or cancel a trade',                                                      inline: false },
        { name: '`ZP trades`',                                  value: 'View pending trade/gift offers sent to you',                                     inline: false },
      )
      .addFields(
        { name: '✨ Rarities',  value: rarityList,                                                                        inline: false },
        { name: '🪙 Platings', value: platingList + `\n0.1% chance per pull • Dupes give character shards`,              inline: false },
        { name: '💰 Currencies', value: '💴 **Yen** and ⭐ **Stars** — earned via events & traded between players',      inline: false },
      )
      .setFooter({ text: 'Dupes earn character shards. Trades expire after 5 minutes.' });

    if (isAdmin(userId)) {
      const tierIds = config.PLATING_TIERS.map(t => t.id).join(' | ');
      embed.addFields({
        name: '🔧 Admin Commands',
        value: [
          `\`ZP setrarity <${Object.keys(config.RARITY_META).join(' | ')}>\` — Force pulls to a rarity`,
          `\`ZP setrarity reset\` — Clear rarity override`,
          `\`ZP setplating <${tierIds}>\` — Force pulls to always drop a plating of that tier`,
          `\`ZP setplating reset\` — Clear plating override`,
          `\`ZP resetcooldown\` — Restore pull charges to max`,
          `\`ZP giveyen [@user] <amount>\` — Add Yen to yourself or a user`,
          `\`ZP givestars [@user] <amount>\` — Add Stars to yourself or a user`,
          `\`ZP givecandytokens [@user] <amount>\` — Give 🍬 Candy Tokens to yourself or a user`,
        ].join('\n'),
        inline: false,
      });
    }

    return message.reply({ embeds: [embed] });
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

    const meta        = rarityMeta(card.rarity);
    const remaining   = charges - 1;
    const chargeInfo  = remaining > 0
      ? `${remaining} pull${remaining === 1 ? '' : 's'} remaining`
      : `No pulls left — next charge in ${config.PULL_COOLDOWN_SECONDS}s`;
    const overrideNote = (isAdmin(userId) && adminRarityOverride) ? ` • 🔧 Rarity locked to ${meta.label}` : '';
    const platingNote  = plating ? ` • ${plating.emoji} **${plating.label} Plating** obtained!` : '';

    if (isDupe) {
      const embed = cardEmbed(card,
        `♻️ Duplicate — ${card.name}`,
        `Already in your collection! +1 ${card.name} Shard • ${chargeInfo}${overrideNote}${platingNote}`
      );
      embed.setColor(plating ? plating.color : 0x888888);
      return message.reply({ embeds: [embed] });
    }

    const embed = cardEmbed(card,
      `${meta.emoji} You pulled — ${card.name}!`,
      `Added to your collection! • ${meta.label} • ${chargeInfo}${overrideNote}${platingNote}`
    );
    if (plating) embed.setColor(plating.color);
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
    const newCards  = [];
    const dupes     = [];
    const platings  = [];

    for (let i = 0; i < charges; i++) {
      const { card, isDupe, plating } = executeSinglePull(inventory, userId);
      if (isDupe) dupes.push(card);
      else        newCards.push(card);
      if (plating) platings.push(plating);
    }

    inv.saveInventory(inventory);

    const overrideNote = (isAdmin(userId) && adminRarityOverride)
      ? ` • 🔧 Rarity locked to ${rarityMeta(adminRarityOverride).label}` : '';

    const embed = new EmbedBuilder()
      .setColor(0x00FFD1)
      .setTitle(`🎴 All Pull — ${charges} card${charges === 1 ? '' : 's'} pulled${overrideNote}`);

    // New cards
    if (newCards.length > 0) {
      const lines = newCards.map(c => {
        const m = rarityMeta(c.rarity);
        return `${m.emoji} **${c.name}** *(${m.label})*`;
      });
      let chunk = '', fieldCount = 0;
      for (const line of lines) {
        if ((chunk + '\n' + line).length > 1000) {
          embed.addFields({ name: fieldCount === 0 ? `✨ New Cards (${newCards.length})` : '​', value: chunk.trim(), inline: false });
          chunk = line; fieldCount++;
        } else {
          chunk = chunk ? chunk + '\n' + line : line;
        }
      }
      if (chunk) embed.addFields({ name: fieldCount === 0 ? `✨ New Cards (${newCards.length})` : '​', value: chunk.trim(), inline: false });
    }

    // Dupes
    if (dupes.length > 0) {
      const grouped = {};
      for (const c of dupes) {
        if (!grouped[c.id]) grouped[c.id] = { card: c, count: 0 };
        grouped[c.id].count++;
      }
      const lines = Object.values(grouped).map(({ card: c, count }) => {
        const m = rarityMeta(c.rarity);
        return `${m.emoji} ${c.name}${count > 1 ? ` ×${count}` : ''} → +${count} 🔮 shard${count === 1 ? '' : 's'}`;
      });
      let chunk = '', fieldCount = 0;
      for (const line of lines) {
        if ((chunk + '\n' + line).length > 1000) {
          embed.addFields({ name: fieldCount === 0 ? `♻️ Duplicates (${dupes.length})` : '​', value: chunk.trim(), inline: false });
          chunk = line; fieldCount++;
        } else {
          chunk = chunk ? chunk + '\n' + line : line;
        }
      }
      if (chunk) embed.addFields({ name: fieldCount === 0 ? `♻️ Duplicates (${dupes.length})` : '​', value: chunk.trim(), inline: false });
    }

    // Platings
    if (platings.length > 0) {
      const grouped = {};
      for (const p of platings) {
        if (!grouped[p.id]) grouped[p.id] = { tier: p, count: 0 };
        grouped[p.id].count++;
      }
      embed.addFields({
        name: '🪙 Platings Obtained!',
        value: Object.values(grouped)
          .map(({ tier, count }) => `${tier.emoji} **${tier.label}**${count > 1 ? ` ×${count}` : ''}`)
          .join('\n'),
        inline: false,
      });
      const rarityOrder = ['diamond', 'gold', 'silver', 'bronze'];
      for (const id of rarityOrder) {
        if (grouped[id]) { embed.setColor(grouped[id].tier.color); break; }
      }
    }

    if (withReset) {
      setCharges(userId, config.MAX_PULL_CHARGES, Date.now());
      embed.addFields({ name: '🍬 Candy Token Used', value: `Pulls reset to **${config.MAX_PULL_CHARGES}**!`, inline: false });
      embed.setFooter({ text: `Charges spent: ${charges} • Pulls instantly reset to ${config.MAX_PULL_CHARGES} via Candy Token` });
    } else {
      embed.setFooter({ text: `Charges spent: ${charges} • Next charge in ${config.PULL_COOLDOWN_SECONDS}s` });
    }
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

    const charShards     = inv.getCharacterShards(inventory, target.id);
    const shardEntries   = Object.entries(charShards).filter(([, n]) => n > 0);
    const platingsObj    = inv.getPlatings(inventory, target.id);
    const platingEntries = Object.entries(platingsObj).filter(([, n]) => n > 0);
    const yen            = inv.getYen(inventory, target.id);
    const stars          = inv.getStars(inventory, target.id);
    const candyTokens    = inv.getCandyTokens(inventory, target.id);

    const hasAnything = shardEntries.length > 0 || platingEntries.length > 0 || yen > 0 || stars > 0 || candyTokens > 0;

    if (!hasAnything) {
      return message.reply(
        `${target.id === userId ? 'You have' : `**${target.username}** has`} nothing in your inventory yet. Pull duplicates to earn character shards, and hope for a plating drop!`
      );
    }

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle(`🎒 ${target.username}'s Inventory`);

    embed.addFields(
      { name: '💴 Yen',           value: `¥${yen.toLocaleString()}`,           inline: true },
      { name: '⭐ Stars',         value: `${stars.toLocaleString()}`,           inline: true },
      { name: '🍬 Candy Tokens',  value: `${candyTokens.toLocaleString()}`,     inline: true },
    );

    if (platingEntries.length > 0) {
      const totalPlatings = platingEntries.reduce((s, [, n]) => s + n, 0);
      embed.addFields({
        name: `🪙 Platings (${totalPlatings} total)`,
        value: config.PLATING_TIERS
          .filter(t => platingsObj[t.id] > 0)
          .map(t => `${t.emoji} **${t.label}** — ×${platingsObj[t.id]}`)
          .join('\n'),
        inline: false,
      });
    }

    if (shardEntries.length > 0) {
      const grouped = {};
      for (const [key] of Object.entries(config.RARITY_META)) grouped[key] = [];
      for (const [cardId, count] of shardEntries) {
        const card   = lookupCard(cardId);
        const rarity = card?.rarity ?? 'R';
        if (!grouped[rarity]) grouped[rarity] = [];
        grouped[rarity].push({ name: card?.name ?? cardId, count });
      }

      const totalShards = shardEntries.reduce((s, [, n]) => s + n, 0);
      embed.addFields({ name: `🔮 Character Shards (${totalShards} total)`, value: '​', inline: false });

      for (const [rarity, group] of Object.entries(grouped)) {
        if (group.length === 0) continue;
        const meta = rarityMeta(rarity);
        embed.addFields({
          name:  `${meta.emoji} ${meta.label}`,
          value: group.map(s => `${s.name} — ×${s.count}`).join('\n'),
          inline: true,
        });
      }
    }

    embed.setFooter({ text: 'Character shards from duplicate pulls • Platings from 0.1% pull luck' });
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
    const embed     = cardEmbed(card);
    const status    = owned
      ? `✅ In your collection${shards > 0 ? ` • 🔮 ×${shards} shard${shards === 1 ? '' : 's'}` : ''}`
      : '❌ Not in your collection';
    embed.setFooter({ text: status });
    return message.reply({ embeds: [embed] });
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
    const target    = message.mentions.users.first() ?? message.author;
    const inventory = inv.loadInventory();
    const yen       = inv.getYen(inventory, target.id);
    const stars     = inv.getStars(inventory, target.id);
    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle(`💰 ${target.username}'s Balance`)
      .addFields(
        { name: '💴 Yen',   value: `¥${yen.toLocaleString()}`,   inline: true },
        { name: '⭐ Stars', value: `${stars.toLocaleString()}`,   inline: true },
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
