// ============================================================
//  test BOT — MAIN
//  Commands:
//    ZP pull  (p)                           – pull a random card
//    ZP allpull  (ap)                       – pull all charges at once
//    ZP collection  (col)                   – browse your card collection
//    ZP collection [filter]                 – filter by rarity or name
//    ZP collection @user [filter]           – view someone else's cards
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
 * Parse "shard:naruto_r:3" or "plating:gold:1"
 * Returns { type, id, amount } or null on bad input.
 */
function parseTradeItem(str) {
  const parts = str.split(':');
  if (parts.length !== 3) return null;
  const [type, id, amountStr] = parts;
  const amount = parseInt(amountStr, 10);
  if (!['shard', 'plating'].includes(type)) return null;
  if (isNaN(amount) || amount <= 0 || !Number.isInteger(amount)) return null;
  return { type, id: id.toLowerCase(), amount };
}

/**
 * Validate that type + id actually refer to something real.
 */
function validateTradeItem(item) {
  if (item.type === 'shard')   return !!lookupCard(item.id);
  if (item.type === 'plating') return !!platingById(item.id);
  return false;
}

/**
 * Human-readable label for a trade item.
 */
function describeItem(item) {
  if (item.type === 'shard') {
    const card = lookupCard(item.id);
    const name = card?.name ?? item.id;
    return `🔮 **×${item.amount}** ${name} shard${item.amount === 1 ? '' : 's'}`;
  }
  if (item.type === 'plating') {
    const tier = platingById(item.id);
    return `${tier?.emoji ?? '🪙'} **×${item.amount}** ${tier?.label ?? item.id} plating${item.amount === 1 ? '' : 's'}`;
  }
  return '?';
}

/**
 * Check whether a user currently holds enough of a trade item.
 */
function userHasItem(inventory, userId, item) {
  if (item.type === 'shard') {
    return (inv.getCharacterShards(inventory, userId)[item.id] ?? 0) >= item.amount;
  }
  if (item.type === 'plating') {
    return (inv.getPlatings(inventory, userId)[item.id] ?? 0) >= item.amount;
  }
  return false;
}

/**
 * Remove items from a user (returns false if insufficient).
 */
function removeItems(inventory, userId, item) {
  if (item.type === 'shard')   return inv.removeCharacterShards(inventory, userId, item.id, item.amount);
  if (item.type === 'plating') return inv.removePlating(inventory, userId, item.id, item.amount);
  return false;
}

/**
 * Add items to a user.
 */
function addItems(inventory, userId, item) {
  if (item.type === 'shard')   inv.addCharacterShards(inventory, userId, item.id, item.amount);
  if (item.type === 'plating') inv.addPlatings(inventory, userId, item.id, item.amount);
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
  if (card.image) embed.setThumbnail(card.image);
  if (footer)     embed.setFooter({ text: footer });
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

function buildCollectionPage(authorId, targetUser, cards, page, filter, inventory) {
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
    )
    .setFooter({ text: `Card ${page + 1} of ${filtered.length}${filterTag}${shardTag}` });

  if (card.image) embed.setThumbnail(card.image);

  const base = `col|${authorId}|${targetUser.id}|%page%|${filter}`;
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(base.replace('%page%', page - 1))
      .setLabel('◀ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`col|${authorId}|${targetUser.id}|close|${filter}`)
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
});

