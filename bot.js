// ============================================================
//  test BOT — MAIN
//  Commands:
//    ZP pull  (p)                       – pull a random card
//    ZP collection  (col)               – view your card collection
//    ZP collection @user  (col @user)   – view someone else's cards
//    ZP inventory  (inv)                – view your character shards
//    ZP card <id>  (c <id>)             – inspect a card
//    ZP shards  (sh)                    – check your trade shard balance
//    ZP trade @user <cardId> <shards>   – offer a trade
//    ZP accept <tradeId>  (a)           – accept a trade offer
//    ZP decline <tradeId>  (dec)        – decline a trade offer
//    ZP trades                          – view pending trades sent to you
//    ZP help  (h)                       – show all commands
//  Admin-only commands (user 833025999897755689):
//    ZP setrarity <rarity|reset>        – force your next pulls to a rarity
//    ZP giveshards <amount>             – add trade shards to your account
//    ZP resetcooldown                   – reset your pull charge to max
// ============================================================

require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

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

let adminRarityOverride = null;

function isAdmin(userId) {
  return userId === ADMIN_ID;
}

function pullCardForced(rarity) {
  const pool = CARDS.filter(c => c.rarity === rarity);
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : CARDS[0];
}

// ── Pull charges (in-memory Map, persisted to disk) ───────
// Fast in-memory lookups; only written to disk when charges change.
// Map<userId, { charges: number, lastRefill: number }>
const pullCharges = new Map();

/** Seed the in-memory Map from the saved inventory file at startup. */
function initPullCharges() {
  const data = inv.loadInventory();
  for (const [userId, bucket] of Object.entries(data.pullCharges || {})) {
    pullCharges.set(userId, bucket);
  }
}

/** Debounced async disk write — batches rapid-fire pulls into one write. */
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

  const elapsed    = now - bucket.lastRefill;
  const gained     = Math.floor(elapsed / regenMs);
  const charges    = Math.min(max, bucket.charges + gained);
  const lastRefill = bucket.lastRefill + gained * regenMs;

  return { charges, lastRefill };
}

function setCharges(userId, charges, lastRefill) {
  pullCharges.set(userId, { charges, lastRefill });
  schedulePersist();
}

// ── Helpers ───────────────────────────────────────────────

function rarityMeta(rarity) {
  return config.RARITY_META[rarity] ?? { label: rarity, emoji: '❔', color: 0xffffff, stars: '' };
}

function cardEmbed(card, title, footer) {
  const meta = rarityMeta(card.rarity);
  const embed = new EmbedBuilder()
    .setColor(meta.color)
    .setTitle(title ?? `${meta.emoji} ${card.name}`)
    .addFields(
      { name: 'Series',  value: card.series,                       inline: true },
      { name: 'Rarity',  value: `${meta.emoji} ${meta.label}`,    inline: true },
      { name: 'Stars',   value: meta.stars || '—',                 inline: true },
      { name: 'Flavour', value: `*${card.desc}*`,                  inline: false },
    );
  if (card.image) embed.setThumbnail(card.image);
  if (footer)     embed.setFooter({ text: footer });
  return embed;
}

function lookupCard(cardId) {
  return CARDS.find(c => c.id.toLowerCase() === cardId.toLowerCase()) ?? null;
}

// ── Ready ─────────────────────────────────────────────────

