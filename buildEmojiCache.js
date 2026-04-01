// ============================================================
//  buildEmojiCache.js
//  One-time script: upload every card image as a Discord emoji,
//  save to emoji_cache.json, and never touch that file again
//  unless explicitly run again.
//
//  Usage: node buildEmojiCache.js
// ============================================================

const { Client, GatewayIntentBits } = require('discord.js');
const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');

const { CARDS }       = require('./cards');
const imgCache        = require('./imageCache');
const { EMOJI_SERVERS } = require('./emojiCache');

const CACHE_FILE = path.join(__dirname, 'data', 'emoji_cache.json');

// ── helpers ──────────────────────────────────────────────────

function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); }
  catch { return {}; }
}

function saveCache(data) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** Fetch a URL and return a Buffer, following up to 5 redirects */
function fetchBuffer(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: 15000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (redirectsLeft <= 0) return reject(new Error('Too many redirects'));
        return resolve(fetchBuffer(res.headers.location, redirectsLeft - 1));
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
  });
}

/** Upload one emoji to a guild with a 20-second overall timeout */
async function uploadEmoji(guild, name, imageBuffer) {
  const upload = guild.emojis.create({ attachment: imageBuffer, name });
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error('Upload timed out after 20s')), 20000)
  );
  return Promise.race([upload, timeout]);
}

// ── main ─────────────────────────────────────────────────────

async function run(client) {
  const cache = loadCache();

  const todo  = CARDS.filter(c => !cache[c.id]);
  const total = CARDS.length;
  const skip  = total - todo.length;

  console.log(`\n📦 Emoji cache builder starting...`);
  console.log(`   Total cards : ${total}`);
  console.log(`   Already done: ${skip}`);
  console.log(`   To upload   : ${todo.length}\n`);

  if (todo.length === 0) {
    console.log('✅ All cards already in cache. Nothing to do.');
    return;
  }

  // Pre-fetch all guilds once
  const guilds = [];
  for (const id of EMOJI_SERVERS) {
    try {
      guilds.push(await client.guilds.fetch(id));
    } catch (e) {
      console.warn(`⚠️  Could not fetch guild ${id}: ${e.message}`);
    }
  }

  if (guilds.length === 0) {
    console.error('❌ Could not access any emoji server. Aborting.');
    return;
  }

  // Track how many emojis are in each guild (fetch current counts)
  const emojiCounts = [];
  for (const guild of guilds) {
    const emojis = await guild.emojis.fetch();
    emojiCounts.push(emojis.size);
    console.log(`   Server "${guild.name}" has ${emojis.size}/50 emojis`);
  }
  console.log('');

  const MAX_PER_SERVER = 50;
  let uploaded = 0;
  let failed   = 0;

  for (let i = 0; i < todo.length; i++) {
    const card = todo[i];
    const num  = skip + i + 1;

    // Get image URL
    const imageUrl = imgCache.getImage(card.id) ?? card.image ?? null;
    if (!imageUrl) {
      console.log(`[${num}/${total}] ❌ ${card.id} — no image URL, skipping`);
      failed++;
      continue;
    }

    // Download image as buffer
    let imageBuffer;
    try {
      imageBuffer = await fetchBuffer(imageUrl);
    } catch (e) {
      console.log(`[${num}/${total}] ❌ ${card.id} — image download failed: ${e.message}`);
      failed++;
      continue;
    }

    // Emoji name must be 2+ chars, alphanumeric + underscores
    const emojiName = card.id.replace(/[^a-zA-Z0-9_]/g, '_').padEnd(2, '_');

    // Find a guild with space
    let uploadedOk = false;
    for (let gi = 0; gi < guilds.length; gi++) {
      if (emojiCounts[gi] >= MAX_PER_SERVER) continue;

      try {
        const emoji = await uploadEmoji(guilds[gi], emojiName, imageBuffer);
        cache[card.id] = { name: emoji.name, id: emoji.id };
        saveCache(cache);
        emojiCounts[gi]++;
        uploaded++;
        uploadedOk = true;
        console.log(`[${num}/${total}] ✅ ${card.id} → <:${emoji.name}:${emoji.id}> (server ${gi + 1})`);
        await sleep(600);
        break;
      } catch (e) {
        if (e.message && e.message.toLowerCase().includes('maximum number of emojis')) {
          emojiCounts[gi] = MAX_PER_SERVER;
          console.log(`[${num}/${total}] ⚠️  Server ${gi + 1} full, trying next...`);
          continue;
        }
        console.log(`[${num}/${total}] ❌ ${card.id} — upload error on server ${gi + 1}: ${e.message}`);
        break;
      }
    }

    if (!uploadedOk && !cache[card.id]) {
      failed++;
    }
  }

  console.log(`\n🏁 Done! ${uploaded} uploaded, ${skip} already cached, ${failed} failed.`);
  console.log(`   Emoji cache saved to ${CACHE_FILE}`);
}

// ── boot ─────────────────────────────────────────────────────

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  try {
    await run(client);
  } catch (e) {
    console.error('Fatal error:', e);
  }
  client.destroy();
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN).catch(e => {
  console.error('Login failed:', e.message);
  process.exit(1);
});
