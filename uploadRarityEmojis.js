// ============================================================
//  uploadRarityEmojis.js
//  Uploads custom Discord emojis for rarity tiers, plating
//  tiers, and items. Images sourced from the Twemoji CDN
//  (Twitter open-source emoji set, 72x72 PNG).
//
//  Uploaded emojis are stored in emoji_cache.json under keys:
//    rarity_R, rarity_E, rarity_L, rarity_MY, rarity_UR, rarity_LT
//    plating_bronze, plating_silver, plating_gold, plating_diamond
//    item_liberation, item_tattoos, item_instincts, item_ramen,
//    item_drugs, item_raid_ticket, item_mythical_raid_ticket,
//    item_omega_raid_ticket, item_hellish_raid_ticket
//
//  Already-uploaded keys are skipped. Re-run to pick up any
//  that failed last time.
//
//  Usage: node uploadRarityEmojis.js
// ============================================================

const { Client, GatewayIntentBits } = require('discord.js');
const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');

const { EMOJI_SERVERS } = require('./emojiCache');
const CACHE_FILE = path.join(__dirname, 'data', 'emoji_cache.json');
const TWEMOJI    = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72';

// ── Emoji definitions ─────────────────────────────────────
// key → { label, url }  (url uses Twemoji codepoint PNGs)
const UI_EMOJIS = {
  // Rarity tiers
  rarity_R:  { label: 'rarity_R',  url: `${TWEMOJI}/2b50.png`  },  // ⭐
  rarity_E:  { label: 'rarity_E',  url: `${TWEMOJI}/1f49c.png` },  // 💜
  rarity_L:  { label: 'rarity_L',  url: `${TWEMOJI}/1f31f.png` },  // 🌟
  rarity_MY: { label: 'rarity_MY', url: `${TWEMOJI}/1f525.png` },  // 🔥
  rarity_UR: { label: 'rarity_UR', url: `${TWEMOJI}/1f48e.png` },  // 💎
  rarity_LT: { label: 'rarity_LT', url: `${TWEMOJI}/1f338.png` },  // 🌸

  // Plating tiers
  plating_bronze:  { label: 'plating_bronze',  url: `${TWEMOJI}/1f949.png` },  // 🥉
  plating_silver:  { label: 'plating_silver',  url: `${TWEMOJI}/1f948.png` },  // 🥈
  plating_gold:    { label: 'plating_gold',    url: `${TWEMOJI}/1f947.png` },  // 🥇
  plating_diamond: { label: 'plating_diamond', url: `${TWEMOJI}/1f4a0.png` },  // 💠

  // Items
  item_liberation:           { label: 'item_liberation',           url: `${TWEMOJI}/2600.png`  },  // ☀️
  item_tattoos:              { label: 'item_tattoos',              url: `${TWEMOJI}/1f531.png` },  // 🔱
  item_instincts:            { label: 'item_instincts',            url: `${TWEMOJI}/1f300.png` },  // 🌀
  item_ramen:                { label: 'item_ramen',                url: `${TWEMOJI}/1f35c.png` },  // 🍜
  item_drugs:                { label: 'item_drugs',                url: `${TWEMOJI}/1f48a.png` },  // 💊
  item_raid_ticket:          { label: 'item_raid_ticket',          url: `${TWEMOJI}/1f39f.png` },  // 🎟
  item_mythical_raid_ticket: { label: 'item_mythical_raid_ticket', url: `${TWEMOJI}/1f319.png` },  // 🌙
  item_omega_raid_ticket:    { label: 'item_omega_raid_ticket',    url: `${TWEMOJI}/26a1.png`  },  // ⚡
  item_hellish_raid_ticket:  { label: 'item_hellish_raid_ticket',  url: `${TWEMOJI}/1f480.png` },  // 💀
};

// ── Helpers ───────────────────────────────────────────────

function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); }
  catch { return {}; }
}

function saveCache(data) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchBuffer(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `${parsedUrl.protocol}//${parsedUrl.hostname}/`,
      },
    };
    const req = lib.get(options, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (redirectsLeft <= 0) return reject(new Error('Too many redirects'));
        return resolve(fetchBuffer(res.headers.location, redirectsLeft - 1));
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end',  () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error',   reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timed out')); });
  });
}

async function uploadEmoji(guild, name, imageBuffer) {
  const upload  = guild.emojis.create({ attachment: imageBuffer, name });
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error('Upload timed out after 20s')), 20000)
  );
  return Promise.race([upload, timeout]);
}

// ── Main ──────────────────────────────────────────────────

async function run(client) {
  const cache = loadCache();

  const todo = Object.entries(UI_EMOJIS).filter(([key]) => !cache[key]);

  console.log(`\n🎨 UI emoji uploader`);
  console.log(`   Total UI emojis : ${Object.keys(UI_EMOJIS).length}`);
  console.log(`   Already uploaded: ${Object.keys(UI_EMOJIS).length - todo.length}`);
  console.log(`   To upload       : ${todo.length}\n`);

  if (todo.length === 0) {
    console.log('✅ All UI emojis already cached. Nothing to do.');
    return;
  }

  const guilds      = [];
  const emojiCounts = [];
  for (const id of EMOJI_SERVERS) {
    try {
      const g = await client.guilds.fetch(id);
      const e = await g.emojis.fetch();
      guilds.push(g);
      emojiCounts.push(e.size);
      console.log(`   Server "${g.name}" has ${e.size}/50 emoji slots`);
    } catch (err) {
      console.warn(`⚠️  Could not fetch guild ${id}: ${err.message}`);
    }
  }

  if (guilds.length === 0) {
    console.error('❌ No emoji servers accessible. Aborting.');
    return;
  }

  console.log('');
  let uploaded = 0;
  let failed   = 0;
  const total  = todo.length;

  for (let i = 0; i < todo.length; i++) {
    const [key, def] = todo[i];
    const num = i + 1;

    let buffer;
    try {
      buffer = await fetchBuffer(def.url);
    } catch (e) {
      console.log(`[${num}/${total}] ❌ ${key} — download failed: ${e.message}`);
      failed++;
      continue;
    }

    const emojiName = def.label.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 32).padEnd(2, '_');

    let ok = false;
    for (let gi = 0; gi < guilds.length; gi++) {
      if (emojiCounts[gi] >= 50) continue;
      try {
        const emoji = await uploadEmoji(guilds[gi], emojiName, buffer);
        cache[key] = { name: emoji.name, id: emoji.id };
        saveCache(cache);
        emojiCounts[gi]++;
        uploaded++;
        ok = true;
        console.log(`[${num}/${total}] ✅ ${key} → <:${emoji.name}:${emoji.id}>`);
        await sleep(600);
        break;
      } catch (err) {
        if (err.message && err.message.toLowerCase().includes('maximum number of emojis')) {
          emojiCounts[gi] = 50;
          continue;
        }
        console.log(`[${num}/${total}] ❌ ${key} — upload failed on server ${gi + 1}: ${err.message}`);
        break;
      }
    }
    if (!ok) failed++;
  }

  console.log(`\n🏁 Done! ${uploaded} uploaded, ${failed} failed.`);
  console.log(`   Cache saved to ${CACHE_FILE}`);
}

// ── Boot ──────────────────────────────────────────────────

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  try {
    await run(client);
  } catch (e) {
    console.error('Fatal:', e);
  }
  client.destroy();
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN).catch(e => {
  console.error('Login failed:', e.message);
  process.exit(1);
});