client.once('ready', () => {
  initPullCharges();
  console.log(`✅ test Bot online as ${client.user.tag}`);
  client.user.setActivity('ZP help', { type: 0 });
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
    const embed = new EmbedBuilder()
      .setColor(0x00FFD1)
      .setTitle('📖 test Bot — Commands')
      .setDescription('Pull anime & game character cards, collect them, and trade with others!')
      .addFields(
        { name: '`ZP pull` / `ZP p`',                                value: `Pull a random card (${config.MAX_PULL_CHARGES} charges, +1 every ${config.PULL_COOLDOWN_SECONDS}s)`, inline: false },
        { name: '`ZP collection` / `ZP col`',                        value: 'View your card collection',                        inline: false },
        { name: '`ZP collection @user` / `ZP col @user`',            value: "View another player's collection",                 inline: false },
        { name: '`ZP inventory` / `ZP inv`',                         value: 'View your character shards',                       inline: false },
        { name: '`ZP card <cardId>` / `ZP c <cardId>`',              value: 'Inspect a specific card',                          inline: false },
        { name: '`ZP shards` / `ZP sh`',                             value: 'Check your trade shard balance',                   inline: false },
        { name: '`ZP trade @user <cardId> <shards>`',                value: 'Offer a card in exchange for shards',              inline: false },
        { name: '`ZP accept <tradeId>` / `ZP a <tradeId>`',          value: 'Accept a trade offer',                             inline: false },
        { name: '`ZP decline <tradeId>` / `ZP dec <tradeId>`',       value: 'Decline a trade offer',                            inline: false },
        { name: '`ZP trades`',                                        value: 'View trade offers sent to you',                    inline: false },
      )
      .addFields({
        name: '✨ Rarities',
        value: Object.entries(config.RARITY_META)
          .map(([k, v]) => `${v.emoji} **${v.label}** (${k})`)
          .join('  •  '),
        inline: false,
      })
      .setFooter({ text: 'Dupes become character shards stored in your inventory. Trades expire after 5 minutes.' });

    if (isAdmin(userId)) {
      const rarityKeys = Object.keys(config.RARITY_META).join(' | ');
      embed.addFields({
        name: '🔧 Admin Commands',
        value: [
          `\`ZP setrarity <${rarityKeys}>\` — Force your pulls to a specific rarity`,
          `\`ZP setrarity reset\` — Clear rarity override (back to normal)`,
          `\`ZP giveshards <amount>\` — Add trade shards to your account`,
          `\`ZP resetcooldown\` — Restore your pull charges to max`,
        ].join('\n'),
        inline: false,
      });
    }

    return message.reply({ embeds: [embed] });
  }

  // ── pull | p ─────────────────────────────────────────────
  if (command === 'pull' || command === 'p') {
    const { charges, lastRefill } = getCharges(userId);

    if (charges <= 0) {
      const secsUntilNext = Math.ceil(config.PULL_COOLDOWN_SECONDS - (Date.now() - lastRefill) / 1000);
      return message.reply(`⏳ No pulls left! Next charge in **${secsUntilNext}s**. Charges refill 1 every **${config.PULL_COOLDOWN_SECONDS}s** (max **${config.MAX_PULL_CHARGES}**).`);
    }

    // Update charges in memory + schedule disk write
    setCharges(userId, charges - 1, lastRefill);

    const card = (isAdmin(userId) && adminRarityOverride)
      ? pullCardForced(adminRarityOverride)
      : pullCard();

    const inventory = inv.loadInventory();
    const { isDupe } = inv.addCardToInventory(inventory, userId, card, config.SHARD_VALUES);
    inv.saveInventory(inventory);

    const meta = rarityMeta(card.rarity);
    const remaining = charges - 1;
    const chargeInfo = remaining > 0
      ? `${remaining} pull${remaining === 1 ? '' : 's'} remaining`
      : `No pulls left — next charge in ${config.PULL_COOLDOWN_SECONDS}s`;
    const overrideNote = (isAdmin(userId) && adminRarityOverride)
      ? ` • 🔧 Rarity locked to ${meta.label}`
      : '';

    if (isDupe) {
      const embed = cardEmbed(card,
        `♻️ Duplicate — ${card.name}`,
        `Already in your collection! +1 ${card.name} Shard added to your inventory • ${chargeInfo}${overrideNote}`
      );
      embed.setColor(0x888888);
      return message.reply({ embeds: [embed] });
    }

    const embed = cardEmbed(card,
      `${meta.emoji} You pulled — ${card.name}!`,
      `Added to your collection! • ${meta.label} • ${chargeInfo}${overrideNote}`
    );
    return message.reply({ embeds: [embed] });
  }

  // ── collection | col ─────────────────────────────────────
  if (command === 'collection' || command === 'col') {
    const target    = message.mentions.users.first() ?? message.author;
    const inventory = inv.loadInventory();
    const cards     = inv.getCards(inventory, target.id);

    if (cards.length === 0) {
      return message.reply(`${target.id === userId ? 'You have' : `**${target.username}** has`} no cards yet. Use \`ZP pull\` to get started!`);
    }

    const grouped = {};
    for (const [key] of Object.entries(config.RARITY_META)) grouped[key] = [];
    for (const card of cards) {
      if (grouped[card.rarity]) grouped[card.rarity].push(card);
    }

    const embed = new EmbedBuilder()
      .setColor(0x4A90D9)
      .setTitle(`🗂️ ${target.username}'s Collection`)
      .setDescription(`**${cards.length}** card(s) collected`);

    for (const [rarity, group] of Object.entries(grouped)) {
      if (group.length === 0) continue;
      const meta = rarityMeta(rarity);
      embed.addFields({
        name:   `${meta.emoji} ${meta.label} (${group.length})`,
        value:  group.map(c => `\`${c.id}\` ${c.name}`).join('\n'),
        inline: false,
      });
    }

    embed.setFooter({ text: 'Use ZP c <id> to inspect a card • Use ZP inv to see your character shards' });
    return message.reply({ embeds: [embed] });
  }

  // ── inventory | inv ───────────────────────────────────────
  if (command === 'inventory' || command === 'inv') {
    const target     = message.mentions.users.first() ?? message.author;
    const inventory  = inv.loadInventory();
    const charShards = inv.getCharacterShards(inventory, target.id);
    const entries    = Object.entries(charShards).filter(([, count]) => count > 0);

    if (entries.length === 0) {
      return message.reply(`${target.id === userId ? 'You have' : `**${target.username}** has`} no character shards yet. Pull duplicates to earn them!`);
    }

    const grouped = {};
    for (const [key] of Object.entries(config.RARITY_META)) grouped[key] = [];
    for (const [cardId, count] of entries) {
      const card   = lookupCard(cardId);
      const rarity = card?.rarity ?? 'R';
      if (!grouped[rarity]) grouped[rarity] = [];
      grouped[rarity].push({ cardId, name: card?.name ?? cardId, count });
    }

    const totalShards = entries.reduce((sum, [, c]) => sum + c, 0);
    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle(`🔮 ${target.username}'s Character Shards`)
      .setDescription(`**${totalShards}** shard(s) total`);

    for (const [rarity, group] of Object.entries(grouped)) {
      if (group.length === 0) continue;
      const meta = rarityMeta(rarity);
      embed.addFields({
        name:  `${meta.emoji} ${meta.label}`,
        value: group.map(s => `${s.name} — **×${s.count}**`).join('\n'),
        inline: false,
      });
    }

    embed.setFooter({ text: 'Character shards are earned by pulling duplicate cards' });
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

  // ── shards | sh ──────────────────────────────────────────
  if (command === 'shards' || command === 'sh') {
    const inventory = inv.loadInventory();
    const shards    = inv.getShards(inventory, userId);
    return message.reply(`💎 You have **${shards} trade shards**.\n*Character shards (from dupes) are viewable with \`ZP inv\`.*`);
  }

  // ── trade ─────────────────────────────────────────────────
  if (command === 'trade') {
    const toUser   = message.mentions.users.first();
    const cardId   = args[1];
    const shardAsk = parseInt(args[2], 10);

    if (!toUser || !cardId || isNaN(shardAsk) || shardAsk < 0) {
      return message.reply('Usage: `ZP trade @user <cardId> <shardsYouWant>`\nExample: `ZP trade @Alice naruto_r 50`');
    }
    if (toUser.id === userId) return message.reply('❌ You cannot trade with yourself.');
    if (toUser.bot)           return message.reply('❌ You cannot trade with a bot.');

    const inventory = inv.loadInventory();

    if (!inv.hasCard(inventory, userId, cardId)) {
      return message.reply(`❌ You don't own \`${cardId}\`. Check \`ZP col\` for your cards.`);
    }

    const receiverShards = inv.getShards(inventory, toUser.id);
    if (receiverShards < shardAsk) {
      return message.reply(`❌ **${toUser.username}** only has **${receiverShards} trade shards** — not enough for your asking price.`);
    }

    const card    = lookupCard(cardId);
    const meta    = rarityMeta(card?.rarity ?? 'R');
    const tradeId = trades.createTrade({
      fromUserId:    userId,
      toUserId:      toUser.id,
      offeredCardId: cardId,
      askingShards:  shardAsk,
    });

    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle('🤝 Trade Offer Sent')
      .setDescription(`${message.author.username} → ${toUser.username}`)
      .addFields(
        { name: 'Offering',              value: `${meta.emoji} **${card?.name ?? cardId}** (${meta.label})`, inline: true },
        { name: 'Asking (trade shards)', value: `💎 ${shardAsk}`,                                            inline: true },
        { name: 'Trade ID',              value: `\`${tradeId}\``,                                            inline: true },
      )
      .setFooter({ text: `${toUser.username}: use ZP a ${tradeId}  or  ZP dec ${tradeId} • Expires in 5 min` });

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

    if (!inv.hasCard(inventory, trade.fromUserId, trade.offeredCardId)) {
      trades.cancelTrade(tradeId);
      return message.reply('❌ The sender no longer owns that card. Trade cancelled.');
    }

    if (!inv.removeShards(inventory, trade.toUserId, trade.askingShards)) {
      return message.reply(`❌ You don't have enough trade shards (need **${trade.askingShards}**).`);
    }

    inv.removeCardFromInventory(inventory, trade.fromUserId, trade.offeredCardId);
    const card = lookupCard(trade.offeredCardId);
    const { isDupe } = inv.addCardToInventory(inventory, trade.toUserId, card, config.SHARD_VALUES);
    inv.addShards(inventory, trade.fromUserId, trade.askingShards);
    inv.saveInventory(inventory);
    trades.cancelTrade(tradeId);

    const meta = rarityMeta(card?.rarity ?? 'R');
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('✅ Trade Complete!')
      .addFields(
        { name: 'Card transferred',  value: `${meta.emoji} **${card?.name ?? trade.offeredCardId}**`, inline: true },
        { name: 'Trade shards paid', value: `💎 ${trade.askingShards}`,                               inline: true },
      );

    if (isDupe) {
      embed.setFooter({ text: `You already had that card — +1 ${card?.name} Shard added to your inventory!` });
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
      const card     = lookupCard(trade.offeredCardId);
      const meta     = rarityMeta(card?.rarity ?? 'R');
      const fromUser = await client.users.fetch(trade.fromUserId).catch(() => ({ username: trade.fromUserId }));
      embed.addFields({
        name:  `Trade ${trade.tradeId} — from ${fromUser.username}`,
        value: `${meta.emoji} **${card?.name ?? trade.offeredCardId}** for 💎 **${trade.askingShards} trade shards**\n\`ZP a ${trade.tradeId}\`  •  \`ZP dec ${trade.tradeId}\``,
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
        const rarityKeys = Object.keys(config.RARITY_META).join(' | ');
        return message.reply(`Usage: \`ZP setrarity <${rarityKeys} | reset>\`\n${current}`);
      }
      if (target === 'RESET') {
        adminRarityOverride = null;
        return message.reply('🔧 Rarity override cleared — back to normal pull rates.');
      }
      if (!config.RARITY_META[target]) {
        return message.reply(`❌ Unknown rarity \`${target}\`. Valid options: ${Object.keys(config.RARITY_META).join(', ')}`);
      }
      adminRarityOverride = target;
      const meta = rarityMeta(target);
      return message.reply(`🔧 Rarity locked to **${meta.emoji} ${meta.label}** — all your pulls will be this rarity until you \`ZP setrarity reset\`.`);
    }

    if (command === 'giveshards') {
      const amount = parseInt(args[0], 10);
      if (isNaN(amount) || amount <= 0) return message.reply('Usage: `ZP giveshards <amount>`');
      const inventory = inv.loadInventory();
      inv.addShards(inventory, userId, amount);
      inv.saveInventory(inventory);
      const total = inv.getShards(inventory, userId);
      return message.reply(`🔧 Added **${amount} trade shards**. New balance: **${total}**.`);
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
