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
//    ZP botfight  (bf)                     – fight a randomly generated bot team for rewards
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
//    ZP givecard @user <cardId>
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
    ModalBuilder, TextInputBuilder, TextInputStyle,
    REST, Routes, SlashCommandBuilder,
} = require('discord.js');

const express = require('express');

const config      = require('./config');
const { CARDS, pullCard } = require('./cards');
const inv         = require('./inventory');
const trades      = require('./trades');
const imgCache    = require('./imageCache');
const emojiCache  = require('./emojiCache');

// ── Static image server ───────────────────────────────────
{
  const imageApp = express();
  imageApp.use('/images', express.static(path.join(__dirname, 'public', 'images')));
  const imgPort = process.env.IMAGE_PORT ? parseInt(process.env.IMAGE_PORT) : 3001;
  imageApp.listen(imgPort, () => console.log(`[images] Serving static images on port ${imgPort}`));
}

// ── Status / Info web page ────────────────────────────────
{
  const webApp = express();
  webApp.get('/', (req, res) => {
    const cfg = require('./config');
    const rarityRows = Object.entries(cfg.RARITY_META).map(([key, m]) => {
      const sr = cfg.STAT_RANGES[key];
      const rate = cfg.PULL_RATES[key] != null ? cfg.PULL_RATES[key] + '%' : '(event)';
      return `<tr>
        <td>${m.emoji} <b>${m.label}</b> (${key})</td>
        <td>${rate}</td>
        <td>${sr ? sr.hpMin + '–' + sr.hpMax : '—'}</td>
        <td>${sr ? sr.dmgMin + '–' + sr.dmgMax : '—'}</td>
        <td>${sr ? Math.round(sr.hpMin*0.45) + '–' + Math.round(sr.hpMax*0.55) : '—'}</td>
      </tr>`;
    }).join('');

    const weaponRows = Object.entries(cfg.WEAPON_STATS).map(([key, w]) => {
      const m = cfg.RARITY_META[key];
      return `<tr>
        <td>${m?.emoji ?? ''} <b>${m?.label ?? key}</b></td>
        <td>${w.power.toLocaleString()}</td>
        <td>+${w.hp.toLocaleString()}</td>
        <td>+${w.speed.toLocaleString()}</td>
        <td>+${w.atkMin}–${w.atkMax}</td>
      </tr>`;
    }).join('');

    const adminCmds = [
      'ZP setrarity &lt;rarity|reset&gt;',
      'ZP setplating &lt;tier|reset&gt;',
      'ZP resetcooldown',
      'ZP giveyen [@user] &lt;amount&gt;',
      'ZP givestars [@user] &lt;amount&gt;',
      'ZP givecandytokens [@user] &lt;amount&gt;',
      'ZP giveitem @user &lt;itemId&gt;',
      'ZP giveshards @user &lt;cardId&gt; &lt;amount&gt;',
      'ZP givecard @user &lt;cardId&gt; — give a card directly',
      'ZP givelimitbreaker [@user] &lt;amount&gt;',
      'ZP givelevelscrolls [@user] &lt;amount&gt;',
      'ZP giveraidticket @user &lt;tier&gt; [amount]',
      'ZP createcode / editcode / deletecode / listcodes',
      'ZP refresh — re-sync all server emojis',
      'ZP imgreview [filter] — review all card images/emojis interactively',
    ].map(c => `<li><code>${c}</code></li>`).join('');

    res.send(`<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TKO Bot — Info</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;background:#0d1117;color:#c9d1d9;padding:24px}
  h1{color:#58a6ff;margin-bottom:4px}
  h2{color:#79c0ff;margin-top:28px;margin-bottom:10px;border-bottom:1px solid #30363d;padding-bottom:6px}
  p{color:#8b949e;margin-bottom:16px;font-size:14px}
  table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px}
  th{background:#161b22;color:#58a6ff;text-align:left;padding:8px 12px;border:1px solid #30363d}
  td{padding:7px 12px;border:1px solid #30363d}
  tr:nth-child(even) td{background:#161b22}
  code{background:#161b22;color:#f0883e;padding:2px 6px;border-radius:4px;font-size:12px}
  ul{margin-left:20px;line-height:2}
  .badge{display:inline-block;background:#21262d;border:1px solid #30363d;border-radius:6px;padding:2px 8px;font-size:12px;color:#8b949e}
</style></head><body>
<h1>⚔️ TKO Bot</h1>
<p>Prefix: <code>ZP</code> &nbsp;•&nbsp; Discord card-pulling &amp; battle bot</p>

<h2>✨ Rarities &amp; Base Stats (Lv 1)</h2>
<table>
  <tr><th>Rarity</th><th>Pull Rate</th><th>HP Range</th><th>DMG Range</th><th>Speed Range</th></tr>
  ${rarityRows}
</table>

<h2>⚔️ Weapon Stat Bonuses by Rarity</h2>
<table>
  <tr><th>Rarity</th><th>⚡ Power</th><th>❤️ Health Boost</th><th>💨 Speed Boost</th><th>Attack Boost</th></tr>
  ${weaponRows}
</table>

<h2>🛠️ Admin Commands</h2>
<ul>${adminCmds}</ul>

<h2>💨 Speed Stat</h2>
<p>Base speed = <b>0.45–0.55× the card's base HP</b>. Higher speed means the card attacks first in battle. Weapons add a flat speed bonus on top.</p>

<h2>🔗 Key Commands</h2>
<ul>
  <li><code>ZP equip &lt;card&gt; &lt;weaponId or plating&gt;</code> — unified equip (auto-detects weapon or plating)</li>
  <li><code>ZP equipweapon &lt;card&gt; &lt;weaponId&gt;</code> / <code>ZP ew</code></li>
  <li><code>ZP unequipweapon &lt;card&gt;</code> / <code>ZP uew</code></li>
  <li><code>ZP weaponinfo &lt;weaponId&gt;</code> / <code>ZP winfo</code></li>
  <li><code>ZP evolveweapon &lt;weaponId&gt;</code> / <code>ZP evw</code></li>
  <li><code>ZP help</code> — full command list in Discord</li>
</ul>
</body></html>`);
  });
  const webPort = process.env.WEB_PORT ? parseInt(process.env.WEB_PORT) : 3000;
  webApp.listen(webPort, '0.0.0.0', () => console.log(`[web] Status page on port ${webPort}`));
}


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// ── Kill yen per shard by rarity ──────────────────────────
const KILL_YEN = { R: 50, E: 150, L: 350, MY: 600, UR: 1000, LT: 2000, MD: 5000 };

// ── Admin ─────────────────────────────────────────────────
const ADMIN_ID = '833025999897755689';
let adminRarityOverride  = null;
let adminPlatingOverride = null;

function isAdmin(userId) { return userId === ADMIN_ID; }

// ── Banned Users ──────────────────────────────────────────
const BANNED_FILE = path.join(__dirname, 'data', 'banned_users.json');
let bannedUsers = new Set();
try {
  if (fs.existsSync(BANNED_FILE)) {
    const raw = JSON.parse(fs.readFileSync(BANNED_FILE, 'utf8'));
    bannedUsers = new Set(Array.isArray(raw) ? raw : []);
  }
} catch (_) {}
function saveBannedUsers() {
  try { fs.writeFileSync(BANNED_FILE, JSON.stringify([...bannedUsers], null, 2)); } catch (_) {}
}

// ── Webhook Log Channels ──────────────────────────────────
const TRADE_LOG_CHANNEL = '1489593047799955538';
const RAID_LOG_CHANNEL  = '1489593108663373916';
async function logToChannel(channelId, embed) {
  try {
    const ch = await client.channels.fetch(channelId);
    if (ch?.isTextBased()) await ch.send({ embeds: [embed] });
  } catch (_) {}
}

// ── Support Card Helpers ──────────────────────────────────
// Returns true if the player owns the given support card.
function hasSupportCard(inventory, userId, supportId) {
  const user = inventory.users?.[userId];
  return !!(user?.cards && user.cards.some(c => c.id === supportId));
}

// Returns the effective pull regen in ms for a user.
function getEffectiveRegenMs(inventory, userId) {
  const base = config.PULL_COOLDOWN_SECONDS * 1000;
  if (hasSupportCard(inventory, userId, 'support_r')) return (config.PULL_COOLDOWN_SECONDS - 5) * 1000;
  return base;
}

// Returns the conquest duration in ms for a user.
function getConquestDurationMs(inventory, userId) {
  const twoHours = 2 * 60 * 60 * 1000;
  if (hasSupportCard(inventory, userId, 'support_my')) return 60 * 60 * 1000;
  return twoHours;
}

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
  const pool = CARDS.filter(c => c.rarity === rarity && !c.weaponCard && !c.supportCard && !c.dittoCard);
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

function getCharges(userId, regenMsOverride) {
  const now      = Date.now();
  const regenMs  = regenMsOverride ?? config.PULL_COOLDOWN_SECONDS * 1000;
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
    const baseSpeedFixed = Math.round(card.fixedHp * 0.50);
    return {
      hp:    Math.round(card.fixedHp  * mult),
      dmg:   Math.round(card.fixedDmg * mult),
      speed: Math.round(baseSpeedFixed * mult),
    };
  }
  let hash = 0;
  for (const ch of card.id) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  const t      = (hash >>> 0) % 1000 / 1000;
  const tSpeed = ((hash >>> 7) % 1000) / 1000; // independent fraction for speed
  const range    = config.STAT_RANGES[card.rarity] ?? config.STAT_RANGES['R'];
  const baseHp   = Math.round(range.hpMin  + t * (range.hpMax  - range.hpMin));
  const baseDmg  = Math.round(range.dmgMin + t * (range.dmgMax - range.dmgMin));
  const baseSpeed = Math.round(baseHp * (0.45 + tSpeed * 0.10)); // 0.45–0.55× HP
  return {
    hp:    Math.round(baseHp    * mult),
    dmg:   Math.round(baseDmg   * mult),
    speed: Math.round(baseSpeed * mult),
  };
}

/** Deterministic weapon ATK bonus from the weapon card's ID hash */
function getWeaponAtkBonus(weaponId) {
  const wStats = config.WEAPON_STATS[lookupCard(weaponId)?.rarity];
  if (!wStats) return 0;
  let wHash = 0;
  for (const ch of weaponId) wHash = (wHash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  const t = (wHash >>> 0) % 1000 / 1000;
  return Math.round(wStats.atkMin + t * (wStats.atkMax - wStats.atkMin));
}

// ── Trade item helpers ────────────────────────────────────

function parseTradeItem(str) {
  const parts  = str.trim().split(':');
  const type   = parts[0]?.toLowerCase();
  const CURRENCY_TYPES = ['yen', 'stars', 'candy'];
  const ID_TYPES       = ['shard', 'plating', 'item'];

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
  if (item.type === 'candy')   return true;
  if (item.type === 'item')    return !!config.ITEMS.find(i => i.id === item.id);
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
  if (item.type === 'candy') return `**${item.amount}** Candy Token${item.amount === 1 ? '' : 's'} 🍬`;
  if (item.type === 'item') {
    const cfgItem = config.ITEMS.find(i => i.id === item.id);
    return `**x${item.amount}** ${cfgItem ? cfgItem.emoji + ' ' + cfgItem.name : item.id}`;
  }
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
  if (item.type === 'candy')   return inv.getTradableCandyTokens(inventory, userId) >= item.amount;
  if (item.type === 'item')    return inv.getItemCount(inventory, userId, item.id) >= item.amount;
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
  if (item.type === 'candy')   return inv.removeTradableCandyTokens(inventory, userId, item.amount);
  if (item.type === 'item')    return inv.removeItemAmount(inventory, userId, item.id, item.amount);
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
  if (item.type === 'candy')   inv.addCandyTokens(inventory, userId, item.amount);
  if (item.type === 'item')    inv.addItemAmount(inventory, userId, item.id, item.amount);
}

function addAllItems(inventory, userId, items) {
  for (const item of items) addItems(inventory, userId, item);
}

// ── Fight cooldown ────────────────────────────────────────

const fightCooldowns       = new Map();
const activeBattles        = new Map();
const pendingConfirmations = new Map();
const activeCollabRaids    = new Map(); // ownerId → battleId
const worldBossAttackCooldowns = new Map(); // userId → last attack timestamp (ms)

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
  const platings = inv.getSlotPlatings(slot)
    .map(id => config.PLATING_TIERS.find(t => t.id === id))
    .filter(Boolean);

  // Each plating adds its bonus on top of the base 1×; bonuses are additive
  const platMult = platings.reduce((acc, p) => acc + (p.statMult - 1), 1);

  let equippedWeaponId   = null;
  let equippedWeaponName = null;
  let hp    = Math.round(stats.hp    * platMult);
  let dmg   = Math.round(stats.dmg   * platMult);
  let speed = stats.speed; // plating does not affect speed

  if (slot.equippedWeapon) {
    const { weaponId, weaponName, weaponLevel = 1, evolutionTier = 1 } = slot.equippedWeapon;
    const wCard    = lookupCard(weaponId);
    const wStats   = wCard ? (config.WEAPON_STATS[wCard.rarity] ?? null) : null;
    const tierData = config.WEAPON_EVOLUTION_TIERS[evolutionTier - 1] ?? config.WEAPON_EVOLUTION_TIERS[0];
    const tierMult = 1 + (tierData.statMult * (weaponLevel / 100));
    if (wStats) {
      hp    += Math.round(wStats.hp    * tierMult);
      speed += Math.round(wStats.speed * tierMult);
      dmg   += Math.round(getWeaponAtkBonus(weaponId) * tierMult);
    }
    equippedWeaponId   = weaponId;
    equippedWeaponName = weaponName;
  }

  const meta    = rarityMeta(card.rarity);
  return {
    cardId:    card.id,
    name:      card.name,
    level,
    platings:  platings.map(p => p.id),
    platEmoji: platings.map(p => p.emoji).join(''),
    rarEmoji:  meta.emoji,
    hp,
    maxHp:     hp,
    dmgMin:    Math.round(dmg * 0.8),
    dmgMax:    Math.round(dmg * 1.2),
    dmg,
    speed,
    technique:      card.technique ?? false,
    specialAbility: card.specialAbility ?? null,
    alive:          true,
    equippedWeaponId,
    equippedWeaponName,
  };
}

/**
 * If any card on myCards is Ditto (dittoCard), transform it to copy the
 * strongest card's stats at (80% + (level-1) * 0.1%) efficiency.
 * Technique is also copied if the target has it.
 *
 * Options:
 *   copyAllies — if true, Ditto copies the strongest OTHER card on its own
 *                team (myCards) instead of copying from opponentCards.
 *                Use this in raids so Ditto never copies a raid boss.
 */
function applyDittoTransform(myCards, opponentCards, { copyAllies = false } = {}) {
  for (const bc of myCards) {
    const liveCard = lookupCard(bc.cardId);
    if (!liveCard?.dittoCard) continue;

    // Determine the pool to copy from
    const pool = copyAllies
      ? myCards.filter(c => c !== bc)   // all teammates except self
      : opponentCards;

    if (!pool.length) continue;

    const strongest = pool.reduce((best, opp) => {
      return (opp.hp + opp.dmg) > (best.hp + best.dmg) ? opp : best;
    }, pool[0]);

    const copyMult = 0.80 + (bc.level - 1) * 0.001;
    bc.hp        = Math.round(strongest.hp  * copyMult);
    bc.maxHp     = bc.hp;
    bc.dmg       = Math.round(strongest.dmg * copyMult);
    bc.dmgMin    = Math.round(bc.dmg * 0.8);
    bc.dmgMax    = Math.round(bc.dmg * 1.2);
    bc.technique = strongest.technique;
    bc.copiedFrom = strongest.name;
    bc.name      = `Ditto (${strongest.name})`;
  }
}

/**
 * Build a random bot team of 4 cards at varying levels for ZP botfight.
 * Picks from R–UR pool (not LT, not Ditto) with weighted rarity distribution.
 */
function generateBotTeam() {
  const RARITY_WEIGHTS = { R: 40, E: 30, L: 20, MY: 7, UR: 3 };
  const pool = CARDS.filter(c => c.rarity !== 'LT' && c.rarity !== 'MD' && !c.dittoCard && !c.supportCard && !c.weaponCard);

  const picked = [];
  const used   = new Set();
  while (picked.length < 4 && picked.length < pool.length) {
    const roll   = Math.random() * 100;
    let cum = 0;
    let chosenRarity = 'R';
    for (const [r, w] of Object.entries(RARITY_WEIGHTS)) {
      cum += w;
      if (roll < cum) { chosenRarity = r; break; }
    }
    const rarPool = pool.filter(c => c.rarity === chosenRarity && !used.has(c.id));
    if (!rarPool.length) continue;
    const card = rarPool[Math.floor(Math.random() * rarPool.length)];
    used.add(card.id);
    const level = Math.floor(Math.random() * 60) + 20;
    picked.push(buildBattleCard({ card, level, plating: null }));
  }
  return picked;
}

/**
 * Calculate damage dealt by attacker to target.
 * Applies Golden Pupils (20% chance for 5× crit) if attacker has the ability.
 * Returns { dmg, crit }
 */
function calcDamage(attacker, target) {
  let dmg = attacker.technique
    ? Math.round(target.maxHp * (attacker.dmg / 10000) * (0.9 + Math.random() * 0.2))
    : Math.round(attacker.dmg * (0.8 + Math.random() * 0.4));
  let crit = false;
  if (attacker.specialAbility === 'golden_pupils' && Math.random() < 0.20) {
    dmg  = Math.round(dmg * 5);
    crit = true;
  }
  return { dmg, crit };
}

