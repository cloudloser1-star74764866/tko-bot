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
//    ZP wallet                              – view your currencies
//    ZP shop                                – view the shop and all buyable items
//    ZP inventory  (inv)                    – view platings
//    ZP shards [filter]                     – view character shards
//    ZP wish <cardId>                       – set a wish card (guaranteed after 200 pulls)
//    ZP card <id>  (c <id>)                 – inspect a card
//    ZP mycard <id>  (mc <id>)             – inspect your own card (shows prestige)
//    ZP cardinfo <id>  (ci <id>)           – view card game info
//    ZP absorb shard:<id>:<count>           – level up a card using its shards
//    ZP increaselevelcap <id> <count>  (ilc) – raise a card's level cap using its shards
//    ZP kill <cardId> <shardId>:<count>     – kill shards for yen + prestige points
//    ZP profile  (pro)                      – view your player profile
//    ZP vote                                – get voting link
//    ZP privacy                             – toggle profile privacy
//    ZP team                                – view your battle team
//    ZP add <id>                            – shortcut: add card to team
//    ZP remove <id>                         – shortcut: remove card from team
//    ZP swap <id1> <id2>                    – swap two team card positions
//    ZP fight @user                         – challenge a player to a team battle
//    ZP duofight @user  (df)               – fight with your duo partner's team
//    ZP trade @user <offer> for <ask>       – offer a trade
//    ZP accept <tradeId>  (a)               – accept a trade offer
//    ZP decline <tradeId>  (dec)            – decline / cancel a trade
//    ZP trades                              – view trade offers sent to you
//    ZP clan                                – view your clan
//    ZP clancreate <name>                   – create a new clan
//    ZP clanadd @user                       – add a member to your clan
//    ZP clanremove @user                    – remove a member from your clan
//    ZP clanleave                           – leave your clan
//    ZP clandelete                          – delete your clan
//    ZP clanfundadd <amount>                – donate yen to clan fund
//    ZP clanfundtake <amount>               – withdraw yen from clan fund (owner)
//    ZP duo                                 – view your duo partnership
//    ZP duocreate @user                     – create a duo with another player
//    ZP duoadd @user                        – invite a player to your duo
//    ZP duoremove                           – disband your duo
//    ZP help  (h)                           – show all commands
//  Admin (user 833025999897755689):
//    ZP setrarity <rarity|reset>
//    ZP setplating <tier|reset>
//    ZP resetcooldown
//    ZP giveyen [@user] <amount>
//    ZP givestars [@user] <amount>
//    ZP givecandytokens [@user] <amount>
//    ZP giveitem @user <itemId>
//    ZP giveshards @user <cardId> <amount>
//    ZP createcode <name> <code> [yen:<n>] [stars:<n>] [candytokens:<n>] [plating:<tier>:<n>] [card:<rarity>]
//    ZP editcode <name> [yen:<n>] [stars:<n>] [candytokens:<n>] [plating:<tier>:<n>] [card:<rarity>]
//    ZP deletecode <name>
//    ZP listcodes
//    ZP givelimitbreaker [@user] <amount>
//  User:
//    ZP redeem <code>
//    ZP raid                                – fight a Limited raid boss (costs a raid ticket)
//    ZP conquestsend <cardId>
//    ZP conquestrecall
// ============================================================

require('dotenv').config();

// ── Single-instance lock ──────────────────────────────────────────────────────
// Prevents two bot processes from running at the same time (duplicate messages).
// Uses a timestamp-based lock so stale files left by Railway restarts (where
// PIDs are meaningless across containers) are detected and cleaned up reliably.
const fs        = require('fs');
const path      = require('path');
const LOCK_FILE = path.join(__dirname, '.bot.lock');
const LOCK_TTL  = 30 * 1000; // 30 seconds — lock is considered stale after this

(function acquireLock() {
  if (fs.existsSync(LOCK_FILE)) {
    const raw = fs.readFileSync(LOCK_FILE, 'utf8').trim();
    const ts  = parseInt(raw, 10);
    if (!isNaN(ts)) {
      const age = Date.now() - ts;
      if (age < LOCK_TTL) {
        console.error(`[lock] Another bot instance is already running (lock age: ${age}ms). Exiting.`);
        process.exit(1);
      }
      console.warn(`[lock] Stale lock detected (age: ${age}ms, TTL: ${LOCK_TTL}ms) — removing and taking over.`);
    }
    try { fs.unlinkSync(LOCK_FILE); } catch (_) {}
  }
  fs.writeFileSync(LOCK_FILE, String(Date.now()));
})();

function releaseLock() {
  try { fs.unlinkSync(LOCK_FILE); } catch (_) {}
}

process.on('exit',             ()    => releaseLock());
process.on('SIGINT',           ()    => { releaseLock(); process.exit(0); });
process.on('SIGTERM',          ()    => { releaseLock(); process.exit(0); });
process.on('uncaughtException', (err) => { console.error('[uncaughtException]', err); releaseLock(); process.exit(1); });
// ─────────────────────────────────────────────────────────────────────────────

const {
    Client, GatewayIntentBits, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    REST, Routes, SlashCommandBuilder,
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
    GatewayIntentBits.DirectMessages,
  ],
});

// ── Kill yen per shard by rarity ──────────────────────────
const KILL_YEN = { R: 50, E: 150, L: 350, MY: 600, UR: 1000, LT: 2000 };

// ── Admin ─────────────────────────────────────────────────
const ADMIN_ID = '833025999897755689';
let adminRarityOverride  = null;
let adminPlatingOverride = null;

function isAdmin(userId) { return userId === ADMIN_ID; }

function parseRewardArgs(argList) {
  const rewards = { yen: 0, stars: 0, candyTokens: 0, platings: {}, cardRarity: null };
  for (const arg of argList) {
    const lower = arg.toLowerCase();
    if (lower.startsWith('yen:'))          { rewards.yen          = Math.max(0, parseInt(arg.slice(4), 10)  || 0); }
    else if (lower.startsWith('stars:'))   { rewards.stars        = Math.max(0, parseInt(arg.slice(6), 10)  || 0); }
    else if (lower.startsWith('candytokens:')) { rewards.candyTokens = Math.max(0, parseInt(arg.slice(12), 10) || 0); }
    else if (lower.startsWith('plating:')) {
      const parts = lower.slice(8).split(':');
      const tier   = parts[0];
      const amount = Math.max(0, parseInt(parts[1], 10) || 0);
      if (tier && amount > 0) rewards.platings[tier] = amount;
    }
    else if (lower.startsWith('card:')) {
      rewards.cardRarity = normalizeRarity(arg.slice(5)) ?? arg.slice(5).toUpperCase();
    }
  }
  return rewards;
}

function formatRewards(r) {
  const parts = [];
  if (r.yen          > 0) parts.push(`¥${r.yen.toLocaleString()} Yen`);
  if (r.stars        > 0) parts.push(`${r.stars.toLocaleString()} Stars`);
  if (r.candyTokens  > 0) parts.push(`${r.candyTokens} Candy Token${r.candyTokens === 1 ? '' : 's'}`);
  if (r.cardRarity)       parts.push(`1 Random ${rarityMeta(r.cardRarity)?.label ?? r.cardRarity} Card`);
  if (r.platings) {
    for (const [tier, amount] of Object.entries(r.platings)) {
      if (amount > 0) parts.push(`${amount}x ${tier} Plating`);
    }
  }
  return parts.length ? parts.join(', ') : 'None';
}

function pullCardForced(rarity) {
  const pool = CARDS.filter(c => c.rarity === rarity);
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : CARDS[0];
}

// ── Pull charges (in-memory, persisted on change) ─────────
const pullCharges = new Map();

async function initPullCharges() {
  const data = await inv.loadInventory();
  for (const [userId, bucket] of Object.entries(data.pullCharges || {})) {
    pullCharges.set(userId, bucket);
  }
}

let persistTimer = null;
function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(async () => {
    const data = await inv.loadInventory();
    data.pullCharges = Object.fromEntries(pullCharges);
    await inv.saveInventory(data);
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

function getCardStats(card, level = 1) {
  const lvl  = Math.max(1, level ?? 1);
  const mult = 1 + 0.02 * (lvl - 1);
  if (card.fixedHp != null && card.fixedDmg != null) {
    return {
      hp:  Math.round(card.fixedHp  * mult),
      dmg: Math.round(card.fixedDmg * mult),
    };
  }
  let hash = 0;
  for (const ch of card.id) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  const t = (hash >>> 0) % 1000 / 1000;
  const range = config.STAT_RANGES[card.rarity] ?? config.STAT_RANGES['R'];
  const baseHp  = Math.round(range.hpMin  + t * (range.hpMax  - range.hpMin));
  const baseDmg = Math.round(range.dmgMin + t * (range.dmgMax - range.dmgMin));
  return {
    hp:  Math.round(baseHp  * mult),
    dmg: Math.round(baseDmg * mult),
  };
}

// ── Trade item helpers ────────────────────────────────────

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

function parseTradeItems(str) {
  const tokens = str.split(',').map(s => s.trim()).filter(Boolean);
  if (tokens.length === 0) return null;
  const items = tokens.map(parseTradeItem);
  if (items.some(i => i === null)) return null;
  return items;
}

function validateTradeItem(item) {
  if (item.type === 'shard')   return !!lookupCard(item.id);
  if (item.type === 'plating') return !!platingById(item.id);
  if (item.type === 'yen')     return true;
  if (item.type === 'stars')   return true;
  return false;
}

function describeItem(item) {
  if (item.type === 'shard') {
    const card      = lookupCard(item.id);
    const cardEmoji = emojiCache.getEmoji(item.id) ?? '';
    return `${cardEmoji ? cardEmoji + ' ' : ''}**x${item.amount}** ${card?.name ?? item.id} shard${item.amount === 1 ? '' : 's'}`;
  }
  if (item.type === 'plating') {
    const tier = platingById(item.id);
    return `**x${item.amount}** ${tier?.label ?? item.id} plating${item.amount === 1 ? '' : 's'}`;
  }
  if (item.type === 'yen')   return `**¥${item.amount.toLocaleString()}** Yen`;
  if (item.type === 'stars') return `**${item.amount.toLocaleString()}** Star${item.amount === 1 ? '' : 's'}`;
  return '?';
}

function describeItems(items) {
  return items.map(describeItem).join('\n');
}

function userHasItem(inventory, userId, item) {
  if (item.type === 'shard')   return (inv.getCharacterShards(inventory, userId)[item.id] ?? 0) >= item.amount;
  if (item.type === 'plating') return (inv.getPlatings(inventory, userId)[item.id] ?? 0) >= item.amount;
  if (item.type === 'yen')     return inv.getYen(inventory, userId) >= item.amount;
  if (item.type === 'stars')   return inv.getStars(inventory, userId) >= item.amount;
  return false;
}

function findMissingItem(inventory, userId, items) {
  return items.find(item => !userHasItem(inventory, userId, item)) ?? null;
}

function removeItems(inventory, userId, item) {
  if (item.type === 'shard')   return inv.removeCharacterShards(inventory, userId, item.id, item.amount);
  if (item.type === 'plating') return inv.removePlating(inventory, userId, item.id, item.amount);
  if (item.type === 'yen')     return inv.removeYen(inventory, userId, item.amount);
  if (item.type === 'stars')   return inv.removeStars(inventory, userId, item.amount);
  return false;
}

function removeAllItems(inventory, userId, items) {
  for (const item of items) removeItems(inventory, userId, item);
}

function addItems(inventory, userId, item) {
  if (item.type === 'shard')   inv.addCharacterShards(inventory, userId, item.id, item.amount);
  if (item.type === 'plating') inv.addPlatings(inventory, userId, item.id, item.amount);
  if (item.type === 'yen')     inv.addYen(inventory, userId, item.amount);
  if (item.type === 'stars')   inv.addStars(inventory, userId, item.amount);
}

function addAllItems(inventory, userId, items) {
  for (const item of items) addItems(inventory, userId, item);
}

// ── Fight cooldown ────────────────────────────────────────

const fightCooldowns    = new Map();
const activeBattles     = new Map();
const activeCollabRaids = new Map(); // ownerId → battleId

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
    cardId:    card.id,
    name:      card.name,
    level,
    plating:   slot.plating ?? null,
    platEmoji: plating?.emoji ?? '',
    rarEmoji:  meta.emoji,
    hp,
    maxHp:     hp,
    dmgMin:    Math.round(dmg * 0.8),
    dmgMax:    Math.round(dmg * 1.2),
    dmg,
    technique: card.technique ?? false,
    alive:     true,
  };
}

function hpBar(current, max) {
  const pct    = max <= 0 ? 0 : Math.max(0, Math.min(1, current / max));
  const filled = Math.round(pct * 10);
  return '[' + '#'.repeat(filled) + '-'.repeat(10 - filled) + ']';
}

function cardBattleLine(bc) {
  if (!bc.alive) {
    return `~~=> **${bc.name}** | Lv. ${bc.level}~~\nDefeated`;
  }
  return [
    hpBar(bc.hp, bc.maxHp),
    `=> **${bc.name}** | Lv. ${bc.level}`,
    bc.technique
      ? `HP ${bc.hp.toLocaleString()}/${bc.maxHp.toLocaleString()} | TEC ${bc.dmgMin}–${bc.dmgMax}`
      : `HP ${bc.hp.toLocaleString()}/${bc.maxHp.toLocaleString()} | DMG ${bc.dmgMin}–${bc.dmgMax}`,
  ].join('\n');
}

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

function buildBattleComponents(state) {
  const rows = [];
  const alive = state.attackerCards
    .map((bc, i) => ({ bc, i }))
    .filter(({ bc }) => bc.alive);

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

// ── Raid helpers ──────────────────────────────────────────

function buildRaidEmbed(state, log = null) {
  const boss     = state.defenderCards[0];
  const atkLines = state.attackerCards.map(cardBattleLine).join('\n\n');
  const allAtkDead = state.attackerCards.every(b => !b.alive);

  const parts = [
    `**═════ ${state.defenderName} ═════**`,
    cardBattleLine(boss),
    '',
    `**═════ ${state.attackerName}'s Team ═════**`,
    atkLines,
  ];
  if (log) parts.push('', log);
  if (!allAtkDead && boss.alive) parts.push('', '*Choose a card to attack with!*');

  const tier  = config.RAID_TICKET_TIERS.find(t => t.id === state.raidTicketTier);
  const color = tier?.color ?? 0xFF69B4;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${tier?.emoji ?? '🔥'} ${tier?.label ?? 'Raid'} Battle`)
    .setDescription(parts.join('\n'));

  if (state.bossImg) embed.setThumbnail(state.bossImg);
  return embed;
}

// ── Collab Raid helpers ────────────────────────────────────

function buildCollabRaidPreEmbed(state) {
  const boss     = state.defenderCards[0];
  const tier     = config.RAID_TICKET_TIERS.find(t => t.id === state.raidTicketTier);

  const lines = [
    `**═════ ${state.defenderName} ═════**`,
    cardBattleLine(boss),
    '',
    `**═════ Raid Party ═════**`,
    `👑 **${state.ownerName}** — Ready (can use any card)`,
  ];

  for (let i = 0; i < 4; i++) {
    const p = state.participants[i];
    if (!p) {
      lines.push(`▫️ Slot ${i + 2}: Empty`);
    } else if (p.joined && p.selectedCard) {
      const meta = rarityMeta(lookupCard(p.selectedCard.cardId)?.rarity ?? 'R');
      lines.push(`✅ **${p.username}** — ${meta.emoji} ${p.selectedCard.name}`);
    } else {
      lines.push(`⏳ **${p.username}** — Selecting card…`);
    }
  }

  lines.push('');
  if (state.allowJoins) {
    const names = state.whitelist.length > 0
      ? state.whitelist.map(uid => `<@${uid}>`).join(', ')
      : 'No one yet';
    lines.push(`✅ **Joins enabled!** Whitelisted: ${names}`);
    lines.push(`*Use \`ZP wh @user\` to add more (max 4)*`);
  } else {
    lines.push(`🔒 **Joins disabled.** Use \`ZP arj\` to let whitelisted players join.`);
  }

  const embed = new EmbedBuilder()
    .setColor(tier?.color ?? 0xFF69B4)
    .setTitle(`${tier?.emoji ?? '🔥'} ${tier?.label ?? 'Raid'} — Waiting to Start`)
    .setDescription(lines.join('\n'));

  if (state.bossImg) embed.setThumbnail(state.bossImg);
  return embed;
}

function buildCollabRaidBattleEmbed(state, log = null) {
  const boss    = state.defenderCards[0];
  const tier    = config.RAID_TICKET_TIERS.find(t => t.id === state.raidTicketTier);

  const turnName = state.currentTurnIdx === 0
    ? `👑 ${state.ownerName}`
    : (state.participants[state.currentTurnIdx - 1]?.username ?? '?');

  const parts = [
    `**═════ ${state.defenderName} ═════**`,
    cardBattleLine(boss),
    '',
    `**═════ 👑 ${state.ownerName}'s Cards ═════**`,
    state.ownerCards.map(cardBattleLine).join('\n\n'),
  ];

  if (state.participants.length > 0) {
    parts.push('', `**═════ Allies ═════**`);
    for (const p of state.participants) {
      if (p.selectedCard) {
        parts.push(`**${p.username}:**\n${cardBattleLine(p.selectedCard)}`);
      }
    }
  }

  if (log) parts.push('', log);

  const allOwnerDead = state.ownerCards.every(c => !c.alive);
  const allAllyDead  = state.participants.every(p => !p.selectedCard || !p.selectedCard.alive);
  if (boss.alive && !(allOwnerDead && allAllyDead)) {
    parts.push('', `*${turnName}'s turn — choose a card to attack!*`);
  }

  const embed = new EmbedBuilder()
    .setColor(tier?.color ?? 0xFF69B4)
    .setTitle(`${tier?.emoji ?? '🔥'} ${tier?.label ?? 'Raid'} Battle`)
    .setDescription(parts.join('\n'));

  if (state.bossImg) embed.setThumbnail(state.bossImg);
  return embed;
}

function buildCollabPreComponents(state) {
  const joinBtn = new ButtonBuilder()
    .setCustomId(`craid|${state.battleId}|join`)
    .setLabel('Join Raid')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(!state.allowJoins);

  const startBtn = new ButtonBuilder()
    .setCustomId(`craid|${state.battleId}|start`)
    .setLabel('Start Raid')
    .setStyle(ButtonStyle.Success);

  return [new ActionRowBuilder().addComponents(joinBtn, startBtn)];
}

function buildCollabBattleComponents(state) {
  const rows = [];

  if (state.currentTurnIdx === 0) {
    const alive = state.ownerCards
      .map((bc, i) => ({ bc, i }))
      .filter(({ bc }) => bc.alive);

    for (let r = 0; r < alive.length && rows.length < 4; r += 4) {
      rows.push(
        new ActionRowBuilder().addComponents(
          alive.slice(r, r + 4).map(({ bc, i }) =>
            new ButtonBuilder()
              .setCustomId(`craid|${state.battleId}|attack|${i}`)
              .setLabel(bc.name.length > 20 ? bc.name.slice(0, 18) + '…' : bc.name)
              .setStyle(ButtonStyle.Success)
          )
        )
      );
    }
  } else {
    const pIdx = state.currentTurnIdx - 1;
    const p    = state.participants[pIdx];
    if (p?.selectedCard?.alive) {
      rows.push(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`craid|${state.battleId}|attack|${pIdx}`)
            .setLabel(p.selectedCard.name.length > 20 ? p.selectedCard.name.slice(0, 18) + '…' : p.selectedCard.name)
            .setStyle(ButtonStyle.Success)
        )
      );
    }
  }

  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`craid|${state.battleId}|run`)
        .setLabel('Run Away')
        .setStyle(ButtonStyle.Danger)
    )
  );
  return rows;
}

function buildTimeoutComponents(state, pIdx) {
  const p = state.participants[pIdx];
  const name = p.username.length > 16 ? p.username.slice(0, 14) + '\u2026' : p.username;
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`craid|${state.battleId}|skipturn|${pIdx}`)
        .setLabel(`Skip ${name}'s Turn`)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`craid|${state.battleId}|kick|${pIdx}`)
        .setLabel(`Kick ${name}`)
        .setStyle(ButtonStyle.Danger),
    ),
  ];
}

function startParticipantTimeout(state, client) {
  if (state.participantTimeout) {
    clearTimeout(state.participantTimeout);
    state.participantTimeout = null;
  }
  if (state.currentTurnIdx === 0) return;

  const expectedTurnIdx = state.currentTurnIdx;
  const pIdx = expectedTurnIdx - 1;
  const p    = state.participants[pIdx];
  if (!p?.selectedCard?.alive) return;

  state.participantTimeout = setTimeout(async () => {
    state.participantTimeout = null;
    if (!activeBattles.has(state.battleId)) return;
    if (state.currentTurnIdx !== expectedTurnIdx) return;
    if (!state.raidChannelId || !state.raidMessageId) return;
    try {
      const ch  = await client.channels.fetch(state.raidChannelId);
      const msg = await ch.messages.fetch(state.raidMessageId);
      const timeoutLog = `⏰ **${p.username}** didn't act in time! **${state.ownerName}**, choose an action:`;
      await msg.edit({
        embeds:     [buildCollabRaidBattleEmbed(state, timeoutLog)],
        components: buildTimeoutComponents(state, pIdx),
      });
    } catch (err) {
      console.error('[craid timeout] Failed to update message:', err.message);
    }
  }, 10_000);
}

function advanceCollabTurn(state) {
  const total = 1 + state.participants.length;
  for (let i = 1; i <= total; i++) {
    const next = (state.currentTurnIdx + i) % total;
    if (next === 0) {
      if (state.ownerCards.some(c => c.alive)) {
        state.currentTurnIdx = 0;
        return;
      }
    } else {
      const p = state.participants[next - 1];
      if (p?.selectedCard?.alive) {
        state.currentTurnIdx = next;
        return;
      }
    }
  }
}