// ── Button Interactions ───────────────────────────────────

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const parts = interaction.customId.split('|');
  if (parts[0] !== 'col') return;

  const [, authorId, targetId, pageStr, ...filterParts] = parts;
  const filter = filterParts.join('|');

  if (interaction.user.id !== authorId) {
    return interaction.reply({ content: '❌ These buttons are not for you.', ephemeral: true });
  }

  if (pageStr === 'close') {
    return interaction.update({ components: [] });
  }

  const page       = parseInt(pageStr, 10);
  const targetUser = await client.users.fetch(targetId).catch(() => null);
  if (!targetUser) return interaction.reply({ content: '❌ Could not find that user.', ephemeral: true });

  const inventory = inv.loadInventory();
  const cards     = inv.getCards(inventory, targetId);
  const { embed, components } = buildCollectionPage(authorId, targetUser, cards, page, filter, inventory);

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
      .setDescription('Pull anime & game character cards, collect them, and trade shards & platings!')
      .addFields(
        { name: '`ZP pull` / `ZP p`',                          value: `Pull a random card (${config.MAX_PULL_CHARGES} charges, +1 every ${config.PULL_COOLDOWN_SECONDS}s)`, inline: false },
        { name: '`ZP allpull` / `ZP ap`',                      value: 'Spend all pull charges at once and see a full summary',                          inline: false },
        { name: '`ZP collection` / `ZP col`',                  value: 'Browse your card collection one card at a time',                                 inline: false },
        { name: '`ZP col [rarity or name]`',                   value: 'Filter by rarity code (e.g. `LT`) or name/series keyword',                       inline: false },
        { name: '`ZP col @user [filter]`',                     value: "Browse another player's collection",                                              inline: false },
        { name: '`ZP inventory` / `ZP inv`',                   value: 'View your character shards and platings',                                         inline: false },
        { name: '`ZP card <cardId>` / `ZP c <cardId>`',        value: 'Inspect a specific card by ID',                                                   inline: false },
        {
          name: '`ZP trade @user <offer> for <ask>`',
          value: [
            'Offer character shards or platings in exchange for the same.',
            '**Item format:** `shard:<cardId>:<amount>` or `plating:<tier>:<amount>`',
            '**Tiers:** `bronze` `silver` `gold` `diamond`',
            '**Examples:**',
            '`ZP trade @Alice shard:naruto_r:3 for plating:gold:1`',
            '`ZP trade @Bob plating:bronze:2 for shard:goku_r:5`',
            '`ZP trade @Eve shard:sasuke_e:1 for shard:zoro_e:1`',
          ].join('\n'),
          inline: false,
        },
        { name: '`ZP accept <tradeId>` / `ZP a <tradeId>`',    value: 'Accept a trade offer sent to you',                                               inline: false },
        { name: '`ZP decline <tradeId>` / `ZP dec <tradeId>`', value: 'Decline or cancel a trade',                                                      inline: false },
        { name: '`ZP trades`',                                  value: 'View pending trade offers sent to you',                                           inline: false },
      )
      .addFields(
        { name: '✨ Rarities',  value: rarityList,                                                                        inline: false },
        { name: '🪙 Platings', value: platingList + `\n0.1% chance per pull • Dupes give character shards`,              inline: false },
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
    const { charges, lastRefill } = getCharges(userId);

    if (charges <= 0) {
      const secsUntilNext = Math.ceil(config.PULL_COOLDOWN_SECONDS - (Date.now() - lastRefill) / 1000);
      return message.reply(`⏳ No pulls left! Next charge in **${secsUntilNext}s**. Charges refill 1 every **${config.PULL_COOLDOWN_SECONDS}s** (max **${config.MAX_PULL_CHARGES}**).`);
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

    embed.setFooter({ text: `Charges spent: ${charges} • Next charge in ${config.PULL_COOLDOWN_SECONDS}s` });
    return message.reply({ embeds: [embed] });
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

    const { embed, components } = buildCollectionPage(userId, target, cards, 0, filter, inventory);
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

    if (shardEntries.length === 0 && platingEntries.length === 0) {
      return message.reply(
        `${target.id === userId ? 'You have' : `**${target.username}** has`} nothing in your inventory yet. Pull duplicates to earn character shards, and hope for a plating drop!`
      );
    }

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle(`🎒 ${target.username}'s Inventory`);

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
        '❌ You must mention a user.\nUsage: `ZP trade @user <offer> for <ask>`\n' +
        'Item format: `shard:<cardId>:<amount>` or `plating:<tier>:<amount>`\n' +
        'Example: `ZP trade @Alice shard:naruto_r:3 for plating:gold:1`'
      );
    }
    if (toUser.id === userId) return message.reply('❌ You cannot trade with yourself.');
    if (toUser.bot)           return message.reply('❌ You cannot trade with a bot.');

    // Strip mention tokens and find "for" separator
    const tradeArgs  = args.filter(a => !a.startsWith('<@'));
    const forIndex   = tradeArgs.findIndex(a => a.toLowerCase() === 'for');

    if (forIndex === -1 || forIndex === 0 || forIndex === tradeArgs.length - 1) {
      return message.reply(
        '❌ Invalid format. Use: `ZP trade @user <offer> for <ask>`\n' +
        'Item format: `shard:<cardId>:<amount>` or `plating:<tier>:<amount>`\n' +
        'Example: `ZP trade @Alice shard:naruto_r:3 for plating:gold:1`'
      );
    }

    const offerStr = tradeArgs.slice(0, forIndex).join('');
    const askStr   = tradeArgs.slice(forIndex + 1).join('');

    const offer = parseTradeItem(offerStr);
    const ask   = parseTradeItem(askStr);

    if (!offer) return message.reply(`❌ Couldn't parse your offer \`${offerStr}\`.\nFormat: \`shard:<cardId>:<amount>\` or \`plating:<tier>:<amount>\``);
    if (!ask)   return message.reply(`❌ Couldn't parse your ask \`${askStr}\`.\nFormat: \`shard:<cardId>:<amount>\` or \`plating:<tier>:<amount>\``);

    if (!validateTradeItem(offer)) {
      return message.reply(offer.type === 'shard'
        ? `❌ Unknown card ID \`${offer.id}\`. Check \`ZP col\` for valid IDs.`
        : `❌ Unknown plating tier \`${offer.id}\`. Valid tiers: ${config.PLATING_TIERS.map(t => t.id).join(', ')}`
      );
    }
    if (!validateTradeItem(ask)) {
      return message.reply(ask.type === 'shard'
        ? `❌ Unknown card ID \`${ask.id}\`. Check \`ZP col\` for valid IDs.`
        : `❌ Unknown plating tier \`${ask.id}\`. Valid tiers: ${config.PLATING_TIERS.map(t => t.id).join(', ')}`
      );
    }

    const inventory = inv.loadInventory();

    if (!userHasItem(inventory, userId, offer)) {
      return message.reply(`❌ You don't have enough to offer. You need ${describeItem(offer)}.`);
    }

    const tradeId = trades.createTrade({ fromUserId: userId, toUserId: toUser.id, offer, ask });

    const embed = new EmbedBuilder()
      .setColor(0x4A90D9)
      .setTitle('🤝 Trade Offer Sent')
      .setDescription(`**${message.author.username}** → **${toUser.username}**`)
      .addFields(
        { name: 'Offering',  value: describeItem(offer), inline: true },
        { name: 'Asking for', value: describeItem(ask),  inline: true },
        { name: 'Trade ID',  value: `\`${tradeId}\``,    inline: true },
      )
      .setFooter({ text: `${toUser.username}: use  ZP a ${tradeId}  or  ZP dec ${tradeId}  • Expires in 5 min` });

    return message.reply({ content: `${toUser}`, embeds: [embed] });
  }

  // ── accept | a ────────────────────────────────────────────
  if (command === 'accept' || command === 'a') {
    const tradeId = args[0];
    if (!tradeId) return message.reply('Usage: `ZP accept <tradeId>` or `ZP a <tradeId>`');

    const trade = trades.getTrade(tradeId);
    if (!trade) return message.reply(`❌ Trade \`${tradeId}\` not found or has expired.`);
    if (trade.toUserId !== userId) return message.reply('❌ That trade is not addressed to you.');

    const inventory = inv.loadInventory();

    // Check sender still has what they offered
    if (!userHasItem(inventory, trade.fromUserId, trade.offer)) {
      trades.cancelTrade(tradeId);
      return message.reply(`❌ The sender no longer has ${describeItem(trade.offer)}. Trade cancelled.`);
    }

    // Check receiver has what's being asked
    if (!userHasItem(inventory, userId, trade.ask)) {
      return message.reply(`❌ You don't have enough: you need ${describeItem(trade.ask)} to accept this trade.`);
    }

    // Execute the swap
    removeItems(inventory, trade.fromUserId, trade.offer);
    removeItems(inventory, userId,           trade.ask);
    addItems(inventory,    userId,           trade.offer);
    addItems(inventory,    trade.fromUserId, trade.ask);
    inv.saveInventory(inventory);
    trades.cancelTrade(tradeId);

    const fromUser = await client.users.fetch(trade.fromUserId).catch(() => ({ username: trade.fromUserId }));
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('✅ Trade Complete!')
      .setDescription(`**${fromUser.username}** ↔ **${message.author.username}**`)
      .addFields(
        { name: `${message.author.username} received`, value: describeItem(trade.offer), inline: true },
        { name: `${fromUser.username} received`,       value: describeItem(trade.ask),   inline: true },
      );

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

    trades.cancelTrade(tradeId);
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
        name:  `Trade \`${trade.tradeId}\` — from ${fromUser.username}`,
        value: [
          `They offer: ${describeItem(trade.offer)}`,
          `They want:  ${describeItem(trade.ask)}`,
          `\`ZP a ${trade.tradeId}\`  •  \`ZP dec ${trade.tradeId}\``,
        ].join('\n'),
        inline: false,
      });
    }

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