function simulateSingleBotFight(attackerCards, defenderCards) {
  const atk = attackerCards.map(c => ({ ...c, hp: c.maxHp, alive: true }));
  const def = defenderCards.map(c => ({ ...c, hp: c.maxHp, alive: true }));
  const weaponKills = {};

  while (atk.some(c => c.alive) && def.some(c => c.alive)) {
    const attacker = atk.find(c => c.alive);
    const target   = def.find(c => c.alive);
    if (!attacker || !target) break;

    const { dmg } = calcDamage(attacker, target);
    target.hp = Math.max(0, target.hp - dmg);
    if (target.hp === 0) {
      target.alive = false;
      if (attacker.equippedWeaponId) {
        weaponKills[attacker.equippedWeaponId] = (weaponKills[attacker.equippedWeaponId] ?? 0) + 1;
      }
    }

    if (def.every(c => !c.alive)) break;

    const retaliator = def.find(c => c.alive);
    const atkTarget  = atk.find(c => c.alive);
    if (retaliator && atkTarget) {
      const retDmg = Math.round(retaliator.dmg * (0.8 + Math.random() * 0.4));
      atkTarget.hp = Math.max(0, atkTarget.hp - retDmg);
      if (atkTarget.hp === 0) atkTarget.alive = false;
    }
  }

  const won = def.every(c => !c.alive);
  return { won, weaponKills };
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
  const spdStr = bc.speed != null ? ` | SPD ${bc.speed.toLocaleString()}` : '';
  return [
    hpBar(bc.hp, bc.maxHp),
    `=> **${bc.name}** | Lv. ${bc.level}`,
    bc.technique
      ? `HP ${bc.hp.toLocaleString()}/${bc.maxHp.toLocaleString()} | TEC ${bc.dmgMin}–${bc.dmgMax}${spdStr}`
      : `HP ${bc.hp.toLocaleString()}/${bc.maxHp.toLocaleString()} | DMG ${bc.dmgMin}–${bc.dmgMax}${spdStr}`,
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
  const rewardShares = state.rewardShares ?? [];
  const shareDeduction = Math.min(rewardShares.length * 0.20, 0.5); // owner loses up to 50% of their share
  const ownerShare = 0.5 * (1 - shareDeduction);
  const sharedUsers = rewardShares.map(s => ({
    userId: s.userId, username: s.username,
    share: 0.5 * 0.20, // 20% of owner's base 50%
  }));
  const allPlayers = [
    { userId: state.ownerId, username: state.ownerName, share: ownerShare },
    ...allies.map(p => ({
      userId: p.userId, username: p.username,
      share: allies.length > 0 ? 0.5 / allies.length : 0,
    })),
    ...sharedUsers,
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
    const yenRange  = cfg.yenMax   - cfg.yenMin;
    const starRange = cfg.starsMax - cfg.starsMin;
    const totalYen   = Math.floor(cfg.yenMin   + Math.random() * (yenRange  + 1));
    const totalStars = Math.floor(cfg.starsMin + Math.random() * (starRange + 1));
    for (const p of allPlayers) {
      const yShare = Math.floor(totalYen   * p.share);
      const sShare = Math.floor(totalStars * p.share);
      if (yShare > 0) inv.addYen(inventory, p.userId, yShare);
      if (sShare > 0) inv.addStars(inventory, p.userId, sShare);
    }
    const ownerY = Math.floor(totalYen   * 0.5);
    const allyY  = totalYen - ownerY;
    const ownerS = Math.floor(totalStars * 0.5);
    lines.push(
      `💰 **¥${totalYen.toLocaleString()} Yen** + ⭐ **${totalStars.toLocaleString()} Stars** split!` +
      ` **${state.ownerName}** ¥${ownerY.toLocaleString()} / ⭐${ownerS}` +
      (allies.length > 0 ? `, allies share the rest` : '')
    );
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
  } else if (cfg.noLimitBreakers) {
    // Normal tickets fall back to extra yen+stars instead of LBs
    const yenRange  = cfg.yenMax   - cfg.yenMin;
    const starRange = cfg.starsMax - cfg.starsMin;
    const totalYen   = Math.floor(cfg.yenMin   + Math.random() * (yenRange  + 1));
    const totalStars = Math.floor(cfg.starsMin + Math.random() * (starRange + 1));
    for (const p of allPlayers) {
      const yShare = Math.floor(totalYen   * p.share);
      const sShare = Math.floor(totalStars * p.share);
      if (yShare > 0) inv.addYen(inventory, p.userId, yShare);
      if (sShare > 0) inv.addStars(inventory, p.userId, sShare);
    }
    const ownerY = Math.floor(totalYen   * 0.5);
    const ownerS = Math.floor(totalStars * 0.5);
    lines.push(
      `💰 **¥${totalYen.toLocaleString()} Yen** + ⭐ **${totalStars.toLocaleString()} Stars** split!` +
      ` **${state.ownerName}** ¥${ownerY.toLocaleString()} / ⭐${ownerS}` +
      (allies.length > 0 ? `, allies share the rest` : '')
    );
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
// Yen/stars scale: 0.5× (normal) → 2× (mythical) → 5× (omega) → 10× (hellish)  base of 20 000–40 000 yen / 50–100 stars
// Limit breakers: normal tickets cannot drop them; all other tiers can.
const RAID_REWARD_CONFIG = {
  raid_ticket: {
    cardChance: 0.10,
    yenMin: 10000,  yenMax: 20000,    // 0.5× base
    starsMin: 25,   starsMax: 50,     // 0.5× base
    cardPool: ['R','E','L'],
    noLimitBreakers: true,            // normal tickets never drop LBs
    lbMin: 0, lbMax: 0,
    cardCount: [1,3],
  },
  mythical_raid_ticket: {
    cardChance: 0.15,
    yenMin: 40000,  yenMax: 80000,    // 2× base
    starsMin: 100,  starsMax: 200,    // 2× base
    cardPool: ['E','L','MY'],
    lbMin: 1, lbMax: 3,
    cardCount: [1,3],
  },
  omega_raid_ticket: {
    cardChance: 0.20,
    yenMin: 100000, yenMax: 200000,   // 5× base
    starsMin: 250,  starsMax: 500,    // 5× base
    cardPool: ['L','MY','UR'],
    lbMin: 2, lbMax: 4,
    cardCount: [1,4],
  },
  hellish_raid_ticket: {
    cardChance: 0.30,
    yenMin: 200000, yenMax: 400000,   // 10× base
    starsMin: 500,  starsMax: 1000,   // 10× base
    cardPool: ['L','MY','UR'],
    lbMin: 3, lbMax: 5,
    cardCount: [1,5],
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

  // Yen + Stars
  const yenRange   = cfg.yenMax   - cfg.yenMin;
  const starRange  = cfg.starsMax - cfg.starsMin;
  if (roll < cfg.cardChance + 0.40) {
    const yen   = Math.floor(cfg.yenMin   + Math.random() * (yenRange  + 1));
    const stars = Math.floor(cfg.starsMin + Math.random() * (starRange + 1));
    inv.addYen(inventory, userId, yen);
    inv.addStars(inventory, userId, stars);
    return `💰 **¥${yen.toLocaleString()} Yen** + ⭐ **${stars.toLocaleString()} Stars** dropped!`;
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

  // Limit Breakers — normal raid tickets cannot drop them; fall back to bonus yen+stars instead
  if (cfg.noLimitBreakers) {
    const yen   = Math.floor(cfg.yenMin   + Math.random() * (yenRange  + 1));
    const stars = Math.floor(cfg.starsMin + Math.random() * (starRange + 1));
    inv.addYen(inventory, userId, yen);
    inv.addStars(inventory, userId, stars);
    return `💰 **¥${yen.toLocaleString()} Yen** + ⭐ **${stars.toLocaleString()} Stars** dropped!`;
  }
  const lbCount = Math.floor(cfg.lbMin + Math.random() * (cfg.lbMax - cfg.lbMin + 1));
  inv.addLimitBreakers(inventory, userId, lbCount);
  let raidScrollBonus = '';
  if (hasSupportCard(inventory, userId, 'support_ur') && Math.random() < 0.20) {
    inv.addItem(inventory, userId, 'level_scroll');
    raidScrollBonus = '\n📜 **Level Scroll** also dropped!';
  }
  return `💎 **${lbCount} Limit Breaker${lbCount === 1 ? '' : 's'}** dropped!${raidScrollBonus}`;
}

// ── Team / Fight helpers ──────────────────────────────────

function slotPower(slot) {
  const card = lookupCard(slot.cardId);
  if (!card) return 0;
  const level     = slot.level ?? 1;
  const stats     = getCardStats(card, level);
  const platings  = inv.getSlotPlatings(slot)
    .map(id => config.PLATING_TIERS.find(t => t.id === id))
    .filter(Boolean);
  const platMult  = platings.reduce((acc, p) => acc + (p.statMult - 1), 1);
  return (stats.hp + stats.dmg) * platMult;
}

function resolveTeamSlots(team, inventory, userId) {
  return team.map(slot => {
    const card     = lookupCard(slot.cardId);
    const invCard  = inv.getCards(inventory, userId).find(c => c.id === slot.cardId);
    const level    = invCard?.level ?? 1;

    // Load equipped weapon data for this card
    const equippedWeaponId = inv.getEquippedWeapon(inventory, userId, slot.cardId);
    let equippedWeapon = null;
    if (equippedWeaponId) {
      const wCard    = lookupCard(equippedWeaponId);
      const wInvCard = inv.getCards(inventory, userId).find(c => c.id === equippedWeaponId);
      const wData    = inv.getWeaponData(inventory, userId, equippedWeaponId);
      if (wCard && wInvCard) {
        equippedWeapon = {
          weaponId:      equippedWeaponId,
          weaponName:    wCard.name,
          weaponLevel:   wInvCard.level ?? 1,
          evolutionTier: wData.evolutionTier ?? 1,
        };
      }
    }

    return { ...slot, card, level, equippedWeapon };
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
  'madness': 'MD', 'md': 'MD',
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
    desc:   live.desc ?? live.description ?? '',
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
  if (lower === 'weapon' || lower === 'weapons') return cards.filter(c => c.weaponCard === true);
  return cards.filter(c =>
    c.name.toLowerCase().includes(lower) ||
    c.series.toLowerCase().includes(lower)
  );
}

function cardEmbed(card, title, footer, level = 1, personalCap = null) {
  const cap    = personalCap ?? inv.MAX_CARD_LEVEL;
  const meta   = rarityMeta(card.rarity);
  const lvl    = Math.max(1, level ?? 1);
  const isMax  = lvl >= cap;
  const levelLabel = isMax ? `✨ **MAX** (${lvl}/${cap})` : `Lv. ${lvl} / ${cap}`;
  const embed  = new EmbedBuilder()
    .setColor(meta.color)
    .setTitle(title ?? `${meta.emoji} ${card.name}`)
    .addFields(
      { name: 'Series', value: card.series,                    inline: true },
      { name: 'Rarity', value: `${meta.emoji} ${meta.label}`, inline: true },
      { name: 'Stars',  value: meta.stars || '—',              inline: true },
    );

  if (card.supportCard) {
    embed.addFields({ name: '✨ Passive Effect', value: card.desc ?? 'Passive support card.', inline: false });
  } else if (card.weaponCard) {
    const wStats = config.WEAPON_STATS[card.rarity];
    const sigCard = card.weaponOf ? (lookupCard(card.weaponOf)?.name ?? card.weaponOf) : null;
    if (wStats) {
      embed.addFields(
        { name: '⚡ Power',            value: `${wStats.power.toLocaleString()}`,              inline: true },
        { name: '❤️ Health Boosted',   value: `${wStats.hp.toLocaleString()}`,                 inline: true },
        { name: '💨 Speed Boosted',    value: `${wStats.speed.toLocaleString()}`,              inline: true },
        { name: '⚔️ Attack Boosted',   value: `${wStats.atkMin}–${wStats.atkMax}`,             inline: true },
        { name: '🃏 Signature Cards',  value: sigCard ?? '—',                                  inline: true },
        { name: '🏷️ Type',            value: 'Weapon',                                        inline: true },
      );
    } else {
      embed.addFields({ name: '⚔️ Weapon Card', value: card.desc ?? 'Equip to a card to boost its stats in battle.', inline: false });
    }
  } else {
    const stats = getCardStats(card, lvl);
    embed.addFields(
      { name: '📊 Level', value: levelLabel, inline: true },
      { name: '❤️ Health', value: `${stats.hp.toLocaleString()}`, inline: true },
      { name: card.technique ? '🔵 Technique' : '⚔️ Damage', value: `${stats.dmg.toLocaleString()}`, inline: true },
      { name: '💨 Speed', value: `${stats.speed.toLocaleString()}`, inline: true },
    );
  }

  const img = imgCache.getImage(card.id) ?? card.image ?? null;
  if (img)    embed.setThumbnail(img);
  if (footer) embed.setFooter({ text: footer });
  return embed;
}

// ── Pull embeds ───────────────────────────────────────────

function singlePullEmbed(card, isDupe, plating, chargeInfo, authorUsername, droppedTickets = []) {
  const meta  = rarityMeta(card.rarity);
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
  if (card.supportCard) descLines.push(`✨ *Passive support card — check \`ZP cardinfo ${card.id}\` for its effect.*`);
  if (card.weaponCard)  descLines.push(`⚔️ *Weapon card — equip it to a card with \`ZP equip <card> ${card.id}\`.*`);

  const embed = new EmbedBuilder()
    .setColor(plating?.color ?? (isDupe ? 0x888888 : meta.color))
    .setTitle(`${titlePrefix} ${card.name}${titleSuffix}`)
    .setDescription(descLines.join('\n'))
    .setFooter({ text: `Pulled by ${authorUsername} • ${chargeInfo}` });

  if (card.weaponCard) {
    const wStats = config.WEAPON_STATS[card.rarity];
    const sigCard = card.weaponOf ? (lookupCard(card.weaponOf)?.name ?? card.weaponOf) : null;
    if (wStats) {
      embed.addFields(
        { name: '⚡ Power',           value: `${wStats.power.toLocaleString()}`,  inline: true },
        { name: '❤️ Health Boosted',  value: `${wStats.hp.toLocaleString()}`,     inline: true },
        { name: '💨 Speed Boosted',   value: `${wStats.speed.toLocaleString()}`,  inline: true },
        { name: '⚔️ Attack Boosted',  value: `${wStats.atkMin}–${wStats.atkMax}`, inline: true },
        { name: '🃏 Signature Cards', value: sigCard ?? '—',                      inline: true },
        { name: '🏷️ Type',           value: 'Weapon',                            inline: true },
      );
    }
  } else if (!card.supportCard) {
    const stats = getCardStats(card, 1);
    embed.addFields(
      { name: '❤️ Health', value: `${stats.hp.toLocaleString()}`,  inline: true },
      { name: card.technique ? '🔵 Technique' : '⚔️ Damage', value: `${stats.dmg.toLocaleString()}`, inline: true },
      { name: '💨 Speed', value: `${stats.speed.toLocaleString()}`, inline: true },
    );
  }

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

const RARITY_ORDER = ['R', 'E', 'L', 'MY', 'UR', 'LT', 'MD'];

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
      { name: '❤️ Health',   value: `${stats.hp.toLocaleString()}`,  inline: true },
      { name: card.technique ? '🔵 Technique' : '⚔️ Damage', value: `${stats.dmg.toLocaleString()}`, inline: true },
      { name: '💨 Speed',   value: `${stats.speed.toLocaleString()}`, inline: true },
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

// ── Image review (admin) ──────────────────────────────────
function getImageReviewCards(filter) {
  const allCards = getSortedAllCards();
  if (!filter || filter === '_') return allCards;
  if (filter === 'missing') {
    const ec = emojiCache.load();
    return allCards.filter(c => !ec[c.id]);
  }
  const f = filter.toLowerCase();
  return allCards.filter(c =>
    c.name.toLowerCase().includes(f) ||
    c.series.toLowerCase().includes(f) ||
    c.id.toLowerCase().includes(f)
  );
}

function buildImageReviewEmbed(authorId, filteredCards, index, filter, expiry) {
  const card     = filteredCards[index];
  const meta     = rarityMeta(card.rarity);
  const emojiStr = emojiCache.getEmoji(card.id);
  const imageUrl = imgCache.getImage(card.id) ?? card.image ?? null;
  const ec       = emojiCache.load();
  const hasEmoji = !!ec[card.id];
  const filterLabel = (!filter || filter === '_') ? 'all cards' : `filter: "${filter}"`;

  const embed = new EmbedBuilder()
    .setColor(meta.color)
    .setTitle(`${emojiStr ?? meta.emoji} ${card.name}`)
    .setDescription(`🔍 **Admin Image Review** — ${filterLabel}`)
    .addFields(
      { name: 'Series',  value: card.series,                    inline: true },
      { name: 'Rarity',  value: `${meta.emoji} ${meta.label}`, inline: true },
      { name: 'Card ID', value: `\`${card.id}\``,              inline: true },
      { name: 'Emoji',   value: hasEmoji ? `${emojiStr} ✅ Cached` : '❌ Not cached', inline: true },
      { name: 'Image',   value: imageUrl ? `✅ [View](${imageUrl})` : '❌ None',      inline: true },
    )
    .setFooter({ text: `Card ${index + 1} of ${filteredCards.length}` });

  if (imageUrl) embed.setImage(imageUrl);

  const base = `imgrev|${authorId}|${expiry}|${index}|${filter || '_'}`;

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${base}|next`)
      .setLabel('✅ Looks Good')
      .setStyle(ButtonStyle.Success)
      .setDisabled(index >= filteredCards.length - 1),
    new ButtonBuilder()
      .setCustomId(`${base}|find`)
      .setLabel('🔄 Find Another')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`${base}|typeurl`)
      .setLabel('✏️ Enter URL')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${base}|skip`)
      .setLabel('⏭️ Skip')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(index >= filteredCards.length - 1),
    new ButtonBuilder()
      .setCustomId(`${base}|done`)
      .setLabel('❌ Done')
      .setStyle(ButtonStyle.Danger),
  );

  const components = [row1];

  if (!hasEmoji && imageUrl) {
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${base}|upload`)
        .setLabel('📤 Upload Emoji')
        .setStyle(ButtonStyle.Secondary),
    );
    components.push(row2);
  }

  return { embed, components };
}

function buildCollectionPage(authorId, targetUser, cards, page, filter, inventory, expiry) {
  const enriched = cards.map(enrichCard).filter(c => !lookupCard(c.id)?.weaponCard);
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
      { name: '📊 Level',    value: levelLabel,                       inline: true },
      { name: '❤️ Health',   value: `${stats.hp.toLocaleString()}`,  inline: true },
      { name: card.technique ? '🔵 Technique' : '⚔️ Damage', value: `${stats.dmg.toLocaleString()}`, inline: true },
      { name: '💨 Speed',    value: `${stats.speed.toLocaleString()}`, inline: true },
      { name: '🪪 Card ID',  value: `\`${card.id}\``,                inline: true },
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

// ── Weapon collection page builder ───────────────────────

const WCOL_TIMEOUT_MS = 120_000;

function buildWeaponCollectionPage(authorId, targetUser, cards, page, filter, inventory, expiry) {
  const enriched = cards.map(enrichCard).filter(c => lookupCard(c.id)?.weaponCard);
  const filtered = filter
    ? enriched.filter(c => {
        const hay = `${c.id} ${c.name} ${c.series}`.toLowerCase();
        return filter.toLowerCase().split(/\s+/).every(w => hay.includes(w));
      })
    : enriched;

  filtered.sort((a, b) => {
    const ra = RARITY_ORDER.indexOf(a.rarity);
    const rb = RARITY_ORDER.indexOf(b.rarity);
    if (ra !== rb) return rb - ra;
    return a.name.localeCompare(b.name);
  });

  if (filtered.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(0x808080)
      .setTitle(`⚔️ ${targetUser.username}'s Weapons`)
      .setDescription(filter
        ? `No weapons matching **"${filter}"**.`
        : 'No weapons in your collection yet. Weapon cards drop from pulls!');
    return { embed, components: [] };
  }

  page = Math.max(0, Math.min(page, filtered.length - 1));
  const card     = filtered[page];
  const wDef     = lookupCard(card.id);
  const meta     = rarityMeta(card.rarity);
  const wData    = inv.getWeaponData(inventory, targetUser.id, card.id);
  const wStats   = config.WEAPON_STATS[card.rarity];
  const tier     = wData.evolutionTier ?? 1;
  const prestige = wData.prestige ?? 0;
  const tierData = config.WEAPON_EVOLUTION_TIERS[tier - 1];
  const nextTier = config.WEAPON_EVOLUTION_TIERS[tier];
  const level    = card.level ?? 1;
  const tierMult = 1 + (tierData.statMult * (level / 100));
  const shards   = inv.getCharacterShards(inventory, targetUser.id)[card.id] ?? 0;
  const sigName  = wDef?.weaponOf ? (lookupCard(wDef.weaponOf)?.name ?? wDef.weaponOf) : null;
  const filterTag = filter ? ` • Filter: "${filter}"` : '';

  const atkBonus = wStats ? Math.round(getWeaponAtkBonus(card.id) * tierMult) : 0;
  const effectiveHp    = wStats ? Math.round(wStats.hp    * tierMult) : 0;
  const effectiveSpeed = wStats ? Math.round(wStats.speed * tierMult) : 0;

  const progressLine = nextTier
    ? `**Progress → Tier ${tier + 1}:** ${prestige}/${config.WEAPON_EVOLVE_PRESTIGE} prestige • ${shards}/${config.WEAPON_EVOLVE_SHARDS} shards`
    : '⚡ **MAX EVOLUTION — Legendary!**';

  const embed = new EmbedBuilder()
    .setColor(meta.color)
    .setTitle(`⚔️ ${meta.emoji} ${card.name}`)
    .setDescription(`⚔️ **${targetUser.username}'s Weapon Collection**\n${wDef?.desc ?? ''}`)
    .addFields(
      { name: 'Series',      value: card.series,                             inline: true },
      { name: 'Rarity',      value: `${meta.emoji} ${meta.label}`,           inline: true },
      { name: '🏷️ Type',    value: sigName ? `Signature: ${sigName}` : 'Universal', inline: true },
      { name: `${tierData.emoji} Tier`,  value: `**${tier} — ${tierData.name}**`,  inline: true },
      { name: '📊 Level',    value: `${level} / 100`,                        inline: true },
      { name: '✨ Prestige', value: `${prestige.toLocaleString()}`,          inline: true },
    );

  if (wStats) {
    embed.addFields(
      { name: '❤️ HP Bonus',     value: `+${effectiveHp.toLocaleString()}`, inline: true },
      { name: '⚔️ ATK Bonus',    value: `+${atkBonus.toLocaleString()}`,    inline: true },
      { name: '💨 Speed Bonus',  value: `+${effectiveSpeed.toLocaleString()}`, inline: true },
    );
  }

  embed.addFields({ name: '📈 Evolution Progress', value: progressLine, inline: false });

  const colImg = imgCache.getImage(card.id) ?? card.image ?? null;
  if (colImg) embed.setThumbnail(colImg);
  embed.setFooter({ text: `Weapon ${page + 1} of ${filtered.length}${filterTag} • Earn prestige by winning fights` });

  const base = `wcol|${authorId}|${targetUser.id}|${expiry}|%page%|${filter}`;
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(base.replace('%page%', page - 1))
      .setLabel('◀ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`wcol|${authorId}|${targetUser.id}|${expiry}|close|${filter}`)
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

  const TOTAL = showAdmin ? 10 : 9;

  const pages = [
    // Page 0: Pulling
    new EmbedBuilder()
      .setColor(0x00FFD1)
      .setTitle(`📖 Help — 🎴 Pulling (1/${TOTAL})`)
      .setDescription('Pull random character cards from anime, manga, and games!')
      .addFields(
        { name: '`ZP pull` / `ZP p` / `ZP pu`',          value: `Pull a random card. You have up to **${config.MAX_PULL_CHARGES}** charges; +1 regenerates every **${config.PULL_COOLDOWN_SECONDS}s** (25s with 💙 Swift Pull Token support card).`, inline: false },
        { name: '`ZP allpull` / `ZP ap`',                 value: 'Spend **all** your current pull charges at once.', inline: false },
        { name: '`ZP allpull reset` / `ZP ap reset`',     value: 'Spend all charges then instantly refill back to max. Costs **1 Candy Token**.', inline: false },
        { name: '`ZP reset` / `ZP rs`',                   value: 'Use a Candy Token to instantly refill your pulls to max.', inline: false },
        { name: '`ZP wish <cardId>` / `ZP wi <cardId>`',  value: `Set a card as your wish. After **${inv.WISH_THRESHOLD} pulls**, you are guaranteed to receive that card! With 💛 Eternal Wish Crystal, you can wish for UR cards and Limited cards you already own.`, inline: false },
        { name: '`ZP daily`',                              value: 'Claim your daily reward: **¥100,000 Yen**, **1,000 Stars**, **5 Candy Tokens**, and **Level Scrolls** based on your streak (1 per streak day, caps at 10).', inline: false },
      )
      .setFooter({ text: `Page 1 of ${TOTAL} • ZP help` }),

    // Page 1: Collection & Cards
    new EmbedBuilder()
      .setColor(0x4A90D9)
      .setTitle(`📖 Help — 🗂️ Collection & Cards (2/${TOTAL})`)
      .setDescription('Browse your collection, inspect cards, and level them up.')
      .addFields(
        { name: '`ZP collection` / `ZP col`',                                          value: 'Browse your card collection with Prev/Next buttons.', inline: false },
        { name: '`ZP col [rarity or keyword]`',                                         value: 'Filter by rarity code (e.g. `LT`, `MY`) or a name/series keyword.', inline: false },
        { name: '`ZP col @user [filter]`',                                              value: "Browse another player's collection.", inline: false },
        { name: '`ZP all` / `ZP all [filter]`',                                        value: 'Browse every card in the game, sorted by rarity.', inline: false },
        { name: '`ZP card <id>` / `ZP c <id>` / `ZP ca <id>`',                        value: 'Inspect a specific card — shows level, stats, shards.', inline: false },
        { name: '`ZP mycard <id>` / `ZP mc <id>` / `ZP mci <id>`',                    value: 'Inspect your own card with prestige points.', inline: false },
        { name: '`ZP cardinfo <id>` / `ZP ci <id>`',                                   value: 'View base game info for any card.', inline: false },
        { name: '`ZP absorb shard:<id>:<count>` / `ZP ab ...`',                        value: 'Spend character shards to level up a card. **1 shard = 1 level**. Each level gives **+2% stats**.', inline: false },
        { name: '`ZP increaselevelcap <id> <count>` / `ZP ilc <id> <count>`',          value: 'Break a card\'s level cap beyond 100. Each level costs **1 Limit Breaker** + **100 Prestige Points** on that card.', inline: false },
        { name: '`ZP kill <cardId> <shardId>:<count>` / `ZP ki ...`',                  value: 'Use a card to kill shards — earn **yen** and **prestige points** on the card used. 1 prestige point per shard.', inline: false },
        { name: '`ZP use level_scroll <cardId>`',                                       value: 'Use a 📜 Level Scroll to instantly raise a card\'s level by 1 (up to its current level cap). Scrolls drop from fights, raids, and daily rewards.', inline: false },
      )
      .setFooter({ text: `Page 2 of ${TOTAL} • ZP help` }),

    // Page 2: Economy & Profile
    new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle(`📖 Help — 💰 Economy & Profile (3/${TOTAL})`)
      .setDescription('Manage your currencies and player profile.')
      .addFields(
        { name: '`ZP wallet` / `ZP balance` / `ZP bal`',       value: 'Check your Yen, Stars, Candy Tokens, and Limit Breakers. Add `@user` to check someone else.', inline: false },
        { name: '`ZP shop` / `ZP sh`',                          value: 'Browse the shop — see all buyable items and their costs.', inline: false },
        { name: '`ZP buy candy stars <amount>`',                 value: 'Buy candy tokens with stars. **1,000 stars** per token.', inline: false },
        { name: '`ZP buy candy yen <amount>`',                   value: 'Buy candy tokens with yen. **¥10,000** per token.', inline: false },
        { name: '`ZP inventory` / `ZP inv`',                    value: 'View your platings.', inline: false },
        { name: '`ZP shards [rarity or name]` / `ZP sd`',       value: 'View your character shards. Filter by rarity or character name.', inline: false },
        { name: '`ZP items` / `ZP it`',                         value: 'View your special items (raid tickets, scrolls, etc).', inline: false },
        { name: '`ZP use <itemId>`',                             value: 'Use a special item to claim its Limited card.', inline: false },
        { name: '`ZP profile` / `ZP pro`',                      value: 'View your player profile — total cards, kills, pulls, wish progress, and more.', inline: false },
        { name: '`ZP profile @user`',                           value: "View another player's profile (if they haven't set it to private).", inline: false },
        { name: '`ZP vote` / `ZP vo`',                          value: 'Get the link to vote for the bot and earn extra pull charges!', inline: false },
        { name: '`ZP privacy` / `ZP pv`',                       value: 'Toggle your profile and collection privacy on/off.', inline: false },
        { name: '`ZP conquestsend <cardId>` / `ZP cs <cardId>`', value: 'Send a card on a conquest mission (2 hrs; 1 hr with ❤️ Time Warp Compass). With 💜 Conquest Expansion, send up to 2 cards at once.', inline: false },
        { name: '`ZP conquestrecall` / `ZP cr`',                value: 'Recall your card to earn **1 Limit Breaker** + **1–10 Candy Tokens**. Use `ZP cr 2` for the second slot.', inline: false },
      )
      .setFooter({ text: `Page 3 of ${TOTAL} • ZP help` }),

    // Page 3: Team Management & Battles
    new EmbedBuilder()
      .setColor(0xFF4757)
      .setTitle(`📖 Help — ⚔️ Team & Battles (4/${TOTAL})`)
      .setDescription(`Build a team of **${inv.TEAM_SIZE} cards** and battle!\n\n**Plating bonuses:**\n${platingList}`)
      .addFields(
        { name: '`ZP team` / `ZP tm`',                                                               value: 'View your battle team with power scores.', inline: false },
        { name: '`ZP team add <id>` / `ZP teamadd <id>` / `ZP add <id>`',                            value: `Add a card to your team (max ${inv.TEAM_SIZE}).`, inline: false },
        { name: '`ZP team remove <id>` / `ZP teamremove <id>` / `ZP rm <id>`',                       value: 'Remove a card from your team.', inline: false },
        { name: '`ZP swap <id1> <id2>` / `ZP sw ...`',                                               value: 'Swap the positions of two cards on your team.', inline: false },
        { name: '`ZP team equip <id> <plating>` / `ZP teamequip ...`',                               value: 'Equip a plating onto a team card. Valid: `bronze` `silver` `gold` `diamond`', inline: false },
        { name: '`ZP team unequip <id>` / `ZP teamunequip <id>`',                                    value: 'Remove a plating from a team card.', inline: false },
        { name: '`ZP fight @user` / `ZP fi @user`',                                                  value: `Challenge a player to a turn-based team battle! ${config.FIGHT_COOLDOWN_SECONDS}s cooldown. Rewards: ¥${config.FIGHT_YEN_MIN.toLocaleString()}–¥${config.FIGHT_YEN_MAX.toLocaleString()} Yen + ⭐ Stars.`, inline: false },
        { name: '`ZP botfight` / `ZP bf`',                                                           value: `Fight a randomly generated bot team. Rewards: ¥${config.BOT_FIGHT_YEN_MIN.toLocaleString()}–¥${config.BOT_FIGHT_YEN_MAX.toLocaleString()} Yen + ${config.BOT_FIGHT_STAR_MIN}–${config.BOT_FIGHT_STAR_MAX} Stars.`, inline: false },
        { name: '`ZP timeskip` / `ZP ts`',                                                           value: 'Spend **10,000 ⭐ Stars** to auto-simulate **100 botfights** instantly. Earn Yen and weapon prestige from all wins — no clicking required!', inline: false },
        { name: '`ZP duofight @user` / `ZP df @user`',                                               value: 'Fight alongside your duo partner — your combined teams take on the opponent!', inline: false },
      )
      .setFooter({ text: `Page 4 of ${TOTAL} • ZP help` }),

    // Page 4: Raids & Weapons
    new EmbedBuilder()
      .setColor(0xFF6B00)
      .setTitle(`📖 Help — 🏴 Raids & Weapons (5/${TOTAL})`)
      .setDescription('Fight powerful raid bosses and evolve your weapons!')
      .addFields(
        {
          name: '`ZP raid` / `ZP raid mythical` / `ZP raid omega` / `ZP raid hellish`',
          value: [
            'Spend a raid ticket to fight a random Boss. Supports **solo or collab** (up to 5 players).',
            '🎟️ **Raid** (0.15% drop) — Rare–Legendary boss → ¥10k–20k + ⭐25–50 Stars',
            '🌙 **Mythical** (0.075% drop) — Mythical boss → ¥40k–80k + ⭐100–200 Stars + 1–3 Limit Breakers',
            '⚡ **Omega** (0.05% drop) — Ultra Rare boss → ¥100k–200k + ⭐250–500 Stars + 2–4 Limit Breakers',
            '💀 **Hellish** (0.01% drop) — Limited boss → ¥200k–400k + ⭐500–1k Stars + 3–5 Limit Breakers',
          ].join('\n'),
          inline: false,
        },
        { name: '`ZP allowraidjoins` / `ZP arj`',       value: 'Enable others to join your active raid. Run after using a raid ticket.', inline: false },
        { name: '`ZP whitelist @user` / `ZP wh @user`', value: 'Whitelist a player (max 4) to join your collab raid. They click **Join Raid** on the raid card.', inline: false },
        { name: '`ZP shareraid @user` / `ZP sr @user`', value: 'Share **20% of your raid rewards** with another player. Clan members are auto-whitelisted when you start a raid.', inline: false },
        { name: '\u200b', value: '**⚔️ Weapon System**', inline: false },
        { name: '`ZP equip <card> <weaponId or plating>`',                  value: 'Unified equip command — equip a weapon card **or** a plating to a card. Handles both automatically.', inline: false },
        { name: '`ZP equipweapon <cardId> <weaponId>` / `ZP ew`',          value: 'Equip a weapon card to a card slot. Boosts that card\'s HP, DMG, and Speed in battle.', inline: false },
        { name: '`ZP unequipweapon <cardId>` / `ZP uew`',                  value: 'Remove the equipped weapon from a card.', inline: false },
        { name: '`ZP evolveweapon <weaponId>` / `ZP evw`',                 value: `Evolve a weapon to the next tier (max Tier ${config.WEAPON_EVOLUTION_TIERS.length}). Costs **${config.WEAPON_EVOLVE_SHARDS} weapon shards** + **${config.WEAPON_EVOLVE_PRESTIGE} weapon prestige** per tier.\nTiers: Basic → Refined → Enhanced → Masterwork → Legendary`, inline: false },
        { name: '`ZP weaponinfo <weaponId>` / `ZP winfo`',                 value: 'View your weapon\'s evolution tier, prestige, and shard progress.', inline: false },
      )
      .setFooter({ text: `Page 5 of ${TOTAL} • ZP help` }),

    // Page 5: Trading
    new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle(`📖 Help — 🤝 Trading (6/${TOTAL})`)
      .setDescription('Trade shards, platings, Yen, Stars, items, and Candy Tokens with other players.\n> 🔒 Candy Tokens earned from codes are trade-locked and cannot be offered in trades.')
      .addFields(
        {
          name: '`ZP trade @user <offer> [for <ask>]` / `ZP tr ...`',
          value: [
            'Send a trade offer or instant gift.',
            '**Item formats:** `shard:<cardId>:<amount>` • `plating:<tier>:<amount>` • `yen:<amount>` • `stars:<amount>` • `candy:<amount>` • `item:<itemId>:<amount>`',
            '**Examples:**',
            '`ZP trade @Alice shard:naruto_r:5` — free gift',
            '`ZP trade @Alice yen:500 for stars:100` — currency swap',
            '`ZP trade @Alice candy:2 for yen:5000` — candy for yen',
          ].join('\n'),
          inline: false,
        },
        { name: '`ZP accept <tradeId>` / `ZP a <id>` / `ZP ac <id>`', value: 'Accept a pending trade offer.', inline: false },
        { name: '`ZP decline <tradeId>` / `ZP dec <id>`',              value: 'Decline or cancel a trade.', inline: false },
        { name: '`ZP trades` / `ZP trs`',                               value: 'List all pending trade offers addressed to you.', inline: false },
      )
      .setFooter({ text: `Page 6 of ${TOTAL} • Trades expire after 5 minutes` }),

    // Page 6: Clans & Duos
    new EmbedBuilder()
      .setColor(0xFF6B35)
      .setTitle(`📖 Help — 🏛️ Clans & Duos (7/${TOTAL})`)
      .setDescription('Form clans with other players and create duo partnerships for team battles!')
      .addFields(
        { name: '**Clan Commands**', value: '\u200b', inline: false },
        { name: '`ZP clancreate <name>` / `ZP cc <name>`',      value: 'Create a new clan. You become the owner.', inline: false },
        { name: '`ZP clan`',                                     value: 'View your clan info, members, and fund.', inline: false },
        { name: '`ZP clanadd @user` / `ZP cla @user`',          value: '(Owner) Invite a player to your clan.', inline: false },
        { name: '`ZP clanremove @user` / `ZP cr @user`',        value: '(Owner) Remove a player from your clan.', inline: false },
        { name: '`ZP clanleave` / `ZP cl`',                     value: 'Leave your current clan.', inline: false },
        { name: '`ZP clandelete` / `ZP cd`',                    value: '(Owner) Permanently delete your clan.', inline: false },
        { name: '`ZP clanfundadd <yen>` / `ZP cfa <yen>`',      value: 'Donate yen to the clan fund.', inline: false },
        { name: '`ZP clanfundtake <yen>` / `ZP cft <yen>`',     value: '(Owner) Withdraw yen from the clan fund.', inline: false },
        { name: '**Duo Commands**', value: '\u200b', inline: false },
        { name: '`ZP duocreate @user` / `ZP dc @user`',         value: 'Send a duo partnership request to a player.', inline: false },
        { name: '`ZP duo`',                                      value: 'View your duo partnership.', inline: false },
        { name: '`ZP duoremove` / `ZP dr`',                     value: 'Disband your current duo partnership.', inline: false },
      )
      .setFooter({ text: `Page 7 of ${TOTAL} • ZP help` }),

    // Page 7: Reference
    new EmbedBuilder()
      .setColor(0x00FFD1)
      .setTitle(`📖 Help — 📚 Reference (8/${TOTAL})`)
      .setDescription('Quick reference for rarities, platings, currencies, and card stats.')
      .addFields(
        { name: '✨ Rarities', value: rarityList, inline: false },
        {
          name: '🛡️ Platings',
          value: config.PLATING_TIERS.map(t => `${t.emoji} **${t.label}** — ×${t.statMult} stats (+${Math.round((t.statMult - 1) * 100)}%) • 0.1% pull drop`).join('\n'),
          inline: false,
        },
        {
          name: '💵 Currencies & Resources',
          value: [
            '**Yen** — earned from fights & kills. Traded between players.',
            '**Stars** — earned from fights. Traded between players. Used for Time Skip.',
            '**Candy Tokens** — bought in shop or given by admins. Resets pull charges.',
            '**Limit Breakers** — earned from `ZP conquestsend`. Used to break the level cap past 100.',
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
          name: '📊 Card Stats',
          value: [
            '**❤️ Health** — base HP, scales with level',
            '**⚔️ Damage / 🔵 Technique** — base attack power',
            '**💨 Speed** — determines who attacks first (0.45–0.55× base HP)',
            '',
            '**Power Formula:** Power = (HP + DMG) × level bonus × plating multiplier',
            '**Level bonus:** ×(1 + 0.02 × (level − 1))',
          ].join('\n'),
          inline: false,
        },
      )
      .setFooter({ text: `Page 8 of ${TOTAL} • ZP help` }),

    // Page 8: Support Cards & Level Scrolls
    new EmbedBuilder()
      .setColor(0xAA00FF)
      .setTitle(`📖 Help — 🌟 Support Cards & Scrolls (9/${TOTAL})`)
      .setDescription('Support cards grant **passive effects** while they are in your collection. Simply owning them unlocks their bonus — they cannot be traded or used in battle.')
      .addFields(
        {
          name: '💙 Swift Pull Token (R) — `support_r`',
          value: 'Pull charge regeneration is reduced from 30s → **25s**.',
          inline: false,
        },
        {
          name: '💜 Conquest Expansion (E) — `support_e`',
          value: 'Unlocks a **second conquest slot** — send two cards on missions simultaneously.',
          inline: false,
        },
        {
          name: '💛 Eternal Wish Crystal (L) — `support_l`',
          value: 'Allows you to **wish for UR cards** in addition to R/E/L/MY. Also allows wishing for **Limited cards you already own**.',
          inline: false,
        },
        {
          name: '❤️ Time Warp Compass (MY) — `support_my`',
          value: 'Conquest mission duration is halved: **1 hour** instead of 2.',
          inline: false,
        },
        {
          name: '🟡 Scroll Awakener (UR) — `support_ur`',
          value: '📜 **Level Scrolls** now drop from fights, raids, and daily rewards.',
          inline: false,
        },
        {
          name: '📜 Level Scroll — `ZP use level_scroll <cardId>`',
          value: 'Instantly raises a card\'s level by 1 (up to its current level cap). Earned via fights/raids/daily when you own the Scroll Awakener. Daily scrolls scale with your streak (max 10 at day 10+).',
          inline: false,
        },
      )
      .setFooter({ text: `Page 9 of ${TOTAL} • ZP help` }),
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
              '`ZP imgreview [filter]` – Review card images & emojis interactively (`missing` = uncached only, or filter by name/series).',
              '`ZP giveitem @user <itemId>` – Give a limited item to a player',
              '`ZP giveraidticket @user <tier> [amount]` – Give raid tickets (tiers: `normal` `mythical` `omega` `hellish`)',
              '`ZP giveshards @user <cardId> <amount>` – Give character shards to a player',
              '`ZP givecard @user <cardId>` – Give a card directly to a player (gives shard if they own it)',
              '`ZP givelimitbreaker [@user] <amount>` – Give Limit Breakers to a player',
              '`ZP givelevelscrolls [@user] <amount>` – Give Level Scrolls 📜 to a player',
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
  emojiCache.logCacheStatus(CARDS);
  // First discover any emojis already on Discord (populates cache without re-uploading).
  // Then fetch missing images, then upload anything still not cached.
  emojiCache.discoverFromDiscord(client, CARDS)
    .catch(err => console.error('Emoji discover error:', err))
    .finally(() => {
      imgCache.refreshMissing()
        .catch(err => console.error('Image cache refresh error:', err))
        .finally(() => {
          emojiCache.syncEmojis(client, CARDS, imgCache).catch(err => console.error('Emoji sync error:', err));
        });
    });

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

// ── Per-user button cooldown (prevents button-spam bugs) ──────
// Key: `${userId}:${buttonType}` → timestamp of last click
const buttonCooldowns = new Map();
const BUTTON_COOLDOWN_MS = 500; // 0.5 seconds per button type per user

function isButtonOnCooldown(userId, buttonType) {
  const key = `${userId}:${buttonType}`;
  const last = buttonCooldowns.get(key) ?? 0;
  if (Date.now() - last < BUTTON_COOLDOWN_MS) return true;
  buttonCooldowns.set(key, Date.now());
  // Auto-clean after cooldown expires to avoid memory leak
  setTimeout(() => buttonCooldowns.delete(key), BUTTON_COOLDOWN_MS + 100);
  return false;
}

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

  // ── Modal submit handler ───────────────────────────────────
  if (interaction.isModalSubmit()) {
    const mParts  = interaction.customId.split('|');

    if (mParts[0] === 'imgrev_url') {
      const [, authorId, expiryStr, indexStr, ...filterRest] = mParts;
      const filter  = filterRest.join('|');
      const expiry  = parseInt(expiryStr, 10);
      const index   = parseInt(indexStr, 10);
      const url     = interaction.fields.getTextInputValue('url').trim();

      if (interaction.user.id !== authorId) {
        return interaction.reply({ content: 'This review is not for you.', ephemeral: true });
      }

      const filteredCards = getImageReviewCards(filter === '_' ? '' : filter);
      const card = filteredCards[index];

      if (!url.startsWith('http')) {
        return interaction.reply({ content: '❌ That doesn\'t look like a valid URL.', ephemeral: true });
      }

      imgCache.setImage(card.id, url);
      const newExpiry = Date.now() + 30 * 60_000;
      const { embed, components } = buildImageReviewEmbed(authorId, filteredCards, index, filter, newExpiry);
      return interaction.update({ embeds: [embed], components });
    }

    return;
  }

  if (!interaction.isButton()) return;

  // ── Per-user button cooldown check ────────────────────────────
  const parts = interaction.customId.split('|');
  const buttonType = parts[0];
  if (isButtonOnCooldown(interaction.user.id, buttonType)) {
    return interaction.reply({
      content: '⏳ Please wait a moment before clicking again.',
      ephemeral: true,
    });
  }

  // ── Confirmation button handler ───────────────────────────
  if (parts[0] === 'confirm_action' || parts[0] === 'cancel_confirm') {
    const confirmId = parts[1];
    const pending   = pendingConfirmations.get(confirmId);

    if (!pending) {
      return interaction.update({ content: '⏱️ This confirmation has expired.', components: [], embeds: [] });
    }
    if (interaction.user.id !== pending.userId) {
      return interaction.reply({ content: 'This confirmation is not for you.', ephemeral: true });
    }

    if (parts[0] === 'cancel_confirm') {
      pendingConfirmations.delete(confirmId);
      return interaction.update({ content: '❌ Action cancelled.', components: [], embeds: [] });
    }

    // Confirmed — execute the action
    pendingConfirmations.delete(confirmId);

    if (pending.type === 'kill_rarity') {
      const { killerCard, targets, totalShards, totalYen } = pending;
      const inventory = await inv.loadInventory();

      for (const { def, count } of targets) {
        inv.removeCharacterShards(inventory, pending.userId, def.id, count);
      }
      inv.addYen(inventory, pending.userId, totalYen);
      inv.addPrestigePoints(inventory, pending.userId, killerCard.id, totalShards);
      inv.incrementTotalKills(inventory, pending.userId, totalShards);
      await inv.saveInventory(inventory);

      const freshInv = await inv.loadInventory();
      const newPP    = inv.getPrestigePoints(freshInv, pending.userId)[killerCard.id] ?? 0;
      const killerMeta = rarityMeta(killerCard.rarity);

      const embed = new EmbedBuilder()
        .setColor(killerMeta.color)
        .setTitle(`⚔️ ${killerCard.name} killed ${totalShards} shards!`)
        .setDescription(`Destroyed **${totalShards} shards** across **${targets.length} cards**.`)
        .addFields(
          { name: '💰 Yen Earned',       value: `¥${totalYen.toLocaleString()}`,        inline: true },
          { name: '✨ Prestige Points',  value: `+${totalShards} → **${newPP}** total`, inline: true },
        )
        .setFooter({ text: 'Prestige points are tracked per killer card!' });
      return interaction.update({ embeds: [embed], components: [] });
    }

    if (pending.type === 'absorb_all') {
      const { actions } = pending;
      const inventory = await inv.loadInventory();
      let totalAbsorbed = 0;

      for (const { def, levelsGained, currentLevel } of actions) {
        const actualLevel = inv.getCardLevel(inventory, pending.userId, def.id) ?? 1;
        const actualCap   = inv.getPersonalLevelCap(inventory, pending.userId, def.id);
        const actualGain  = Math.min(levelsGained, actualCap - actualLevel);
        if (actualGain < 1) continue;
        inv.removeCharacterShards(inventory, pending.userId, def.id, actualGain);
        inv.setCardLevel(inventory, pending.userId, def.id, actualLevel + actualGain);
        totalAbsorbed += actualGain;
      }
      await inv.saveInventory(inventory);

      const embed = new EmbedBuilder()
        .setColor(0x00FFD1)
        .setTitle(`📈 Absorbed ${totalAbsorbed} shards!`)
        .setDescription(`Successfully levelled up **${actions.length} card${actions.length === 1 ? '' : 's'}** using their shards.`)
        .setFooter({ text: 'Check ZP col to see your updated levels.' });
      return interaction.update({ embeds: [embed], components: [] });
    }

    return interaction.update({ content: 'Unknown action type.', components: [] });
  }

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

    const { dmg: dmgDealt, crit: isCrit } = calcDamage(attacker, target);
    target.hp       = Math.max(0, target.hp - dmgDealt);
    if (target.hp === 0) target.alive = false;

    // Track weapon kills: if attacker has a weapon equipped and just killed the target
    if (!target.alive && attacker.equippedWeaponId) {
      if (!state.weaponKills) state.weaponKills = {};
      state.weaponKills[attacker.equippedWeaponId] = (state.weaponKills[attacker.equippedWeaponId] ?? 0) + 1;
    }

    let log = `⚔️ **${attacker.name}** attacked **${target.name}** for **${dmgDealt.toLocaleString()}** damage!${isCrit ? ' 👁️ **GOLDEN PUPILS CRIT — 5×!**' : ''}`;
    if (!target.alive) log += ` **${target.name}** was defeated!`;

    if (state.defenderCards.every(bc => !bc.alive)) {
      activeBattles.delete(battleId);
      const inventory = await inv.loadInventory();

      if (state.isRaid) {
        const rewardText = generateRaidReward(state, inventory);
        await inv.saveInventory(inventory);
        log += `\n\n🏆 **${state.attackerName}** defeated the Raid Boss!\n\n${rewardText}`;
        // Log solo raid completion
        const raidLogEmbed = new EmbedBuilder()
          .setColor(0xFFD700)
          .setTitle('⚔️ Solo Raid Completed')
          .setDescription(
            `**Player:** <@${state.attackerId}> (${state.attackerName})\n` +
            `**Boss:** ${state.defenderName}\n` +
            `**Tier:** ${state.raidTicketTier ?? 'unknown'}\n\n` +
            `**Rewards:** ${rewardText}`
          )
          .setTimestamp();
        logToChannel(RAID_LOG_CHANNEL, raidLogEmbed);
        const embed = buildRaidEmbed(state, log);
        return interaction.update({ embeds: [embed], components: [] });
      }

      const yenMin   = state.isBotFight ? config.BOT_FIGHT_YEN_MIN   : config.FIGHT_YEN_MIN;
      const yenMax   = state.isBotFight ? config.BOT_FIGHT_YEN_MAX   : config.FIGHT_YEN_MAX;
      const starMin  = state.isBotFight ? config.BOT_FIGHT_STAR_MIN  : config.FIGHT_STAR_MIN;
      const starMax  = state.isBotFight ? config.BOT_FIGHT_STAR_MAX  : config.FIGHT_STAR_MAX;
      const yenEarned   = Math.floor(yenMin  + Math.random() * (yenMax  - yenMin  + 1));
      const starsEarned = Math.floor(starMin + Math.random() * (starMax - starMin + 1));
      inv.addYen(inventory, state.attackerId, yenEarned);
      inv.addStars(inventory, state.attackerId, starsEarned);
      let scrollDropText = '';
      if (hasSupportCard(inventory, state.attackerId, 'support_ur') && Math.random() < 0.08) {
        inv.addItem(inventory, state.attackerId, 'level_scroll');
        scrollDropText = '  +📜 Level Scroll';
      }
      // Apply weapon prestige earned during this fight
      if (state.weaponKills && Object.keys(state.weaponKills).length > 0) {
        for (const [weaponId, kills] of Object.entries(state.weaponKills)) {
          if (inv.hasCard(inventory, state.attackerId, weaponId)) {
            inv.addWeaponPrestige(inventory, state.attackerId, weaponId, kills);
          }
        }
      }
      await inv.saveInventory(inventory);
      const winLabel = state.isBotFight ? '🤖 Bot Team defeated!' : `🏆 **${state.attackerName}** wins!`;
      log += `\n\n${winLabel}\n+¥${yenEarned.toLocaleString()} Yen  +${starsEarned.toLocaleString()} Stars${scrollDropText}`;
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
      if (state.isBotFight) {
        log += `\n\n💀 The Bot Team wins! **${state.attackerName}** was defeated — better luck next time!`;
        const embed = buildBattleEmbed(state, log);
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

      // Ditto boss transform: copy strongest player card at Lv-100 stats × 10
      if (state.isDittoBoss && state.defenderCards[0]) {
        const allAttackers = state.attackerCards;
        if (allAttackers.length > 0) {
          const strongest = allAttackers.reduce((best, c) => {
            const liveCard = lookupCard(c.cardId);
            if (!liveCard) return best;
            const s100 = getCardStats(liveCard, 100);
            const score = s100.hp + s100.dmg;
            const bScore = (() => {
              const bl = lookupCard(best.cardId);
              if (!bl) return 0;
              const bs = getCardStats(bl, 100);
              return bs.hp + bs.dmg;
            })();
            return score > bScore ? c : best;
          }, allAttackers[0]);

          const srcCard = lookupCard(strongest.cardId);
          if (srcCard) {
            const s100   = getCardStats(srcCard, 100);
            const newHp  = Math.round(s100.hp  * 10);
            const newDmg = Math.round(s100.dmg * 10);
            const boss   = state.defenderCards[0];
            boss.name    = `Ditto (${srcCard.name})`;
            boss.hp      = newHp;
            boss.maxHp   = newHp;
            boss.dmg     = newDmg;
            boss.dmgMin  = Math.round(newDmg * 0.8);
            boss.dmgMax  = Math.round(newDmg * 1.2);
            boss.technique = srcCard.technique ?? false;
            state.defenderName = boss.name;
          }
        }
      }

      // Apply Ditto ally-copy: Ditto on the player team copies the strongest
      // teammate instead of the raid boss.
      const dittoAllyLog = [];
      for (const bc of state.attackerCards) {
        const liveCard = lookupCard(bc.cardId);
        if (!liveCard?.dittoCard) continue;
        const allies = state.attackerCards.filter(c => c !== bc);
        if (allies.length > 0) {
          const strongest = allies.reduce((best, c) => (c.hp + c.dmg) > (best.hp + best.dmg) ? c : best, allies[0]);
          const copyMult  = 0.80 + (bc.level - 1) * 0.001;
          bc.hp           = Math.round(strongest.hp  * copyMult);
          bc.maxHp        = bc.hp;
          bc.dmg          = Math.round(strongest.dmg * copyMult);
          bc.dmgMin       = Math.round(bc.dmg * 0.8);
          bc.dmgMax       = Math.round(bc.dmg * 1.2);
          bc.technique    = strongest.technique;
          bc.name         = `Ditto (${strongest.name})`;
          dittoAllyLog.push(`🟣 **Ditto** copied ally **${strongest.name}**'s stats!`);
        }
      }

      const dittoTransformNote = state.isDittoBoss
        ? `\n🟣 **Ditto transformed** into **${state.defenderCards[0]?.name ?? '???'}** (10× Lv-100 stats)!`
        : '';
      const dittoAllyNote = dittoAllyLog.length ? `\n${dittoAllyLog.join('\n')}` : '';
      const startLog = `🚀 The raid has started! 👑 **${state.ownerName}** — choose a card to attack!${dittoTransformNote}${dittoAllyNote}`;
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

      const { dmg: dmgDealt, crit: raidCrit } = calcDamage(attacker, boss);
      boss.hp = Math.max(0, boss.hp - dmgDealt);
      if (boss.hp === 0) boss.alive = false;

      let log = `⚔️ ${attackerLabel} attacked **${boss.name}** for **${dmgDealt.toLocaleString()}** damage!${raidCrit ? ' 👁️ **GOLDEN PUPILS CRIT — 5×!**' : ''}`;
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
        // Log collab raid completion
        const rewardSharesText = (state.rewardShares ?? []).length > 0
          ? '\n**Reward Shares (20% each):** ' + (state.rewardShares).map(s => `<@${s.userId}> (${s.username})`).join(', ')
          : '';
        const collabLogEmbed = new EmbedBuilder()
          .setColor(0xFFD700)
          .setTitle('🏰 Collab Raid Completed')
          .setDescription(
            `**Owner:** <@${state.ownerId}> (${state.ownerName})\n` +
            `**Participants:** ${winners}\n` +
            `**Boss:** ${boss.name}\n` +
            `**Tier:** ${state.raidTicketTier ?? 'unknown'}` +
            rewardSharesText +
            `\n\n**Rewards:** ${rewardText}`
          )
          .setTimestamp();
        logToChannel(RAID_LOG_CHANNEL, collabLogEmbed);
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

  // ── Image review button handler (admin) ──────────────────
  if (parts[0] === 'imgrev') {
    const [, authorId, expiryStr, indexStr, ...rest] = parts;
    const action = rest.pop();
    const filter = rest.join('|');
    const expiry = parseInt(expiryStr, 10);
    const index  = parseInt(indexStr, 10);

    if (interaction.user.id !== authorId) {
      return interaction.reply({ content: 'This review is not for you.', ephemeral: true });
    }
    if (Date.now() > expiry) {
      return interaction.update({ content: '⏱️ This review session has expired.', components: [], embeds: [] });
    }

    const filteredCards = getImageReviewCards(filter === '_' ? '' : filter);
    if (filteredCards.length === 0) {
      return interaction.update({ content: 'No cards to review.', components: [], embeds: [] });
    }

    if (action === 'done') {
      return interaction.update({ content: '✅ Image review ended.', components: [], embeds: [] });
    }

    if (action === 'next' || action === 'skip') {
      const nextIndex = index + 1;
      if (nextIndex >= filteredCards.length) {
        return interaction.update({ content: '🎉 All cards reviewed!', components: [], embeds: [] });
      }
      const { embed, components } = buildImageReviewEmbed(authorId, filteredCards, nextIndex, filter, expiry);
      return interaction.update({ embeds: [embed], components });
    }

    if (action === 'find') {
      await interaction.deferUpdate();
      const card      = filteredCards[index];
      const freshUrl  = await imgCache.fetchJikanUrl(card.id, card.name).catch(() => null);
      const newExpiry = Date.now() + 30 * 60_000;
      const { embed, components } = buildImageReviewEmbed(authorId, filteredCards, index, filter, newExpiry);
      if (!freshUrl) {
        embed.setDescription('🔍 **Admin Image Review** — ⚠️ No image found on MyAnimeList. Use ✏️ Enter URL to paste one manually.');
      }
      return interaction.editReply({ embeds: [embed], components });
    }

    if (action === 'typeurl') {
      const card  = filteredCards[index];
      const modal = new ModalBuilder()
        .setCustomId(`imgrev_url|${authorId}|${expiry}|${index}|${filter}`)
        .setTitle(`Set image for ${card.name}`);
      const input = new TextInputBuilder()
        .setCustomId('url')
        .setLabel('Image URL')
        .setPlaceholder('https://...')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }

    if (action === 'upload') {
      await interaction.deferUpdate();
      const card = filteredCards[index];
      try {
        await emojiCache.syncEmojis(client, [card], imgCache);
      } catch (err) {
        console.error('imgrev upload error:', err);
      }
      const newExpiry = Date.now() + 30 * 60_000;
      const { embed, components } = buildImageReviewEmbed(authorId, filteredCards, index, filter, newExpiry);
      return interaction.editReply({ embeds: [embed], components });
    }

    return;
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
      const lowerFilter  = filterArg.toLowerCase();
      if (rarityFilter) {
        allEntries = allEntries.filter(([cardId]) => (lookupCard(cardId)?.rarity ?? 'R') === rarityFilter);
      } else if (lowerFilter === 'weapon' || lowerFilter === 'weapons') {
        allEntries = allEntries.filter(([cardId]) => lookupCard(cardId)?.weaponCard === true);
      } else {
        allEntries = allEntries.filter(([cardId]) => {
          const card = lookupCard(cardId);
          return (card?.name ?? cardId).toLowerCase().includes(lowerFilter);
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

  // ── wcol (weapon collection) button ───────────────────────
  if (parts[0] === 'wcol') {
    const [, wAuthorId, wTargetId, wExpiryStr, wPageStr, ...wFilterParts] = parts;
    const wFilter = wFilterParts.join('|');
    const wExpiry = parseInt(wExpiryStr, 10);

    if (interaction.user.id !== wAuthorId) {
      return interaction.reply({ content: 'These buttons are not for you.', ephemeral: true });
    }
    if (Date.now() > wExpiry) {
      return interaction.update({ components: [], embeds: interaction.message.embeds, content: interaction.message.content || null });
    }
    if (wPageStr === 'close') {
      return interaction.update({ components: [] });
    }

    const wPage       = parseInt(wPageStr, 10);
    const wTargetUser = await client.users.fetch(wTargetId).catch(() => null);
    if (!wTargetUser) return interaction.reply({ content: 'Could not find that user.', ephemeral: true });

    const wInventory = await inv.loadInventory();
    const wCards     = inv.getCards(wInventory, wTargetId);
    const { embed, components } = buildWeaponCollectionPage(wAuthorId, wTargetUser, wCards, wPage, wFilter, wInventory, wExpiry);
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

  // ── Banned user check ─────────────────────────────────────
  if (bannedUsers.has(userId) && !isAdmin(userId)) return;

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
    if (!wishCard || wishCard.rarity === 'MD') {
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

    const inventory                              = await inv.loadInventory();
    const effectiveRegenMs                       = getEffectiveRegenMs(inventory, userId);
    const effectiveRegenSecs                     = Math.round(effectiveRegenMs / 1000);
    const { charges, lastRefill }                = getCharges(userId, effectiveRegenMs);

    if (charges <= 0) {
      const secsUntilNext = Math.ceil(effectiveRegenSecs - (Date.now() - lastRefill) / 1000);
      return message.reply(`No pulls left! Next charge in **${secsUntilNext}s**. Charges refill 1 every **${effectiveRegenSecs}s** (max **${config.MAX_PULL_CHARGES}**).`);
    }

    setCharges(userId, charges - 1, lastRefill);

    const { card, isDupe, plating, droppedTickets } = executeSinglePull(inventory, userId);
    const wishGrant                                  = checkAndGrantWish(inventory, userId);
    await inv.saveInventory(inventory);

    const remaining  = charges - 1;
    const chargeInfo = remaining > 0
      ? `${remaining} pull${remaining === 1 ? '' : 's'} remaining`
      : `No pulls left — next charge in ${effectiveRegenSecs}s`;

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
      let wish        = inv.getWish(inventory, userId);
      // Auto-clear any stale MD wish (guard against old data)
      if (wish) {
        const staleCard = lookupCard(wish.cardId);
        if (!staleCard || staleCard.rarity === 'MD') {
          inv.clearWish(inventory, userId);
          await inv.saveInventory(inventory);
          wish = null;
        }
      }
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

    const inventory = await inv.loadInventory();
    const hasAnyWish = hasSupportCard(inventory, userId, 'support_l');
    
    // Block MD rarity from being wished
    if (card.rarity === 'MD') {
        return message.reply(`You cannot wish for **MD** rarity cards.`);
    }

    if (card.rarity === 'LT') {
      if (!hasAnyWish) {
        return message.reply(`You cannot wish for **Limited** cards. Wishes are limited to Mythical rarity and below.\n*Own the 💛 Eternal Wish Crystal (L) support card to unlock UR and Limited wishes (must already own the Limited card)!*`);
      }
      if (!inv.hasCard(inventory, userId, card.id)) {
        return message.reply(`You can only wish for a **Limited** card if you already own it.\n*You don't own **${card.name}** yet — obtain it first, then set your wish!*`);
      }
    }

    if (card.rarity === 'UR' && !hasAnyWish) {
      return message.reply(`You cannot wish for **Ultra Rare** cards. Wishes are limited to Mythical rarity and below.\n*Own the 💛 Eternal Wish Crystal (L) support card to unlock UR and Limited wishes!*`);
    }

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

  // ── daily ────────────────────────────────────────────────
  if (command === 'daily') {
    const inventory = await inv.loadInventory();
    const dailyInfo = inv.getDailyInfo(inventory, userId);
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const TWO_DAYS = 48 * 60 * 60 * 1000;
    const lastDate = dailyInfo.lastDate;

    if (lastDate && (now - lastDate) < ONE_DAY) {
      const nextMs = lastDate + ONE_DAY - now;
      const nextHrs  = Math.floor(nextMs / 3600000);
      const nextMins = Math.floor((nextMs % 3600000) / 60000);
      return message.reply(`You already claimed your daily! Come back in **${nextHrs}h ${nextMins}m**.`);
    }

    const hasScrollAwakener = hasSupportCard(inventory, userId, 'support_ur');
    const result = inv.claimDaily(inventory, userId, hasScrollAwakener);
    await inv.saveInventory(inventory);

    const streakBroken = lastDate && (now - lastDate) >= TWO_DAYS;
    const streakLabel  = streakBroken ? '🔄 Streak reset!' : `🔥 Day **${result.streak}** streak!`;
    const scrollsText  = result.scrolls > 0 ? `\n> 📜 **${result.scrolls} Level Scroll${result.scrolls === 1 ? '' : 's'}**` : '';
    const scrollsNote  = result.scrolls === 0
      ? '\n\n*Own the 🟡 Scroll Awakener (UR) support card to earn Level Scrolls from daily rewards!*'
      : '';

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('📅 Daily Reward Claimed!')
      .setDescription(
        `${streakLabel}\n\n**Rewards:**\n` +
        `> 💰 **¥100,000 Yen**\n` +
        `> ⭐ **1,000 Stars**\n` +
        `> 🍬 **5 Candy Tokens**` +
        scrollsText +
        scrollsNote
      )
      .setFooter({ text: `Come back tomorrow to keep your streak! Scrolls cap at ${inv.DAILY_SCROLL_CAP} (day ${inv.DAILY_SCROLL_CAP}+).` });
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
    const cards     = inv.getCards(inventory, target.id).filter(c => !lookupCard(c.id)?.weaponCard);

    if (cards.length === 0) {
      return message.reply(`${target.id === userId ? 'You have' : `**${target.username}** has`} no cards yet. Use \`ZP pull\` to get started!`);
    }

    const expiry = Date.now() + COLLECTION_TIMEOUT_MS;
    const { embed, components } = buildCollectionPage(userId, target, cards, 0, filter, inventory, expiry);
    return message.reply({ embeds: [embed], components });
  }

  // ── wcollection | wcol ───────────────────────────────────
  if (command === 'wcollection' || command === 'wcol') {
    const target  = message.mentions.users.first() ?? message.author;
    const filter  = args.filter(a => !a.startsWith('<@')).join(' ').trim();

    if (target.id !== userId) {
      const checkInv = await inv.loadInventory();
      if (inv.getPrivacy(checkInv, target.id)) {
        return message.reply(`**${target.username}**'s collection is set to private.`);
      }
    }

    const inventory = await inv.loadInventory();
    const cards     = inv.getCards(inventory, target.id);
    const expiry    = Date.now() + WCOL_TIMEOUT_MS;
    const { embed, components } = buildWeaponCollectionPage(userId, target, cards, 0, filter, inventory, expiry);
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
    const candy     = inv.getTradableCandyTokens(inventory, target.id);
    const lockedCandy = inv.getLockedCandyTokens(inventory, target.id);

    const lbs = inv.getLimitBreakers(inventory, target.id);
    const candyDisplay = lockedCandy > 0
      ? `${candy.toLocaleString()} + ${lockedCandy} 🔒`
      : candy.toLocaleString();
    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle(`${target.username}'s Wallet`)
      .addFields(
        { name: 'Yen',            value: `¥${yen.toLocaleString()}`,   inline: true },
        { name: 'Stars',          value: stars.toLocaleString(),       inline: true },
        { name: 'Candy Tokens',   value: candyDisplay,                  inline: true },
        { name: 'Limit Breakers', value: lbs.toLocaleString(),         inline: true },
      )
      .setFooter({ text: 'Earn yen from fights and kills • Stars from fights • 🔒 = trade-locked (from codes)' });
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

    const userItems  = inv.getItems(inventory, target.id);
    const raidTierIds = config.RAID_TICKET_TIERS.map(t => t.id);
    const ticketEntries = raidTierIds
      .map(id => ({ tier: config.RAID_TICKET_TIERS.find(t => t.id === id), count: userItems[id] ?? 0 }))
      .filter(e => e.count > 0);

    const hasAnything = platingEntries.length > 0 || ticketEntries.length > 0;
    if (!hasAnything) {
      return message.reply(
        `${target.id === userId ? 'You have' : `**${target.username}** has`} nothing in their inventory yet!`
      );
    }

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle(`${target.username}'s Inventory`);

    if (platingEntries.length > 0) {
      const totalPlatings = platingEntries.reduce((s, [, n]) => s + n, 0);
      embed.addFields({
        name: `🛡️ Platings (${totalPlatings} total)`,
        value: config.PLATING_TIERS
          .filter(t => platingsObj[t.id] > 0)
          .map(t => `**${t.label}** — x${platingsObj[t.id]}`)
          .join('\n'),
        inline: false,
      });
    }

    if (ticketEntries.length > 0) {
      embed.addFields({
        name: '🎟️ Raid Tickets',
        value: ticketEntries
          .map(e => `${e.tier.emoji} **${e.tier.label}** — x${e.count}\n*Use: \`${e.tier.useCmd}\`*`)
          .join('\n'),
        inline: false,
      });
    }

    embed.setFooter({ text: 'Platings drop at 0.1% per pull • Raid Tickets drop from pulls too!' });
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
      const lowerFilter  = filterArg.toLowerCase();
      if (rarityFilter) {
        filtered = allEntries.filter(([cardId]) => (lookupCard(cardId)?.rarity ?? 'R') === rarityFilter);
      } else if (lowerFilter === 'weapon' || lowerFilter === 'weapons') {
        filtered = allEntries.filter(([cardId]) => lookupCard(cardId)?.weaponCard === true);
      } else {
        filtered = allEntries.filter(([cardId]) => {
          const card = lookupCard(cardId);
          return (card?.name ?? cardId).toLowerCase().includes(lowerFilter);
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

    // ── Level Scroll special handling ────────────────────────
    if (itemId === 'level_scroll') {
      const cardQuery = args.slice(1).filter(a => !a.startsWith('<@')).join(' ');
      if (!cardQuery) {
        return message.reply('Usage: `ZP use level_scroll <cardId>` — specify which card to level up!');
      }
      const targetCard = resolveCard(cardQuery);
      if (!targetCard) {
        return message.reply(`No card found matching \`${cardQuery}\`. Use \`ZP col\` to see your cards.`);
      }
      const inventory = await inv.loadInventory();
      if (!inv.hasCard(inventory, userId, targetCard.id)) {
        return message.reply(`You don't own **${targetCard.name}**.`);
      }
      if (!inv.removeItem(inventory, userId, 'level_scroll')) {
        return message.reply(`You don't have a 📜 **Level Scroll**. Earn one from fights, raids, or daily rewards (requires 🟡 Scroll Awakener support card).`);
      }
      const user   = inventory.users[userId];
      const slot   = user.cards.find(c => c.id === targetCard.id);
      if (!slot) {
        inv.addItem(inventory, userId, 'level_scroll');
        await inv.saveInventory(inventory);
        return message.reply(`Could not find **${targetCard.name}** in your card data. Your scroll has been refunded.`);
      }
      const curLvl = slot.level ?? 1;
      const cap    = inv.getPersonalLevelCap(inventory, userId, targetCard.id);
      if (curLvl >= cap) {
        inv.addItem(inventory, userId, 'level_scroll');
        await inv.saveInventory(inventory);
        return message.reply(`**${targetCard.name}** is already at its level cap (**${cap}**). Use \`ZP ilc\` to raise the cap first.`);
      }
      slot.level = curLvl + 1;
      await inv.saveInventory(inventory);
      const meta = rarityMeta(targetCard.rarity);
      const embed = new EmbedBuilder()
        .setColor(meta.color)
        .setTitle('📜 Level Scroll Used!')
        .setDescription(
          `${meta.emoji} **${targetCard.name}** leveled up!\n\n` +
          `**Level:** ${curLvl} → **${curLvl + 1}** / ${cap}\n` +
          `+2% stats from the new level!`
        )
        .setFooter({ text: 'Level Scrolls drop from fights, raids, and daily rewards (Scroll Awakener required)' });
      const img = imgCache.getImage(targetCard.id) ?? targetCard.image ?? null;
      if (img) embed.setThumbnail(img);
      return message.reply({ embeds: [embed] });
    }

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

    // Boss stats = card's Lv-100 stats × 10
    const isDittoBoss = bossCard.dittoCard === true;
    const lv100Stats  = getCardStats(bossCard, 100);
    const bossHp      = Math.round(lv100Stats.hp  * 10);
    const bossDmg     = Math.round(lv100Stats.dmg * 10);
    const bossImg     = imgCache.getImage(bossCard.id) ?? bossCard.image ?? null;

    const bossBC = {
      cardId:    bossCard.id,
      name:      isDittoBoss ? 'Ditto (???)' : bossCard.name,
      level:     100,
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
      isDittoBoss,
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
      defenderName:   isDittoBoss ? 'Ditto (???)' : bossCard.name,
      defenderCards:  [bossBC],
      bossImg,
      raidBossCard:   bossCard,
      isDittoBoss,
      expiry: Date.now() + 30 * 60 * 1000,
      rewardShares: [],
    };

    // Auto-whitelist all clan members of the raid owner
    const ownerClan = inv.getUserClan(inventory, userId);
    if (ownerClan) {
      const clanMembers = ownerClan.members.filter(m => m !== userId);
      for (const memberId of clanMembers) {
        if (state.whitelist.length < 4) state.whitelist.push(memberId);
      }
    }

    activeBattles.set(battleId, state);
    activeCollabRaids.set(userId, battleId);

    const dittoNote = isDittoBoss ? `\n🟣 *Ditto will **Transform** into your team's strongest card (10× Lv-100 stats) when the raid starts!*` : '';
    const openLog = `${tier.emoji} **${tier.label}** consumed! A **${bossMeta.emoji} ${isDittoBoss ? 'Ditto' : bossCard.name}** Raid Boss appeared!${dittoNote}\n**HP:** ${bossHp.toLocaleString()} | **DMG:** ${bossDmg.toLocaleString()}–${Math.round(bossDmg * 1.2).toLocaleString()}\n\n*Use \`ZP arj\` to allow others to join, \`ZP wh @user\` to whitelist players, then click **Start Raid**!*`;
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

  // ── shareraid | sr ────────────────────────────────────────
  if (command === 'shareraid' || command === 'sr') {
    const battleId = activeCollabRaids.get(userId);
    if (!battleId) return message.reply('You don\'t have an active collab raid! Use a raid ticket first.');
    const state = activeBattles.get(battleId);
    if (!state?.isCollabRaid) return message.reply('No active collab raid found.');

    const target = message.mentions.users.first();
    if (!target) return message.reply('Usage: `ZP shareraid @user` or `ZP sr @user`');
    if (target.id === userId) return message.reply('You can\'t share rewards with yourself!');

    if (!state.rewardShares) state.rewardShares = [];
    if (state.rewardShares.some(s => s.userId === target.id)) {
      return message.reply(`**${target.username}** already has a reward share on this raid!`);
    }
    if (state.rewardShares.length >= 4) {
      return message.reply('You can share with at most 4 users!');
    }

    state.rewardShares.push({ userId: target.id, username: target.username });

    const logEmbed = new EmbedBuilder()
      .setColor(0xFF9900)
      .setTitle('🔗 Raid Reward Share Added')
      .setDescription(
        `**Raid Owner:** <@${userId}> (${message.author.username})\n` +
        `**Shared With:** <@${target.id}> (${target.username})\n` +
        `**Share:** 20% of owner's raid rewards\n` +
        `**Boss:** ${state.raidBossCard?.name ?? 'Unknown'}`
      )
      .setTimestamp();
    logToChannel(RAID_LOG_CHANNEL, logEmbed);

    return message.reply(`✅ **${target.username}** will automatically receive **20%** of your raid rewards! (No acceptance needed)`);
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
      const slotPlatDefs2 = inv.getSlotPlatings(slot ?? {}).map(id => config.PLATING_TIERS.find(t => t.id === id)).filter(Boolean);
      if (slotPlatDefs2.length > 0) {
        const combinedMult = slotPlatDefs2.reduce((acc, p) => acc + (p.statMult - 1), 1);
        const base         = getCardStats(card, level);
        const platedHp     = Math.round(base.hp  * combinedMult);
        const platedDmg    = Math.round(base.dmg * combinedMult);
        const platLabel    = slotPlatDefs2.map(p => p.label).join(' + ');
        embed.addFields({
          name: `${platLabel} Plating (in battle)`,
          value: card.technique
            ? `❤️ **${platedHp}** HP  🔵 **${platedDmg}** TEC  *(x${combinedMult.toFixed(1)} boost)*`
            : `❤️ **${platedHp}** HP  ⚔️ **${platedDmg}** DMG  *(x${combinedMult.toFixed(1)} boost)*`,
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
    if (!cardQuery) return message.reply('Usage: `ZP mycard <name or id>` — e.g. `ZP mc gear5 luffy`\nFor weapons use `ZP wmci <weaponId>`');

    const card = resolveCard(cardQuery);
    if (!card) return message.reply(`No card found matching \`${cardQuery}\`.`);

    if (lookupCard(card.id)?.weaponCard) {
      return message.reply(`**${card.name}** is a weapon card. Use \`ZP wmci ${card.id}\` to see your weapon's stats.`);
    }

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

    const team          = inv.getTeam(inventory, userId);
    const slot          = team.find(s => s.cardId === card.id);
    const mycardPlatings = inv.getSlotPlatings(slot ?? {})
      .map(id => config.PLATING_TIERS.find(t => t.id === id)).filter(Boolean);

    // Equipped weapon
    const equippedWeaponId = inv.getEquippedWeapon(inventory, userId, card.id);
    let weaponLine = 'None';
    if (equippedWeaponId) {
      const wCard    = lookupCard(equippedWeaponId);
      const wData    = inv.getWeaponData(inventory, userId, equippedWeaponId);
      const wTier    = config.WEAPON_EVOLUTION_TIERS[wData.evolutionTier - 1];
      const wLevel   = (inv.getCards(inventory, userId).find(c => c.id === equippedWeaponId)?.level ?? 1);
      weaponLine = wCard
        ? `${wTier?.emoji ?? '⚔️'} **${wCard.name}** (Tier ${wData.evolutionTier} ${wTier?.name ?? ''}) Lv${wLevel}`
        : equippedWeaponId;
    }

    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`${meta.emoji} ${card.name} (Your Card)`)
      .addFields(
        { name: 'Series',           value: card.series,                    inline: true },
        { name: 'Rarity',           value: `${meta.emoji} ${meta.label}`, inline: true },
        { name: 'Stars',            value: meta.stars || '—',              inline: true },
        { name: '📊 Level',         value: levelLabel,                        inline: true },
        { name: '❤️ Health',        value: `${stats.hp.toLocaleString()}`,   inline: true },
        { name: card.technique ? '🔵 Technique' : '⚔️ Damage', value: `${stats.dmg.toLocaleString()}`, inline: true },
        { name: '💨 Speed',         value: `${stats.speed.toLocaleString()}`, inline: true },
        { name: '✨ Prestige Points', value: `${pp}`,                         inline: true },
        { name: '🔮 Shards',        value: `${shards}`,                      inline: true },
        { name: 'Plating',           value: mycardPlatings.length ? mycardPlatings.map(p => p.label).join(' + ') : 'None', inline: true },
        { name: '⚔️ Equipped Weapon', value: weaponLine,                    inline: false },
      );

    if (mycardPlatings.length > 0) {
      const combinedMult = mycardPlatings.reduce((acc, p) => acc + (p.statMult - 1), 1);
      const base         = getCardStats(card, level);
      const platedHp     = Math.round(base.hp  * combinedMult);
      const platedDmg    = Math.round(base.dmg * combinedMult);
      const baseSpeed    = base.speed;
      const platLabel    = mycardPlatings.map(p => p.label).join(' + ');
      embed.addFields({
        name: `Battle Stats (with ${platLabel} Plating)`,
        value: card.technique
          ? `❤️ **${platedHp.toLocaleString()}** HP  🔵 **${platedDmg.toLocaleString()}** TEC  💨 **${baseSpeed.toLocaleString()}** SPD  *(x${combinedMult.toFixed(1)} HP/DMG boost)*`
          : `❤️ **${platedHp.toLocaleString()}** HP  ⚔️ **${platedDmg.toLocaleString()}** DMG  💨 **${baseSpeed.toLocaleString()}** SPD  *(x${combinedMult.toFixed(1)} HP/DMG boost)*`,
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

    const dittoDesc = card.dittoCard
      ? `\n\n🟣 **Special — Transform:** At the start of battle, Ditto copies the **strongest enemy card's** stats and technique at **80% efficiency** (+0.1% per level). At Lv 100 it copies at **89.9%**.\n🤝 **In Raids:** Ditto copies the **strongest ally** on your team instead (never the raid boss).\n💀 **As a Raid Boss (Hellish):** Ditto transforms into your team's strongest card at **10× its Lv-100 stats**!\n🛡️ **Cannot equip platings** — Ditto's power comes from copying, not armour.`
      : '';

    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`${meta.emoji} ${card.name}`)
      .setDescription((card.desc || card.description || 'No description available.') + dittoDesc)
      .addFields(
        { name: 'Series',      value: card.series,                    inline: true },
        { name: 'Rarity',      value: `${meta.emoji} ${meta.label}`, inline: true },
        { name: 'Stars',       value: meta.stars || '—',              inline: true },
        { name: card.dittoCard ? '❤️ Copied HP' : '❤️ Base HP',  value: card.dittoCard ? '(copied in battle)' : `${stats.hp.toLocaleString()}`, inline: true },
        { name: card.dittoCard ? '⚔️ Copied DMG' : (card.technique ? '🔵 Base TEC' : '⚔️ Base DMG'), value: card.dittoCard ? '(copied in battle)' : `${stats.dmg.toLocaleString()}`, inline: true },
        { name: card.dittoCard ? '💨 Copied SPD' : '💨 Base SPD', value: card.dittoCard ? '(copied in battle)' : `${stats.speed.toLocaleString()}`, inline: true },
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
        '       `ZP absorb all [rarity]` — absorb ALL shards into every card they belong to\n' +
        '       `ZP absorb <rarity>` — shortcut: absorb all shards for a specific rarity (e.g. `ZP absorb MY`)\n' +
        'Example: `ZP absorb shard:naruto:5` — spend 5 Naruto shards to gain 5 levels.'
      );
    }

    // ── absorb all [rarity]  OR  absorb <rarity> shortcut ──
    const isAllKeyword   = raw.toLowerCase() === 'all';
    const rarityShortcut = !isAllKeyword && !raw.includes(':') ? normalizeRarity(args.join(' ')) : null;

    if (isAllKeyword || rarityShortcut) {
      const rarityFilter = isAllKeyword
        ? (args[1] ? normalizeRarity(args.slice(1).join(' ')) : null)
        : rarityShortcut;

      if (isAllKeyword && args[1] && !rarityFilter) {
        return message.reply(`Unknown rarity \`${args[1]}\`. Try: R, E, L, MY, UR, LT, MD`);
      }

      const inventory = await inv.loadInventory();
      const allShards  = inv.getCharacterShards(inventory, userId);

      const actions = [];
      for (const [cardId, shardCount] of Object.entries(allShards)) {
        if (shardCount < 1) continue;
        const def = lookupCard(cardId);
        if (!def || def.supportCard || def.weaponCard || def.dittoCard) continue;
        if (rarityFilter && def.rarity !== rarityFilter) continue;
        if (!inv.hasCard(inventory, userId, def.id)) continue;

        const currentLevel = inv.getCardLevel(inventory, userId, def.id) ?? 1;
        const personalCap  = inv.getPersonalLevelCap(inventory, userId, def.id);
        if (currentLevel >= personalCap) continue;

        const levelsGained = Math.min(shardCount, personalCap - currentLevel);
        if (levelsGained < 1) continue;
        actions.push({ def, shardCount, levelsGained, currentLevel });
      }

      if (!actions.length) {
        const rarityLabel = rarityFilter ? `${rarityMeta(rarityFilter).label} ` : '';
        return message.reply(`You have no ${rarityLabel}shards that can be absorbed right now.`);
      }

      const totalShards = actions.reduce((s, a) => s + a.levelsGained, 0);
      const labelStr    = rarityFilter ? `${rarityMeta(rarityFilter).emoji} ${rarityMeta(rarityFilter).label}` : 'all rarities';

      const confirmId = `${userId}_absorb_all_${Date.now()}`;
      pendingConfirmations.set(confirmId, {
        type: 'absorb_all', userId, actions, channelId: message.channel.id,
      });
      setTimeout(() => pendingConfirmations.delete(confirmId), 60_000);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`confirm_action|${confirmId}`).setLabel('Confirm Absorb').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`cancel_confirm|${confirmId}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary),
      );
      const previewLines = actions.slice(0, 15).map(a => `• **${a.def.name}**: +${a.levelsGained} levels (${a.currentLevel} → ${a.currentLevel + a.levelsGained})`);
      if (actions.length > 15) previewLines.push(`…and ${actions.length - 15} more`);
      const embed = new EmbedBuilder()
        .setColor(0x00FFD1)
        .setTitle(`📈 Absorb all shards — ${labelStr}?`)
        .setDescription(
          `This will absorb **${totalShards} shard${totalShards === 1 ? '' : 's'}** across **${actions.length} card${actions.length === 1 ? '' : 's'}**:\n` +
          previewLines.join('\n')
        )
        .setFooter({ text: 'This action cannot be undone. Expires in 60s.' });
      return message.reply({ embeds: [embed], components: [row] });
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
    const killerCardId = args[0]?.toLowerCase();

    if (!killerCardId) {
      return message.reply(
        '**Kill command usage:**\n' +
        '`ZP kill <killerCard> <shardId>:<count>[,<shardId2>:<count2>...]` — Kill specific shards\n' +
        '`ZP kill <killerCard> <rarity>` — Kill ALL shards of every non-special card at that rarity\n' +
        'Examples:\n' +
        '• `ZP kill naruto_r sasuke_r:5,kakashi_r:3`\n' +
        '• `ZP kill naruto_r R` — kills all your R shards'
      );
    }

    const killerCard = resolveCard(killerCardId);
    if (!killerCard) return message.reply(`No card found matching \`${killerCardId}\`.`);

    const inventory = await inv.loadInventory();
    if (!inv.hasCard(inventory, userId, killerCard.id)) {
      return message.reply(`You don't own **${killerCard.name}**. You need to own the killer card!`);
    }

    const allShards = inv.getCharacterShards(inventory, userId);

    // ── Rarity-based kill: ZP kill <killerCard> <rarity> ──
    const rarityArg = args.slice(1).join(' ');
    const rarityKey = normalizeRarity(rarityArg.trim());
    if (rarityKey) {
      // Collect all non-special shards at this rarity
      const targets = [];
      for (const [cardId, count] of Object.entries(allShards)) {
        if (count < 1) continue;
        const def = lookupCard(cardId);
        if (!def || def.rarity !== rarityKey) continue;
        if (def.supportCard || def.weaponCard || def.dittoCard) continue;
        targets.push({ def, count });
      }
      if (!targets.length) {
        return message.reply(`You have no ${rarityMeta(rarityKey).label} shards to kill.`);
      }
      const totalShards = targets.reduce((s, t) => s + t.count, 0);
      const totalYen    = targets.reduce((s, t) => s + t.count * (KILL_YEN[rarityKey] ?? 50), 0);
      const killerMeta  = rarityMeta(killerCard.rarity);
      const meta        = rarityMeta(rarityKey);

      const confirmId = `${userId}_kill_rarity_${Date.now()}`;
      pendingConfirmations.set(confirmId, {
        type: 'kill_rarity', userId, killerCard, rarityKey, targets, totalShards, totalYen,
        channelId: message.channel.id,
      });
      setTimeout(() => pendingConfirmations.delete(confirmId), 60_000);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`confirm_action|${confirmId}`).setLabel('Confirm Kill').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`cancel_confirm|${confirmId}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary),
      );
      const lines = targets.slice(0, 15).map(t => `• ${t.count}x ${t.def.name}`);
      if (targets.length > 15) lines.push(`…and ${targets.length - 15} more`);
      const embed = new EmbedBuilder()
        .setColor(meta.color)
        .setTitle(`⚔️ Kill all ${meta.emoji} ${meta.label} shards?`)
        .setDescription(
          `**${killerCard.name}** will destroy **${totalShards} shard${totalShards === 1 ? '' : 's'}** across **${targets.length} card${targets.length === 1 ? '' : 's'}**:\n` +
          lines.join('\n') + `\n\n**Yen earned:** ¥${totalYen.toLocaleString()}\n**Prestige points:** +${totalShards} on ${killerCard.name}`
        )
        .setFooter({ text: 'This action cannot be undone. Expires in 60s.' });
      return message.reply({ embeds: [embed], components: [row] });
    }

    // ── Multi-target shard kill: ZP kill <killerCard> shardId:count[,shardId:count] ──
    const shardArgRaw = args.slice(1).join('');
    if (!shardArgRaw) {
      return message.reply('Please specify what to kill. Usage: `ZP kill <killerCard> <shardId>:<count>`');
    }

    const shardTokens = shardArgRaw.split(',').map(s => s.trim()).filter(Boolean);
    const targets = [];
    for (const token of shardTokens) {
      const colonIdx = token.lastIndexOf(':');
      if (colonIdx < 1) return message.reply(`Invalid format for \`${token}\`. Use \`shardId:count\`.`);
      const shardId = token.slice(0, colonIdx).toLowerCase();
      const count   = parseInt(token.slice(colonIdx + 1), 10);
      if (isNaN(count) || count < 1) return message.reply(`Count must be a positive number in \`${token}\`.`);
      const def = resolveCard(shardId);
      if (!def) return message.reply(`No card found matching \`${shardId}\`.`);
      const have = allShards[def.id] ?? 0;
      if (have < count) return message.reply(`You only have **${have}** ${def.name} shard${have === 1 ? '' : 's'} but tried to kill **${count}**.`);
      targets.push({ def, count });
    }

    const totalYen   = targets.reduce((s, t) => s + t.count * (KILL_YEN[t.def.rarity] ?? 50), 0);
    const totalCount = targets.reduce((s, t) => s + t.count, 0);

    for (const { def, count } of targets) {
      inv.removeCharacterShards(inventory, userId, def.id, count);
    }
    inv.addYen(inventory, userId, totalYen);
    inv.addPrestigePoints(inventory, userId, killerCard.id, totalCount);
    inv.incrementTotalKills(inventory, userId, totalCount);
    await inv.saveInventory(inventory);

    const killerMeta = rarityMeta(killerCard.rarity);
    const freshInv   = await inv.loadInventory();
    const newPP      = inv.getPrestigePoints(freshInv, userId)[killerCard.id] ?? 0;
    const img        = imgCache.getImage(killerCard.id) ?? killerCard.image ?? null;

    const lines = targets.map(({ def, count }) => {
      const m = rarityMeta(def.rarity);
      const em = emojiCache.getEmoji(def.id) ?? '';
      const yen = count * (KILL_YEN[def.rarity] ?? 50);
      return `${m.emoji} ${em} **${def.name}** ×${count} → ¥${yen.toLocaleString()}`;
    });

    const embed = new EmbedBuilder()
      .setColor(killerMeta.color)
      .setTitle(`⚔️ ${killerCard.name} killed ${totalCount} shard${totalCount === 1 ? '' : 's'}!`)
      .setDescription(lines.join('\n'))
      .addFields(
        { name: '💰 Total Yen',         value: `¥${totalYen.toLocaleString()}`,              inline: true },
        { name: '✨ Prestige Points',   value: `+${totalCount} → **${newPP}** total`,         inline: true },
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
          const slotPlatDefs = inv.getSlotPlatings(slot).map(id => config.PLATING_TIERS.find(t => t.id === id)).filter(Boolean);
          const platStr = slotPlatDefs.length ? ` [${slotPlatDefs.map(p => p.label).join('+')}]` : '';
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

      const removedPlatings = inv.getSlotPlatings(slot);
      for (const tier of removedPlatings) {
        inv.addPlating(inventory, userId, tier);
      }
      await inv.saveInventory(inventory);

      if (removedPlatings.length > 0) {
        const names = removedPlatings.map(id => config.PLATING_TIERS.find(t => t.id === id)?.label ?? id).join(', ');
        return message.reply(`**${card.name}** removed from your team. **${names} Plating${removedPlatings.length > 1 ? 's' : ''}** returned to inventory.`);
      }
      return message.reply(`**${card.name}** removed from your team.`);
    }

    // ── ZP team equip ─────────────────────────────────────
    if (sub === 'equip') {
      const platingStr = args[args.length - 1]?.toLowerCase();
      const cardQuery  = args.slice(1, -1).filter(a => !a.startsWith('<@')).join(' ');
      if (!cardQuery || !platingStr) return message.reply('Usage: `ZP team equip <name or id> <plating>` — valid platings: `bronze` `silver` `gold` `diamond`\nExample: `ZP team equip gear5 luffy gold`');

      const card    = resolveCard(cardQuery);
      if (!card)    return message.reply(`No card found matching \`${cardQuery}\`.`);
      if (card.dittoCard) return message.reply(`**Ditto** cannot equip platings — it copies stats from its allies instead!`);

      const tier    = platingById(platingStr);
      if (!tier)    return message.reply(`Unknown plating \`${platingStr}\`. Valid: \`bronze\` \`silver\` \`gold\` \`diamond\``);

      const inventory = await inv.loadInventory();
      const result    = inv.equipPlatingToTeam(inventory, userId, card.id, tier.id);
      await inv.saveInventory(inventory);

      if (result === 'equipped')        return message.reply(`**${tier.label} Plating** equipped to **${card.name}**!`);
      if (result === 'not_on_team')     return message.reply(`**${card.name}** is not on your team.`);
      if (result === 'no_plating')      return message.reply(`You don't have a **${tier.label} Plating** in your inventory.`);
      if (result === 'already_equipped') return message.reply(`**${card.name}** already has a **${tier.label} Plating** equipped.`);
      if (result === 'max_platings')    return message.reply(`**${card.name}** already has the maximum of **2 platings** equipped. Unequip one first.`);
    }

    // ── ZP team unequip ───────────────────────────────────
    if (sub === 'unequip') {
      const unequipArgs = args.slice(1).filter(a => !a.startsWith('<@'));
      if (!unequipArgs.length) return message.reply('Usage: `ZP team unequip <name or id> [plating]` — omit plating to remove all.\nExample: `ZP team unequip gojo gold`');

      const lastArg       = unequipArgs[unequipArgs.length - 1].toLowerCase();
      const targetTier    = platingById(lastArg);
      const cardQuery     = targetTier
        ? unequipArgs.slice(0, -1).join(' ')
        : unequipArgs.join(' ');

      if (!cardQuery) return message.reply('Usage: `ZP team unequip <name or id> [plating]`');
      const card = resolveCard(cardQuery);
      if (!card) return message.reply(`No card found matching \`${cardQuery}\`.`);

      const inventory = await inv.loadInventory();
      const removed   = inv.unequipPlatingFromTeam(inventory, userId, card.id, targetTier?.id ?? null);
      await inv.saveInventory(inventory);

      if (removed.length === 0) {
        return message.reply(targetTier
          ? `**${card.name}** doesn't have a **${targetTier.label} Plating** equipped.`
          : `**${card.name}** doesn't have any platings equipped.`);
      }
      const names = removed.map(id => config.PLATING_TIERS.find(t => t.id === id)?.label ?? id).join(', ');
      return message.reply(`**${names} Plating${removed.length > 1 ? 's' : ''}** unequipped from **${card.name}** and returned to your inventory.`);
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

    const removedPlatings2 = inv.getSlotPlatings(slot);
    for (const tier of removedPlatings2) {
      inv.addPlating(inventory, userId, tier);
    }
    await inv.saveInventory(inventory);

    if (removedPlatings2.length > 0) {
      const names = removedPlatings2.map(id => config.PLATING_TIERS.find(t => t.id === id)?.label ?? id).join(', ');
      return message.reply(`**${card.name}** removed from your team. **${names} Plating${removedPlatings2.length > 1 ? 's' : ''}** returned to inventory.`);
    }
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

    applyDittoTransform(attackerCards, defenderCards);
    applyDittoTransform(defenderCards, attackerCards);

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
      weaponKills:  {},
      expiry: Date.now() + 5 * 60 * 1000,
    };
    activeBattles.set(battleId, state);

    const embed      = buildBattleEmbed(state);
    const components = buildBattleComponents(state);
    return message.reply({ embeds: [embed], components });
  }

  // ── botfight | bf ─────────────────────────────────────────
  if (command === 'botfight' || command === 'bf') {
    const coolSecs = getFightCooldownSecs(userId);
    if (coolSecs > 0) return message.reply(`You're on cooldown! Wait **${coolSecs}s** before fighting again.`);

    const inventory     = await inv.loadInventory();
    const attackerTeam  = inv.getTeam(inventory, userId);

    if (attackerTeam.length < inv.TEAM_SIZE) {
      return message.reply(`You need a full team of **${inv.TEAM_SIZE}** cards to fight! Use \`ZP add <cardId>\` to fill your team.`);
    }

    const attackerResolved = resolveTeamSlots(attackerTeam, inventory, userId);
    const attackerCards    = attackerResolved.map(buildBattleCard).filter(Boolean);
    const defenderCards    = generateBotTeam();

    applyDittoTransform(attackerCards, defenderCards);

    setFightCooldown(userId);

    const battleId = `${userId}_bf_${Date.now()}`;
    const state    = {
      battleId,
      attackerId:   userId,
      defenderId:   'BOT',
      attackerName: message.author.username,
      defenderName: '🤖 Bot Team',
      attackerCards,
      defenderCards,
      isBotFight:   true,
      weaponKills:  {},
      expiry: Date.now() + 5 * 60 * 1000,
    };
    activeBattles.set(battleId, state);

    const dittoInTeam = attackerCards.find(bc => bc.copiedFrom);
    const dittoNote   = dittoInTeam ? `\n*🟣 Ditto copied **${dittoInTeam.copiedFrom}**'s stats!*` : '';

    const embed      = buildBattleEmbed(state, dittoNote || null);
    const components = buildBattleComponents(state);
    return message.reply({ embeds: [embed], components });
  }

  // ── timeskip | ts ─────────────────────────────────────────
  if (command === 'timeskip' || command === 'ts') {
    const TIMESKIP_COST    = 10000;
    const TIMESKIP_FIGHTS  = 50;

    const inventory = await inv.loadInventory();
    const userStars = inv.getStars(inventory, userId);
    if (userStars < TIMESKIP_COST) {
      return message.reply(`You need **${TIMESKIP_COST.toLocaleString()} ⭐ Stars** to use Time Skip! You only have **${userStars.toLocaleString()}**.`);
    }

    const teamSlots = inv.getTeam(inventory, userId);
    if (teamSlots.length < inv.TEAM_SIZE) {
      return message.reply(`You need a full team of **${inv.TEAM_SIZE}** cards to use Time Skip! Use \`ZP add <cardId>\` to fill your team.`);
    }

    inv.removeStars(inventory, userId, TIMESKIP_COST);

    const attackerResolved = resolveTeamSlots(teamSlots, inventory, userId);
    const baseAttackerCards = attackerResolved.map(buildBattleCard).filter(Boolean);

    let wins = 0;
    let losses = 0;
    let totalYen = 0;
    const totalWeaponKills = {};

    for (let i = 0; i < TIMESKIP_FIGHTS; i++) {
      const defenderCards = generateBotTeam();
      const attackerCards = baseAttackerCards.map(c => ({ ...c }));
      applyDittoTransform(attackerCards, defenderCards);

      const { won, weaponKills } = simulateSingleBotFight(attackerCards, defenderCards);
      if (won) {
        wins++;
        const yenEarned = Math.floor(config.BOT_FIGHT_YEN_MIN + Math.random() * (config.BOT_FIGHT_YEN_MAX - config.BOT_FIGHT_YEN_MIN + 1));
        totalYen += yenEarned;
        for (const [wId, kills] of Object.entries(weaponKills)) {
          totalWeaponKills[wId] = (totalWeaponKills[wId] ?? 0) + kills;
        }
      } else {
        losses++;
      }
    }

    inv.addYen(inventory, userId, totalYen);

    const weaponPrestigeLines = [];
    for (const [weaponId, kills] of Object.entries(totalWeaponKills)) {
      if (inv.hasCard(inventory, userId, weaponId)) {
        inv.addWeaponPrestige(inventory, userId, weaponId, kills);
        const wCard = lookupCard(weaponId);
        weaponPrestigeLines.push(`⚔️ **${wCard?.name ?? weaponId}** — +${kills} weapon prestige`);
      }
    }

    await inv.saveInventory(inventory);

    const winRate = Math.round((wins / TIMESKIP_FIGHTS) * 100);
    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('⏩ Time Skip — 100 Botfights Simulated!')
      .setDescription(
        `**${message.author.username}** skipped through **${TIMESKIP_FIGHTS} botfights** in the blink of an eye!\n\n` +
        `**Cost:** -${TIMESKIP_COST.toLocaleString()} ⭐ Stars`
      )
      .addFields(
        {
          name: '📊 Battle Results',
          value: [
            `✅ **Wins:** ${wins} / ${TIMESKIP_FIGHTS}`,
            `❌ **Losses:** ${losses} / ${TIMESKIP_FIGHTS}`,
            `📈 **Win Rate:** ${winRate}%`,
          ].join('\n'),
          inline: false,
        },
        {
          name: '💰 Rewards Earned',
          value: `+¥${totalYen.toLocaleString()} Yen`,
          inline: false,
        },
        ...(weaponPrestigeLines.length > 0 ? [{
          name: '🗡️ Weapon Prestige Gained',
          value: weaponPrestigeLines.join('\n'),
          inline: false,
        }] : []),
      )
      .setFooter({ text: 'Time Skip simulates 100 botfights automatically — stars are spent, yen is earned' });
    return message.reply({ embeds: [embed] });
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

    applyDittoTransform(attackerCards, defenderCards);
    applyDittoTransform(defenderCards, attackerCards);

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

    if (!offerStr) return message.reply('Usage: `ZP trade @user <offer> [for <ask>]`\nOffer format: `shard:<cardId>:<count>` · `plating:<tier>:<count>` · `yen:<amount>` · `stars:<amount>` · `candy:<amount>` · `item:<itemId>:<count>`');

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

      // Log gift to trade channel
      const giftLogEmbed = new EmbedBuilder()
        .setColor(0x00FFD1)
        .setTitle('🎁 Gift Logged')
        .addFields(
          { name: 'From', value: `<@${userId}> (${message.author.username})`, inline: true },
          { name: 'To', value: `<@${target.id}> (${target.username})`, inline: true },
          { name: 'Items', value: describeItems(offerItems), inline: false },
        )
        .setTimestamp();
      logToChannel(TRADE_LOG_CHANNEL, giftLogEmbed);

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

    // Log trade to trade channel
    const tradeLogEmbed = new EmbedBuilder()
      .setColor(0x00FFD1)
      .setTitle('🤝 Trade Logged')
      .addFields(
        { name: 'Trade ID', value: tradeId, inline: false },
        { name: `${trade.offerName} offered`, value: describeItems(trade.offerItems), inline: true },
        { name: `${message.author.username} offered`, value: describeItems(trade.askItems), inline: true },
        { name: 'Parties', value: `<@${trade.offerId}> ↔️ <@${userId}>`, inline: false },
      )
      .setTimestamp();
    logToChannel(TRADE_LOG_CHANNEL, tradeLogEmbed);

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
        'Send a card on a conquest mission. Recall it with `ZP conquestrecall` to earn **1 Limit Breaker** and **1–10 Candy Tokens**.'
      );
    }

    const card = resolveCard(cardQuery);
    if (!card) return message.reply(`No card found matching \`${cardQuery}\`.`);

    const inventory = await inv.loadInventory();
    if (!inv.hasCard(inventory, userId, card.id)) {
      return message.reply(`You don't own **${card.name}**.`);
    }

    const conquestDurationMs   = getConquestDurationMs(inventory, userId);
    const conquestDurationHrs  = conquestDurationMs / (60 * 60 * 1000);
    const hasExtraSlot         = hasSupportCard(inventory, userId, 'support_e');

    const existing  = inv.getConquest(inventory, userId);
    const existing2 = hasExtraSlot ? inv.getConquest2(inventory, userId) : null;

    if (existing && existing2 && hasExtraSlot) {
      const elapsed1 = Math.floor((Date.now() - existing.sentAt) / 60000);
      const elapsed2 = Math.floor((Date.now() - existing2.sentAt) / 60000);
      return message.reply(
        `Both conquest slots are occupied!\n` +
        `**Slot 1:** ${lookupCard(existing.cardId)?.name ?? existing.cardId} (${elapsed1} min ago)\n` +
        `**Slot 2:** ${lookupCard(existing2.cardId)?.name ?? existing2.cardId} (${elapsed2} min ago)\n` +
        `Use \`ZP conquestrecall\` or \`ZP cr 2\` to recall a card first.`
      );
    }

    if (existing && !hasExtraSlot) {
      const existingCard = lookupCard(existing.cardId);
      const elapsed = Math.floor((Date.now() - existing.sentAt) / 60000);
      return message.reply(
        `**${existingCard?.name ?? existing.cardId}** is already on conquest (${elapsed} min ago). ` +
        `Use \`ZP conquestrecall\` to claim your rewards. ` +
        (hasExtraSlot ? '' : '*Own 💜 Conquest Expansion to send a second card!*')
      );
    }

    if (!existing) {
      inv.setConquest(inventory, userId, card.id);
    } else {
      inv.setConquest2(inventory, userId, card.id);
    }
    await inv.saveInventory(inventory);

    const slotLabel = (!existing) ? 'Slot 1' : 'Slot 2';
    const meta = rarityMeta(card.rarity);
    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`${card.name} Sent on Conquest! (${slotLabel})`)
      .setDescription(
        `**${card.name}** has been dispatched on a conquest mission.\n\n` +
        `Come back in **${conquestDurationHrs === 1 ? '1 hour' : '2 hours'}** and use \`ZP conquestrecall\` to claim:\n` +
        `> **1 Limit Breaker** + **1–10 Candy Tokens**`
      )
      .setFooter({ text: hasExtraSlot ? 'You have 2 conquest slots (Conquest Expansion active)' : 'Own 💜 Conquest Expansion to unlock a second slot' });
    const img = imgCache.getImage(card.id) ?? card.image ?? null;
    if (img) embed.setThumbnail(img);
    return message.reply({ embeds: [embed] });
  }

  // ── conquestrecall ────────────────────────────────────────
  if (command === 'conquestrecall' || command === 'cr') {
    const slotArg   = args[0];
    const useSlot2  = slotArg === '2';
    const inventory = await inv.loadInventory();

    const hasExtraSlot = hasSupportCard(inventory, userId, 'support_e');
    if (useSlot2 && !hasExtraSlot) {
      return message.reply(`You don't have a second conquest slot. Own 💜 Conquest Expansion to unlock it.`);
    }

    const conquest = useSlot2 ? inv.getConquest2(inventory, userId) : inv.getConquest(inventory, userId);
    if (!conquest) {
      return message.reply(
        useSlot2
          ? `Slot 2 is empty. Send a card with \`ZP conquestsend <cardId>\`.`
          : `You don't have a card on conquest. Send one with \`ZP conquestsend <cardId>\`.`
      );
    }

    const conquestDurationMs = getConquestDurationMs(inventory, userId);
    const elapsedMs = Date.now() - conquest.sentAt;
    if (elapsedMs < conquestDurationMs) {
      const remaining = Math.ceil((conquestDurationMs - elapsedMs) / 60000);
      return message.reply(`**${lookupCard(conquest.cardId)?.name ?? conquest.cardId}** is still on conquest. Come back in **${remaining} more minute${remaining === 1 ? '' : 's'}**.`);
    }

    const card        = lookupCard(conquest.cardId);
    const candyEarned = Math.floor(1 + Math.random() * 10);

    inv.addLimitBreakers(inventory, userId, 1);
    inv.addCandyTokens(inventory, userId, candyEarned);
    if (useSlot2) {
      inv.clearConquest2(inventory, userId);
    } else {
      inv.clearConquest(inventory, userId);
    }
    await inv.saveInventory(inventory);

    const meta = card ? rarityMeta(card.rarity) : { color: 0x00FFD1 };
    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`Conquest Complete!${useSlot2 ? ' (Slot 2)' : ''}`)
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

  // ── equip (unified: plating or weapon) ───────────────────
  if (command === 'equip') {
    const nonMention = args.filter(a => !a.startsWith('<@'));
    if (nonMention.length < 2) {
      return message.reply(
        'Usage:\n' +
        '`ZP equip <card> <plating>` — equip a plating (bronze/silver/gold/diamond)\n' +
        '`ZP equip <card> <weaponId>` — equip a weapon card'
      );
    }

    const inventory = await inv.loadInventory();

    // Try interpreting the last token(s) as a plating tier first
    const lastArg   = nonMention[nonMention.length - 1].toLowerCase();
    const platingTr = platingById(lastArg);

    if (platingTr) {
      // ── plating branch ──
      const cardQuery = nonMention.slice(0, -1).join(' ');
      const card = resolveCard(cardQuery);
      if (!card) return message.reply(`No card found matching \`${cardQuery}\`.`);
      if (!inv.hasCard(inventory, userId, card.id)) return message.reply(`You don't own **${card.name}**.`);
      if (card.dittoCard) return message.reply(`**Ditto** cannot equip platings — it copies stats from its allies instead!`);
      const teamSlot = inv.getTeam(inventory, userId).find(s => s.cardId === card.id);
      if (!teamSlot) return message.reply(`**${card.name}** is not on your team. Add it first with \`ZP team add ${card.id}\`.`);
      if ((inv.getPlatings(inventory, userId)[platingTr.id] ?? 0) < 1)
        return message.reply(`You don't have a **${platingTr.label} Plating** in your inventory.`);
      const result = inv.equipPlatingToTeam(inventory, userId, card.id, platingTr.id);
      await inv.saveInventory(inventory);
      if (result === 'equipped')        return message.reply(`**${platingTr.label} Plating** equipped to **${card.name}**!`);
      if (result === 'no_plating')      return message.reply(`You don't have a **${platingTr.label} Plating** in your inventory.`);
      if (result === 'not_in_team')     return message.reply(`**${card.name}** is not on your team.`);
      if (result === 'already_equipped') return message.reply(`**${card.name}** already has a **${platingTr.label} Plating** equipped.`);
      if (result === 'max_platings')    return message.reply(`**${card.name}** already has the maximum of **2 platings** equipped. Unequip one first.`);
      return message.reply(`Plating equipped!`);
    }

    // ── weapon branch ──
    const card   = resolveCard(nonMention[0]);
    const weapon = resolveCard(nonMention.slice(1).join(' '));
    if (!card)   return message.reply(`No card found matching \`${nonMention[0]}\`.`);
    if (!weapon) return message.reply(`No card/weapon found matching \`${nonMention.slice(1).join(' ')}\`. Valid platings: \`bronze\` \`silver\` \`gold\` \`diamond\``);
    const wDef2 = CARDS.find(c => c.id === weapon.id);
    if (!wDef2?.weaponCard) return message.reply(`**${weapon.name}** is neither a plating tier nor a weapon card.`);
    if (wDef2.weaponOf && wDef2.weaponOf !== card.id) {
      const sigCard = lookupCard(wDef2.weaponOf);
      return message.reply(`**${weapon.name}** is a signature weapon for **${sigCard?.name ?? wDef2.weaponOf}** and cannot be equipped to **${card.name}**.`);
    }
    if (!inv.hasCard(inventory, userId, card.id))   return message.reply(`You don't own **${card.name}**.`);
    if (!inv.hasCard(inventory, userId, weapon.id)) return message.reply(`You don't own **${weapon.name}**.`);
    const equipResult2 = inv.equipWeapon(inventory, userId, card.id, weapon.id);
    if (equipResult2 === 'already_in_use') {
      const otherCard = inv.getCards(inventory, userId).find(c => c.id !== card.id && c.equippedWeapon === weapon.id);
      const otherName = lookupCard(otherCard?.id)?.name ?? otherCard?.id ?? 'another card';
      return message.reply(`**${weapon.name}** is already equipped to **${otherName}**. Unequip it first with \`ZP unequipweapon ${otherCard?.id}\`.`);
    }
    await inv.saveInventory(inventory);
    const wData2    = inv.getWeaponData(inventory, userId, weapon.id);
    const tierData2 = config.WEAPON_EVOLUTION_TIERS[wData2.evolutionTier - 1];
    const cardMeta2 = rarityMeta(card.rarity);
    const embed2 = new EmbedBuilder()
      .setColor(cardMeta2.color)
      .setTitle(`⚔️ Weapon Equipped!`)
      .setDescription(
        `**${weapon.name}** is now equipped to **${card.name}**!\n\n` +
        `${tierData2.emoji} **Tier ${wData2.evolutionTier} — ${tierData2.name}** weapon\n` +
        `+${Math.round(tierData2.statMult * 100)}% stat bonus (at max level)\n\n` +
        `*Fight with ${card.name} to earn weapon prestige. Evolve with \`ZP evolveweapon ${weapon.id}\`.*`
      )
      .setFooter({ text: 'Use ZP unequipweapon <cardId> to remove the weapon' });
    return message.reply({ embeds: [embed2] });
  }

  // ── equipweapon ───────────────────────────────────────────
  if (command === 'equipweapon' || command === 'ew') {
    const nonMention = args.filter(a => !a.startsWith('<@'));
    const cardQuery   = nonMention[0];
    const weaponQuery = nonMention.slice(1).join(' ') || nonMention[0];

    if (nonMention.length < 2) {
      return message.reply('Usage: `ZP equipweapon <cardId> <weaponId>`\nExample: `ZP ew gojo gojo_weapon`');
    }

    const card   = resolveCard(nonMention[0]);
    const weapon = resolveCard(nonMention.slice(1).join(' '));

    if (!card)   return message.reply(`No card found matching \`${nonMention[0]}\`.`);
    if (!weapon) return message.reply(`No weapon card found matching \`${nonMention.slice(1).join(' ')}\`.`);

    const wDef = CARDS.find(c => c.id === weapon.id);
    if (!wDef?.weaponCard) {
      return message.reply(`**${weapon.name}** is not a weapon card. Only weapon cards can be equipped.`);
    }
    if (wDef.weaponOf && wDef.weaponOf !== card.id) {
      const sigCard = lookupCard(wDef.weaponOf);
      return message.reply(`**${weapon.name}** is a signature weapon for **${sigCard?.name ?? wDef.weaponOf}** and cannot be equipped to **${card.name}**.`);
    }

    const inventory = await inv.loadInventory();

    if (!inv.hasCard(inventory, userId, card.id)) {
      return message.reply(`You don't own **${card.name}**.`);
    }
    if (!inv.hasCard(inventory, userId, weapon.id)) {
      return message.reply(`You don't own **${weapon.name}**.`);
    }

    const equipResult = inv.equipWeapon(inventory, userId, card.id, weapon.id);
    if (equipResult === 'already_in_use') {
      const otherCard = inv.getCards(inventory, userId).find(c => c.id !== card.id && c.equippedWeapon === weapon.id);
      const otherName = lookupCard(otherCard?.id)?.name ?? otherCard?.id ?? 'another card';
      return message.reply(`**${weapon.name}** is already equipped to **${otherName}**. Unequip it first with \`ZP unequipweapon ${otherCard?.id}\`.`);
    }
    await inv.saveInventory(inventory);

    const wData    = inv.getWeaponData(inventory, userId, weapon.id);
    const tierData = config.WEAPON_EVOLUTION_TIERS[wData.evolutionTier - 1];
    const cardMeta = rarityMeta(card.rarity);
    const embed = new EmbedBuilder()
      .setColor(cardMeta.color)
      .setTitle(`⚔️ Weapon Equipped!`)
      .setDescription(
        `**${weapon.name}** is now equipped to **${card.name}**!\n\n` +
        `${tierData.emoji} **Tier ${wData.evolutionTier} — ${tierData.name}** weapon\n` +
        `+${Math.round(tierData.statMult * 100)}% stat bonus (at max level)\n\n` +
        `*Fight with ${card.name} to earn weapon prestige. Evolve the weapon with \`ZP evolveweapon ${weapon.id}\`.*`
      )
      .setFooter({ text: 'Use ZP unequipweapon <cardId> to remove the weapon' });
    return message.reply({ embeds: [embed] });
  }

  // ── unequipweapon ─────────────────────────────────────────
  if (command === 'unequipweapon' || command === 'uew') {
    const cardQuery = args.filter(a => !a.startsWith('<@')).join(' ');
    if (!cardQuery) return message.reply('Usage: `ZP unequipweapon <cardId>`');

    const card = resolveCard(cardQuery);
    if (!card) return message.reply(`No card found matching \`${cardQuery}\`.`);

    const inventory = await inv.loadInventory();
    if (!inv.hasCard(inventory, userId, card.id)) {
      return message.reply(`You don't own **${card.name}**.`);
    }
    const currentWeaponId = inv.getEquippedWeapon(inventory, userId, card.id);
    if (!currentWeaponId) {
      return message.reply(`**${card.name}** doesn't have a weapon equipped.`);
    }
    inv.unequipWeapon(inventory, userId, card.id);
    await inv.saveInventory(inventory);
    const wCard = lookupCard(currentWeaponId);
    return message.reply(`⚔️ **${wCard?.name ?? currentWeaponId}** has been unequipped from **${card.name}**.`);
  }

  // ── evolveweapon ──────────────────────────────────────────
  if (command === 'evolveweapon' || command === 'evw') {
    const weaponQuery = args.filter(a => !a.startsWith('<@')).join(' ');
    if (!weaponQuery) return message.reply('Usage: `ZP evolveweapon <weaponId>`');

    const weapon = resolveCard(weaponQuery);
    if (!weapon) return message.reply(`No card found matching \`${weaponQuery}\`.`);

    const wDef = CARDS.find(c => c.id === weapon.id);
    if (!wDef?.weaponCard) return message.reply(`**${weapon.name}** is not a weapon card.`);

    const inventory = await inv.loadInventory();
    if (!inv.hasCard(inventory, userId, weapon.id)) {
      return message.reply(`You don't own **${weapon.name}**.`);
    }

    const result = inv.evolveWeapon(inventory, userId, weapon.id, config);
    if (!result.success) {
      return message.reply(`❌ Cannot evolve **${weapon.name}**: ${result.reason}`);
    }
    await inv.saveInventory(inventory);

    const newTierData = config.WEAPON_EVOLUTION_TIERS[result.newTier - 1];
    const meta = rarityMeta(weapon.rarity);
    const img  = imgCache.getImage(weapon.id) ?? weapon.image ?? null;
    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`${newTierData.emoji} Weapon Evolved!`)
      .setDescription(
        `**${weapon.name}** evolved to **Tier ${result.newTier} — ${newTierData.name}**!\n\n` +
        `**Stat Bonus (at Lv100):** +${Math.round(newTierData.statMult * 100)}%\n` +
        (result.newTier < config.WEAPON_EVOLUTION_TIERS.length
          ? `\n*Next tier (Tier ${result.newTier + 1}) costs **${config.WEAPON_EVOLVE_SHARDS} weapon shards** + **${config.WEAPON_EVOLVE_PRESTIGE} weapon prestige**.*`
          : '\n*This weapon is at its maximum evolution tier — LEGENDARY!*')
      )
      .setFooter({ text: 'Gain weapon prestige by winning fights with the weapon equipped on a killing card' });
    if (img) embed.setThumbnail(img);
    return message.reply({ embeds: [embed] });
  }

  // ── weaponinfo ────────────────────────────────────────────
  if (command === 'weaponinfo' || command === 'winfo' || command === 'wp') {
    const weaponQuery = args.filter(a => !a.startsWith('<@')).join(' ');
    if (!weaponQuery) return message.reply('Usage: `ZP weaponinfo <weaponId>`');

    const weapon = resolveCard(weaponQuery);
    if (!weapon) return message.reply(`No weapon found matching \`${weaponQuery}\`.`);

    const wDef = CARDS.find(c => c.id === weapon.id);
    if (!wDef?.weaponCard) return message.reply(`**${weapon.name}** is not a weapon card.`);

    const inventory = await inv.loadInventory();
    const owned     = inv.hasCard(inventory, userId, weapon.id);
    const meta      = rarityMeta(weapon.rarity);

    const wStats  = config.WEAPON_STATS[weapon.rarity];
    const sigName = wDef.weaponOf ? (lookupCard(wDef.weaponOf)?.name ?? wDef.weaponOf) : null;

    if (!owned) {
      const img = imgCache.getImage(weapon.id) ?? weapon.image ?? null;
      const tierLines = config.WEAPON_EVOLUTION_TIERS.map(t =>
        `${t.emoji} **Tier ${t.tier} — ${t.name}**: +${Math.round(t.statMult * 100)}% stats at Lv100`
      ).join('\n');
      const embed = new EmbedBuilder()
        .setColor(meta.color)
        .setTitle(`⚔️ ${weapon.name}`)
        .setDescription(`${meta.emoji} **${meta.label}** weapon — ${weapon.series}\n\n${weapon.desc}`)
        .setFooter({ text: 'You do not own this weapon yet' });
      if (wStats) {
        embed.addFields(
          { name: '⚡ Power',           value: `${wStats.power.toLocaleString()}`,  inline: true },
          { name: '❤️ Health Boosted',  value: `${wStats.hp.toLocaleString()}`,     inline: true },
          { name: '💨 Speed Boosted',   value: `${wStats.speed.toLocaleString()}`,  inline: true },
          { name: '⚔️ Attack Boosted',  value: `${wStats.atkMin}–${wStats.atkMax}`, inline: true },
          { name: '🃏 Signature Cards', value: sigName ?? '—',                      inline: true },
          { name: '🏷️ Type',           value: 'Weapon',                            inline: true },
        );
      }
      embed.addFields({ name: '📈 Evolution Tiers', value: tierLines, inline: false });
      if (img) embed.setImage(img);
      return message.reply({ embeds: [embed] });
    }

    const wData    = inv.getWeaponData(inventory, userId, weapon.id);
    const tier     = wData.evolutionTier ?? 1;
    const prestige = wData.prestige ?? 0;
    const tierData = config.WEAPON_EVOLUTION_TIERS[tier - 1];
    const nextTier = config.WEAPON_EVOLUTION_TIERS[tier];
    const shards   = (inv.getCharacterShards(inventory, userId)[weapon.id] ?? 0);
    const invCard  = inv.getCards(inventory, userId).find(c => c.id === weapon.id);
    const level    = invCard?.level ?? 1;

    const progressToNext = nextTier
      ? `\n**Progress to Tier ${tier + 1}:** ${prestige}/${config.WEAPON_EVOLVE_PRESTIGE} prestige  |  ${shards}/${config.WEAPON_EVOLVE_SHARDS} shards`
      : '\n**⚡ Maximum evolution reached!**';

    const img = imgCache.getImage(weapon.id) ?? weapon.image ?? null;
    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`⚔️ ${weapon.name} — Your Weapon`)
      .setDescription(
        `${meta.emoji} **${meta.label}** weapon — ${weapon.series}\n\n` +
        `${tierData.emoji} **Tier ${tier} — ${tierData.name}**\n` +
        `**Level:** ${level} / 100  |  **Weapon Prestige:** ${prestige}\n` +
        `**Stat Bonus:** +${Math.round(tierData.statMult * (level / 100) * 100)}% (at current level)` +
        progressToNext
      )
      .setFooter({ text: `Equip with: ZP equip <cardId> ${weapon.id}` });
    if (wStats) {
      embed.addFields(
        { name: '⚡ Power',           value: `${wStats.power.toLocaleString()}`,  inline: true },
        { name: '❤️ Health Boosted',  value: `${wStats.hp.toLocaleString()}`,     inline: true },
        { name: '💨 Speed Boosted',   value: `${wStats.speed.toLocaleString()}`,  inline: true },
        { name: '⚔️ Attack Boosted',  value: `${wStats.atkMin}–${wStats.atkMax}`, inline: true },
        { name: '🃏 Signature Cards', value: sigName ?? '—',                      inline: true },
        { name: '🏷️ Type',           value: 'Weapon',                            inline: true },
      );
    }
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
    if (r.candyTokens > 0) { inv.addLockedCandyTokens(inventory, userId, r.candyTokens); lines.push(`**${r.candyTokens} Candy Token${r.candyTokens === 1 ? '' : 's'}** 🔒 *(trade-locked)*`); }
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

  // ── imgreview ─────────────────────────────────────────────
  if (command === 'imgreview' || command === 'imgrev') {
    if (!isAdmin(userId)) return;
    const filter = args.join(' ').trim() || '';
    const filteredCards = getImageReviewCards(filter);
    if (filteredCards.length === 0) {
      return message.reply(`No cards found${filter ? ` matching "${filter}"` : ''}.`);
    }
    const expiry = Date.now() + 30 * 60_000;
    const { embed, components } = buildImageReviewEmbed(userId, filteredCards, 0, filter || '_', expiry);
    return message.reply({ embeds: [embed], components });
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

  // ── givelevelscrolls ──────────────────────────────────────
  if (command === 'givelevelscrolls' || command === 'gls') {
    if (!isAdmin(userId)) return;
    const target = message.mentions.users.first() ?? message.author;
    const amount = parseInt(args.find(a => !a.startsWith('<@')), 10);
    if (isNaN(amount) || amount <= 0) return message.reply('Usage: `ZP givelevelscrolls [@user] <amount>`');
    const inventory = await inv.loadInventory();
    for (let i = 0; i < amount; i++) inv.addItem(inventory, target.id, 'level_scroll');
    await inv.saveInventory(inventory);
    return message.reply(`Gave **${amount} 📜 Level Scroll${amount === 1 ? '' : 's'}** to **${target.username}**.`);
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

  // ── removecard ────────────────────────────────────────────
  if (command === 'removecard' || command === 'rc') {
    if (!isAdmin(userId)) return;
    const target = message.mentions.users.first();
    const nonMentionArgs = args.filter(a => !a.startsWith('<@'));
    const cardQuery = nonMentionArgs.join(' ');

    if (!target || !cardQuery)
      return message.reply('Usage: `ZP removecard @user <cardId or name>`');

    const card = resolveCard(cardQuery) ?? lookupCard(cardQuery.toLowerCase());
    if (!card) return message.reply(`❌ No card found matching \`${cardQuery}\`.`);

    const inventory = await inv.loadInventory();
    if (!inv.hasCard(inventory, target.id, card.id))
      return message.reply(`❌ **${target.username}** does not own **${card.name}**.`);

    inv.removeCardFromInventory(inventory, target.id, card.id);
    await inv.saveInventory(inventory);

    const emoji = emojiCache.getEmoji(card.id) ?? '';
    return message.reply(`🗑️ Removed **${emoji}${card.name}** from **${target.username}**'s collection.`);
  }

  // ── removeshards ──────────────────────────────────────────
  if (command === 'removeshards' || command === 'rs') {
    if (!isAdmin(userId)) return;
    const target = message.mentions.users.first();
    const nonMentionArgs = args.filter(a => !a.startsWith('<@'));
    const cardQuery = nonMentionArgs.slice(0, -1).join(' ') || nonMentionArgs[0];
    const amountArg = nonMentionArgs[nonMentionArgs.length - 1];
    const amount = parseInt(amountArg, 10);

    if (!target || !cardQuery || isNaN(amount) || amount <= 0)
      return message.reply('Usage: `ZP removeshards @user <cardId or name> <amount>`\nUse `all` as amount to wipe every shard.');

    const card = resolveCard(cardQuery) ?? lookupCard(cardQuery.toLowerCase());
    if (!card) return message.reply(`❌ No card found matching \`${cardQuery}\`.`);

    const inventory = await inv.loadInventory();
    const userShards = inv.getCharacterShards(inventory, target.id);
    const current = userShards[card.id] ?? 0;
    if (current === 0)
      return message.reply(`❌ **${target.username}** has no **${card.name}** shards.`);

    const toRemove = Math.min(amount, current);
    inv.removeCharacterShards(inventory, target.id, card.id, toRemove);
    await inv.saveInventory(inventory);

    const emoji = emojiCache.getEmoji(card.id) ?? '';
    return message.reply(`🗑️ Removed **${toRemove}x ${emoji}${card.name} shard${toRemove === 1 ? '' : 's'}** from **${target.username}** (had ${current}, now has ${current - toRemove}).`);
  }

  // ── clearshards ───────────────────────────────────────────
  if (command === 'clearshards' || command === 'cs') {
    if (!isAdmin(userId)) return;
    const target = message.mentions.users.first();
    const nonMentionArgs = args.filter(a => !a.startsWith('<@'));
    const cardQuery = nonMentionArgs.join(' ');

    if (!target || !cardQuery)
      return message.reply('Usage: `ZP clearshards @user <cardId or name>` — wipes ALL shards of that card.');

    const card = resolveCard(cardQuery) ?? lookupCard(cardQuery.toLowerCase());
    if (!card) return message.reply(`❌ No card found matching \`${cardQuery}\`.`);

    const inventory = await inv.loadInventory();
    const userShards = inv.getCharacterShards(inventory, target.id);
    const current = userShards[card.id] ?? 0;
    if (current === 0)
      return message.reply(`❌ **${target.username}** has no **${card.name}** shards to clear.`);

    delete userShards[card.id];
    await inv.saveInventory(inventory);

    const emoji = emojiCache.getEmoji(card.id) ?? '';
    return message.reply(`🗑️ Cleared all **${current}x ${emoji}${card.name} shard${current === 1 ? '' : 's'}** from **${target.username}**.`);
  }

  // ── givecard ──────────────────────────────────────────────
  if (command === 'givecard' || command === 'gc') {
    const target = message.mentions.users.first();
    const nonMentionArgs = args.filter(a => !a.startsWith('<@'));
    const cardQuery = nonMentionArgs.join(' ');

    if (!target || !cardQuery)
      return message.reply('Usage: `ZP givecard @user <cardId or name>`');

    const card = resolveCard(cardQuery) ?? lookupCard(cardQuery);
    if (!card) return message.reply(`❌ No card found matching \`${cardQuery}\`.`);

    const inventory = await inv.loadInventory();
    const { isDupe } = inv.addCardToInventory(inventory, target.id, card);
    await inv.saveInventory(inventory);
    const meta  = rarityMeta(card.rarity);
    const emoji = emojiCache.getEmoji(card.id) ?? '';
    if (isDupe) {
      return message.reply(`**${target.username}** already owns **${card.name}** — gave them **1 ${emoji}${card.name} Shard** instead.`);
    }
    return message.reply(`${meta.emoji} Gave **${emoji}${card.name}** (${meta.label}) to **${target.username}**!`);
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

  // ── rebuildemojis ────────────────────────────────────────
  if (command === 'rebuildemojis' || command === 're') {
    if (!isAdmin(userId)) return;
    const reply = await message.reply('🗑️ Deleting all existing emojis from emoji servers… this will take a while.');
    try {
      await emojiCache.deleteAllEmojis(client);
      await reply.edit('🔄 All emojis deleted. Now re-uploading fresh emojis from updated images… this may take several minutes.');
      const imgCache = require('./imageCache');
      await emojiCache.syncEmojis(client, CARDS, imgCache);
      return reply.edit('✅ Emoji rebuild complete! All card emojis have been refreshed with the latest official art.');
    } catch (err) {
      console.error('[rebuildemojis]', err);
      return reply.edit(`❌ Emoji rebuild encountered an error: ${err.message}`);
    }
  }

  // ── banaccount ────────────────────────────────────────────
  if (command === 'banaccount' || command === 'ban') {
    if (!isAdmin(userId)) return;
    const targetId = args.find(a => !a.startsWith('<@')) ?? message.mentions.users.first()?.id;
    if (!targetId) return message.reply('Usage: `ZP banaccount <userId>` — provide the user\'s Discord account ID.');
    if (targetId === ADMIN_ID) return message.reply('Cannot ban the admin account.');
    if (bannedUsers.has(targetId)) return message.reply(`Account \`${targetId}\` is already banned.`);
    bannedUsers.add(targetId);
    saveBannedUsers();
    return message.reply(`🔨 Account \`${targetId}\` has been **fully banned** from using the bot.`);
  }

  // ── unbanaccount ──────────────────────────────────────────
  if (command === 'unbanaccount' || command === 'unban') {
    if (!isAdmin(userId)) return;
    const targetId = args.find(a => !a.startsWith('<@')) ?? message.mentions.users.first()?.id;
    if (!targetId) return message.reply('Usage: `ZP unbanaccount <userId>` — provide the user\'s Discord account ID.');
    if (!bannedUsers.has(targetId)) return message.reply(`Account \`${targetId}\` is not currently banned.`);
    bannedUsers.delete(targetId);
    saveBannedUsers();
    return message.reply(`✅ Account \`${targetId}\` has been **unbanned** and can use the bot again.`);
  }

  // ── worldboss ─────────────────────────────────────────────
  // ZP worldboss              — view current world boss status
  // ZP worldboss spawn [channelId]  — (admin) spawn a world boss
  // ZP worldboss attack             — attack the world boss with your best team card
  // ZP worldboss end                — (admin) end the world boss and distribute rewards
  if (command === 'worldboss' || command === 'wb') {
    const sub = args[0]?.toLowerCase();

    // ── spawn (admin only) ────────────────────────────────
    if (sub === 'spawn') {
      if (!isAdmin(userId)) return message.reply('Only admins can spawn a World Boss.');
      const inventory = await inv.loadInventory();
      if (inv.getWorldBoss(inventory)) return message.reply('A World Boss is already active! Use `ZP worldboss end` to end it first.');

      const channelId = args[1] ?? message.channelId;

      // Pick a random MD or LT boss card
      const bossPool = CARDS.filter(c => (c.rarity === 'MD' || c.rarity === 'LT') && !c.weaponCard && !c.supportCard && !c.dittoCard);
      if (!bossPool.length) return message.reply('No boss-eligible cards found.');
      const bossCard = bossPool[Math.floor(Math.random() * bossPool.length)];
      const bossStats = getCardStats(bossCard, 100);

      const bossHp  = Math.round(bossStats.hp  * 50);  // 50× scaled for world boss
      const bossDmg = Math.round(bossStats.dmg * 50);

      const bossData = {
        bossCardId:   bossCard.id,
        bossName:     bossCard.name,
        bossSeries:   bossCard.series,
        bossRarity:   bossCard.rarity,
        maxHp:        bossHp,
        currentHp:    bossHp,
        bossDmg:      bossDmg,
        channelId,
        spawnedAt:    Date.now(),
        participants: {},
      };
      inv.setWorldBoss(inventory, bossData);
      await inv.saveInventory(inventory);

      const bossEmoji   = getEmoji(bossCard.id) ?? '';
      const bossMeta    = rarityMeta(bossCard.rarity);
      const targetCh    = client.channels.cache.get(channelId);
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🌍 WORLD BOSS HAS APPEARED!')
        .setDescription(
          `${bossEmoji} **${bossCard.name}** from *${bossCard.series}* ${bossMeta.emoji}\n\n` +
          `❤️ **HP:** ${bossHp.toLocaleString()}\n` +
          `⚔️ **DMG:** ${bossDmg.toLocaleString()}\n\n` +
          `**The more damage you deal, the bigger your share of the rewards!**\n` +
          `Use \`ZP worldboss attack\` to attack!\n\n` +
          `> Admins can end the boss with \`ZP worldboss end\` to distribute rewards.`
        )
        .setFooter({ text: `World Boss spawned in this channel` });

      if (targetCh && targetCh.id !== message.channelId) {
        await targetCh.send({ embeds: [embed] }).catch(() => {});
        return message.reply(`✅ World Boss **${bossCard.name}** spawned in <#${channelId}>!`);
      }
      return message.reply({ embeds: [embed] });
    }

    // ── end (admin only) ─────────────────────────────────
    if (sub === 'end') {
      if (!isAdmin(userId)) return message.reply('Only admins can end the World Boss.');
      const inventory = await inv.loadInventory();
      const boss = inv.getWorldBoss(inventory);
      if (!boss) return message.reply('No World Boss is currently active.');

      const parts = boss.participants ?? {};
      const totalDamage = Object.values(parts).reduce((s, p) => s + (p.damage ?? 0), 0);

      // Reward pool
      const totalYen   = 5_000_000;
      const totalStars = 50_000;

      const lines = [];
      const sorted = Object.entries(parts).sort((a, b) => (b[1].damage ?? 0) - (a[1].damage ?? 0));

      for (const [uid, pdata] of sorted) {
        const pct   = totalDamage > 0 ? (pdata.damage / totalDamage) : 0;
        const yen   = Math.round(totalYen   * pct);
        const stars = Math.round(totalStars * pct);
        if (yen > 0)   inv.addYen(inventory,   uid, yen);
        if (stars > 0) inv.addStars(inventory, uid, stars);
        const pctStr = (pct * 100).toFixed(1);
        lines.push(`<@${uid}> — **${pdata.damage?.toLocaleString() ?? 0}** dmg (${pctStr}%) → ¥${yen.toLocaleString()} / ⭐${stars.toLocaleString()}`);
      }

      inv.clearWorldBoss(inventory);
      await inv.saveInventory(inventory);

      const hpLeft = boss.currentHp;
      const hpPct  = boss.maxHp > 0 ? ((1 - hpLeft / boss.maxHp) * 100).toFixed(1) : '100';
      const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('🏆 World Boss Ended — Rewards Distributed!')
        .setDescription(
          `**${boss.bossName}** has been vanquished!\n` +
          `HP reduced by **${hpPct}%** — Total damage dealt: **${totalDamage.toLocaleString()}**\n\n` +
          (lines.length ? lines.join('\n') : '*No participants dealt damage.*')
        );
      return message.reply({ embeds: [embed] });
    }

    // ── attack ────────────────────────────────────────────
    if (sub === 'attack' || sub === 'atk') {
      const inventory = await inv.loadInventory();
      const boss = inv.getWorldBoss(inventory);
      if (!boss) return message.reply('No World Boss is currently active right now. Watch for an announcement!');
      if (boss.currentHp <= 0) return message.reply('The World Boss has already been defeated! Wait for the rewards to be distributed.');

      // Attack cooldown: 30 seconds
      const WB_COOLDOWN = 30_000;
      const lastAtk = worldBossAttackCooldowns.get(userId) ?? 0;
      const remaining = WB_COOLDOWN - (Date.now() - lastAtk);
      if (remaining > 0) {
        return message.reply(`You're attacking too fast! Wait **${Math.ceil(remaining / 1000)}s** before attacking the World Boss again.`);
      }

      // Get strongest alive team card
      const team = inv.getTeam(inventory, userId);
      if (!team.length) return message.reply('You have no cards on your team! Build a team first with `ZP team add <card>`.');

      const bestSlot = team.reduce((best, slot) => {
        if (!slot.cardId) return best;
        const card = lookupCard(slot.cardId);
        if (!card) return best;
        const power = inv.getSlotPower(inventory, userId, slot.cardId);
        return power > (best.power ?? -1) ? { slot, card, power } : best;
      }, { slot: null, card: null, power: -1 });

      if (!bestSlot.card) return message.reply('No valid cards found on your team.');

      const { slot: atkSlot, card: atkCard } = bestSlot;
      const atkBc = buildBattleCard({ card: atkCard, level: atkSlot.level ?? 1, plating: null }, atkSlot);
      const fakeBoss = { maxHp: boss.maxHp, dmg: boss.bossDmg, hp: boss.currentHp, technique: false, specialAbility: null };

      const { dmg, crit } = calcDamage(atkBc, fakeBoss);
      const actualDmg = Math.min(dmg, boss.currentHp);

      worldBossAttackCooldowns.set(userId, Date.now());
      inv.recordWorldBossDamage(inventory, userId, message.author.username, actualDmg);
      await inv.saveInventory(inventory);

      // Reload to get updated state
      const updatedBoss = inv.getWorldBoss(inventory);
      const hpLeft   = updatedBoss?.currentHp ?? 0;
      const hpBar    = hpBar_fn(hpLeft, boss.maxHp);
      const totalDmg = Object.values(updatedBoss?.participants ?? {}).reduce((s, p) => s + (p.damage ?? 0), 0);
      const myDmg    = updatedBoss?.participants?.[userId]?.damage ?? actualDmg;
      const myPct    = totalDmg > 0 ? ((myDmg / totalDmg) * 100).toFixed(1) : '100.0';

      const bossEmoji = getEmoji(boss.bossCardId) ?? '👹';
      const critNote  = crit ? ' 👁️ **GOLDEN PUPILS CRIT — 5×!**' : '';
      const defeatedNote = hpLeft <= 0 ? '\n\n💀 **The World Boss has been slain!** Admins will distribute the rewards shortly.' : '';

      const embed = new EmbedBuilder()
        .setColor(hpLeft <= 0 ? 0xFFD700 : 0xFF4757)
        .setTitle(`${bossEmoji} World Boss — ${boss.bossName}`)
        .setDescription(
          `${hpBar} **${hpLeft.toLocaleString()} / ${boss.maxHp.toLocaleString()} HP**\n\n` +
          `⚔️ **${message.author.username}**'s **${atkCard.name}** dealt **${actualDmg.toLocaleString()}** damage!${critNote}\n` +
          `📊 Your total contribution: **${myDmg.toLocaleString()}** dmg (**${myPct}%** of total)\n` +
          `> The more damage you deal, the higher your reward share!${defeatedNote}`
        );
      return message.reply({ embeds: [embed] });
    }

    // ── status (default) ─────────────────────────────────
    {
      const inventory = await inv.loadInventory();
      const boss = inv.getWorldBoss(inventory);
      if (!boss) {
        return message.reply('No World Boss is currently active. Watch for admin announcements!');
      }

      const parts = boss.participants ?? {};
      const totalDmg = Object.values(parts).reduce((s, p) => s + (p.damage ?? 0), 0);
      const sorted   = Object.entries(parts)
        .sort((a, b) => (b[1].damage ?? 0) - (a[1].damage ?? 0))
        .slice(0, 10);

      const leaderboard = sorted.map(([uid, p], i) => {
        const pct = totalDmg > 0 ? ((p.damage / totalDmg) * 100).toFixed(1) : '0.0';
        return `**${i + 1}.** ${p.username} — ${(p.damage ?? 0).toLocaleString()} dmg (${pct}%)`;
      }).join('\n') || '*No damage dealt yet.*';

      const hpLeft   = boss.currentHp;
      const bossEmoji = getEmoji(boss.bossCardId) ?? '👹';
      const bossMeta  = rarityMeta(boss.bossRarity ?? 'MD');

      const embed = new EmbedBuilder()
        .setColor(0xFF4757)
        .setTitle(`${bossEmoji} World Boss — ${boss.bossName}`)
        .setDescription(
          `${bossMeta.emoji} *${boss.bossSeries ?? ''}*\n\n` +
          `${hpBar_fn(hpLeft, boss.maxHp)} **${hpLeft.toLocaleString()} / ${boss.maxHp.toLocaleString()} HP**\n\n` +
          `**Top Attackers:**\n${leaderboard}\n\n` +
          `Use \`ZP worldboss attack\` to join the fight!`
        );
      return message.reply({ embeds: [embed] });
    }
  }

  // ── listbanned ────────────────────────────────────────────
  if (command === 'listbanned') {
    if (!isAdmin(userId)) return;
    if (bannedUsers.size === 0) return message.reply('No accounts are currently banned.');
    const list = [...bannedUsers].map(id => `\`${id}\``).join('\n');
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('🔨 Banned Accounts')
          .setDescription(list)
          .setFooter({ text: `${bannedUsers.size} banned account${bannedUsers.size === 1 ? '' : 's'}` }),
      ],
    });
  }
});

// ── Error handler ─────────────────────────────────────────
client.on('error', (err) => {
  console.error('[Discord Client Error]', err);
});

// ── Login ─────────────────────────────────────────────────

console.log("Ping loop started");

if (!process.env.DISCORD_TOKEN) {
  console.warn('[bot] No DISCORD_TOKEN set — running in web-only mode (status page still available).');
} else {
  client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('[bot] Discord login failed:', err.message, '— web status page is still running.');
  });
}