function generateCollabRaidReward(state, inventory) {
  const boss   = state.raidBossCard;
  const tierId = state.raidTicketTier ?? 'hellish_raid_ticket';
  const cfg    = RAID_REWARD_CONFIG[tierId] ?? RAID_REWARD_CONFIG['hellish_raid_ticket'];
  const roll   = Math.random();

  const allies = state.participants.filter(p => p.selectedCard);
  const allPlayers = [
    { userId: state.ownerId, username: state.ownerName, share: 0.5 },
    ...allies.map(p => ({
      userId: p.userId, username: p.username,
      share: allies.length > 0 ? 0.5 / allies.length : 0,
    })),
  ];

  const lines = [];

  if (roll < cfg.cardChance) {
    const winner  = allPlayers[Math.floor(Math.random() * allPlayers.length)];
    const bossItem = config.ITEMS.find(i => i.cardId === boss.id);
    if (bossItem) {
      inv.addItem(inventory, winner.userId, bossItem.id);
      lines.push(`${bossItem.emoji} **${bossItem.name}** dropped for **${winner.username}**! Use \`${bossItem.useCmd ?? `ZP use ${bossItem.id}`}\` to claim **${boss.name}**!`);
    } else {
      const { isDupe } = inv.addCardToInventory(inventory, winner.userId, boss);
      const meta = rarityMeta(boss.rarity);
      lines.push(`${meta.emoji} **${boss.name}** joined **${winner.username}**'s collection!${isDupe ? ' *(+1 shard)*' : ''}`);
    }
  } else if (roll < cfg.cardChance + 0.40) {
    const yenRange = cfg.yenMax - cfg.yenMin;
    const totalYen = Math.floor(cfg.yenMin + Math.random() * (yenRange + 1));
    for (const p of allPlayers) {
      const share = Math.floor(totalYen * p.share);
      if (share > 0) inv.addYen(inventory, p.userId, share);
    }
    const ownerY = Math.floor(totalYen * 0.5);
    const allyY  = totalYen - ownerY;
    lines.push(`💰 **¥${totalYen.toLocaleString()} Yen** split! **${state.ownerName}** ¥${ownerY.toLocaleString()} (50%)${allies.length > 0 ? `, allies share ¥${allyY.toLocaleString()}` : ''}`);
  } else if (roll < cfg.cardChance + 0.65) {
    const [cMin, cMax] = cfg.cardCount;
    const count  = Math.floor(cMin + Math.random() * (cMax - cMin + 1));
    const cLines = [];
    for (let i = 0; i < count; i++) {
      const rarity  = cfg.cardPool[Math.floor(Math.random() * cfg.cardPool.length)];
      const dropped = pullCardForced(rarity);
      const winner  = Math.random() < 0.5
        ? allPlayers[0]
        : allPlayers[Math.floor(Math.random() * allPlayers.length)];
      const { isDupe } = inv.addCardToInventory(inventory, winner.userId, dropped);
      const meta  = rarityMeta(dropped.rarity);
      const emoji = emojiCache.getEmoji(dropped.id) ?? '';
      cLines.push(`${meta.emoji} **${dropped.name}**${emoji ? ' ' + emoji : ''} → **${winner.username}**${isDupe ? ' *(+1 shard)*' : ''}`);
    }
    lines.push(`🎴 **${count} card${count === 1 ? '' : 's'}** dropped!\n${cLines.join('\n')}`);
  } else {
    const lbCount  = Math.floor(cfg.lbMin + Math.random() * (cfg.lbMax - cfg.lbMin + 1));
    const ownerLB  = Math.ceil(lbCount * 0.5);
    const allyLB   = lbCount - ownerLB;
    inv.addLimitBreakers(inventory, state.ownerId, ownerLB);
    if (allyLB > 0) {
      for (const p of allies) {
        inv.addLimitBreakers(inventory, p.userId, Math.max(1, Math.floor(allyLB / Math.max(1, allies.length))));
      }
    }
    lines.push(`💎 **${lbCount} Limit Breaker${lbCount === 1 ? '' : 's'}** split! **${state.ownerName}** gets ${ownerLB}${allyLB > 0 && allies.length > 0 ? `, allies share ${allyLB}` : ''}`);
  }

  return lines.join('\n') || '💰 No extra drops this time.';
}

// Reward config per ticket tier
const RAID_REWARD_CONFIG = {
  raid_ticket: {
    cardChance: 0.10, yenMin: 10000,  yenMax: 25000,  cardPool: ['R','E','L'], lbMin: 1, lbMax: 2,  cardCount: [1,3],
  },
  mythical_raid_ticket: {
    cardChance: 0.15, yenMin: 25000,  yenMax: 60000,  cardPool: ['E','L','MY'], lbMin: 1, lbMax: 3,  cardCount: [1,3],
  },
  omega_raid_ticket: {
    cardChance: 0.20, yenMin: 50000,  yenMax: 100000, cardPool: ['L','MY','UR'], lbMin: 2, lbMax: 4, cardCount: [1,4],
  },
  hellish_raid_ticket: {
    cardChance: 0.30, yenMin: 100000, yenMax: 200000, cardPool: ['L','MY','UR'], lbMin: 3, lbMax: 5, cardCount: [1,5],
  },
};

function generateRaidReward(state, inventory) {
  const userId   = state.attackerId;
  const boss     = state.raidBossCard;
  const tierId   = state.raidTicketTier ?? 'hellish_raid_ticket';
  const cfg      = RAID_REWARD_CONFIG[tierId] ?? RAID_REWARD_CONFIG['hellish_raid_ticket'];
  const roll     = Math.random();

  // Boss card / item drop
  if (roll < cfg.cardChance) {
    const bossItem = config.ITEMS.find(i => i.cardId === boss.id);
    if (bossItem) {
      inv.addItem(inventory, userId, bossItem.id);
      return `${bossItem.emoji} **${bossItem.name}** dropped! Use \`${bossItem.useCmd ?? `ZP use ${bossItem.id}`}\` to claim **${boss.name}**!`;
    }
    // Non-LT bosses: add card directly
    const { isDupe } = inv.addCardToInventory(inventory, userId, boss);
    const meta = rarityMeta(boss.rarity);
    return `${meta.emoji} **${boss.name}** joined your collection!${isDupe ? ' *(+1 shard)*' : ''}`;
  }

  // Yen
  const yenRange = cfg.yenMax - cfg.yenMin;
  if (roll < cfg.cardChance + 0.40) {
    const yen = Math.floor(cfg.yenMin + Math.random() * (yenRange + 1));
    inv.addYen(inventory, userId, yen);
    return `💰 **¥${yen.toLocaleString()} Yen** dropped!`;
  }

  // Random cards
  if (roll < cfg.cardChance + 0.65) {
    const [cMin, cMax] = cfg.cardCount;
    const count = Math.floor(cMin + Math.random() * (cMax - cMin + 1));
    const lines = [];
    for (let i = 0; i < count; i++) {
      const rarity      = cfg.cardPool[Math.floor(Math.random() * cfg.cardPool.length)];
      const dropped     = pullCardForced(rarity);
      const { isDupe }  = inv.addCardToInventory(inventory, userId, dropped);
      const meta        = rarityMeta(dropped.rarity);
      const emoji       = emojiCache.getEmoji(dropped.id) ?? '';
      lines.push(`${meta.emoji} **${dropped.name}**${emoji ? ' ' + emoji : ''}${isDupe ? ' *(+1 shard)*' : ''}`);
    }
    return `🎴 **${count} card${count === 1 ? '' : 's'}** dropped!\n${lines.join('\n')}`;
  }

  // Limit Breakers
  const lbCount = Math.floor(cfg.lbMin + Math.random() * (cfg.lbMax - cfg.lbMin + 1));
  inv.addLimitBreakers(inventory, userId, lbCount);
  return `💎 **${lbCount} Limit Breaker${lbCount === 1 ? '' : 's'}** dropped!`;
}

// ── Team / Fight helpers ──────────────────────────────────

function slotPower(slot) {
  const card = lookupCard(slot.cardId);
  if (!card) return 0;
  const level     = slot.level ?? 1;
  const stats     = getCardStats(card, level);
  const plating   = slot.plating ? config.PLATING_TIERS.find(t => t.id === slot.plating) : null;
  const platMult  = plating ? plating.statMult : 1;
  return (stats.hp + stats.dmg) * platMult;
}

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

const RARITY_ALIASES = {
  'rare': 'R', 'r': 'R',
  'epic': 'E', 'e': 'E',
  'legendary': 'L', 'l': 'L',
  'mythic': 'MY', 'mythical': 'MY', 'my': 'MY',
  'ultrarare': 'UR', 'ultra-rare': 'UR', 'ultra rare': 'UR', 'ur': 'UR',
  'limited': 'LT', 'lt': 'LT',
};

function normalizeRarity(input) {
  if (!input) return null;
  const upper = input.toUpperCase();
  if (config.RARITY_META[upper]) return upper;
  const lower = input.toLowerCase();
  return RARITY_ALIASES[lower] ?? null;
}

function lookupCard(cardId) {
  return CARDS.find(c => c.id.toLowerCase() === cardId.toLowerCase()) ?? null;
}

/**
 * Merge a stored inventory card with the live card definition so that
 * rarity (and name/series) always reflect the current cards.js values.
 */
function enrichCard(storedCard) {
  const live = lookupCard(storedCard.id);
  if (!live) return storedCard;
  return {
    ...storedCard,
    rarity: live.rarity,
    name:   live.name,
    series: live.series,
  };
}

function resolveCard(query, pool = CARDS) {
  if (!query) return null;
  const q = query.toLowerCase().trim();
  if (!q) return null;

  const exact = pool.find(c => c.id.toLowerCase() === q);
  if (exact) return exact;

  const qUnderscore = q.replace(/\s+/g, '_');
  if (qUnderscore !== q) {
    const u = pool.find(c => c.id.toLowerCase() === qUnderscore);
    if (u) return u;
  }

  const qCompact = q.replace(/[\s_-]+/g, '');
  const compact  = pool.find(c => c.id.toLowerCase().replace(/_/g, '').includes(qCompact));
  if (compact) return compact;

  const words = q.split(/[\s_-]+/).filter(w => w.length > 0);
  if (words.length === 0) return null;

  const wordMatch = pool.filter(c => {
    const hay = `${c.id.toLowerCase()} ${c.name.toLowerCase()} ${c.series.toLowerCase()}`;
    return words.every(w => hay.includes(w));
  });

  return wordMatch[0] ?? null;
}

function applyFilter(cards, filter) {
  if (!filter) return cards;
  const rarity = normalizeRarity(filter);
  if (rarity) return cards.filter(c => c.rarity === rarity);
  const lower = filter.toLowerCase();
  return cards.filter(c =>
    c.name.toLowerCase().includes(lower) ||
    c.series.toLowerCase().includes(lower)
  );
}

function cardEmbed(card, title, footer, level = 1, personalCap = null) {
  const cap    = personalCap ?? inv.MAX_CARD_LEVEL;
  const meta   = rarityMeta(card.rarity);
  const lvl    = Math.max(1, level ?? 1);
  const stats  = getCardStats(card, lvl);
  const isMax  = lvl >= cap;
  const levelLabel = isMax ? `✨ **MAX** (${lvl}/${cap})` : `Lv. ${lvl} / ${cap}`;
  const embed  = new EmbedBuilder()
    .setColor(meta.color)
    .setTitle(title ?? `${meta.emoji} ${card.name}`)
    .addFields(
      { name: 'Series',      value: card.series,                    inline: true },
      { name: 'Rarity',      value: `${meta.emoji} ${meta.label}`, inline: true },
      { name: 'Stars',       value: meta.stars || '—',              inline: true },
      { name: '📊 Level',    value: levelLabel,                     inline: true },
      { name: '❤️ Health',   value: `${stats.hp}`,                 inline: true },
      { name: card.technique ? '🔵 Technique' : '⚔️ Damage', value: `${stats.dmg}`, inline: true },
    );
  const img = imgCache.getImage(card.id) ?? card.image ?? null;
  if (img)    embed.setThumbnail(img);
  if (footer) embed.setFooter({ text: footer });
  return embed;
}

// ── Pull embeds ───────────────────────────────────────────

function singlePullEmbed(card, isDupe, plating, chargeInfo, authorUsername, droppedTickets = []) {
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
  if (plating) descLines.push(`**${plating.label} Plating** dropped!`);
  for (const ticketId of droppedTickets) {
    const rTier = config.RAID_TICKET_TIERS.find(t => t.id === ticketId);
    if (rTier) descLines.push(`${rTier.emoji} **${rTier.label}** dropped! Use \`${rTier.useCmd}\` to fight a boss!`);
  }

  const embed = new EmbedBuilder()
    .setColor(plating?.color ?? (isDupe ? 0x888888 : meta.color))
    .setTitle(`${titlePrefix} ${card.name}${titleSuffix}`)
    .setDescription(descLines.join('\n'))
    .addFields(
      { name: '❤️ Health', value: `${stats.hp}`,  inline: true },
      { name: card.technique ? '🔵 Technique' : '⚔️ Damage', value: `${stats.dmg}`, inline: true },
    )
    .setFooter({ text: `Pulled by ${authorUsername} • ${chargeInfo}` });

  if (img) embed.setImage(img);
  return embed;
}

function allPullEmbed(results, charges, withReset, authorUsername, overrideNote) {
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

    const outcomeParts = [];
    if (g.newCount > 0)   outcomeParts.push('✨ New!');
    if (g.dupeCount > 0)  outcomeParts.push(`${cardEmoji ? cardEmoji + ' ' : ''}${g.dupeCount} Shard${g.dupeCount === 1 ? '' : 's'}`);
    const outcomeLine = outcomeParts.join(' • ');

    const platingStr  = g.platings.map(p => `${p.label} Plating!`).join('  ');
    const platingPart = platingStr ? `  ${platingStr}` : '';

    lines.push(`**${lineNum}** [${m.label}] x${total} **${g.card.name}**${cardEmoji ? ' ' + cardEmoji : ''}\n${outcomeLine}${platingPart}`);
    lineNum++;
  }

  const platings    = results.map(r => r.plating).filter(Boolean);
  const rarityOrder = ['diamond', 'gold', 'silver', 'bronze'];
  const topPlating  = rarityOrder.map(id => platings.find(p => p.id === id)).find(Boolean);
  const color       = topPlating?.color ?? 0x00FFD1;

  const newCount  = results.filter(r => !r.isDupe).length;
  const dupeCount = results.filter(r =>  r.isDupe).length;
  const allDropped = results.flatMap(r => r.droppedTickets ?? []);
  const ticketTotals = {};
  for (const t of allDropped) ticketTotals[t] = (ticketTotals[t] || 0) + 1;
  const ticketFooterParts = Object.entries(ticketTotals).map(([id, n]) => {
    const rTier = config.RAID_TICKET_TIERS.find(t => t.id === id);
    return rTier ? `${rTier.emoji} ${n}x ${rTier.label}` : null;
  }).filter(Boolean);
  const footerParts = [
    `Total Pulls: ${charges}/${charges}`,
    newCount  ? `✨ ${newCount} new` : null,
    dupeCount ? `${dupeCount} shard${dupeCount === 1 ? '' : 's'}` : null,
    platings.length ? `${platings.length} plating${platings.length === 1 ? '' : 's'}` : null,
    ...ticketFooterParts,
    withReset ? `Pulls reset to ${charges}` : null,
    overrideNote || null,
  ].filter(Boolean).join('  •  ');

  const fullDesc = lines.join('\n\n');

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`🎴 ${authorUsername} Has Pulled ${charges} Card${charges === 1 ? '' : 's'}!`)
    .setDescription(fullDesc.length <= 4000 ? fullDesc : fullDesc.slice(0, 3990) + '\n…')
    .setFooter({ text: footerParts });
}

// ── Collection page builder ───────────────────────────────

const COLLECTION_TIMEOUT_MS = 60_000;

const RARITY_ORDER = ['R', 'E', 'L', 'MY', 'UR', 'LT'];

function getSortedAllCards() {
  return [...CARDS].sort((a, b) => {
    const ra = RARITY_ORDER.indexOf(a.rarity);
    const rb = RARITY_ORDER.indexOf(b.rarity);
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });
}

const SHARDS_PER_PAGE = 20;

function buildShardsPage(authorId, target, entries, filterArg, page, expiry) {
  const totalShards = entries.reduce((s, [, n]) => s + n, 0);
  const totalPages  = Math.max(1, Math.ceil(entries.length / SHARDS_PER_PAGE));
  const p           = Math.max(0, Math.min(page, totalPages - 1));
  const slice       = entries.slice(p * SHARDS_PER_PAGE, (p + 1) * SHARDS_PER_PAGE);

  const titleSuffix = filterArg ? ` — "${filterArg}"` : '';
  const lines = slice.map(([cardId, count]) => {
    const card   = lookupCard(cardId);
    const rarity = card?.rarity ?? 'R';
    const meta   = rarityMeta(rarity);
    const emoji  = emojiCache.getEmoji(cardId) ?? '';
    const name   = card?.name ?? cardId;
    return `${meta.emoji}${emoji ? ' ' + emoji : ''} **${name}** — x${count}`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x9B59B6)
    .setTitle(`${target.username}'s Shards${titleSuffix}`)
    .setDescription(lines.join('\n') || 'No shards on this page.')
    .setFooter({
      text: `${entries.length} card${entries.length === 1 ? '' : 's'} • ${totalShards} shard${totalShards === 1 ? '' : 's'} total • Page ${p + 1}/${totalPages}` +
            (filterArg ? '' : '  •  Filter: ZP shards R / ZP shards <name>'),
    });

  const base = `shards|${authorId}|${target.id}|${expiry}|%p%|${filterArg || '_'}`;
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(base.replace('%p%', String(p - 1)))
      .setLabel('◀ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(p === 0),
    new ButtonBuilder()
      .setCustomId(base.replace('%p%', String(p + 1)))
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(p >= totalPages - 1),
    new ButtonBuilder()
      .setCustomId(base.replace('%p%', 'close'))
      .setLabel('Close')
      .setStyle(ButtonStyle.Danger),
  );

  return { embed, components: totalPages > 1 ? [row] : [] };
}

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
      { name: card.technique ? '🔵 Technique' : '⚔️ Damage', value: `${stats.dmg}`, inline: true },
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
  const enriched = cards.map(enrichCard);
  const filtered = applyFilter(enriched, filter);

  filtered.sort((a, b) => {
    const ra = RARITY_ORDER.indexOf(a.rarity);
    const rb = RARITY_ORDER.indexOf(b.rarity);
    if (ra !== rb) return rb - ra;
    return a.name.localeCompare(b.name);
  });

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
  const personalCap = inv.getPersonalLevelCap(inventory, targetUser.id, card.id);
  const levelLabel  = cardLevel >= personalCap ? `✨ MAX (${cardLevel}/${personalCap})` : `Lv. ${cardLevel}/${personalCap}`;

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
      { name: card.technique ? '🔵 Technique' : '⚔️ Damage', value: `${stats.dmg}`, inline: true },
      { name: '🪪 Card ID',  value: `\`${card.id}\``,              inline: true },
    )
    .setFooter({ text: `Card ${page + 1} of ${filtered.length}${filterTag}${shardTag}` });

  const colImg = imgCache.getImage(card.id) ?? card.image ?? null;
  if (colImg) embed.setThumbnail(colImg);

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

// ── Help pages ────────────────────────────────────────────

const HELP_TIMEOUT_MS = 120_000;

