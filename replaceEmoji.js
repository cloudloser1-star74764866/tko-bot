// ============================================================
//  replaceEmoji.js
//  Replaces a single card's emoji on Discord with a new image URL.
//  Usage: node replaceEmoji.js <cardId> <imageUrl>
//  Example: node replaceEmoji.js sukuna https://...
// ============================================================

const { Client, GatewayIntentBits } = require('discord.js');
const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');

const { EMOJI_SERVERS } = require('./emojiCache');
const CACHE_FILE = path.join(__dirname, 'data', 'emoji_cache.json');

function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); }
  catch { return {}; }
}

function saveCache(data) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

function fetchBuffer(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: 20000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (redirectsLeft <= 0) return reject(new Error('Too many redirects'));
        return resolve(fetchBuffer(res.headers.location, redirectsLeft - 1));
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timed out')); });
  });
}

async function run(client) {
  const [,, cardId, imageUrl] = process.argv;
  if (!cardId || !imageUrl) {
    console.error('Usage: node replaceEmoji.js <cardId> <imageUrl>');
    process.exit(1);
  }

  const cache = loadCache();
  const existing = cache[cardId];

  // 1. Fetch all emoji servers
  const guilds = [];
  for (const id of EMOJI_SERVERS) {
    try { guilds.push(await client.guilds.fetch(id)); }
    catch (e) { console.warn(`⚠️  Could not fetch guild ${id}: ${e.message}`); }
  }

  // 2. Delete old emoji if it exists in cache
  if (existing) {
    console.log(`🗑️  Found existing emoji for "${cardId}" (id: ${existing.id}). Searching servers to delete...`);
    let deleted = false;
    for (const guild of guilds) {
      try {
        const emojis = await guild.emojis.fetch();
        const match = emojis.find(e => e.id === existing.id);
        if (match) {
          await match.delete();
          console.log(`   Deleted from server "${guild.name}"`);
          deleted = true;
          break;
        }
      } catch (e) {
        console.warn(`   Error checking server "${guild.name}": ${e.message}`);
      }
    }
    if (!deleted) console.warn(`   Emoji not found on any server (may have been removed already).`);
    delete cache[cardId];
    saveCache(cache);
  } else {
    console.log(`ℹ️  No existing emoji for "${cardId}" in cache.`);
  }

  // 3. Download new image
  console.log(`\n📥 Downloading image from:\n   ${imageUrl}`);
  let buffer;
  try {
    buffer = await fetchBuffer(imageUrl);
    console.log(`   Downloaded ${(buffer.length / 1024).toFixed(1)} KB`);
  } catch (e) {
    console.error(`❌ Failed to download image: ${e.message}`);
    process.exit(1);
  }

  // 4. Upload to first server with space
  const emojiName = cardId.replace(/[^a-zA-Z0-9_]/g, '_').padEnd(2, '_');
  for (const guild of guilds) {
    try {
      const emojis = await guild.emojis.fetch();
      if (emojis.size >= 50) {
        console.log(`   Server "${guild.name}" is full (${emojis.size}/50), trying next...`);
        continue;
      }
      const emoji = await guild.emojis.create({ attachment: buffer, name: emojiName });
      cache[cardId] = { name: emoji.name, id: emoji.id };
      saveCache(cache);
      console.log(`✅ Uploaded! <:${emoji.name}:${emoji.id}> on server "${guild.name}"`);
      console.log(`   emoji_cache.json updated.`);
      return;
    } catch (e) {
      console.error(`❌ Upload failed on "${guild.name}": ${e.message}`);
    }
  }

  console.error('❌ Could not upload to any server.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once('clientReady', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}\n`);
  try { await run(client); }
  catch (e) { console.error('Fatal:', e); }
  client.destroy();
  process.exit(0);
});
client.login(process.env.DISCORD_TOKEN).catch(e => {
  console.error('Login failed:', e.message);
  process.exit(1);
});
