// ============================================================
//  test BOT — MAIN
//  Commands:
//    ZP pull              – pull a random card
//    ZP inventory         – view your cards
//    ZP inventory @user   – view someone else's cards
//    ZP card <id>         – inspect a card
//    ZP shards            – check your shard balance
//    ZP trade @user <cardId> <shards>  – offer a trade
//    ZP accept <tradeId>  – accept a trade offer
//    ZP decline <tradeId> – decline a trade offer
//    ZP trades            – view pending trades sent to you
//    ZP help              – show all commands
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

// Per-user pull cooldown
const cooldowns = new Map();

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

  // ── !tko help ────────────────────────────────────────────
  if (!command || command === 'help') {
    const embed = new EmbedBuilder()
      .setColor(0x00FFD1)
      .setTitle('📖 test Bot — Commands')
      .setDescription('Pull anime & game character cards, collect them, and trade with others!')
      .addFields(
        { name: '`ZP pull`',                              value: 'Pull a random card (30s cooldown)', inline: false },
        { name: '`ZP inventory`',                         value: 'View your card collection',         inline: false },
        { name: '`ZP inventory @user`',                   value: 'View another player\'s collection', inline: false },
        { name: '`ZP card <cardId>`',                     value: 'Inspect a specific card',           inline: false },
        { name: '`ZP shards`',                            value: 'Check your shard balance',          inline: false },
        { name: '`ZP trade @user <cardId> <shards>`',     value: 'Offer a card for shards',           inline: false },
        { name: '`ZP accept <tradeId>`',                  value: 'Accept a trade offer',              inline: false },
        { name: '`ZP decline <tradeId>`',                 value: 'Decline a trade offer',             inline: false },
        { name: '`ZP trades`',                            value: 'View trade offers sent to you',     inline: false },
      )
      .addFields({
        name: '✨ Rarities',
        value: Object.entries(config.RARITY_META)
          .map(([k, v]) => `${v.emoji} **${v.label}** (${k})`)
          .join('  •  '),
        inline: false,
      })
      .setFooter({ text: 'Dupes are auto-converted to shards. Trades expire after 5 minutes.' });
    return message.reply({ embeds: [embed] });
  }

  // ── !tko pull ─────────────────────────────────────────────
  if (command === 'pull') {
    const userId = message.author.id;
    const now    = Date.now();
    const last   = cooldowns.get(userId) ?? 0;
    const wait   = config.PULL_COOLDOWN_SECONDS * 1000 - (now - last);

    if (wait > 0) {
      return message.reply(`⏳ Cooldown! You can pull again in **${Math.ceil(wait / 1000)}s**.`);
    }

    cooldowns.set(userId, now);
    const card      = pullCard();
    const inventory = inv.loadInventory();
    const { isDupe, shardsAwarded } = inv.addCardToInventory(inventory, userId, card, config.SHARD_VALUES);
    inv.saveInventory(inventory);

    const meta = rarityMeta(card.rarity);

    if (isDupe) {
      const embed = cardEmbed(card,
        `♻️ Duplicate — ${card.name}`,
        `Already in your collection! Converted to ${shardsAwarded} shards 💎`
      );
      embed.setColor(0x888888);
      return message.reply({ embeds: [embed] });
    }

    const embed = cardEmbed(card,
      `${meta.emoji} You pulled — ${card.name}!`,
      `Added to your inventory! • ${meta.label}`
    );
    return message.reply({ embeds: [embed] });
  }

  // ── !tko inventory [@user] ────────────────────────────────
  if (command === 'inventory' || command === 'inv') {
    const target   = message.mentions.users.first() ?? message.author;
    const inventory = inv.loadInventory();
    const cards    = inv.getCards(inventory, target.id);
    const shards   = inv.getShards(inventory, target.id);

    if (cards.length === 0) {
      return message.reply(`${target.id === message.author.id ? 'You have' : `**${target.username}** has`} no cards yet. Use \`ZP pull\` to get started!`);
    }

    // Group by rarity
    const grouped = {};
    for (const [key] of Object.entries(config.RARITY_META)) grouped[key] = [];
    for (const card of cards) {
      if (grouped[card.rarity]) grouped[card.rarity].push(card);
    }

    const embed = new EmbedBuilder()
      .setColor(0x4A90D9)
      .setTitle(`🗂️ ${target.username}'s Collection`)
      .setDescription(`**${cards.length}** card(s) collected • 💎 **${shards}** shards`);

    for (const [rarity, group] of Object.entries(grouped)) {
      if (group.length === 0) continue;
      const meta = rarityMeta(rarity);
      embed.addFields({
        name:   `${meta.emoji} ${meta.label} (${group.length})`,
        value:  group.map(c => `\`${c.id}\` ${c.name}`).join('\n'),
        inline: false,
      });
    }

    embed.setFooter({ text: 'Use ZP card <id> to inspect a card' });
    return message.reply({ embeds: [embed] });
  }

  // ── !tko card <id> ────────────────────────────────────────
  if (command === 'card') {
    const cardId = args[0];
    if (!cardId) return message.reply('Usage: `ZP card <cardId>`');

    const card = lookupCard(cardId);
    if (!card) return message.reply(`❌ No card found with id \`${cardId}\`. Check \`ZP inventory\` for your card IDs.`);

    const inventory  = inv.loadInventory();
    const owned      = inv.hasCard(inventory, message.author.id, card.id);
    const embed      = cardEmbed(card);
    embed.setFooter({ text: owned ? '✅ In your collection' : '❌ Not in your collection' });
    return message.reply({ embeds: [embed] });
  }

  // ── !tko shards ───────────────────────────────────────────
  if (command === 'shards') {
    const inventory = inv.loadInventory();
    const shards    = inv.getShards(inventory, message.author.id);
    return message.reply(`💎 You have **${shards} shards**.`);
  }

  // ── !tko trade @user <cardId> <shards> ───────────────────
  if (command === 'trade') {
    // Args: @user cardId shardsAmount
    const toUser  = message.mentions.users.first();
    const cardId  = args[1]; // args[0] is the mention
    const shardAsk = parseInt(args[2], 10);

    if (!toUser || !cardId || isNaN(shardAsk) || shardAsk < 0) {
      return message.reply('Usage: `ZP trade @user <cardId> <shardsYouWant>`\nExample: `ZP trade @Alice naruto 50`');
    }
    if (toUser.id === message.author.id) {
      return message.reply('❌ You cannot trade with yourself.');
    }
    if (toUser.bot) {
      return message.reply('❌ You cannot trade with a bot.');
    }

    const inventory = inv.loadInventory();

    // Sender must own the card
    if (!inv.hasCard(inventory, message.author.id, cardId)) {
      return message.reply(`❌ You don't own \`${cardId}\`. Check \`ZP inventory\` for your cards.`);
    }

    // Receiver must have enough shards
    const receiverShards = inv.getShards(inventory, toUser.id);
    if (receiverShards < shardAsk) {
      return message.reply(`❌ **${toUser.username}** only has **${receiverShards} shards** — not enough for your asking price.`);
    }

    const card    = lookupCard(cardId);
    const meta    = rarityMeta(card?.rarity ?? 'R');
    const tradeId = trades.createTrade({
      fromUserId:    message.author.id,
      toUserId:      toUser.id,
      offeredCardId: cardId,
      askingShards:  shardAsk,
    });

    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle('🤝 Trade Offer Sent')
      .setDescription(`${message.author.username} → ${toUser.username}`)
      .addFields(
        { name: 'Offering',       value: `${meta.emoji} **${card?.name ?? cardId}** (${meta.label})`, inline: true },
        { name: 'Asking (shards)',value: `💎 ${shardAsk}`,                                             inline: true },
        { name: 'Trade ID',       value: `\`${tradeId}\``,                                            inline: true },
      )
      .setFooter({ text: `${toUser.username}: use ZP accept ${tradeId}  or  ZP decline ${tradeId} • Expires in 5 min` });

    return message.reply({ content: `${toUser}`, embeds: [embed] });
  }

  // ── !tko accept <tradeId> ────────────────────────────────
  if (command === 'accept') {
    const tradeId = args[0];
    if (!tradeId) return message.reply('Usage: `ZP accept <tradeId>`');

    const trade = trades.getTrade(tradeId);
    if (!trade) return message.reply(`❌ Trade \`${tradeId}\` not found or has expired.`);
    if (trade.toUserId !== message.author.id) return message.reply('❌ That trade is not addressed to you.');

    const inventory = inv.loadInventory();

    // Check sender still owns the card
    if (!inv.hasCard(inventory, trade.fromUserId, trade.offeredCardId)) {
      trades.cancelTrade(tradeId);
      return message.reply('❌ The sender no longer owns that card. Trade cancelled.');
    }

    // Check receiver still has enough shards
    if (!inv.removeShards(inventory, trade.toUserId, trade.askingShards)) {
      return message.reply(`❌ You don't have enough shards (need **${trade.askingShards}**).`);
    }

    // Execute: move card, move shards
    inv.removeCardFromInventory(inventory, trade.fromUserId, trade.offeredCardId);
    const card = lookupCard(trade.offeredCardId);
    const { isDupe, shardsAwarded } = inv.addCardToInventory(inventory, trade.toUserId, card, config.SHARD_VALUES);
    inv.addShards(inventory, trade.fromUserId, trade.askingShards);
    inv.saveInventory(inventory);
    trades.cancelTrade(tradeId);

    const meta = rarityMeta(card?.rarity ?? 'R');
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('✅ Trade Complete!')
      .addFields(
        { name: 'Card transferred', value: `${meta.emoji} **${card?.name ?? trade.offeredCardId}**`, inline: true },
        { name: 'Shards paid',      value: `💎 ${trade.askingShards}`,                               inline: true },
      );

    if (isDupe) {
      embed.setFooter({ text: `You already had that card — converted to ${shardsAwarded} shards instead!` });
    }

    return message.reply({ embeds: [embed] });
  }

  // ── !tko decline <tradeId> ───────────────────────────────
  if (command === 'decline') {
    const tradeId = args[0];
    if (!tradeId) return message.reply('Usage: `ZP decline <tradeId>`');

    const trade = trades.getTrade(tradeId);
    if (!trade) return message.reply(`❌ Trade \`${tradeId}\` not found or already expired.`);
    if (trade.toUserId !== message.author.id && trade.fromUserId !== message.author.id) {
      return message.reply('❌ You are not part of that trade.');
    }

    trades.cancelTrade(tradeId);
    return message.reply(`🚫 Trade \`${tradeId}\` has been cancelled.`);
  }

  // ── !tko trades ───────────────────────────────────────────
  if (command === 'trades') {
    const pending = trades.getTradesForUser(message.author.id);
    if (pending.length === 0) {
      return message.reply('📭 You have no pending trade offers.');
    }

    const inventory = inv.loadInventory();
    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle('📬 Pending Trade Offers');

    for (const trade of pending) {
      const card     = lookupCard(trade.offeredCardId);
      const meta     = rarityMeta(card?.rarity ?? 'R');
      const fromUser = await client.users.fetch(trade.fromUserId).catch(() => ({ username: trade.fromUserId }));
      embed.addFields({
        name:  `Trade ${trade.tradeId} — from ${fromUser.username}`,
        value: `${meta.emoji} **${card?.name ?? trade.offeredCardId}** for 💎 **${trade.askingShards} shards**\n\`ZP accept ${trade.tradeId}\`  •  \`ZP decline ${trade.tradeId}\``,
      });
    }

    return message.reply({ embeds: [embed] });
  }

  // ── Unknown command ───────────────────────────────────────
  return message.reply(`❓ Unknown command. Use \`ZP help\` to see all commands.`);
});

// ── Login ─────────────────────────────────────────────────
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ DISCORD_TOKEN not set in environment!');
  process.exit(1);
}
client.login(token);