function buildHelpPage(authorId, page, showAdmin, expiry) {
  const rarityList  = Object.entries(config.RARITY_META)
    .map(([k, v]) => `${v.emoji} **${v.label}** \`${k}\``)
    .join('\n');
  const platingList = config.PLATING_TIERS
    .map(t => `${t.emoji} **${t.label}** — x${t.statMult} battle stats (+${Math.round((t.statMult - 1) * 100)}%)`)
    .join('\n');

  const pages = [
    // Page 0: Pulling
    new EmbedBuilder()
      .setColor(0x00FFD1)
      .setTitle('📖 Help — 🎴 Pulling (1/7)')
      .setDescription('Pull random character cards from anime, manga, and games!')
      .addFields(
        { name: '`ZP pull` / `ZP p` / `ZP pu`',      value: `Pull a random card. You have up to **${config.MAX_PULL_CHARGES}** charges; +1 regenerates every **${config.PULL_COOLDOWN_SECONDS}s**.`, inline: false },
        { name: '`ZP allpull` / `ZP ap`',             value: 'Spend **all** your current pull charges at once.', inline: false },
        { name: '`ZP allpull reset` / `ZP ap reset`', value: 'Spend all charges then instantly refill back to max. Costs **1 Candy Token**.', inline: false },
        { name: '`ZP reset` / `ZP rs`',               value: 'Use a Candy Token to instantly refill your pulls to max.', inline: false },
        { name: '`ZP wish <cardId>` / `ZP wi <cardId>`', value: `Set a card as your wish. After **${inv.WISH_THRESHOLD} pulls**, you are guaranteed to receive that card!`, inline: false },
      )
      .setFooter({ text: 'Page 1 of 7 • ZP help' }),

    // Page 1: Collection & Cards
    new EmbedBuilder()
      .setColor(0x4A90D9)
      .setTitle('📖 Help — 🗂️ Collection & Cards (2/7)')
      .setDescription('Browse your collection, inspect cards, and level them up.')
      .addFields(
        { name: '`ZP collection` / `ZP col`',         value: 'Browse your card collection with Prev/Next buttons.', inline: false },
        { name: '`ZP col [rarity or keyword]`',        value: 'Filter by rarity code (e.g. `LT`, `MY`) or a name/series keyword.', inline: false },
        { name: '`ZP col @user [filter]`',             value: "Browse another player's collection.", inline: false },
        { name: '`ZP all` / `ZP all [filter]`',       value: 'Browse every card in the game, sorted by rarity.', inline: false },
        { name: '`ZP card <id>` / `ZP c <id>` / `ZP ca <id>`', value: 'Inspect a specific card — shows level, stats, shards.', inline: false },
        { name: '`ZP mycard <id>` / `ZP mc <id>` / `ZP mci <id>`', value: 'Inspect your own card with prestige points.', inline: false },
        { name: '`ZP cardinfo <id>` / `ZP ci <id>`',  value: 'View base game info for any card.', inline: false },
        { name: '`ZP absorb shard:<id>:<count>` / `ZP ab ...`', value: 'Spend character shards to level up a card. **1 shard = 1 level**. Each level gives **+2% stats**.', inline: false },
        { name: '`ZP increaselevelcap <id> <count>` / `ZP ilc <id> <count>`', value: 'Break a card\'s level cap beyond 100. Each level costs **1 Limit Breaker** + **100 Prestige Points** on that card.', inline: false },
        { name: '`ZP kill <cardId> <shardId>:<count>` / `ZP ki ...`', value: 'Use a card to kill shards — earn **yen** and **prestige points** on the card used. 1 prestige point per shard.', inline: false },
      )
      .setFooter({ text: 'Page 2 of 7 • ZP help' }),

    // Page 2: Economy & Profile
    new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle('📖 Help — 💰 Economy & Profile (3/7)')
      .setDescription('Manage your currencies and player profile.')
      .addFields(
        { name: '`ZP wallet` / `ZP balance` / `ZP bal`', value: 'Check your Yen, Stars, Candy Tokens, and Limit Breakers. Add `@user` to check someone else.', inline: false },
        { name: '`ZP shop` / `ZP sh`',                    value: 'Browse the shop — see all buyable items and their costs.', inline: false },
        { name: '`ZP buy candy stars <amount>` / `ZP bu ...`', value: 'Buy candy tokens with stars. **1,000 stars** per token.', inline: false },
        { name: '`ZP buy candy yen <amount>`',             value: 'Buy candy tokens with yen. **¥10,000** per token.', inline: false },
        { name: '`ZP inventory` / `ZP inv`',              value: 'View your platings.', inline: false },
        { name: '`ZP shards [rarity or name]` / `ZP sd`', value: 'View your character shards. Filter by rarity or character name.', inline: false },
        { name: '`ZP items` / `ZP it`',                   value: 'View your special items.', inline: false },
        { name: '`ZP use <itemId>`',                      value: 'Use a special item to claim its Limited card.', inline: false },
        { name: '`ZP profile` / `ZP pro`',                value: 'View your player profile — total cards, kills, pulls, wish progress, and more.', inline: false },
        { name: '`ZP profile @user`',                     value: "View another player's profile (if they haven't set it to private).", inline: false },
        { name: '`ZP vote` / `ZP vo`',                    value: 'Get the link to vote for the bot and earn extra pull charges!', inline: false },
        { name: '`ZP privacy` / `ZP pv`',                 value: 'Toggle your profile and collection privacy on/off.', inline: false },
        { name: '`ZP conquestsend <cardId>` / `ZP cs <cardId>`', value: 'Send a card on a 2-hour conquest mission. Only one card at a time.', inline: false },
        { name: '`ZP conquestrecall` / `ZP cr`',          value: 'Recall your card after 2 hours to earn **1 Limit Breaker** + **1–10 Candy Tokens**.', inline: false },
      )
      .setFooter({ text: 'Page 3 of 7 • ZP help' }),

    // Page 3: Team & Battle
    new EmbedBuilder()
      .setColor(0xFF4757)
      .setTitle('📖 Help — ⚔️ Team & Battle (4/7)')
      .setDescription(`Build a team of **${inv.TEAM_SIZE} cards** and fight other players!\n\n**Plating battle bonuses:**\n${platingList}`)
      .addFields(
        { name: '`ZP team` / `ZP tm`',                   value: 'View your battle team with power scores.', inline: false },
        { name: '`ZP team add <id>` / `ZP teamadd <id>` / `ZP add <id>`', value: `Add a card to your team (max ${inv.TEAM_SIZE}).`, inline: false },
        { name: '`ZP team remove <id>` / `ZP teamremove <id>` / `ZP rm <id>`', value: 'Remove a card from your team.', inline: false },
        { name: '`ZP swap <id1> <id2>` / `ZP sw ...`',  value: 'Swap the positions of two cards on your team.', inline: false },
        { name: '`ZP team equip <id> <plating>` / `ZP teamequip ...`', value: 'Equip a plating onto a team card. Valid: `bronze` `silver` `gold` `diamond`', inline: false },
        { name: '`ZP team unequip <id>` / `ZP teamunequip <id>`', value: 'Remove a plating from a team card.', inline: false },
        { name: '`ZP fight @user` / `ZP fi @user`',      value: `Challenge a player to a turn-based team battle! ${config.FIGHT_COOLDOWN_SECONDS}s cooldown.`, inline: false },
        { name: '`ZP duofight @user` / `ZP df @user`',   value: 'Fight alongside your duo partner — your combined teams take on the opponent!', inline: false },
        { name: '`ZP raid` / `ZP raid mythical` / `ZP raid omega` / `ZP raid hellish`',
          value: [
            'Spend a raid ticket to fight a random Boss. Supports **solo or collab** (up to 5 players total).',
            '🎟️ **Raid** (0.15% drop) — Rare–Legendary boss, 4× Lv100 stats → ¥10k–25k, low card chance',
            '🌙 **Mythical** (0.075% drop) — Mythical boss, 5× Lv100 stats → ¥25k–60k, medium card chance',
            '⚡ **Omega** (0.05% drop) — Ultra Rare boss, 5× Lv100 stats → ¥50k–100k, higher card chance',
            '💀 **Hellish** (0.01% drop) — Limited boss, 4× Lv100 stats → ¥100k–200k, Limit Breakers, medium card chance',
          ].join('\n'), inline: false },
        { name: '`ZP allowraidjoins` / `ZP arj`', value: 'Enable others to join your active raid. Run after using a raid ticket.', inline: false },
        { name: '`ZP whitelist @user` / `ZP wh @user`', value: 'Whitelist a player (max 4) to join your collab raid. They click **Join Raid** on the raid card.', inline: false },
      )
      .setFooter({ text: 'Page 4 of 7 • ZP help' }),

    // Page 4: Trading
    new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('📖 Help — 🤝 Trading (5/7)')
      .setDescription('Trade shards, platings, Yen, and Stars with other players.')
      .addFields(
        {
          name: '`ZP trade @user <offer> [for <ask>]` / `ZP tr ...`',
          value: [
            'Send a trade offer or instant gift.',
            '**Item formats:** `shard:<cardId>:<amount>` • `plating:<tier>:<amount>` • `yen:<amount>` • `stars:<amount>`',
            '**Examples:**',
            '`ZP trade @Alice shard:naruto_r:5` — free gift',
            '`ZP trade @Alice yen:500 for stars:100` — currency swap',
          ].join('\n'),
          inline: false,
        },
        { name: '`ZP accept <tradeId>` / `ZP a <id>` / `ZP ac <id>`', value: 'Accept a pending trade offer.', inline: false },
        { name: '`ZP decline <tradeId>` / `ZP dec <id>`', value: 'Decline or cancel a trade.', inline: false },
        { name: '`ZP trades` / `ZP trs`',                 value: 'List all pending trade offers addressed to you.', inline: false },
      )
      .setFooter({ text: 'Page 5 of 7 • Trades expire after 5 minutes' }),

    // Page 5: Clans & Duos
    new EmbedBuilder()
      .setColor(0xFF6B35)
      .setTitle('📖 Help — 🏛️ Clans & Duos (6/7)')
      .setDescription('Form clans with other players and create duo partnerships for team battles!')
      .addFields(
        { name: '**Clan Commands**', value: '\u200b', inline: false },
        { name: '`ZP clancreate <name>` / `ZP cc <name>`', value: 'Create a new clan. You become the owner.', inline: false },
        { name: '`ZP clan`',              value: 'View your clan info, members, and fund.', inline: false },
        { name: '`ZP clanadd @user` / `ZP cla @user`',  value: '(Owner) Invite a player to your clan.', inline: false },
        { name: '`ZP clanremove @user` / `ZP cr @user`', value: '(Owner) Remove a player from your clan.', inline: false },
        { name: '`ZP clanleave` / `ZP cl`',              value: 'Leave your current clan.', inline: false },
        { name: '`ZP clandelete` / `ZP cd`',             value: '(Owner) Permanently delete your clan.', inline: false },
        { name: '`ZP clanfundadd <yen>` / `ZP cfa <yen>`', value: 'Donate yen to the clan fund.', inline: false },
        { name: '`ZP clanfundtake <yen>` / `ZP cft <yen>`', value: '(Owner) Withdraw yen from the clan fund.', inline: false },
        { name: '**Duo Commands**', value: '\u200b', inline: false },
        { name: '`ZP duocreate @user` / `ZP dc @user`', value: 'Send a duo partnership request to a player.', inline: false },
        { name: '`ZP duo`',               value: 'View your duo partnership.', inline: false },
        { name: '`ZP duoremove` / `ZP dr`', value: 'Disband your current duo partnership.', inline: false },
      )
      .setFooter({ text: 'Page 6 of 7 • ZP help' }),

    // Page 6: Reference
    new EmbedBuilder()
      .setColor(0x00FFD1)
      .setTitle('📖 Help — 📚 Reference (7/7)')
      .setDescription('Quick reference for rarities, platings, and currencies.')
      .addFields(
        { name: '✨ Rarities', value: rarityList, inline: false },
        {
          name: 'Platings',
          value: config.PLATING_TIERS.map(t => `**${t.label}** — 0.1% pull drop`).join('\n'),
          inline: false,
        },
        {
          name: 'Currencies & Resources',
          value: [
            '**Yen** — earned from fights             & kills. Traded between                   players.',
            '**Stars** — earned from                  fights. Traded between                    players.',
            '**Candy Tokens** — bought in             shop or given by admins.                  Resets pull charges.',
            '**Limit Breakers** — earned              from `ZP conquestsend`. Used              to break level cap past 100.',
          ].join('\n'),
          inline: false,
        },
        {
          name: '⚔️ Kill Yen Rewards (per shard)',
          value: Object.entries(KILL_YEN)
            .map(([r, y]) => `${rarityMeta(r).emoji} **${rarityMeta(r).label}** — ¥${y}`)
            .join('\n'),
          inline: false,
        },
        {
          name: '📊 Card Power Formula',
          value: 'Power = (HP + DMG) × level bonus × plating multiplier\nLevel bonus: ×(1 + 0.02 × (level − 1))',
          inline: false,
        },
      )
      .setFooter({ text: 'Page 7 of 7 • ZP help' }),
  ];

  if (showAdmin) {
    const tierIds = config.PLATING_TIERS.map(t => t.id).join(' | ');
    pages.push(
      new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('📖 Help — 🛠️ Admin Commands')
        .addFields(
          {
            name: 'Bot Admin (owner only)',
            value: [
              `\`ZP setrarity <${Object.keys(config.RARITY_META).join(' | ')}>\` – Force all pulls to a specific rarity`,
              '`ZP setrarity reset` – Clear rarity override',
              `\`ZP setplating <${tierIds}>\` – Force every pull to drop a specific plating`,
              '`ZP setplating reset` – Clear plating override',
              '`ZP resetcooldown` – Restore your pull charges to max',
              '`ZP giveyen [@user] <amount>` – Add Yen to a user',
              '`ZP givestars [@user] <amount>` – Add Stars to a user',
              '`ZP givecandytokens [@user] <amount>` – Give Candy Tokens to a user',
            ].join('\n'),
            inline: false,
          },
          {
            name: '\u200b',
            value: [
              '`ZP refresh` – Delete all server emojis and re-sync from scratch',
              '`ZP giveitem @user <itemId>` – Give a limited item to a player',
              '`ZP giveraidticket @user <tier> [amount]` – Give raid tickets (tiers: `normal` `mythical` `omega` `hellish`)',
              '`ZP giveshards @user <cardId> <amount>` – Give character shards to a player',
              '`ZP givelimitbreaker [@user] <amount>` – Give Limit Breakers to a player',
              '`ZP createcode <name> <code> [yen:<n>] [stars:<n>] [candytokens:<n>] [plating:<tier>:<n>] [card:<rarity>]` – Create a redeemable code',
              '`ZP editcode <name> [yen:<n>] [stars:<n>] [candytokens:<n>] [plating:<tier>:<n>] [card:<rarity>]` – Edit a code\'s rewards',
              '`ZP deletecode <name>` – Delete a code',
              '`ZP listcodes` – List all active codes',
            ].join('\n'),
            inline: false,
          }
        )
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

// ── Ready ─────────────────────────────────────────────────

client.once('ready', async () => {
  await initPullCharges();
  console.log(`✅ test Bot online as ${client.user.tag}`);
  client.user.setActivity('ZP help  |  /zp', { type: 0 });
  imgCache.refreshMissing().catch(err => console.error('Image cache refresh error:', err));
  emojiCache.logCacheStatus(CARDS);
  emojiCache.syncEmojis(client, CARDS, imgCache).catch(err => console.error('Emoji sync error:', err));

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  const slashCommand = new SlashCommandBuilder()
    .setName('zp')
    .setDescription('Use any ZP bot command')
    .addStringOption(opt =>
      opt.setName('input')
        .setDescription('Command + args, e.g. "pull", "col legendary", "help", "wallet"')
        .setRequired(true)
    )
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('Mention a user (needed for fight, trade, profile @user, etc.)')
        .setRequired(false)
    );

  rest.put(Routes.applicationCommands(client.user.id), { body: [slashCommand.toJSON()] })
    .then(() => console.log('✅ Global slash command /zp registered'))
    .catch(err => console.error('Failed to register slash command:', err));
});

// ── Slash command → message adapter ───────────────────────

function createSlashContext(interaction) {
  const userOption = interaction.options.getUser('user');
  let replied = false;

  return {
    author: {
      bot: false,
      id: interaction.user.id,
      username: interaction.user.username,
    },
    content: `${config.PREFIX} ${interaction.options.getString('input') ?? ''}`,
    guild: interaction.guild ?? null,
    channel: interaction.channel,
    mentions: {
      users: {
        first: () => userOption ?? null,
        get:   (id) => (userOption?.id === id ? userOption : null),
      },
    },
    reply: async (opts) => {
      if (!replied) {
        replied = true;
        return interaction.editReply(opts).catch(() => interaction.followUp(opts));
      }
      return interaction.followUp(opts);
    },
  };
}

// ── Interaction deduplication ─────────────────────────────
// Guards against the handler firing twice for the same interaction,
// which would cause duplicate replies.
const recentInteractions = new Set();

// ── Interactions (buttons + slash commands) ───────────────

client.on('interactionCreate', async (interaction) => {
  // ── Deduplication guard ────────────────────────────────
  if (recentInteractions.has(interaction.id)) {
    console.warn(`[dedup] Duplicate interactionCreate for ${interaction.id} — skipping.`);
    return;
  }
  recentInteractions.add(interaction.id);
  setTimeout(() => recentInteractions.delete(interaction.id), 100);

  // ── Slash command handler ──────────────────────────────
  if (interaction.isChatInputCommand() && interaction.commandName === 'zp') {
    await interaction.deferReply();
    const mockMessage = createSlashContext(interaction);
    client.emit('messageCreate', mockMessage);
    return;
  }

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
      return interaction.reply({ content: 'These buttons are not for you.', ephemeral: true });
    }
    if (Date.now() > state.expiry) {
      activeBattles.delete(battleId);
      return interaction.update({ components: [], embeds: interaction.message.embeds });
    }

    if (action === 'run') {
      activeBattles.delete(battleId);
      const runEmbed = state.isRaid
        ? buildRaidEmbed(state, `**${state.attackerName}** fled from the Raid Boss!`)
        : buildBattleEmbed(state, `**${state.attackerName}** ran away from the battle!`);
      return interaction.update({ embeds: [runEmbed], components: [] });
    }

    const atkIdx   = parseInt(action, 10);
    const attacker = state.attackerCards[atkIdx];
    if (!attacker?.alive) {
      return interaction.reply({ content: 'That card is already defeated!', ephemeral: true });
    }

    const target = state.defenderCards.find(bc => bc.alive);
    if (!target) {
      activeBattles.delete(battleId);
      return interaction.update({ components: [], embeds: interaction.message.embeds });
    }

    const dmgDealt  = attacker.technique
      ? Math.round(target.maxHp * (attacker.dmg / 10000) * (0.9 + Math.random() * 0.2))
      : Math.round(attacker.dmg * (0.8 + Math.random() * 0.4));
    target.hp       = Math.max(0, target.hp - dmgDealt);
    if (target.hp === 0) target.alive = false;

    let log = `⚔️ **${attacker.name}** attacked **${target.name}** for **${dmgDealt.toLocaleString()}** damage!`;
    if (!target.alive) log += ` **${target.name}** was defeated!`;

    if (state.defenderCards.every(bc => !bc.alive)) {
      activeBattles.delete(battleId);
      const inventory = await inv.loadInventory();

      if (state.isRaid) {
        const rewardText = generateRaidReward(state, inventory);
        await inv.saveInventory(inventory);
        log += `\n\n🏆 **${state.attackerName}** defeated the Raid Boss!\n\n${rewardText}`;
        const embed = buildRaidEmbed(state, log);
        return interaction.update({ embeds: [embed], components: [] });
      }

      const yenEarned   = Math.floor(config.FIGHT_YEN_MIN  + Math.random() * (config.FIGHT_YEN_MAX  - config.FIGHT_YEN_MIN + 1));
      const starsEarned = Math.floor(config.FIGHT_STAR_MIN + Math.random() * (config.FIGHT_STAR_MAX - config.FIGHT_STAR_MIN + 1));
      inv.addYen(inventory, state.attackerId, yenEarned);
      inv.addStars(inventory, state.attackerId, starsEarned);
      await inv.saveInventory(inventory);
      log += `\n\n🏆 **${state.attackerName}** wins!\n+¥${yenEarned.toLocaleString()} Yen  +${starsEarned.toLocaleString()} Stars`;
      const embed = buildBattleEmbed(state, log);
      return interaction.update({ embeds: [embed], components: [] });
    }

    const retaliator = state.defenderCards.find(bc => bc.alive);
    const atkTarget  = state.attackerCards.find(bc => bc.alive);
    if (retaliator && atkTarget) {
      const retDmg  = Math.round(retaliator.dmg * (0.8 + Math.random() * 0.4));
      atkTarget.hp  = Math.max(0, atkTarget.hp - retDmg);
      if (atkTarget.hp === 0) atkTarget.alive = false;
      log += `\n💥 **${retaliator.name}** retaliated against **${atkTarget.name}** for **${retDmg.toLocaleString()}** damage!`;
      if (!atkTarget.alive) log += ` **${atkTarget.name}** was defeated!`;
    }

    if (state.attackerCards.every(bc => !bc.alive)) {
      activeBattles.delete(battleId);
      if (state.isRaid) {
        log += `\n\n💀 Your team was wiped out! The Raid Boss **${state.defenderName}** is victorious!`;
        const embed = buildRaidEmbed(state, log);
        return interaction.update({ embeds: [embed], components: [] });
      }
      log += `\n\n**${state.defenderName}** wins! **${state.attackerName}** was defeated!`;
      const embed = buildBattleEmbed(state, log);
      return interaction.update({ embeds: [embed], components: [] });
    }

    const embed      = state.isRaid ? buildRaidEmbed(state, log) : buildBattleEmbed(state, log);
    const components = buildBattleComponents(state);
    return interaction.update({ embeds: [embed], components });
  }

  // ── Collab Raid button handler ────────────────────────────
  if (parts[0] === 'craid') {
    const battleId = parts[1];
    const action   = parts[2];
    const state    = activeBattles.get(battleId);
    const uid      = interaction.user.id;

    if (!state || !state.isCollabRaid) {
      return interaction.update({ components: [], embeds: interaction.message.embeds });
    }
    if (Date.now() > state.expiry) {
      activeBattles.delete(battleId);
      activeCollabRaids.delete(state.ownerId);
      return interaction.update({ components: [], embeds: interaction.message.embeds });
    }

    // ── Join ──────────────────────────────────────────────
    if (action === 'join') {
      if (!state.allowJoins)
        return interaction.reply({ content: 'The raid owner hasn\'t enabled joins yet!', ephemeral: true });
      if (!state.whitelist.includes(uid))
        return interaction.reply({ content: 'You are not whitelisted for this raid!', ephemeral: true });
      if (uid === state.ownerId)
        return interaction.reply({ content: 'You\'re the raid owner — just click **Start Raid**!', ephemeral: true });
      if (state.started)
        return interaction.reply({ content: 'The raid has already started!', ephemeral: true });

      const existing = state.participants.find(p => p.userId === uid);
      if (existing?.joined)
        return interaction.reply({ content: `You've already joined with **${existing.selectedCard?.name}**!`, ephemeral: true });

      const inventory    = await inv.loadInventory();
      const team         = inv.getTeam(inventory, uid);
      if (!team || team.length === 0)
        return interaction.reply({ content: 'You need cards in your team to join! Use `ZP add <card>`.', ephemeral: true });

      const resolvedTeam = resolveTeamSlots(team, inventory, uid);
      const battleCards  = resolvedTeam.map(buildBattleCard).filter(Boolean);
      if (battleCards.length === 0)
        return interaction.reply({ content: 'No valid cards in your team!', ephemeral: true });

      state.raidChannelId = interaction.channelId;
      state.raidMessageId = interaction.message.id;
      state.pendingJoins[uid] = { username: interaction.user.username, battleCards };

      const rows = [];
      for (let r = 0; r < battleCards.length && rows.length < 4; r += 4) {
        rows.push(
          new ActionRowBuilder().addComponents(
            battleCards.slice(r, r + 4).map((bc, off) => {
              const idx  = r + off;
              const meta = rarityMeta(lookupCard(bc.cardId)?.rarity ?? 'R');
              return new ButtonBuilder()
                .setCustomId(`craid|${battleId}|pickcard|${uid}|${idx}`)
                .setLabel(`${meta.emoji} ${bc.name.length > 17 ? bc.name.slice(0, 15) + '…' : bc.name}`)
                .setStyle(ButtonStyle.Primary);
            })
          )
        );
      }

      return interaction.reply({ content: '**Pick a card to fight with:**', components: rows, ephemeral: true });
    }

    // ── Pick Card ─────────────────────────────────────────
    if (action === 'pickcard') {
      const pickUid  = parts[3];
      const cardIdx  = parseInt(parts[4], 10);

      if (uid !== pickUid)
        return interaction.reply({ content: 'This card picker isn\'t for you!', ephemeral: true });

      const pending = state.pendingJoins?.[uid];
      if (!pending)
        return interaction.reply({ content: 'Your join session expired — click **Join Raid** again.', ephemeral: true });

      const selectedCard = pending.battleCards[cardIdx];
      if (!selectedCard)
        return interaction.reply({ content: 'Invalid card selection.', ephemeral: true });

      const existingIdx = state.participants.findIndex(p => p.userId === uid);
      if (existingIdx >= 0) {
        state.participants[existingIdx] = { userId: uid, username: pending.username, selectedCard, joined: true };
      } else if (state.participants.length < 4) {
        state.participants.push({ userId: uid, username: pending.username, selectedCard, joined: true });
      } else {
        return interaction.reply({ content: 'The raid party is full (4 players max)!', ephemeral: true });
      }
      delete state.pendingJoins[uid];

      if (state.raidMessageId && state.raidChannelId) {
        try {
          const ch  = await client.channels.fetch(state.raidChannelId);
          const msg = await ch.messages.fetch(state.raidMessageId);
          await msg.edit({ embeds: [buildCollabRaidPreEmbed(state)], components: buildCollabPreComponents(state) });
        } catch (_) {}
      }

      return interaction.update({
        content: `✅ You joined the raid with **${selectedCard.name}**! Wait for the owner to start.`,
        components: [],
      });
    }

    // ── Start ─────────────────────────────────────────────
    if (action === 'start') {
      if (uid !== state.ownerId)
        return interaction.reply({ content: 'Only the raid owner can start the raid!', ephemeral: true });
      if (state.started)
        return interaction.reply({ content: 'Raid already started!', ephemeral: true });

      const inventory    = await inv.loadInventory();
      const team         = inv.getTeam(inventory, state.ownerId);
      const resolvedTeam = resolveTeamSlots(team, inventory, state.ownerId);
      state.ownerCards   = resolvedTeam.map(buildBattleCard).filter(Boolean);

      if (state.ownerCards.length === 0)
        return interaction.reply({ content: 'You need cards in your team to start!', ephemeral: true });

      state.started       = true;
      state.currentTurnIdx = 0;
      state.attackerCards  = [
        ...state.ownerCards,
        ...state.participants.filter(p => p.selectedCard).map(p => p.selectedCard),
      ];
      activeCollabRaids.delete(state.ownerId);

      const startLog = `🚀 The raid has started! 👑 **${state.ownerName}** — choose a card to attack!`;
      return interaction.update({
        embeds:     [buildCollabRaidBattleEmbed(state, startLog)],
        components: buildCollabBattleComponents(state),
      });
    }

    // ── Run ───────────────────────────────────────────────
    if (action === 'run') {
      if (uid !== state.ownerId)
        return interaction.reply({ content: 'Only the raid owner can flee!', ephemeral: true });
      if (state.participantTimeout) { clearTimeout(state.participantTimeout); state.participantTimeout = null; }
      activeBattles.delete(battleId);
      activeCollabRaids.delete(state.ownerId);
      return interaction.update({
        embeds:     [buildCollabRaidBattleEmbed(state, `💨 **${state.ownerName}** fled from the Raid Boss!`)],
        components: [],
      });
    }

    // ── Attack ────────────────────────────────────────────
    if (action === 'attack') {
      if (!state.started)
        return interaction.reply({ content: 'The raid hasn\'t started yet!', ephemeral: true });

      if (state.participantTimeout) { clearTimeout(state.participantTimeout); state.participantTimeout = null; }

      const cardIdx    = parseInt(parts[3], 10);
      const isOwnerTurn = state.currentTurnIdx === 0;
      let attacker, attackerLabel;

      if (isOwnerTurn) {
        if (uid !== state.ownerId)
          return interaction.reply({ content: 'It\'s not your turn!', ephemeral: true });
        attacker      = state.ownerCards[cardIdx];
        attackerLabel = `👑 ${state.ownerName}'s **${attacker?.name}**`;
      } else {
        const pIdx = state.currentTurnIdx - 1;
        const p    = state.participants[pIdx];
        if (!p || uid !== p.userId)
          return interaction.reply({ content: 'It\'s not your turn!', ephemeral: true });
        attacker      = p.selectedCard;
        attackerLabel = `**${p.username}**'s **${attacker?.name}**`;
      }

      if (!attacker?.alive)
        return interaction.reply({ content: 'That card is already defeated!', ephemeral: true });

      const boss = state.defenderCards[0];
      if (!boss?.alive) {
        return interaction.update({ components: [], embeds: interaction.message.embeds });
      }

      const dmgDealt = attacker.technique
        ? Math.round(boss.maxHp * (attacker.dmg / 10000) * (0.9 + Math.random() * 0.2))
        : Math.round(attacker.dmg * (0.8 + Math.random() * 0.4));
      boss.hp = Math.max(0, boss.hp - dmgDealt);
      if (boss.hp === 0) boss.alive = false;

      let log = `⚔️ ${attackerLabel} attacked **${boss.name}** for **${dmgDealt.toLocaleString()}** damage!`;
      if (!boss.alive) log += ` **${boss.name}** was defeated!`;

      if (!boss.alive) {
        if (state.participantTimeout) { clearTimeout(state.participantTimeout); state.participantTimeout = null; }
        activeBattles.delete(battleId);
        activeCollabRaids.delete(state.ownerId);
        const inventory  = await inv.loadInventory();
        const rewardText = generateCollabRaidReward(state, inventory);
        await inv.saveInventory(inventory);
        const winners = [state.ownerName, ...state.participants.map(p => p.username)].join(', ');
        log += `\n\n🏆 **${winners}** defeated the Raid Boss!\n\n${rewardText}`;
        return interaction.update({ embeds: [buildCollabRaidBattleEmbed(state, log)], components: [] });
      }

      const retDmg = Math.round(boss.dmg * (0.8 + Math.random() * 0.4));
      attacker.hp  = Math.max(0, attacker.hp - retDmg);
      if (attacker.hp === 0) attacker.alive = false;
      log += `\n💥 **${boss.name}** retaliated against ${attackerLabel} for **${retDmg.toLocaleString()}** damage!`;
      if (!attacker.alive) log += ` **${attacker.name}** was defeated!`;

      const allOwnerDead = state.ownerCards.every(c => !c.alive);
      const allAllyDead  = state.participants.every(p => !p.selectedCard || !p.selectedCard.alive);

      if (allOwnerDead && allAllyDead) {
        if (state.participantTimeout) { clearTimeout(state.participantTimeout); state.participantTimeout = null; }
        activeBattles.delete(battleId);
        activeCollabRaids.delete(state.ownerId);
        log += `\n\n💀 The entire raid party was wiped out! **${boss.name}** is victorious!`;
        return interaction.update({ embeds: [buildCollabRaidBattleEmbed(state, log)], components: [] });
      }

      advanceCollabTurn(state);
      state.attackerCards = [...state.ownerCards, ...state.participants.filter(p => p.selectedCard).map(p => p.selectedCard)];
      const nextName = state.currentTurnIdx === 0
        ? `👑 ${state.ownerName}`
        : state.participants[state.currentTurnIdx - 1].username;
      log += `\n\n⏭️ **${nextName}**'s turn!`;
      startParticipantTimeout(state, client);

      return interaction.update({
        embeds:     [buildCollabRaidBattleEmbed(state, log)],
        components: buildCollabBattleComponents(state),
      });
    }

    // ── Skip turn (owner action after participant timeout) ─────────────────────
    if (action === 'skipturn') {
      if (uid !== state.ownerId)
        return interaction.reply({ content: 'Only the raid owner can skip a turn!', ephemeral: true });

      const pIdx = parseInt(parts[3], 10);
      if (state.currentTurnIdx !== pIdx + 1)
        return interaction.reply({ content: 'That player\'s turn has already passed!', ephemeral: true });

      const p = state.participants[pIdx];
      let log = `⏩ **${state.ownerName}** skipped **${p.username}**'s turn!`;

      advanceCollabTurn(state);
      state.attackerCards = [...state.ownerCards, ...state.participants.filter(p => p.selectedCard).map(p => p.selectedCard)];
      const nextName = state.currentTurnIdx === 0
        ? `👑 ${state.ownerName}`
        : state.participants[state.currentTurnIdx - 1].username;
      log += `\n⏭️ **${nextName}**'s turn!`;
      startParticipantTimeout(state, client);

      return interaction.update({
        embeds:     [buildCollabRaidBattleEmbed(state, log)],
        components: buildCollabBattleComponents(state),
      });
    }

    // ── Kick participant (owner action after participant timeout) ──────────────
    if (action === 'kick') {
      if (uid !== state.ownerId)
        return interaction.reply({ content: 'Only the raid owner can kick a participant!', ephemeral: true });

      const pIdx = parseInt(parts[3], 10);
      const p = state.participants[pIdx];
      if (!p)
        return interaction.reply({ content: 'That participant no longer exists.', ephemeral: true });

      if (p.selectedCard) p.selectedCard.alive = false;
      let log = `🚫 **${p.username}** was kicked from the raid!`;

      const allOwnerDead = state.ownerCards.every(c => !c.alive);
      const allAllyDead  = state.participants.every(p => !p.selectedCard || !p.selectedCard.alive);

      if (allOwnerDead && allAllyDead) {
        if (state.participantTimeout) { clearTimeout(state.participantTimeout); state.participantTimeout = null; }
        activeBattles.delete(battleId);
        activeCollabRaids.delete(state.ownerId);
        log += `\n\n💀 The entire raid party was wiped out!`;
        return interaction.update({ embeds: [buildCollabRaidBattleEmbed(state, log)], components: [] });
      }

      advanceCollabTurn(state);
      state.attackerCards = [...state.ownerCards, ...state.participants.filter(p => p.selectedCard).map(p => p.selectedCard)];
      const nextName = state.currentTurnIdx === 0
        ? `👑 ${state.ownerName}`
        : state.participants[state.currentTurnIdx - 1].username;
      log += `\n⏭️ **${nextName}**'s turn!`;
      startParticipantTimeout(state, client);

      return interaction.update({
        embeds:     [buildCollabRaidBattleEmbed(state, log)],
        components: buildCollabBattleComponents(state),
      });
    }
    return;
  }

  // ── Help button handler ───────────────────────────────────
  if (parts[0] === 'help') {
    const [, authorId, expiryStr, pageStr, adminFlag] = parts;
    const expiry    = parseInt(expiryStr, 10);
    const showAdmin = adminFlag === '1';

    if (interaction.user.id !== authorId) {
      return interaction.reply({ content: 'These buttons are not for you.', ephemeral: true });
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
    const [, authorId, expiryStr, pageStr, ...filterParts] = parts;
    const filter = filterParts.join('|');
    const expiry = parseInt(expiryStr, 10);

    if (interaction.user.id !== authorId) {
      return interaction.reply({ content: 'These buttons are not for you.', ephemeral: true });
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

  // ── Shards button handler ─────────────────────────────────
  if (parts[0] === 'shards') {
    const [, authorId, targetId, expiryStr, pageStr, ...filterParts] = parts;
    const filterArg = filterParts.join('|').replace(/^_$/, '');
    const expiry    = parseInt(expiryStr, 10);

    if (interaction.user.id !== authorId) {
      return interaction.reply({ content: 'These buttons are not for you.', ephemeral: true });
    }
    if (Date.now() > expiry) {
      return interaction.update({ components: [], embeds: interaction.message.embeds });
    }
    if (pageStr === 'close') {
      return interaction.update({ components: [] });
    }

    const page     = parseInt(pageStr, 10);
    const target   = await client.users.fetch(targetId).catch(() => null);
    if (!target) return interaction.reply({ content: 'Could not find that user.', ephemeral: true });

    const inventory  = await inv.loadInventory();
    const charShards = inv.getCharacterShards(inventory, targetId);
    let allEntries   = Object.entries(charShards).filter(([, n]) => n > 0);

    if (filterArg) {
      const rarityFilter = normalizeRarity(filterArg);
      if (rarityFilter) {
        allEntries = allEntries.filter(([cardId]) => (lookupCard(cardId)?.rarity ?? 'R') === rarityFilter);
      } else {
        allEntries = allEntries.filter(([cardId]) => {
          const card = lookupCard(cardId);
          return (card?.name ?? cardId).toLowerCase().includes(filterArg.toLowerCase());
        });
      }
    }

    const rarityOrder = Object.keys(config.RARITY_META);
    allEntries.sort(([a], [b]) => {
      const ra = lookupCard(a)?.rarity ?? 'R';
      const rb = lookupCard(b)?.rarity ?? 'R';
      return rarityOrder.indexOf(rb) - rarityOrder.indexOf(ra);
    });

    const { embed, components } = buildShardsPage(authorId, target, allEntries, filterArg, page, expiry);
    return interaction.update({ embeds: [embed], components });
  }

  if (parts[0] !== 'col') return;

  const [, authorId, targetId, expiryStr, pageStr, ...filterParts] = parts;
  const filter = filterParts.join('|');
  const expiry = parseInt(expiryStr, 10);

  if (interaction.user.id !== authorId) {
    return interaction.reply({ content: 'These buttons are not for you.', ephemeral: true });
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

  const page       = parseInt(pageStr, 10);
  const targetUser = await client.users.fetch(targetId).catch(() => null);
  if (!targetUser) return interaction.reply({ content: 'Could not find that user.', ephemeral: true });

  const inventory = await inv.loadInventory();
  const cards     = inv.getCards(inventory, targetId);
  const { embed, components } = buildCollectionPage(authorId, targetUser, cards, page, filter, inventory, expiry);

  await interaction.update({ embeds: [embed], components });
});

// ── Message Handler ───────────────────────────────────────

// Pending duo invites: Map<inviteeId, { inviterId, inviterName }>
const pendingDuoInvites = new Map();

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const prefix = config.PREFIX.toLowerCase();
  if (!message.content.toLowerCase().startsWith(prefix)) return;

  const args    = message.content.slice(config.PREFIX.length).trim().split(/\s+/);
  let command   = args.shift()?.toLowerCase();

  // Normalize no-space compound commands e.g. ZP teamadd → ZP team add
  const COMPOUND_PREFIXES = ['team'];
  for (const cpfx of COMPOUND_PREFIXES) {
    if (command?.startsWith(cpfx) && command.length > cpfx.length) {
      args.unshift(command.slice(cpfx.length));
      command = cpfx;
      break;
    }
  }
  const userId  = message.author.id;
  const guildId = message.guild?.id;

  // ── help | h ─────────────────────────────────────────────
  if (!command || command === 'help' || command === 'h') {
    const expiry    = Date.now() + HELP_TIMEOUT_MS;
    const showAdmin = isAdmin(userId);
    const { embed, components } = buildHelpPage(userId, 0, showAdmin, expiry);
    return message.reply({ embeds: [embed], components });
  }

  // ── Shared pull logic ────────────────────────────────────

  function executeSinglePull(inventory, uid) {
    const card    = (isAdmin(uid) && adminRarityOverride)
      ? pullCardForced(adminRarityOverride)
      : pullCard();
    const { isDupe } = inv.addCardToInventory(inventory, uid, card);
    const plating    = (isAdmin(uid) && adminPlatingOverride)
      ? adminPlatingOverride
      : rollPlating();
    if (plating) inv.addPlating(inventory, uid, plating.id);

    // Track total pulls
    inv.incrementTotalPulls(inventory, uid, 1);

    // Track wish progress
    const wishCount = inv.incrementWishPulls(inventory, uid);

    // Roll independently for each raid ticket tier
    const droppedTickets = [];
    for (const [ticketId, chance] of Object.entries(config.RAID_TICKET_CHANCES)) {
      if (Math.random() < chance) {
        inv.addItem(inventory, uid, ticketId);
        droppedTickets.push(ticketId);
      }
    }

    return { card, isDupe, plating, wishCount, droppedTickets };
  }

  /**
   * Check if wish threshold was reached, grant the card if so.
   * Returns the granted wish card + info, or null.
   */
  function checkAndGrantWish(inventory, uid) {
    const wish = inv.getWish(inventory, uid);
    if (!wish) return null;
    if (wish.pullCount < inv.WISH_THRESHOLD) return null;

    const wishCard = lookupCard(wish.cardId);
    if (!wishCard) {
      inv.clearWish(inventory, uid);
      return null;
    }

    const { isDupe } = inv.addCardToInventory(inventory, uid, wishCard);
    inv.clearWish(inventory, uid);
    return { card: wishCard, isDupe };
  }

  // ── pull | p ─────────────────────────────────────────────
  if (command === 'pull' || command === 'p' || command === 'pu') {
    if (args.filter(a => !a.startsWith('<@')).length > 0)
      return message.reply('`ZP pull` takes no arguments. Just use `ZP pull`, `ZP p`, or `ZP pu`.');
    const { charges, lastRefill } = getCharges(userId);

    if (charges <= 0) {
      const secsUntilNext = Math.ceil(config.PULL_COOLDOWN_SECONDS - (Date.now() - lastRefill) / 1000);
      return message.reply(`No pulls left! Next charge in **${secsUntilNext}s**. Charges refill 1 every **${config.PULL_COOLDOWN_SECONDS}s** (max **${config.MAX_PULL_CHARGES}**).`);
    }

    setCharges(userId, charges - 1, lastRefill);

    const inventory                              = await inv.loadInventory();
    const { card, isDupe, plating, droppedTickets } = executeSinglePull(inventory, userId);
    const wishGrant                                  = checkAndGrantWish(inventory, userId);
    await inv.saveInventory(inventory);

    const remaining  = charges - 1;
    const chargeInfo = remaining > 0
      ? `${remaining} pull${remaining === 1 ? '' : 's'} remaining`
      : `No pulls left — next charge in ${config.PULL_COOLDOWN_SECONDS}s`;

    const embed = singlePullEmbed(card, isDupe, plating, chargeInfo, message.author.username, droppedTickets);
    await message.reply({ embeds: [embed] });

    if (wishGrant) {
      const wMeta = rarityMeta(wishGrant.card.rarity);
      const wImg  = imgCache.getImage(wishGrant.card.id) ?? wishGrant.card.image ?? null;
      const wEmbed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle(`✨ Wish Granted! ${wishGrant.card.name}!`)
        .setDescription(
          `After **${inv.WISH_THRESHOLD} pulls**, your wish was granted!\n` +
          `${wMeta.emoji} **${wMeta.label}** — ${wishGrant.card.series}\n` +
          (wishGrant.isDupe ? `You already owned this card — **+1 Shard** added instead.` : `**${wishGrant.card.name}** added to your collection!`)
        )
        .setFooter({ text: 'Your wish has been cleared. Use ZP wish to set a new one!' });
      if (wImg) wEmbed.setImage(wImg);
      await message.reply({ embeds: [wEmbed] });
    }

    return;
  }

  // ── allpull | ap ──────────────────────────────────────────
  if (command === 'allpull' || command === 'ap') {
    const withReset = args[0]?.toLowerCase() === 'reset';
    const { charges, lastRefill } = getCharges(userId);

    if (charges <= 0) {
      const secsUntilNext = Math.ceil(config.PULL_COOLDOWN_SECONDS - (Date.now() - lastRefill) / 1000);
      return message.reply(`No pulls left! Next charge in **${secsUntilNext}s**.`);
    }

    if (withReset) {
      const inventory = await inv.loadInventory();
      if (!inv.removeCandyTokens(inventory, userId, 1)) {
        return message.reply(`You need a **Candy Token** to use \`ZP ap reset\`. You currently have none.`);
      }
      await inv.saveInventory(inventory);
    }

    setCharges(userId, 0, lastRefill);

    const inventory = await inv.loadInventory();
    const results   = [];

    for (let i = 0; i < charges; i++) {
      results.push(executeSinglePull(inventory, userId));
    }

    const wishGrant = checkAndGrantWish(inventory, userId);
    await inv.saveInventory(inventory);

    if (withReset) {
      setCharges(userId, config.MAX_PULL_CHARGES, Date.now());
    }

    const overrideNote = (isAdmin(userId) && adminRarityOverride)
      ? `Rarity locked to ${rarityMeta(adminRarityOverride).label}` : '';

    const embed = allPullEmbed(results, charges, withReset, message.author.username, overrideNote);
    await message.reply({ embeds: [embed] });

    if (wishGrant) {
      const wMeta  = rarityMeta(wishGrant.card.rarity);
      const wImg   = imgCache.getImage(wishGrant.card.id) ?? wishGrant.card.image ?? null;
      const wEmbed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle(`✨ Wish Granted! ${wishGrant.card.name}!`)
        .setDescription(
          `After **${inv.WISH_THRESHOLD} pulls**, your wish was granted!\n` +
          `${wMeta.emoji} **${wMeta.label}** — ${wishGrant.card.series}\n` +
          (wishGrant.isDupe ? `You already owned this card — **+1 Shard** added instead.` : `**${wishGrant.card.name}** added to your collection!`)
        )
        .setFooter({ text: 'Your wish has been cleared. Use ZP wish to set a new one!' });
      if (wImg) wEmbed.setImage(wImg);
      await message.reply({ embeds: [wEmbed] });
    }

    return;
  }

  // ── reset ─────────────────────────────────────────────────
  if (command === 'reset' || command === 'rs') {
    const inventory = await inv.loadInventory();
    const tokens = inv.getCandyTokens(inventory, userId);
    if (tokens <= 0) {
      return message.reply(`You have no **Candy Tokens**. Ask an admin to give you one!`);
    }
    inv.removeCandyTokens(inventory, userId, 1);
    await inv.saveInventory(inventory);
    setCharges(userId, config.MAX_PULL_CHARGES, Date.now());
    return message.reply(`**Candy Token** used! Your pulls have been reset to **${config.MAX_PULL_CHARGES}**. You have **${tokens - 1}** token${tokens - 1 === 1 ? '' : 's'} remaining.`);
  }

  // ── wish ─────────────────────────────────────────────────
  if (command === 'wish' || command === 'wi') {
    const cardQuery = args.filter(a => !a.startsWith('<@')).join(' ');
    if (!cardQuery) {
      const inventory = await inv.loadInventory();
      const wish      = inv.getWish(inventory, userId);
      if (!wish) {
        return message.reply(
          `You have no wish set. Use \`ZP wish <name or id>\` to wish for a card.\n` +
          `After **${inv.WISH_THRESHOLD} pulls**, you are guaranteed to receive it!`
        );
      }
      const wishCard = lookupCard(wish.cardId);
      const remaining = inv.WISH_THRESHOLD - wish.pullCount;
      const meta = wishCard ? rarityMeta(wishCard.rarity) : { emoji: '❔' };
      const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle(`✨ Your Current Wish`)
        .setDescription(
          `**Card:** ${meta.emoji} **${wishCard?.name ?? wish.cardId}**\n` +
          `**Progress:** ${wish.pullCount} / ${inv.WISH_THRESHOLD} pulls\n` +
          `**Remaining:** ${remaining} pull${remaining === 1 ? '' : 's'} until guaranteed!\n\n` +
          `Use \`ZP wish <cardId>\` to change your wish (progress will reset).`
        )
        .setFooter({ text: 'Pull more cards to make progress!' });
      const wImg = wishCard ? (imgCache.getImage(wishCard.id) ?? wishCard.image ?? null) : null;
      if (wImg) embed.setThumbnail(wImg);
      return message.reply({ embeds: [embed] });
    }

    const card = resolveCard(cardQuery);
    if (!card) {
      return message.reply(`No card found matching \`${cardQuery}\`. Use \`ZP all\` to browse available cards.`);
    }

    if (card.rarity === 'UR' || card.rarity === 'LT') {
      return message.reply(`You cannot wish for **${rarityMeta(card.rarity).label}** cards. Wishes are limited to Mythical rarity and below.`);
    }

    const inventory = await inv.loadInventory();
    inv.setWish(inventory, userId, card.id);
    await inv.saveInventory(inventory);

    const meta  = rarityMeta(card.rarity);
    const wImg  = imgCache.getImage(card.id) ?? card.image ?? null;
    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle(`✨ Wish Set — ${card.name}!`)
      .setDescription(
        `${meta.emoji} **${meta.label}** — ${card.series}\n\n` +
        `Your wish is set! After **${inv.WISH_THRESHOLD} pulls**, you are guaranteed to receive **${card.name}**.\n` +
        `Use \`ZP wish\` anytime to check your progress.`
      )
      .setFooter({ text: 'Keep pulling! The pity resets after you receive your wish.' });
    if (wImg) embed.setThumbnail(wImg);
    return message.reply({ embeds: [embed] });
  }

  // ── collection | col ─────────────────────────────────────
  if (command === 'collection' || command === 'col') {
    const target  = message.mentions.users.first() ?? message.author;
    const filter  = args.filter(a => !a.startsWith('<@')).join(' ').trim();

    if (target.id !== userId) {
      const checkInv  = await inv.loadInventory();
      if (inv.getPrivacy(checkInv, target.id)) {
        return message.reply(`**${target.username}**'s collection is set to private.`);
      }
    }

    const inventory = await inv.loadInventory();
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

  // ── wallet | balance | bal ────────────────────────────────
  if (command === 'wallet' || command === 'balance' || command === 'bal') {
    const target    = message.mentions.users.first() ?? message.author;

    if (target.id !== userId) {
      const checkInv = await inv.loadInventory();
      if (inv.getPrivacy(checkInv, target.id)) {
        return message.reply(`**${target.username}**'s wallet is set to private.`);
      }
    }

    const inventory = await inv.loadInventory();
    const yen       = inv.getYen(inventory, target.id);
    const stars     = inv.getStars(inventory, target.id);
    const candy     = inv.getCandyTokens(inventory, target.id);

    const lbs = inv.getLimitBreakers(inventory, target.id);
    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle(`${target.username}'s Wallet`)
      .addFields(
        { name: 'Yen',            value: `¥${yen.toLocaleString()}`,   inline: true },
        { name: 'Stars',          value: stars.toLocaleString(),       inline: true },
        { name: 'Candy Tokens',   value: candy.toLocaleString(),       inline: true },
        { name: 'Limit Breakers', value: lbs.toLocaleString(),         inline: true },
      )
      .setFooter({ text: 'Earn yen from fights and kills • Stars from fights • Limit Breakers from conquest' });
    return message.reply({ embeds: [embed] });
  }

  // ── buy ───────────────────────────────────────────────────
  if (command === 'buy' || command === 'bu') {
    const STARS_PER_TOKEN = 1000;
    const YEN_PER_TOKEN   = 10000;

    // ZP buy candy stars [amount]
    // ZP buy candy yen [amount]
    const what     = args[0]?.toLowerCase();
    const currency = args[1]?.toLowerCase();
    const amount   = Math.max(1, parseInt(args[2], 10) || 1);

    if (what !== 'candy') {
      return message.reply(
        `Usage:\n` +
        `\`ZP buy candy stars <amount>\` — spend stars to buy candy tokens (**${STARS_PER_TOKEN.toLocaleString()} stars** each)\n` +
        `\`ZP buy candy yen <amount>\` — spend yen to buy candy tokens (**¥${YEN_PER_TOKEN.toLocaleString()}** each)`
      );
    }

    if (currency !== 'stars' && currency !== 'yen') {
      return message.reply(
        `Choose a currency:\n` +
        `\`ZP buy candy stars <amount>\` — **${STARS_PER_TOKEN.toLocaleString()} stars** per token\n` +
        `\`ZP buy candy yen <amount>\` — **¥${YEN_PER_TOKEN.toLocaleString()}** per token`
      );
    }

    const inventory = await inv.loadInventory();

    if (currency === 'stars') {
      const cost = STARS_PER_TOKEN * amount;
      const have = inv.getStars(inventory, userId);
      if (have < cost) {
        return message.reply(
          `You need **${cost.toLocaleString()} stars** for **${amount}** candy token${amount === 1 ? '' : 's'}, but you only have **${have.toLocaleString()}**.`
        );
      }
      inv.removeStars(inventory, userId, cost);
      inv.addCandyTokens(inventory, userId, amount);
      await inv.saveInventory(inventory);

      const embed = new EmbedBuilder()
        .setColor(0xFF69B4)
        .setTitle(`Purchase Successful`)
        .setDescription(
          `You spent **${cost.toLocaleString()} stars** and received **${amount} candy token${amount === 1 ? '' : 's'}**.\n\n` +
          `**Stars remaining:** ${inv.getStars(inventory, userId).toLocaleString()}\n` +
          `**Candy tokens:** ${inv.getCandyTokens(inventory, userId).toLocaleString()}`
        );
      return message.reply({ embeds: [embed] });
    }

    if (currency === 'yen') {
      const cost = YEN_PER_TOKEN * amount;
      const have = inv.getYen(inventory, userId);
      if (have < cost) {
        return message.reply(
          `You need **¥${cost.toLocaleString()}** for **${amount}** candy token${amount === 1 ? '' : 's'}, but you only have **¥${have.toLocaleString()}**.`
        );
      }
      inv.removeYen(inventory, userId, cost);
      inv.addCandyTokens(inventory, userId, amount);
      await inv.saveInventory(inventory);

      const embed = new EmbedBuilder()
        .setColor(0xFF69B4)
        .setTitle(`Purchase Successful`)
        .setDescription(
          `You spent **¥${cost.toLocaleString()}** and received **${amount} candy token${amount === 1 ? '' : 's'}**.\n\n` +
          `**Yen remaining:** ¥${inv.getYen(inventory, userId).toLocaleString()}\n` +
          `**Candy tokens:** ${inv.getCandyTokens(inventory, userId).toLocaleString()}`
        );
      return message.reply({ embeds: [embed] });
    }
  }

  // ── shop ──────────────────────────────────────────────────
  if (command === 'shop' || command === 'sh') {
    const STARS_PER_TOKEN = 1000;
    const YEN_PER_TOKEN   = 10000;

    const inventory = await inv.loadInventory();
    const yen       = inv.getYen(inventory, userId);
    const stars     = inv.getStars(inventory, userId);
    const candy     = inv.getCandyTokens(inventory, userId);

    const platingLines = config.PLATING_TIERS.map(t =>
      `**${t.label}** — ${t.statMult}x stat multiplier *(drop from pulls)*`
    ).join('\n');

    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle('ZP Shop')
      .setDescription(
        `Your wallet: **¥${yen.toLocaleString()}** Yen  •  **${stars.toLocaleString()}** Stars  •  **${candy}** Candy Tokens`
      )
      .addFields(
        {
          name: 'Candy Tokens',
          value: [
            `Buy candy tokens to use in future shop features.`,
            `> \`ZP buy candy stars <amount>\` — **${STARS_PER_TOKEN.toLocaleString()} stars** each`,
            `> \`ZP buy candy yen <amount>\` — **¥${YEN_PER_TOKEN.toLocaleString()}** each`,
          ].join('\n'),
          inline: false,
        },
        {
          name: 'Platings *(from pulls only)*',
          value: platingLines,
          inline: false,
        },
        {
          name: 'How to Earn',
          value: [
            `> **Yen** — win fights, kill shards`,
            `> **Stars** — win fights`,
            `> **Candy Tokens** — buy with Yen or Stars above`,
            `> **Limit Breakers** — send cards on conquest (\`ZP conquestsend\`)`,
          ].join('\n'),
          inline: false,
        },
      )
      .setFooter({ text: 'More items coming soon!' });

    return message.reply({ embeds: [embed] });
  }

  // ── inventory | inv ───────────────────────────────────────
  if (command === 'inventory' || command === 'inv') {
    const target    = message.mentions.users.first() ?? message.author;
    const inventory = await inv.loadInventory();

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
      .setTitle(`${target.username}'s Inventory`)
      .addFields({
        name: `Platings (${totalPlatings} total)`,
        value: config.PLATING_TIERS
          .filter(t => platingsObj[t.id] > 0)
          .map(t => `**${t.label}** — x${platingsObj[t.id]}`)
          .join('\n'),
        inline: false,
      })
      .setFooter({ text: 'Platings drop at 0.1% chance per pull' });
    return message.reply({ embeds: [embed] });
  }

  // ── shards ────────────────────────────────────────────────
  if (command === 'shards' || command === 'sd') {
    const target    = message.mentions.users.first() ?? message.author;
    const filterArg = args.filter(a => !a.startsWith('<@')).join(' ').trim();

    const inventory  = await inv.loadInventory();
    const charShards = inv.getCharacterShards(inventory, target.id);
    const allEntries = Object.entries(charShards).filter(([, n]) => n > 0);

    if (allEntries.length === 0) {
      return message.reply(`${target.id === userId ? 'You have' : `**${target.username}** has`} no character shards yet. Pull duplicates to earn shards!`);
    }

    let filtered;
    if (filterArg) {
      const rarityFilter = normalizeRarity(filterArg);
      if (rarityFilter) {
        filtered = allEntries.filter(([cardId]) => (lookupCard(cardId)?.rarity ?? 'R') === rarityFilter);
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

    const rarityOrder = Object.keys(config.RARITY_META);
    filtered.sort(([a], [b]) => {
      const ra = lookupCard(a)?.rarity ?? 'R';
      const rb = lookupCard(b)?.rarity ?? 'R';
      return rarityOrder.indexOf(rb) - rarityOrder.indexOf(ra);
    });

    const expiry = Date.now() + 5 * 60 * 1000;
    const { embed, components } = buildShardsPage(userId, target, filtered, filterArg, 0, expiry);
    return message.reply({ embeds: [embed], components });
  }

  // ── items ─────────────────────────────────────────────────
  if (command === 'items' || command === 'it') {
    const target    = message.mentions.users.first() ?? message.author;
    const inventory = await inv.loadInventory();
    const userItems = inv.getItems(inventory, target.id);
    const entries   = Object.entries(userItems).filter(([, n]) => n > 0);

    if (entries.length === 0) {
      return message.reply(`${target.id === userId ? 'You have' : `**${target.username}** has`} no items. Raid Tickets drop from pulls (🎟️ 0.15%, 🌙 0.075%, ⚡ 0.05%, 💀 0.01%). Other items are granted by admins!`);
    }

    const lines = entries.map(([itemId, count]) => {
      const item = config.ITEMS.find(i => i.id === itemId);
      if (!item) return `\`${itemId}\` — x${count}`;
      const useCmd = item.useCmd ?? `ZP use ${item.id}`;
      return `${item.emoji} **${item.name}** — x${count}\n*${item.desc}*\nUse: \`${useCmd}\``;
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(0xFF69B4)
      .setTitle(`${target.username}'s Items`)
      .setDescription(lines)
      .setFooter({ text: 'Use an item with its listed command' });
    return message.reply({ embeds: [embed] });
  }

  // ── use ───────────────────────────────────────────────────
  if (command === 'use') {
    const itemId = args[0]?.toLowerCase();
    if (!itemId) return message.reply('Usage: `ZP use <itemId>` — check `ZP items` to see what you have.');

    const item = config.ITEMS.find(i => i.id === itemId);
    if (!item) return message.reply(`Unknown item \`${itemId}\`. Check \`ZP items\` for your available items.`);

    if (!item.cardId) {
      const useCmd = item.useCmd ?? `ZP use ${item.id}`;
      return message.reply(`**${item.emoji} ${item.name}** can't be used this way — run \`${useCmd}\` instead!`);
    }

    const inventory = await inv.loadInventory();

    if (!inv.removeItem(inventory, userId, itemId)) {
      return message.reply(`You don't have **${item.emoji} ${item.name}**.`);
    }

    const card     = CARDS.find(c => c.id === item.cardId);
    const { isDupe } = inv.addCardToInventory(inventory, userId, card);
    await inv.saveInventory(inventory);

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

  // ── raid ──────────────────────────────────────────────────
  if (command === 'raid') {
    // Determine which ticket tier was requested
    const tierArg = args[0]?.toLowerCase();
    const TIER_ALIASES = {
      normal: 'raid_ticket', raid: 'raid_ticket', ticket: 'raid_ticket',
      mythical: 'mythical_raid_ticket', my: 'mythical_raid_ticket',
      omega: 'omega_raid_ticket', ur: 'omega_raid_ticket',
      hellish: 'hellish_raid_ticket', hell: 'hellish_raid_ticket', lt: 'hellish_raid_ticket',
    };
    const ticketId = TIER_ALIASES[tierArg] ?? (tierArg ? null : 'raid_ticket');

    if (!ticketId) {
      const tierList = config.RAID_TICKET_TIERS.map(t => `\`${t.useCmd}\` — ${t.emoji} ${t.label}`).join('\n');
      return message.reply(`Unknown raid tier \`${tierArg}\`. Available:\n${tierList}`);
    }

    const tier     = config.RAID_TICKET_TIERS.find(t => t.id === ticketId);
    const inventory = await inv.loadInventory();

    if (!inv.removeItem(inventory, userId, ticketId)) {
      const chances  = config.RAID_TICKET_CHANCES;
      const pct      = ((chances[ticketId] ?? 0) * 100).toFixed(3);
      return message.reply(`You don't have a **${tier.emoji} ${tier.label}**! They drop at **${pct}%** per pull.`);
    }

    const team = inv.getTeam(inventory, userId);
    if (team.length < 1) {
      inv.addItem(inventory, userId, ticketId);
      await inv.saveInventory(inventory);
      return message.reply(`You need at least **1 card** in your team to start a raid! Use \`ZP add <name or id>\` to fill your team first.`);
    }

    // Pick a random boss from this tier's pool
    const bossPool = CARDS.filter(c => tier.bossPools.includes(c.rarity));
    if (!bossPool.length) {
      inv.addItem(inventory, userId, ticketId);
      await inv.saveInventory(inventory);
      return message.reply(`No cards found for ${tier.label} boss pool. Contact an admin!`);
    }
    const bossCard = bossPool[Math.floor(Math.random() * bossPool.length)];
    const bossMeta = rarityMeta(bossCard.rarity);

    // Boss stats = card's Lv-100 stats × tier multiplier
    const lv100Stats = getCardStats(bossCard, 100);
    const bossHp     = Math.round(lv100Stats.hp  * tier.statMult);
    const bossDmg    = Math.round(lv100Stats.dmg * tier.statMult);
    const bossImg    = imgCache.getImage(bossCard.id) ?? bossCard.image ?? null;

    const bossBC = {
      cardId:    bossCard.id,
      name:      bossCard.name,
      level:     1,
      plating:   null,
      platEmoji: '',
      rarEmoji:  bossMeta.emoji,
      hp:        bossHp,
      maxHp:     bossHp,
      dmgMin:    Math.round(bossDmg * 0.8),
      dmgMax:    Math.round(bossDmg * 1.2),
      dmg:       bossDmg,
      technique: bossCard.technique ?? false,
      alive:     true,
    };

    await inv.saveInventory(inventory);

    const battleId = `raid_${userId}_${Date.now()}`;
    const state = {
      battleId,
      isRaid:         true,
      isCollabRaid:   true,
      raidTicketTier: ticketId,
      // pre-start collab fields
      started:        false,
      allowJoins:     false,
      whitelist:      [],
      ownerId:        userId,
      ownerName:      message.author.username,
      ownerCards:     [],
      participants:   [],
      currentTurnIdx: 0,
      pendingJoins:   {},
      raidChannelId:  null,
      raidMessageId:  null,
      // compat fields (used once started)
      attackerId:     userId,
      attackerName:   message.author.username,
      attackerCards:  [],
      defenderName:   bossCard.name,
      defenderCards:  [bossBC],
      bossImg,
      raidBossCard:   bossCard,
      expiry: Date.now() + 30 * 60 * 1000,
    };
    activeBattles.set(battleId, state);
    activeCollabRaids.set(userId, battleId);

    const openLog = `${tier.emoji} **${tier.label}** consumed! A **${bossMeta.emoji} ${bossCard.name}** Raid Boss appeared!\n**HP:** ${bossHp.toLocaleString()} | **DMG:** ${bossDmg.toLocaleString()}–${Math.round(bossDmg * 1.2).toLocaleString()}\n\n*Use \`ZP arj\` to allow others to join, \`ZP wh @user\` to whitelist players, then click **Start Raid**!*`;
    const embed      = buildCollabRaidPreEmbed(state);
    const components = buildCollabPreComponents(state);

    const raidMsg = await message.reply({ embeds: [embed], components });
    if (raidMsg?.id) {
      state.raidMessageId = raidMsg.id;
      state.raidChannelId = raidMsg.channelId;
    }
    return;
  }

  // ── allowraidjoins | arj ──────────────────────────────────
  if (command === 'allowraidjoins' || command === 'arj') {
    const battleId = activeCollabRaids.get(userId);
    if (!battleId) return message.reply('You don\'t have an active collab raid! Use a raid ticket first.');
    const state = activeBattles.get(battleId);
    if (!state?.isCollabRaid) return message.reply('No active collab raid found.');
    if (state.started) return message.reply('The raid has already started!');

    state.allowJoins = true;

    if (state.raidMessageId && state.raidChannelId) {
      try {
        const ch  = await client.channels.fetch(state.raidChannelId);
        const msg = await ch.messages.fetch(state.raidMessageId);
        await msg.edit({ embeds: [buildCollabRaidPreEmbed(state)], components: buildCollabPreComponents(state) });
      } catch (_) {}
    }
    return message.reply('✅ Raid joins enabled! Whitelisted players can now click **Join Raid** on the raid card.');
  }

  // ── whitelist | wh ────────────────────────────────────────
  if (command === 'whitelist' || command === 'wh') {
    const battleId = activeCollabRaids.get(userId);
    if (!battleId) return message.reply('You don\'t have an active collab raid! Use a raid ticket first.');
    const state = activeBattles.get(battleId);
    if (!state?.isCollabRaid) return message.reply('No active collab raid found.');
    if (state.started) return message.reply('The raid has already started!');

    const target = message.mentions.users.first();
    if (!target) return message.reply('Usage: `ZP whitelist @user` or `ZP wh @user`');
    if (target.id === userId) return message.reply('You\'re already the raid owner!');
    if (state.whitelist.length >= 4) return message.reply('Whitelist is full (max 4 players)!');
    if (state.whitelist.includes(target.id)) return message.reply(`**${target.username}** is already whitelisted!`);

    state.whitelist.push(target.id);

    if (state.raidMessageId && state.raidChannelId) {
      try {
        const ch  = await client.channels.fetch(state.raidChannelId);
        const msg = await ch.messages.fetch(state.raidMessageId);
        await msg.edit({ embeds: [buildCollabRaidPreEmbed(state)], components: buildCollabPreComponents(state) });
      } catch (_) {}
    }
    return message.reply(`✅ **${target.username}** whitelisted for the raid!`);
  }

  // ── card | c ─────────────────────────────────────────────
  if (command === 'card' || command === 'c' || command === 'ca') {
    const cardQuery = args.filter(a => !a.startsWith('<@')).join(' ');
    if (!cardQuery) return message.reply('Usage: `ZP card <name or id>` — e.g. `ZP card gear5` or `ZP c naruto`');

    const card = resolveCard(cardQuery);
    if (!card) return message.reply(`No card found matching \`${cardQuery}\`. Try \`ZP all\` to browse cards.`);

    const inventory  = await inv.loadInventory();
    const owned      = inv.hasCard(inventory, userId, card.id);
    const shards     = inv.getCharacterShards(inventory, userId)[card.id] ?? 0;
    const level      = owned ? (inv.getCardLevel(inventory, userId, card.id) ?? 1) : 1;
    const personalCap = owned ? inv.getPersonalLevelCap(inventory, userId, card.id) : inv.MAX_CARD_LEVEL;
    const embed      = cardEmbed(card, undefined, undefined, level, personalCap);

    if (owned) {
      const team     = inv.getTeam(inventory, userId);
      const slot     = team.find(s => s.cardId === card.id);
      const tierData = slot?.plating ? config.PLATING_TIERS.find(t => t.id === slot.plating) : null;
      if (tierData) {
        const base       = getCardStats(card, level);
        const platedHp   = Math.round(base.hp  * tierData.statMult);
        const platedDmg  = Math.round(base.dmg * tierData.statMult);
        embed.addFields({
          name: `${tierData.label} Plating (in battle)`,
          value: card.technique
            ? `❤️ **${platedHp}** HP  🔵 **${platedDmg}** TEC  *(x${tierData.statMult} boost)*`
            : `❤️ **${platedHp}** HP  ⚔️ **${platedDmg}** DMG  *(x${tierData.statMult} boost)*`,
          inline: false,
        });
      }
    }

    const shardEmoji = emojiCache.getEmoji(card.id) ?? '';
    const shardInfo  = shards > 0 ? ` • ${shardEmoji ? shardEmoji + ' ' : ''}x${shards} shard${shards === 1 ? '' : 's'}` : '';
    const lvlInfo    = owned ? ` • Lv. ${level}` : '';
    const absorbHint = owned && shards > 0 && level < personalCap
      ? ` • Use \`ZP absorb shard:${card.id}:${shards}\` to level up!`
      : '';
    const status = owned
      ? `In your collection${lvlInfo}${shardInfo}${absorbHint}`
      : 'Not in your collection';
    embed.setFooter({ text: status });
    return message.reply({ embeds: [embed] });
  }

  // ── mycard | mc ───────────────────────────────────────────
  if (command === 'mycard' || command === 'mc' || command === 'mci') {
    const cardQuery = args.filter(a => !a.startsWith('<@')).join(' ');
    if (!cardQuery) return message.reply('Usage: `ZP mycard <name or id>` — e.g. `ZP mc gear5 luffy`');

    const card = resolveCard(cardQuery);
    if (!card) return message.reply(`No card found matching \`${cardQuery}\`.`);

    const inventory = await inv.loadInventory();
    if (!inv.hasCard(inventory, userId, card.id)) {
      return message.reply(`You don't own **${card.name}**. Use \`ZP card ${card.id}\` to view its base info.`);
    }

    const meta        = rarityMeta(card.rarity);
    const level       = inv.getCardLevel(inventory, userId, card.id) ?? 1;
    const personalCap = inv.getPersonalLevelCap(inventory, userId, card.id);
    const stats       = getCardStats(card, level);
    const shards      = inv.getCharacterShards(inventory, userId)[card.id] ?? 0;
    const pp          = inv.getPrestigePoints(inventory, userId)[card.id] ?? 0;
    const isMax       = level >= personalCap;
    const levelLabel  = isMax ? `✨ MAX (${level}/${personalCap})` : `Lv. ${level} / ${personalCap}`;
    const img         = imgCache.getImage(card.id) ?? card.image ?? null;

    const team     = inv.getTeam(inventory, userId);
    const slot     = team.find(s => s.cardId === card.id);
    const tierData = slot?.plating ? config.PLATING_TIERS.find(t => t.id === slot.plating) : null;

    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`${meta.emoji} ${card.name} (Your Card)`)
      .addFields(
        { name: 'Series',           value: card.series,                    inline: true },
        { name: 'Rarity',           value: `${meta.emoji} ${meta.label}`, inline: true },
        { name: 'Stars',            value: meta.stars || '—',              inline: true },
        { name: '📊 Level',         value: levelLabel,                     inline: true },
        { name: '❤️ Health',        value: `${stats.hp}`,                 inline: true },
        { name: card.technique ? '🔵 Technique' : '⚔️ Damage', value: `${stats.dmg}`, inline: true },
        { name: '✨ Prestige Points', value: `${pp}`,                      inline: true },
        { name: '🔮 Shards',        value: `${shards}`,                   inline: true },
        { name: 'Plating',           value: tierData ? tierData.label : 'None',                  inline: true },
      );

    if (tierData) {
      const base       = getCardStats(card, level);
      const platedHp   = Math.round(base.hp  * tierData.statMult);
      const platedDmg  = Math.round(base.dmg * tierData.statMult);
      embed.addFields({
        name: `Battle Stats (with ${tierData.label} Plating)`,
        value: card.technique
          ? `❤️ **${platedHp}** HP  🔵 **${platedDmg}** TEC  *(x${tierData.statMult} boost)*`
          : `❤️ **${platedHp}** HP  ⚔️ **${platedDmg}** DMG  *(x${tierData.statMult} boost)*`,
        inline: false,
      });
    }

    if (img) embed.setThumbnail(img);
    embed.setFooter({ text: `Use ZP kill ${card.id} to gain prestige points!` });
    return message.reply({ embeds: [embed] });
  }

  // ── cardinfo | ci ─────────────────────────────────────────
  if (command === 'cardinfo' || command === 'ci') {
    const cardQuery = args.filter(a => !a.startsWith('<@')).join(' ');
    if (!cardQuery) return message.reply('Usage: `ZP cardinfo <name or id>` — e.g. `ZP ci gear5`');

    const card = resolveCard(cardQuery);
    if (!card) return message.reply(`No card found matching \`${cardQuery}\`. Use \`ZP all\` to browse cards.`);

    const meta  = rarityMeta(card.rarity);
    const stats = getCardStats(card, 1);
    const img   = imgCache.getImage(card.id) ?? card.image ?? null;

    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`${meta.emoji} ${card.name}`)
      .setDescription(card.description || 'No description available.')
      .addFields(
        { name: 'Series',      value: card.series,                    inline: true },
        { name: 'Rarity',      value: `${meta.emoji} ${meta.label}`, inline: true },
        { name: 'Stars',       value: meta.stars || '—',              inline: true },
        { name: '❤️ Base HP',  value: `${stats.hp}`,                 inline: true },
        { name: card.technique ? '🔵 Base TEC' : '⚔️ Base DMG', value: `${stats.dmg}`, inline: true },
        { name: '🪪 Card ID',  value: `\`${card.id}\``,              inline: true },
        {
          name: '💀 Kill Value',
          value: `¥${(KILL_YEN[card.rarity] ?? 50).toLocaleString()} yen per shard`,
          inline: true,
        },
      )
      .setFooter({ text: `Pull rate: ${config.PULL_RATES[card.rarity] != null ? config.PULL_RATES[card.rarity] + '%' : 'N/A (Limited)'}` });

    if (img) embed.setThumbnail(img);
    return message.reply({ embeds: [embed] });
  }

  // ── absorb ───────────────────────────────────────────────
  if (command === 'absorb' || command === 'ab') {
    const raw = args[0];
    if (!raw) {
      return message.reply(
        'Usage: `ZP absorb shard:<name or id>:<count>`\n' +
        'Example: `ZP absorb shard:naruto:5` — spend 5 Naruto shards to gain 5 levels.'
      );
    }

    const parts = raw.split(':');
    if (parts.length !== 3 || parts[0].toLowerCase() !== 'shard') {
      return message.reply('Invalid format. Usage: `ZP absorb shard:<name or id>:<count>`');
    }

    const cardQuery = parts[1];
    const count     = parseInt(parts[2], 10);
    if (isNaN(count) || count < 1) {
      return message.reply('Count must be a positive number.');
    }

    const card = resolveCard(cardQuery);
    if (!card) {
      return message.reply(`No card found matching \`${cardQuery}\`. Check \`ZP col\` for valid IDs.`);
    }

    const inventory = await inv.loadInventory();

    if (!inv.hasCard(inventory, userId, card.id)) {
      return message.reply(`You don't own **${card.name}**. You must collect the card before levelling it up.`);
    }

    const currentLevel = inv.getCardLevel(inventory, userId, card.id) ?? 1;
    const personalCap  = inv.getPersonalLevelCap(inventory, userId, card.id);

    if (currentLevel >= personalCap) {
      return message.reply(
        `**${card.name}** is already at the maximum level (${personalCap})!\n` +
        `Use \`ZP increaselevelcap ${card.id} <amount>\` to raise the cap using shards.`
      );
    }

    const shards = inv.getCharacterShards(inventory, userId)[card.id] ?? 0;
    if (shards < count) {
      return message.reply(`You only have **${shards}** ${card.name} shard${shards === 1 ? '' : 's'} but tried to absorb **${count}**.`);
    }

    const levelsGained = Math.min(count, personalCap - currentLevel);
    const shardsSpent  = levelsGained;
    const newLevel     = currentLevel + levelsGained;

    inv.removeCharacterShards(inventory, userId, card.id, shardsSpent);
    inv.setCardLevel(inventory, userId, card.id, newLevel);
    await inv.saveInventory(inventory);

    const meta     = rarityMeta(card.rarity);
    const oldStats = getCardStats(card, currentLevel);
    const newStats = getCardStats(card, newLevel);
    const maxNote  = newLevel >= personalCap ? '\n✨ **LEVEL CAP REACHED!** Use `ZP ilc` to raise it.' : '';

    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`📈 ${card.name} levelled up!`)
      .setDescription(
        `**${currentLevel}** → **${newLevel}** *(+${levelsGained} level${levelsGained === 1 ? '' : 's'})*${maxNote}`
      )
      .addFields(
        { name: 'Shards Spent',  value: `${shardsSpent}`,                  inline: true },
        { name: 'Shards Left',   value: `${shards - shardsSpent}`,         inline: true },
        { name: '\u200b',           value: '\u200b',                          inline: true },
        { name: '❤️ HP',            value: `${oldStats.hp} → **${newStats.hp}**`,  inline: true },
        { name: card.technique ? '🔵 Technique' : '⚔️ Damage', value: `${oldStats.dmg} → **${newStats.dmg}**`, inline: true },
      );

    const img = imgCache.getImage(card.id) ?? card.image ?? null;
    if (img) embed.setThumbnail(img);

    const remaining = personalCap - newLevel;
    embed.setFooter({
      text: levelsGained < count
        ? `Only ${levelsGained} of ${count} shards used — card is at cap.`
        : remaining > 0
          ? `${remaining} more level${remaining === 1 ? '' : 's'} to cap (${personalCap})`
          : `Level cap reached! Use ZP ilc to raise it.`,
    });

    return message.reply({ embeds: [embed] });
  }

  // ── increaselevelcap | ilc ────────────────────────────────
  if (command === 'increaselevelcap' || command === 'ilc') {
    const lastArg  = args[args.length - 1];
    const count    = parseInt(lastArg, 10);
    const cardArgs = !isNaN(count) && count > 0 ? args.slice(0, -1) : [];
    const cardQuery = cardArgs.filter(a => !a.startsWith('<@')).join(' ');

    if (!cardQuery || isNaN(count) || count < 1) {
      return message.reply(
        'Usage: `ZP increaselevelcap <name or id> <amount>` or `ZP ilc <name or id> <amount>`\n' +
        'Each level above 100 costs **1 Limit Breaker** + **100 Prestige Points** on that card.\n' +
        'Earn Limit Breakers from `ZP conquest`. Earn prestige points from `ZP kill`.\n' +
        'Example: `ZP ilc gear5 2` — raise Gear 5 Luffy\'s cap from 100 to 102 (costs 2 LBs + 200 PP).'
      );
    }

    const card = resolveCard(cardQuery);
    if (!card) return message.reply(`No card found matching \`${cardQuery}\`.`);

    const inventory = await inv.loadInventory();

    if (!inv.hasCard(inventory, userId, card.id)) {
      return message.reply(`You don't own **${card.name}**. Collect it first!`);
    }

    const lbHave = inv.getLimitBreakers(inventory, userId);
    const ppHave = inv.getPrestigePoints(inventory, userId)[card.id] ?? 0;
    const lbCost = count;
    const ppCost = count * 100;

    if (lbHave < lbCost) {
      return message.reply(
        `You need **${lbCost} Limit Breaker${lbCost === 1 ? '' : 's'}** but only have **${lbHave}**.\n` +
        `Earn Limit Breakers by sending cards on conquest with \`ZP conquestsend\`.`
      );
    }
    if (ppHave < ppCost) {
      return message.reply(
        `You need **${ppCost} Prestige Points** on **${card.name}** but only have **${ppHave}**.\n` +
        `Earn prestige points by using \`ZP kill ${card.id} <shardId>:<count>\`.`
      );
    }

    const currentCap = inv.getPersonalLevelCap(inventory, userId, card.id);

    inv.removeLimitBreaker(inventory, userId, lbCost);
    inv.removePrestigePoints(inventory, userId, card.id, ppCost);
    inv.increaseLevelCap(inventory, userId, card.id, count);
    await inv.saveInventory(inventory);

    const newCap = currentCap + count;
    const meta   = rarityMeta(card.rarity);
    const img    = imgCache.getImage(card.id) ?? card.image ?? null;

    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`${card.name} — Level Cap Increased!`)
      .setDescription(
        `Level cap raised from **${currentCap}** → **${newCap}**!\n\n` +
        `You can now level **${card.name}** up to **Lv. ${newCap}** using \`ZP absorb\`!`
      )
      .addFields(
        { name: 'Limit Breakers Used',  value: `${lbCost}`,                          inline: true },
        { name: 'Prestige Points Used', value: `${ppCost}`,                          inline: true },
        { name: 'New Cap',              value: `Lv. ${newCap}`,                      inline: true },
        { name: 'Limit Breakers Left',  value: `${lbHave - lbCost}`,                inline: true },
        { name: 'Prestige Points Left', value: `${ppHave - ppCost} on ${card.name}`, inline: true },
      )
      .setFooter({ text: `Card: ${card.id}` });
    if (img) embed.setThumbnail(img);
    return message.reply({ embeds: [embed] });
  }

  // ── kill ─────────────────────────────────────────────────
  if (command === 'kill' || command === 'ki') {
    // Usage: ZP kill <killerCardId> <targetShardId>:<count>
    const killerCardId = args[0]?.toLowerCase();
    const shardArg     = args[1];

    if (!killerCardId || !shardArg) {
      return message.reply(
        'Usage: `ZP kill <killerCardId> <shardCardId>:<count>`\n' +
        'Use a card to destroy shards and earn **yen** + **prestige points** on the killer card.\n' +
        'Example: `ZP kill naruto_r sasuke_r:5` — Naruto R kills 5 Sasuke R shards.'
      );
    }

    const shardParts = shardArg.split(':');
    if (shardParts.length !== 2) {
      return message.reply('Invalid format. Use `ZP kill <killerCardId> <shardCardId>:<count>`');
    }

    const targetShardId = shardParts[0].toLowerCase();
    const count         = parseInt(shardParts[1], 10);

    if (isNaN(count) || count < 1) {
      return message.reply('Count must be a positive number.');
    }

    const killerCard = resolveCard(killerCardId);
    if (!killerCard) return message.reply(`No card found matching \`${killerCardId}\`.`);

    const targetCard = resolveCard(targetShardId);
    if (!targetCard) return message.reply(`No card found matching \`${targetShardId}\`.`);

    const inventory = await inv.loadInventory();

    if (!inv.hasCard(inventory, userId, killerCard.id)) {
      return message.reply(`You don't own **${killerCard.name}**. You need to own the killer card!`);
    }

    const shards = inv.getCharacterShards(inventory, userId)[targetCard.id] ?? 0;
    if (shards < count) {
      return message.reply(`You only have **${shards}** ${targetCard.name} shard${shards === 1 ? '' : 's'} but tried to kill **${count}**.`);
    }

    const yenPerShard = KILL_YEN[targetCard.rarity] ?? 50;
    const totalYen    = yenPerShard * count;

    inv.removeCharacterShards(inventory, userId, targetCard.id, count);
    inv.addYen(inventory, userId, totalYen);
    inv.addPrestigePoints(inventory, userId, killerCard.id, count);
    inv.incrementTotalKills(inventory, userId, count);
    await inv.saveInventory(inventory);

    const killerMeta = rarityMeta(killerCard.rarity);
    const targetMeta = rarityMeta(targetCard.rarity);
    const targetEmoji = emojiCache.getEmoji(targetCard.id) ?? '';
    const newPP       = inv.getPrestigePoints(await inv.loadInventory(), userId)[killerCard.id] ?? 0;
    const img         = imgCache.getImage(killerCard.id) ?? killerCard.image ?? null;

    const embed = new EmbedBuilder()
      .setColor(killerMeta.color)
      .setTitle(`⚔️ ${killerCard.name} killed ${count} shard${count === 1 ? '' : 's'}!`)
      .setDescription(
        `${killerMeta.emoji} **${killerCard.name}** destroyed **${count}** ${targetEmoji} ${targetMeta.emoji} **${targetCard.name}** shard${count === 1 ? '' : 's'}!`
      )
      .addFields(
        { name: 'Yen Earned',           value: `¥${totalYen.toLocaleString()} (¥${yenPerShard} per shard)`, inline: true },
        { name: '✨ Prestige Points',   value: `+${count} → **${newPP}** total on ${killerCard.name}`,       inline: true },
        { name: `${targetEmoji} Shards Left`, value: `${shards - count}`,                                 inline: true },
      )
      .setFooter({ text: 'Prestige points are tracked per killer card!' });

    if (img) embed.setThumbnail(img);
    return message.reply({ embeds: [embed] });
  }

  // ── profile | pro ─────────────────────────────────────────
  if (command === 'profile' || command === 'pro') {
    const target = message.mentions.users.first() ?? message.author;

    if (target.id !== userId) {
      const checkInv = await inv.loadInventory();
      if (inv.getPrivacy(checkInv, target.id)) {
        return message.reply(`**${target.username}**'s profile is set to private.`);
      }
    }

    const inventory   = await inv.loadInventory();
    const cards       = inv.getCards(inventory, target.id);
    const charShards  = inv.getCharacterShards(inventory, target.id);
    const totalShards = Object.values(charShards).reduce((s, n) => s + n, 0);
    const yen         = inv.getYen(inventory, target.id);
    const stars       = inv.getStars(inventory, target.id);
    const totalPulls  = inv.getTotalPulls(inventory, target.id);
    const totalKills  = inventory.users[target.id]?.totalKills ?? 0;
    const wish        = inv.getWish(inventory, target.id);
    const isPrivate   = inv.getPrivacy(inventory, target.id);
    const clan        = inv.getUserClan(inventory, target.id);
    const duo         = inv.getUserDuo(inventory, target.id);
    const team        = inv.getTeam(inventory, target.id);

    // Top prestige card
    const ppObj     = inv.getPrestigePoints(inventory, target.id);
    const topPPEntry = Object.entries(ppObj).sort((a, b) => b[1] - a[1])[0];
    const topPPCard  = topPPEntry ? lookupCard(topPPEntry[0]) : null;
    const topPPVal   = topPPEntry ? topPPEntry[1] : 0;

    // Rarity breakdown
    const rarityCounts = {};
    for (const c of cards) rarityCounts[c.rarity] = (rarityCounts[c.rarity] ?? 0) + 1;
    const rarityStr = RARITY_ORDER
      .filter(r => rarityCounts[r])
      .map(r => `${rarityMeta(r).emoji} ${rarityCounts[r]}`)
      .join('  ') || 'None';

    // Wish info
    let wishStr = 'None set';
    if (wish) {
      const wCard = lookupCard(wish.cardId);
      wishStr = `${wCard?.name ?? wish.cardId} (${wish.pullCount}/${inv.WISH_THRESHOLD} pulls)`;
    }

    const embed = new EmbedBuilder()
      .setColor(0x00FFD1)
      .setTitle(`📋 ${target.username}'s Profile`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: '🃏 Cards Collected',    value: `${cards.length}`,              inline: true },
        { name: '🔮 Total Shards',       value: `${totalShards}`,               inline: true },
        { name: '⚔️ Team Size',          value: `${team.length} / ${inv.TEAM_SIZE}`, inline: true },
        { name: 'Yen',                    value: `¥${yen.toLocaleString()}`,      inline: true },
        { name: 'Stars',                value: stars.toLocaleString(),           inline: true },
        { name: '🎴 Total Pulls',        value: totalPulls.toLocaleString(),      inline: true },
        { name: '💀 Total Kills',        value: totalKills.toLocaleString(),      inline: true },
        { name: '✨ Rarity Breakdown',   value: rarityStr,                        inline: false },
        { name: '🌠 Wish Progress',      value: wishStr,                          inline: false },
        { name: '🏛️ Clan',              value: clan ? clan.name : 'None',        inline: true },
        { name: '🤝 Duo Partner',        value: duo ? duo.members.filter(id => id !== target.id).map(id => `<@${id}>`).join(', ') || 'Unknown' : 'None', inline: true },
      );

    if (topPPCard) {
      embed.addFields({
        name: '🏆 Top Prestige Card',
        value: `${rarityMeta(topPPCard.rarity).emoji} **${topPPCard.name}** — ${topPPVal} prestige points`,
        inline: false,
      });
    }

    embed.setFooter({ text: isPrivate ? '🔒 This profile is private' : '🔓 Profile is public • Use ZP privacy to toggle' });
    return message.reply({ embeds: [embed] });
  }

  // ── vote ─────────────────────────────────────────────────
  if (command === 'vote' || command === 'vo') {
    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('🗳️ Vote for the Bot!')
      .setDescription(
        'Support the bot by voting on top.gg! Voting helps the bot grow and may earn you extra pull charges.\n\n' +
        '**Vote here:** https://top.gg/bot/1258837227971022970/vote\n\n' +
        'Thank you for your support!'
      )
      .setFooter({ text: 'Voting resets every 12 hours' });
    return message.reply({ embeds: [embed] });
  }

  // ── privacy ───────────────────────────────────────────────
  if (command === 'privacy' || command === 'pv') {
    const inventory  = await inv.loadInventory();
    const current    = inv.getPrivacy(inventory, userId);
    const newVal     = !current;
    inv.setPrivacy(inventory, userId, newVal);
    await inv.saveInventory(inventory);

    const embed = new EmbedBuilder()
      .setColor(newVal ? 0x888888 : 0x00FFD1)
      .setTitle(`${newVal ? '🔒' : '🔓'} Privacy ${newVal ? 'Enabled' : 'Disabled'}`)
      .setDescription(
        newVal
          ? 'Your profile, collection, and wallet are now **private**. Other players cannot view them.'
          : 'Your profile, collection, and wallet are now **public**. Other players can view them.'
      )
      .setFooter({ text: 'Use ZP privacy again to toggle' });
    return message.reply({ embeds: [embed] });
  }

  // ── team ─────────────────────────────────────────────────
  if (command === 'team' || command === 'tm') {
    const sub = args[0]?.toLowerCase();

    if (!sub || sub === 'view') {
      const target    = message.mentions.users.first() ?? message.author;
      const inventory = await inv.loadInventory();
      const team      = inv.getTeam(inventory, target.id);
      const resolved  = resolveTeamSlots(team, inventory, target.id);

      const embed = new EmbedBuilder()
        .setColor(0x00FFD1)
        .setTitle(`⚔️ ${target.username}'s Team`);

      if (resolved.length === 0) {
        embed.setDescription(`No cards on this team yet.\nUse \`ZP team add <cardId>\` or \`ZP add <cardId>\` to add up to ${inv.TEAM_SIZE} cards.`);
      } else {
        let totalPower = 0;
        const lines = resolved.map((slot, i) => {
          if (!slot.card) return `${i + 1}. ~~${slot.cardId}~~ *(missing card)*`;
          const meta    = rarityMeta(slot.card.rarity);
          const power   = slotPower(slot);
          totalPower   += power;
          const plating = slot.plating ? config.PLATING_TIERS.find(t => t.id === slot.plating) : null;
          const platStr = plating ? ` [${plating.label}]` : '';
          const cap     = inv.getPersonalLevelCap(inventory, target.id, slot.cardId);
          return `${i + 1}. ${meta.emoji} **${slot.card.name}**${platStr} — Lv.${slot.level}/${cap} • ⚡ ${Math.round(power).toLocaleString()} power`;
        });
        embed.setDescription(lines.join('\n'));
        embed.addFields({ name: '⚡ Total Power', value: Math.round(totalPower).toLocaleString(), inline: true });
        if (resolved.length < inv.TEAM_SIZE) {
          embed.addFields({ name: '📋 Slots', value: `${resolved.length} / ${inv.TEAM_SIZE}`, inline: true });
        }
      }
      embed.setFooter({ text: 'Use ZP add <cardId> to add cards • ZP swap <id1> <id2> to swap positions' });
      return message.reply({ embeds: [embed] });
    }

    // ── ZP team add ───────────────────────────────────────
    if (sub === 'add') {
      const cardQuery = args.slice(1).filter(a => !a.startsWith('<@')).join(' ');
      if (!cardQuery) return message.reply('Usage: `ZP team add <name or id>` — e.g. `ZP team add gear5`');

      const card = resolveCard(cardQuery);
      if (!card) return message.reply(`No card found matching \`${cardQuery}\`.`);

      const inventory = await inv.loadInventory();
      if (!inv.hasCard(inventory, userId, card.id)) {
        return message.reply(`You don't own **${card.name}**.`);
      }

      const result = inv.addToTeam(inventory, userId, card.id);
      await inv.saveInventory(inventory);

      if (result === 'added')          return message.reply(`**${card.name}** added to your team!`);
      if (result === 'full')           return message.reply(`Your team is full (${inv.TEAM_SIZE}/${inv.TEAM_SIZE}). Remove a card first.`);
      if (result === 'already_on_team') return message.reply(`**${card.name}** is already on your team.`);
    }

    // ── ZP team remove ────────────────────────────────────
    if (sub === 'remove') {
      const cardQuery = args.slice(1).filter(a => !a.startsWith('<@')).join(' ');
      if (!cardQuery) return message.reply('Usage: `ZP team remove <name or id>`');

      const card = resolveCard(cardQuery);
      if (!card) return message.reply(`No card found matching \`${cardQuery}\`.`);

      const inventory = await inv.loadInventory();
      const slot      = inv.removeFromTeam(inventory, userId, card.id);
      if (!slot) return message.reply(`**${card.name}** is not on your team.`);

      if (slot.plating) {
        inv.addPlating(inventory, userId, slot.plating);
        const tier = config.PLATING_TIERS.find(t => t.id === slot.plating);
        await inv.saveInventory(inventory);
        return message.reply(`**${card.name}** removed from your team. **${tier?.label} Plating** returned to inventory.`);
      }

      await inv.saveInventory(inventory);
      return message.reply(`**${card.name}** removed from your team.`);
    }

    // ── ZP team equip ─────────────────────────────────────
    if (sub === 'equip') {
      const platingStr = args[args.length - 1]?.toLowerCase();
      const cardQuery  = args.slice(1, -1).filter(a => !a.startsWith('<@')).join(' ');
      if (!cardQuery || !platingStr) return message.reply('Usage: `ZP team equip <name or id> <plating>` — valid platings: `bronze` `silver` `gold` `diamond`\nExample: `ZP team equip gear5 luffy gold`');

      const card    = resolveCard(cardQuery);
      if (!card)    return message.reply(`No card found matching \`${cardQuery}\`.`);

      const tier    = platingById(platingStr);
      if (!tier)    return message.reply(`Unknown plating \`${platingStr}\`. Valid: \`bronze\` \`silver\` \`gold\` \`diamond\``);

      const inventory = await inv.loadInventory();
      const result    = inv.equipPlatingToTeam(inventory, userId, card.id, tier.id);
      await inv.saveInventory(inventory);

      if (result === 'equipped')        return message.reply(`**${tier.label} Plating** equipped to **${card.name}**!`);
      if (result === 'not_on_team')     return message.reply(`**${card.name}** is not on your team.`);
      if (result === 'no_plating')      return message.reply(`You don't have a **${tier.label} Plating** in your inventory.`);
      if (result === 'already_equipped') return message.reply(`**${card.name}** already has a plating equipped. Unequip it first.`);
    }

    // ── ZP team unequip ───────────────────────────────────
    if (sub === 'unequip') {
      const cardQuery = args.slice(1).filter(a => !a.startsWith('<@')).join(' ');
      if (!cardQuery) return message.reply('Usage: `ZP team unequip <name or id>`');

      const card = resolveCard(cardQuery);
      if (!card) return message.reply(`No card found matching \`${cardQuery}\`.`);

      const inventory = await inv.loadInventory();
      const tier      = inv.unequipPlatingFromTeam(inventory, userId, card.id);
      await inv.saveInventory(inventory);

      if (!tier) return message.reply(`**${card.name}** doesn't have a plating equipped.`);
      const tierData = config.PLATING_TIERS.find(t => t.id === tier);
      return message.reply(`**${tierData?.label} Plating** unequipped from **${card.name}** and returned to your inventory.`);
    }
  }

  // ── add (shortcut for team add) ───────────────────────────
  if (command === 'add') {
    const cardQuery = args.filter(a => !a.startsWith('<@')).join(' ');
    if (!cardQuery) return message.reply('Usage: `ZP add <name or id>` — e.g. `ZP add gear5 luffy`');

    const card = resolveCard(cardQuery);
    if (!card) return message.reply(`No card found matching \`${cardQuery}\`.`);

    const inventory = await inv.loadInventory();
    if (!inv.hasCard(inventory, userId, card.id)) {
      return message.reply(`You don't own **${card.name}**.`);
    }

    const result = inv.addToTeam(inventory, userId, card.id);
    await inv.saveInventory(inventory);

    if (result === 'added')           return message.reply(`**${card.name}** added to your team!`);
    if (result === 'full')            return message.reply(`Your team is full (${inv.TEAM_SIZE}/${inv.TEAM_SIZE}). Remove a card first with \`ZP remove <cardId>\`.`);
    if (result === 'already_on_team') return message.reply(`**${card.name}** is already on your team.`);
  }

  // ── remove (shortcut for team remove) ────────────────────
  if (command === 'remove' || command === 'rm') {
    const cardQuery = args.filter(a => !a.startsWith('<@')).join(' ');
    if (!cardQuery) return message.reply('Usage: `ZP remove <name or id>` — e.g. `ZP remove gear5`');

    const card = resolveCard(cardQuery);
    if (!card) return message.reply(`No card found matching \`${cardQuery}\`.`);

    const inventory = await inv.loadInventory();
    const slot      = inv.removeFromTeam(inventory, userId, card.id);
    if (!slot) return message.reply(`**${card.name}** is not on your team.`);

    if (slot.plating) {
      inv.addPlating(inventory, userId, slot.plating);
      const tier = config.PLATING_TIERS.find(t => t.id === slot.plating);
      await inv.saveInventory(inventory);
      return message.reply(`**${card.name}** removed from your team. **${tier?.label} Plating** returned to inventory.`);
    }

    await inv.saveInventory(inventory);
    return message.reply(`**${card.name}** removed from your team.`);
  }

  // ── swap ─────────────────────────────────────────────────
  if (command === 'swap' || command === 'sw') {
    const cardId1 = args[0]?.toLowerCase();
    const cardId2 = args[1]?.toLowerCase();

    if (!cardId1 || !cardId2) {
      return message.reply('Usage: `ZP swap <id1> <id2>` — swaps the positions of two cards on your team.\nExample: `ZP swap gear5 sage_naruto`');
    }

    const card1 = resolveCard(cardId1);
    const card2 = resolveCard(cardId2);
    if (!card1) return message.reply(`No card found matching \`${cardId1}\`.`);
    if (!card2) return message.reply(`No card found matching \`${cardId2}\`.`);

    const inventory = await inv.loadInventory();
    const success   = inv.swapTeamPositions(inventory, userId, card1.id, card2.id);

    if (!success) return message.reply(`Both cards must be on your team. Check \`ZP team\` to see your current lineup.`);

    await inv.saveInventory(inventory);

    const meta1 = rarityMeta(card1.rarity);
    const meta2 = rarityMeta(card2.rarity);
    return message.reply(`Swapped ${meta1.emoji} **${card1.name}** and ${meta2.emoji} **${card2.name}** on your team!`);
  }

  // ── fight @user ───────────────────────────────────────────
  if (command === 'fight' || command === 'fi') {
    const opponent = message.mentions.users.first();
    if (!opponent) return message.reply('Usage: `ZP fight @user` — mention someone to challenge!');
    if (opponent.id === userId) return message.reply('You cannot fight yourself!');
    if (opponent.bot) return message.reply('You cannot fight bots!');

    const coolSecs = getFightCooldownSecs(userId);
    if (coolSecs > 0) return message.reply(`You're on cooldown! Wait **${coolSecs}s** before fighting again.`);

    const inventory      = await inv.loadInventory();
    const attackerTeam   = inv.getTeam(inventory, userId);
    const defenderTeam   = inv.getTeam(inventory, opponent.id);

    if (attackerTeam.length < inv.TEAM_SIZE) {
      return message.reply(`You need a full team of **${inv.TEAM_SIZE}** cards to fight! Use \`ZP add <cardId>\` to fill your team.`);
    }
    if (defenderTeam.length < inv.TEAM_SIZE) {
      return message.reply(`**${opponent.username}** doesn't have a full team of **${inv.TEAM_SIZE}** cards yet.`);
    }

    const attackerResolved = resolveTeamSlots(attackerTeam, inventory, userId);
    const defenderResolved = resolveTeamSlots(defenderTeam, inventory, opponent.id);

    const attackerCards = attackerResolved.map(buildBattleCard).filter(Boolean);
    const defenderCards = defenderResolved.map(buildBattleCard).filter(Boolean);

    setFightCooldown(userId);

    const battleId = `${userId}_${Date.now()}`;
    const state    = {
      battleId,
      attackerId:   userId,
      defenderId:   opponent.id,
      attackerName: message.author.username,
      defenderName: opponent.username,
      attackerCards,
      defenderCards,
      expiry: Date.now() + 5 * 60 * 1000,
    };
    activeBattles.set(battleId, state);

    const embed      = buildBattleEmbed(state);
    const components = buildBattleComponents(state);
    return message.reply({ embeds: [embed], components });
  }

  // ── duofight | df ─────────────────────────────────────────
  if (command === 'duofight' || command === 'df') {
    const opponent = message.mentions.users.first();
    if (!opponent) return message.reply('Usage: `ZP duofight @user` — challenge someone with your duo partner!');
    if (opponent.id === userId) return message.reply('You cannot fight yourself!');
    if (opponent.bot) return message.reply('You cannot fight bots!');

    const coolSecs = getFightCooldownSecs(userId);
    if (coolSecs > 0) return message.reply(`You're on cooldown! Wait **${coolSecs}s** before fighting again.`);

    const inventory = await inv.loadInventory();
    const duo       = inv.getUserDuo(inventory, userId);
    if (!duo) return message.reply(`You don't have a duo partner! Use \`ZP duocreate @user\` to create one.`);

    const partnerId = duo.members.find(id => id !== userId);
    if (!partnerId) return message.reply(`Your duo has no partner. Use \`ZP duoremove\` and create a new duo.`);

    const attackerTeam = inv.getTeam(inventory, userId);
    const partnerTeam  = inv.getTeam(inventory, partnerId);
    const defenderTeam = inv.getTeam(inventory, opponent.id);

    if (attackerTeam.length === 0) {
      return message.reply(`Your team is empty! Add cards with \`ZP add <cardId>\`.`);
    }
    if (defenderTeam.length < inv.TEAM_SIZE) {
      return message.reply(`**${opponent.username}** doesn't have a full team of **${inv.TEAM_SIZE}** cards yet.`);
    }

    const partnerUser = await client.users.fetch(partnerId).catch(() => null);
    const partnerName = partnerUser?.username ?? 'Partner';

    // Combine attacker + partner teams
    const combinedTeam = [
      ...resolveTeamSlots(attackerTeam, inventory, userId),
      ...resolveTeamSlots(partnerTeam, inventory, partnerId),
    ];

    const defenderResolved = resolveTeamSlots(defenderTeam, inventory, opponent.id);

    const attackerCards = combinedTeam.map(buildBattleCard).filter(Boolean);
    const defenderCards = defenderResolved.map(buildBattleCard).filter(Boolean);

    setFightCooldown(userId);

    const battleId = `${userId}_${Date.now()}`;
    const state    = {
      battleId,
      attackerId:   userId,
      defenderId:   opponent.id,
      attackerName: `${message.author.username} & ${partnerName}`,
      defenderName: opponent.username,
      attackerCards,
      defenderCards,
      expiry: Date.now() + 5 * 60 * 1000,
    };
    activeBattles.set(battleId, state);

    const embed      = buildBattleEmbed(state);
    const components = buildBattleComponents(state);

    // Limit buttons to 5 rows (Discord cap) — only show first 16 alive cards in buttons
    const safeComponents = components.slice(0, 5);
    return message.reply({
      content: `${partnerUser ? `<@${partnerId}>` : ''} — Duo Battle started!`,
      embeds:  [embed],
      components: safeComponents,
    });
  }

  // ── trade @user <offer> [for <ask>] ──────────────────────
  if (command === 'trade' || command === 'tr') {
    const target = message.mentions.users.first();
    if (!target) return message.reply('Usage: `ZP trade @user <offer> [for <ask>]`');
    if (target.id === userId) return message.reply('You cannot trade with yourself.');
    if (target.bot) return message.reply('You cannot trade with bots.');

    const content = args.filter(a => !a.startsWith('<@')).join(' ');
    const forIdx  = content.toLowerCase().split(' ').indexOf('for');
    let offerStr, askStr;

    if (forIdx === -1) {
      offerStr = content.trim();
      askStr   = null;
    } else {
      const tokens = content.trim().split(/\s+/);
      offerStr = tokens.slice(0, forIdx).join(' ');
      askStr   = tokens.slice(forIdx + 1).join(' ');
    }

    if (!offerStr) return message.reply('Usage: `ZP trade @user <offer> [for <ask>]`\nOffer format: `shard:<cardId>:<count>` or `plating:<tier>:<count>` or `yen:<amount>` or `stars:<amount>`');

    const offerItems = parseTradeItems(offerStr);
    const askItems   = askStr ? parseTradeItems(askStr) : null;

    if (!offerItems) return message.reply('Could not parse your offer. Format: `shard:naruto_r:3` or `yen:500` (separate multiple items with commas).');
    if (askStr && !askItems) return message.reply('Could not parse your ask. Format: `shard:naruto_r:3` or `plating:gold:1`');

    const badOffer = offerItems.find(i => !validateTradeItem(i));
    if (badOffer) return message.reply(`Unknown trade item: \`${badOffer.type}:${badOffer.id ?? ''}\``);

    if (askItems) {
      const badAsk = askItems.find(i => !validateTradeItem(i));
      if (badAsk) return message.reply(`Unknown trade item: \`${badAsk.type}:${badAsk.id ?? ''}\``);
    }

    const inventory = await inv.loadInventory();
    const missing   = findMissingItem(inventory, userId, offerItems);
    if (missing) {
      return message.reply(`You don't have enough **${describeItem(missing)}** to offer.`);
    }

    // If no ask — instant gift
    if (!askItems) {
      removeAllItems(inventory, userId, offerItems);
      addAllItems(inventory, target.id, offerItems);
      await inv.saveInventory(inventory);

      const embed = new EmbedBuilder()
        .setColor(0x00FFD1)
        .setTitle(`🎁 Gift Sent!`)
        .setDescription(`**${message.author.username}** gifted **${target.username}**:\n${describeItems(offerItems)}`)
        .setFooter({ text: 'No return gift expected!' });
      return message.reply({ embeds: [embed] });
    }

    // Create pending trade
    removeAllItems(inventory, userId, offerItems);
    await inv.saveInventory(inventory);

    const tradeId = trades.createTrade({
      tradeId: `trade_${Date.now()}`,
      offerId: userId,
      offerName: message.author.username,
      askId: target.id,
      askName: target.username,
      offerItems,
      askItems,
    });

    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle(`🤝 Trade Offer — ID: \`${tradeId}\``)
      .addFields(
        { name: `📤 ${message.author.username} offers`, value: describeItems(offerItems), inline: false },
        { name: `📥 ${message.author.username} wants`,  value: describeItems(askItems),  inline: false },
      )
      .setDescription(`<@${target.id}> — use \`ZP accept ${tradeId}\` to accept or \`ZP decline ${tradeId}\` to decline.`)
      .setFooter({ text: 'Trade expires in 5 minutes' });
    return message.reply({ embeds: [embed] });
  }

  // ── accept | a ────────────────────────────────────────────
  if (command === 'accept' || command === 'a' || command === 'ac') {
    const tradeId = args[0];
    if (!tradeId) return message.reply('Usage: `ZP accept <tradeId>`');

    const trade = trades.getTrade(tradeId);
    if (!trade) return message.reply('Trade not found or already expired.');
    if (trade.askId !== userId) return message.reply('This trade is not addressed to you.');

    const inventory = await inv.loadInventory();
    const missing   = findMissingItem(inventory, userId, trade.askItems);
    if (missing) {
      // Refund offerer
      addAllItems(inventory, trade.offerId, trade.offerItems);
      await inv.saveInventory(inventory);
      trades.removeTrade(tradeId);
      return message.reply(`You don't have enough **${describeItem(missing)}** to complete this trade. The trade has been cancelled and items refunded.`);
    }

    removeAllItems(inventory, userId, trade.askItems);
    addAllItems(inventory, userId, trade.offerItems);
    addAllItems(inventory, trade.offerId, trade.askItems);
    await inv.saveInventory(inventory);
    trades.removeTrade(tradeId);

    const embed = new EmbedBuilder()
      .setColor(0x00FFD1)
      .setTitle('🤝 Trade Complete!')
      .addFields(
        { name: `${message.author.username} received`, value: describeItems(trade.offerItems), inline: true },
        { name: `${trade.offerName} received`,         value: describeItems(trade.askItems),   inline: true },
      )
      .setFooter({ text: `Trade ID: ${tradeId}` });
    return message.reply({ embeds: [embed] });
  }

  // ── decline | dec ─────────────────────────────────────────
  if (command === 'decline' || command === 'dec') {
    const tradeId = args[0];
    if (!tradeId) return message.reply('Usage: `ZP decline <tradeId>`');

    const trade = trades.getTrade(tradeId);
    if (!trade) return message.reply('Trade not found or already expired.');
    if (trade.askId !== userId && trade.offerId !== userId) return message.reply('You are not part of this trade.');

    // Refund offerer
    const inventory = await inv.loadInventory();
    addAllItems(inventory, trade.offerId, trade.offerItems);
    await inv.saveInventory(inventory);
    trades.removeTrade(tradeId);

    return message.reply(`Trade \`${tradeId}\` cancelled. Items returned to **${trade.offerName}**.`);
  }

  // ── trades ────────────────────────────────────────────────
  if (command === 'trades' || command === 'trs') {
    const pending = trades.getTradesFor(userId);
    if (pending.length === 0) return message.reply('You have no pending trade offers. They appear when someone sends you a trade!');

    const lines = pending.map(t =>
      `**\`${t.tradeId}\`** — From **${t.offerName}**\nOffers: ${describeItems(t.offerItems)}\nWants: ${describeItems(t.askItems)}`
    );

    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle(`🤝 Pending Trades (${pending.length})`)
      .setDescription(lines.join('\n\n').slice(0, 4000))
      .setFooter({ text: 'Use ZP accept <id> or ZP decline <id>' });
    return message.reply({ embeds: [embed] });
  }

  // ── Clan commands ─────────────────────────────────────────

  // ── clancreate ───────────────────────────────────────────
  if (command === 'clancreate' || command === 'cc') {
    const name = args.join(' ').trim();
    if (!name) return message.reply('Usage: `ZP clancreate <name>` — choose a name for your clan.');
    if (name.length > 30) return message.reply('Clan name must be 30 characters or fewer.');

    const inventory = await inv.loadInventory();
    const existing  = inv.getUserClan(inventory, userId);
    if (existing) {
      return message.reply(`You are already in the clan **${existing.name}**. Leave it first with \`ZP clanleave\`.`);
    }

    const clanId = inv.createClan(inventory, userId, name);
    if (!clanId) return message.reply('Failed to create clan. Make sure you are not already in one.');
    await inv.saveInventory(inventory);

    const embed = new EmbedBuilder()
      .setColor(0xFF6B35)
      .setTitle(`🏛️ Clan Created — ${name}`)
      .setDescription(
        `You are now the owner of **${name}**!\n` +
        `Invite members with \`ZP clanadd @user\`.\n` +
        `Clan ID: \`${clanId}\``
      )
      .setFooter({ text: 'Build the strongest clan!' });
    return message.reply({ embeds: [embed] });
  }

  // ── clan ─────────────────────────────────────────────────
  if (command === 'clan') {
    const target    = message.mentions.users.first() ?? message.author;
    const inventory = await inv.loadInventory();
    const clan      = inv.getUserClan(inventory, target.id);

    if (!clan) {
      if (target.id === userId) {
        return message.reply(`You are not in a clan. Create one with \`ZP clancreate <name>\`.`);
      }
      return message.reply(`**${target.username}** is not in a clan.`);
    }

    const memberMentions = clan.members.map(id => `<@${id}>${id === clan.ownerId ? ' 👑' : ''}`).join('\n') || 'None';

    const embed = new EmbedBuilder()
      .setColor(0xFF6B35)
      .setTitle(`🏛️ ${clan.name}`)
      .addFields(
        { name: '👑 Owner',      value: `<@${clan.ownerId}>`,                   inline: true },
        { name: '👥 Members',   value: `${clan.members.length}`,                 inline: true },
        { name: '💰 Clan Fund', value: `¥${clan.fund.toLocaleString()}`,         inline: true },
        { name: 'Member List',  value: memberMentions,                            inline: false },
      )
      .setFooter({ text: `Clan ID: ${clan.id}` });
    return message.reply({ embeds: [embed] });
  }

  // ── clanadd ───────────────────────────────────────────────
  if (command === 'clanadd' || command === 'cla') {
    const target = message.mentions.users.first();
    if (!target) return message.reply('Usage: `ZP clanadd @user`');
    if (target.id === userId) return message.reply('You cannot add yourself.');
    if (target.bot) return message.reply('You cannot add bots to your clan.');

    const inventory = await inv.loadInventory();
    const clan      = inv.getUserClan(inventory, userId);
    if (!clan) return message.reply(`You are not in a clan. Create one with \`ZP clancreate <name>\`.`);
    if (clan.ownerId !== userId) return message.reply(`Only the clan owner (**<@${clan.ownerId}>**) can add members.`);

    const targetClan = inv.getUserClan(inventory, target.id);
    if (targetClan) return message.reply(`**${target.username}** is already in a clan (**${targetClan.name}**).`);

    const success = inv.addToClan(inventory, clan.id, target.id);
    if (!success) return message.reply('Could not add this user to the clan.');
    await inv.saveInventory(inventory);

    return message.reply(`**${target.username}** has been added to **${clan.name}**!`);
  }

  // ── clanremove ────────────────────────────────────────────
  if (command === 'clanremove' || command === 'cr') {
    const target = message.mentions.users.first();
    if (!target) return message.reply('Usage: `ZP clanremove @user`');
    if (target.id === userId) return message.reply(`You can't remove yourself. Use \`ZP clanleave\` to leave or \`ZP clandelete\` to delete.`);

    const inventory = await inv.loadInventory();
    const clan      = inv.getUserClan(inventory, userId);
    if (!clan) return message.reply(`You are not in a clan.`);
    if (clan.ownerId !== userId) return message.reply(`Only the clan owner can remove members.`);
    if (!clan.members.includes(target.id)) return message.reply(`**${target.username}** is not in your clan.`);

    inv.removeFromClan(inventory, clan.id, target.id);
    await inv.saveInventory(inventory);

    return message.reply(`**${target.username}** has been removed from **${clan.name}**.`);
  }

  // ── clanleave ─────────────────────────────────────────────
  if (command === 'clanleave' || command === 'cl') {
    const inventory = await inv.loadInventory();
    const clan      = inv.getUserClan(inventory, userId);
    if (!clan) return message.reply(`You are not in a clan.`);
    if (clan.ownerId === userId) return message.reply(`As the clan owner, you cannot leave. Use \`ZP clandelete\` to disband the clan.`);

    inv.removeFromClan(inventory, clan.id, userId);
    await inv.saveInventory(inventory);

    return message.reply(`You have left **${clan.name}**.`);
  }

  // ── clandelete ────────────────────────────────────────────
  if (command === 'clandelete' || command === 'cd') {
    const inventory = await inv.loadInventory();
    const clan      = inv.getUserClan(inventory, userId);
    if (!clan) return message.reply(`You are not in a clan.`);
    if (clan.ownerId !== userId) return message.reply(`Only the clan owner can delete the clan.`);

    const clanName = clan.name;
    inv.deleteClan(inventory, clan.id);
    await inv.saveInventory(inventory);

    return message.reply(`**${clanName}** has been permanently deleted.`);
  }

  // ── clanfundadd ───────────────────────────────────────────
  if (command === 'clanfundadd' || command === 'cfa') {
    const amount = parseInt(args[0], 10);
    if (isNaN(amount) || amount < 1) return message.reply('Usage: `ZP clanfundadd <amount>` — donate yen to your clan fund.');

    const inventory = await inv.loadInventory();
    const clan      = inv.getUserClan(inventory, userId);
    if (!clan) return message.reply(`You are not in a clan.`);

    if (!inv.removeYen(inventory, userId, amount)) {
      return message.reply(`You don't have enough yen. You have ¥${inv.getYen(inventory, userId).toLocaleString()}.`);
    }

    clan.fund = (clan.fund ?? 0) + amount;
    await inv.saveInventory(inventory);

    return message.reply(`Donated **¥${amount.toLocaleString()}** to **${clan.name}**! Clan fund: **¥${clan.fund.toLocaleString()}**`);
  }

  // ── clanfundtake ──────────────────────────────────────────
  if (command === 'clanfundtake' || command === 'cft') {
    const amount = parseInt(args[0], 10);
    if (isNaN(amount) || amount < 1) return message.reply('Usage: `ZP clanfundtake <amount>` — withdraw yen from your clan fund (owner only).');

    const inventory = await inv.loadInventory();
    const clan      = inv.getUserClan(inventory, userId);
    if (!clan) return message.reply(`You are not in a clan.`);
    if (clan.ownerId !== userId) return message.reply(`Only the clan owner can withdraw from the clan fund.`);

    if ((clan.fund ?? 0) < amount) {
      return message.reply(`The clan fund only has **¥${(clan.fund ?? 0).toLocaleString()}**. You cannot withdraw that much.`);
    }

    clan.fund -= amount;
    inv.addYen(inventory, userId, amount);
    await inv.saveInventory(inventory);

    return message.reply(`Withdrew **¥${amount.toLocaleString()}** from **${clan.name}**'s fund! Fund remaining: **¥${clan.fund.toLocaleString()}**`);
  }

  // ── Duo commands ──────────────────────────────────────────

  // ── duocreate ─────────────────────────────────────────────
  if (command === 'duocreate' || command === 'dc') {
    const target = message.mentions.users.first();
    if (!target) return message.reply('Usage: `ZP duocreate @user`');
    if (target.id === userId) return message.reply('You cannot create a duo with yourself.');
    if (target.bot) return message.reply('You cannot duo with a bot.');

    const inventory = await inv.loadInventory();

    if (inv.getUserDuo(inventory, userId)) {
      return message.reply(`You already have a duo partner! Use \`ZP duoremove\` to disband first.`);
    }
    if (inv.getUserDuo(inventory, target.id)) {
      return message.reply(`**${target.username}** already has a duo partner.`);
    }

    // Create duo directly (no confirmation needed for simplicity)
    const duoId = inv.createDuo(inventory, userId, target.id);
    if (!duoId) return message.reply('Failed to create duo.');
    await inv.saveInventory(inventory);

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('🤝 Duo Created!')
      .setDescription(
        `**${message.author.username}** and **${target.username}** are now duo partners!\n\n` +
        `Use \`ZP duofight @opponent\` to fight together.`
      )
      .setFooter({ text: 'Use ZP duoremove to disband your duo' });
    return message.reply({ embeds: [embed] });
  }

  // ── duo ───────────────────────────────────────────────────
  if (command === 'duo') {
    const target    = message.mentions.users.first() ?? message.author;
    const inventory = await inv.loadInventory();
    const duo       = inv.getUserDuo(inventory, target.id);

    if (!duo) {
      if (target.id === userId) {
        return message.reply(`You don't have a duo partner. Create one with \`ZP duocreate @user\`.`);
      }
      return message.reply(`**${target.username}** doesn't have a duo partner.`);
    }

    const partnerIds = duo.members.filter(id => id !== target.id);
    const partnerMentions = partnerIds.map(id => `<@${id}>`).join(', ') || 'Unknown';

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle(`🤝 ${target.username}'s Duo`)
      .addFields(
        { name: '👥 Partners', value: [target.id, ...partnerIds].map(id => `<@${id}>`).join(', '), inline: false },
      )
      .setFooter({ text: `Duo ID: ${duo.id} • Use ZP duofight @opponent to fight together!` });
    return message.reply({ embeds: [embed] });
  }

  // ── duoadd ────────────────────────────────────────────────
  if (command === 'duoadd' || command === 'da') {
    return message.reply('Duos are 2-person partnerships. Use `ZP duoremove` to disband your current duo, then `ZP duocreate @user` to create a new one with a different partner.');
  }

  // ── duoremove ─────────────────────────────────────────────
  if (command === 'duoremove' || command === 'dr') {
    const inventory = await inv.loadInventory();
    const duo       = inv.getUserDuo(inventory, userId);
    if (!duo) return message.reply(`You don't have a duo partner.`);

    inv.disbandDuo(inventory, duo.id);
    await inv.saveInventory(inventory);

    return message.reply(`Your duo partnership has been disbanded.`);
  }

  // ── conquestsend ──────────────────────────────────────────
  if (command === 'conquestsend' || command === 'cs') {
    const cardQuery = args.filter(a => !a.startsWith('<@')).join(' ');
    if (!cardQuery) {
      return message.reply(
        'Usage: `ZP conquestsend <name or id>` — e.g. `ZP cs gear5 luffy`\n' +
        'Send a card on a 2-hour conquest. Recall it with `ZP conquestrecall` to earn **1 Limit Breaker** and **1–10 Candy Tokens**.'
      );
    }

    const card = resolveCard(cardQuery);
    if (!card) return message.reply(`No card found matching \`${cardQuery}\`.`);

    const inventory = await inv.loadInventory();
    if (!inv.hasCard(inventory, userId, card.id)) {
      return message.reply(`You don't own **${card.name}**.`);
    }

    const existing = inv.getConquest(inventory, userId);
    if (existing) {
      const existingCard = lookupCard(existing.cardId);
      const elapsed = Math.floor((Date.now() - existing.sentAt) / 60000);
      return message.reply(
        `**${existingCard?.name ?? existing.cardId}** is already on conquest (${elapsed} min ago). ` +
        `Use \`ZP conquestrecall\` after 2 hours to claim your rewards.`
      );
    }

    inv.setConquest(inventory, userId, card.id);
    await inv.saveInventory(inventory);

    const meta = rarityMeta(card.rarity);
    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`${card.name} Sent on Conquest!`)
      .setDescription(
        `**${card.name}** has been dispatched on a conquest mission.\n\n` +
        `Come back in **2 hours** and use \`ZP conquestrecall\` to claim:\n` +
        `> **1 Limit Breaker** + **1–10 Candy Tokens**`
      )
      .setFooter({ text: 'Only one card can be on conquest at a time' });
    const img = imgCache.getImage(card.id) ?? card.image ?? null;
    if (img) embed.setThumbnail(img);
    return message.reply({ embeds: [embed] });
  }

  // ── conquestrecall ────────────────────────────────────────
  if (command === 'conquestrecall' || command === 'cr') {
    const inventory = await inv.loadInventory();
    const conquest  = inv.getConquest(inventory, userId);

    if (!conquest) {
      return message.reply(`You don't have a card on conquest. Send one with \`ZP conquestsend <cardId>\`.`);
    }

    const elapsedMs  = Date.now() - conquest.sentAt;
    const TWO_HOURS  = 2 * 60 * 60 * 1000;
    if (elapsedMs < TWO_HOURS) {
      const remaining = Math.ceil((TWO_HOURS - elapsedMs) / 60000);
      return message.reply(`**${lookupCard(conquest.cardId)?.name ?? conquest.cardId}** is still on conquest. Come back in **${remaining} more minute${remaining === 1 ? '' : 's'}**.`);
    }

    const card        = lookupCard(conquest.cardId);
    const candyEarned = Math.floor(1 + Math.random() * 10);

    inv.addLimitBreakers(inventory, userId, 1);
    inv.addCandyTokens(inventory, userId, candyEarned);
    inv.clearConquest(inventory, userId);
    await inv.saveInventory(inventory);

    const meta = card ? rarityMeta(card.rarity) : { color: 0x00FFD1 };
    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`Conquest Complete!`)
      .setDescription(
        `**${card?.name ?? conquest.cardId}** has returned from conquest!\n\n` +
        `**Rewards earned:**\n` +
        `> **1 Limit Breaker**\n` +
        `> **${candyEarned} Candy Token${candyEarned === 1 ? '' : 's'}**`
      )
      .setFooter({ text: 'Use ZP ilc <cardId> to break a card\'s level cap with Limit Breakers' });
    const img = card ? (imgCache.getImage(card.id) ?? card.image ?? null) : null;
    if (img) embed.setThumbnail(img);
    return message.reply({ embeds: [embed] });
  }

  // ── redeem ────────────────────────────────────────────────
  if (command === 'redeem') {
    const codeInput = args[0];
    if (!codeInput) return message.reply('Usage: `ZP redeem <code>`');

    const inventory = await inv.loadInventory();
    const entry = inv.findRedeemCodeByCode(inventory, codeInput);
    if (!entry) return message.reply(`❌ Code \`${codeInput.toUpperCase()}\` is not valid.`);

    if (inv.hasRedeemedCode(inventory, userId, entry.name)) {
      return message.reply(`❌ You have already redeemed the **${entry.name}** code.`);
    }

    const r = entry.rewards;
    const lines = [];

    if (r.yen   > 0) { inv.addYen(inventory, userId, r.yen);           lines.push(`**¥${r.yen.toLocaleString()} Yen**`); }
    if (r.stars > 0) { inv.addStars(inventory, userId, r.stars);       lines.push(`**${r.stars.toLocaleString()} Stars**`); }
    if (r.candyTokens > 0) { inv.addCandyTokens(inventory, userId, r.candyTokens); lines.push(`**${r.candyTokens} Candy Token${r.candyTokens === 1 ? '' : 's'}**`); }
    if (r.cardRarity) {
      const randomCard = pullCardForced(r.cardRarity);
      if (randomCard) {
        const result = inv.addCardToInventory(inventory, userId, randomCard);
        const meta = rarityMeta(r.cardRarity);
        lines.push(result.isDupe
          ? `**${meta?.label ?? r.cardRarity} Card:** ${randomCard.name} (already owned — shard added)`
          : `**${meta?.label ?? r.cardRarity} Card:** ${randomCard.name} (new!)`);
      }
    }
    if (r.platings) {
      for (const [tier, amount] of Object.entries(r.platings)) {
        if (amount > 0) {
          inv.addPlatings(inventory, userId, tier, amount);
          const tierInfo = platingById(tier);
          lines.push(`**${amount}x ${tierInfo ? tierInfo.label : tier} Plating**`);
        }
      }
    }

    if (lines.length === 0) return message.reply(`❌ That code has no rewards configured yet.`);

    inv.markCodeRedeemed(inventory, userId, entry.name);
    await inv.saveInventory(inventory);

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00FFD1)
          .setTitle('🎉 Code Redeemed!')
          .setDescription(`You redeemed the **${entry.name}** code and received:\n\n${lines.join('\n')}`)
          .setFooter({ text: `Code: ${entry.code}` }),
      ],
    });
  }

  // ── Bot Admin commands ─────────────────────────────────────
  if (!isAdmin(userId)) return;

  // ── setrarity ─────────────────────────────────────────────
  if (command === 'setrarity') {
    const raw = args[0];
    if (!raw) return message.reply(`Usage: \`ZP setrarity <${Object.keys(config.RARITY_META).join('|')}|reset>\``);
    if (raw.toLowerCase() === 'reset') {
      adminRarityOverride = null;
      return message.reply('Rarity override cleared. Pulls are back to normal rates.');
    }
    const val = normalizeRarity(raw);
    if (!val) return message.reply(`Unknown rarity \`${raw}\`.`);
    adminRarityOverride = val;
    return message.reply(`All future pulls will be forced to **${rarityMeta(val).label}**. Use \`ZP setrarity reset\` to clear.`);
  }

  // ── setplating ────────────────────────────────────────────
  if (command === 'setplating') {
    const val = args[0]?.toLowerCase();
    if (!val) return message.reply(`Usage: \`ZP setplating <${config.PLATING_TIERS.map(t => t.id).join('|')}|reset>\``);
    if (val === 'reset') {
      adminPlatingOverride = null;
      return message.reply('Plating override cleared.');
    }
    const tier = platingById(val);
    if (!tier) return message.reply(`Unknown plating tier \`${val}\`.`);
    adminPlatingOverride = tier;
    return message.reply(`Every pull will now drop a **${tier.label} Plating**. Use \`ZP setplating reset\` to clear.`);
  }

  // ── resetcooldown ─────────────────────────────────────────
  if (command === 'resetcooldown') {
    setCharges(userId, config.MAX_PULL_CHARGES, Date.now());
    return message.reply(`Pull charges reset to **${config.MAX_PULL_CHARGES}**.`);
  }

  // ── giveyen ───────────────────────────────────────────────
  if (command === 'giveyen') {
    const target = message.mentions.users.first() ?? message.author;
    const amount = parseInt(args.find(a => !a.startsWith('<@')), 10);
    if (isNaN(amount) || amount <= 0) return message.reply('Usage: `ZP giveyen [@user] <amount>`');
    const inventory = await inv.loadInventory();
    inv.addYen(inventory, target.id, amount);
    await inv.saveInventory(inventory);
    return message.reply(`Added **¥${amount.toLocaleString()}** to **${target.username}**'s wallet.`);
  }

  // ── givestars ─────────────────────────────────────────────
  if (command === 'givestars') {
    const target = message.mentions.users.first() ?? message.author;
    const amount = parseInt(args.find(a => !a.startsWith('<@')), 10);
    if (isNaN(amount) || amount <= 0) return message.reply('Usage: `ZP givestars [@user] <amount>`');
    const inventory = await inv.loadInventory();
    inv.addStars(inventory, target.id, amount);
    await inv.saveInventory(inventory);
    return message.reply(`Added **${amount.toLocaleString()} Stars** to **${target.username}**.`);
  }

  // ── givecandytokens ───────────────────────────────────────
  if (command === 'givecandytokens') {
    const target = message.mentions.users.first() ?? message.author;
    const amount = parseInt(args.find(a => !a.startsWith('<@')), 10);
    if (isNaN(amount) || amount <= 0) return message.reply('Usage: `ZP givecandytokens [@user] <amount>`');
    const inventory = await inv.loadInventory();
    inv.addCandyTokens(inventory, target.id, amount);
    await inv.saveInventory(inventory);
    return message.reply(`Gave **${amount}** Candy Token${amount === 1 ? '' : 's'} to **${target.username}**.`);
  }

  // ── refresh ───────────────────────────────────────────────
  if (command === 'refresh') {
    await message.reply('Starting emoji refresh: deleting all emojis and re-syncing...');
    await emojiCache.deleteAllEmojis(client);
    await emojiCache.syncEmojis(client, CARDS, imgCache);
    return message.reply('Emoji refresh complete.');
  }

  // ── givelimitbreaker ──────────────────────────────────────
  if (command === 'givelimitbreaker' || command === 'glb') {
    const target = message.mentions.users.first() ?? message.author;
    const amount = parseInt(args.find(a => !a.startsWith('<@')), 10);
    if (isNaN(amount) || amount <= 0) return message.reply('Usage: `ZP givelimitbreaker [@user] <amount>`');
    const inventory = await inv.loadInventory();
    inv.addLimitBreakers(inventory, target.id, amount);
    await inv.saveInventory(inventory);
    return message.reply(`Gave **${amount} Limit Breaker${amount === 1 ? '' : 's'}** to **${target.username}**.`);
  }

  // ── giveitem ──────────────────────────────────────────────
  if (command === 'giveitem') {
    const target = message.mentions.users.first();
    const itemId = args.find(a => !a.startsWith('<@'))?.toLowerCase();
    if (!target || !itemId) return message.reply(`Usage: \`ZP giveitem @user <itemId>\` — available: ${config.ITEMS.map(i => `\`${i.id}\``).join(', ')}`);

    const item = config.ITEMS.find(i => i.id === itemId);
    if (!item) return message.reply(`Unknown item \`${itemId}\`. Available: ${config.ITEMS.map(i => `\`${i.id}\``).join(', ')}`);

    const inventory = await inv.loadInventory();
    inv.addItem(inventory, target.id, itemId);
    await inv.saveInventory(inventory);
    return message.reply(`Gave **${item.emoji} ${item.name}** to **${target.username}**.`);
  }

  // ── giveraidticket ────────────────────────────────────────
  if (command === 'giveraidticket' || command === 'grt') {
    const target = message.mentions.users.first();
    const nonMention = args.filter(a => !a.startsWith('<@'));
    const tierArg = nonMention[0]?.toLowerCase();
    const amount  = parseInt(nonMention[1] ?? '1', 10);

    const TIER_ALIASES_ADMIN = {
      normal: 'raid_ticket', raid: 'raid_ticket', ticket: 'raid_ticket',
      mythical: 'mythical_raid_ticket', my: 'mythical_raid_ticket',
      omega: 'omega_raid_ticket', ur: 'omega_raid_ticket',
      hellish: 'hellish_raid_ticket', hell: 'hellish_raid_ticket', lt: 'hellish_raid_ticket',
    };
    const ticketId = TIER_ALIASES_ADMIN[tierArg];

    if (!target || !ticketId || isNaN(amount) || amount <= 0) {
      return message.reply(
        'Usage: `ZP giveraidticket @user <tier> [amount]`\n' +
        'Tiers: `normal` `mythical` `omega` `hellish`\n' +
        'Example: `ZP giveraidticket @user hellish 3`'
      );
    }

    const tier = config.RAID_TICKET_TIERS.find(t => t.id === ticketId);
    const inventory = await inv.loadInventory();
    for (let i = 0; i < amount; i++) inv.addItem(inventory, target.id, ticketId);
    await inv.saveInventory(inventory);
    return message.reply(`Gave **${amount}× ${tier.emoji} ${tier.label}** to **${target.username}**.`);
  }

  // ── giveshards ────────────────────────────────────────────
  if (command === 'giveshards') {
    if (!isAdmin(userId)) return;

    const target = message.mentions.users.first();
    const nonMentionArgs = args.filter(a => !a.startsWith('<@'));
    const cardId = nonMentionArgs[0]?.toLowerCase();
    const amount = parseInt(nonMentionArgs[1], 10);

    if (!target || !cardId || isNaN(amount) || amount <= 0)
      return message.reply('Usage: `ZP giveshards @user <cardId> <amount>`');

    const card = lookupCard(cardId);
    if (!card) return message.reply(`❌ No card found with ID \`${cardId}\`.`);

    const inventory = await inv.loadInventory();
    inv.addCharacterShards(inventory, target.id, cardId, amount);
    await inv.saveInventory(inventory);

    const emoji = emojiCache.getEmoji(cardId) ?? '';
    return message.reply(`Gave **${amount}x ${emoji}${card.name} shard${amount === 1 ? '' : 's'}** to **${target.username}**.`);
  }

  // ── createcode ────────────────────────────────────────────
  if (command === 'createcode') {
    const name     = args[0];
    const code     = args[1];
    const rewardArgs = args.slice(2);
    if (!name || !code) return message.reply('Usage: `ZP createcode <name> <code> [yen:<n>] [stars:<n>] [candytokens:<n>] [plating:<tier>:<n>] [card:<rarity>]`');

    const rewards  = parseRewardArgs(rewardArgs);
    const inventory = await inv.loadInventory();
    const created  = inv.createRedeemCode(inventory, name, code, rewards);
    if (!created) return message.reply(`❌ A code named **${name}** already exists. Use \`ZP editcode\` to update it.`);
    await inv.saveInventory(inventory);

    const codeEntry = inv.getRedeemCodes(inventory)[name.toLowerCase()];
    return message.reply(`✅ Code **${name}** created!\n**Code:** \`${codeEntry.code}\`\n**Rewards:** ${formatRewards(rewards)}`);
  }

  // ── editcode ──────────────────────────────────────────────
  if (command === 'editcode') {
    const name       = args[0];
    const rewardArgs = args.slice(1);
    if (!name) return message.reply('Usage: `ZP editcode <name> [yen:<n>] [stars:<n>] [candytokens:<n>] [plating:<tier>:<n>] [card:<rarity>]`');

    const rewards   = parseRewardArgs(rewardArgs);
    const inventory = await inv.loadInventory();
    const updated   = inv.updateRedeemCode(inventory, name, rewards);
    if (!updated) return message.reply(`❌ No code named **${name}** found. Use \`ZP createcode\` to create it.`);
    await inv.saveInventory(inventory);

    return message.reply(`✅ Code **${name}** updated!\n**Rewards:** ${formatRewards(rewards)}`);
  }

  // ── deletecode ────────────────────────────────────────────
  if (command === 'deletecode') {
    const name = args[0];
    if (!name) return message.reply('Usage: `ZP deletecode <name>`');

    const inventory = await inv.loadInventory();
    const deleted   = inv.deleteRedeemCode(inventory, name);
    if (!deleted) return message.reply(`❌ No code named **${name}** found.`);
    await inv.saveInventory(inventory);

    return message.reply(`✅ Code **${name}** has been deleted.`);
  }

  // ── listcodes ─────────────────────────────────────────────
  if (command === 'listcodes') {
    const inventory = await inv.loadInventory();
    const codes     = Object.values(inv.getRedeemCodes(inventory));
    if (codes.length === 0) return message.reply('No redeem codes exist yet. Create one with `ZP createcode`.');

    const lines = codes.map(c =>
      `**${c.name}** — Code: \`${c.code}\` — Rewards: ${formatRewards(c.rewards)} — Redeemed by: ${c.redeemedBy.length} user${c.redeemedBy.length === 1 ? '' : 's'}`
    );

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('🔧 Active Redeem Codes')
          .setDescription(lines.join('\n'))
          .setFooter({ text: `${codes.length} code${codes.length === 1 ? '' : 's'} total` }),
      ],
    });
  }
});

// ── Error handler ─────────────────────────────────────────
client.on('error', (err) => {
  console.error('[Discord Client Error]', err);
});

// ── Login ─────────────────────────────────────────────────

client.login(process.env.DISCORD_TOKEN);

console.log("Ping loop started");
