const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');

const FILE = path.join(__dirname, 'data', 'emoji_cache.json');

const EMOJI_SERVERS = [
  '1488816245116768379',
  '1488815993416454166',
  '1488684823286648932',
  '1488853555388612711',
];

const CARDS_PER_SERVER = 50;

function load() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
  catch { return {}; }
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function getEmoji(cardId) {
  const cache = load();
  const entry = cache[cardId];
  if (!entry) return null;
  return `<:${entry.name}:${entry.id}>`;
}

function setEmoji(cardId, name, id) {
  const cache = load();
  cache[cardId] = { name, id };
  save(cache);
}

function removeEmoji(cardId) {
  const cache = load();
  delete cache[cardId];
  save(cache);
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
      res.on('end',  () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error',   reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
  });
}

/** Upload one emoji to a guild, with a hard 20-second timeout */
async function uploadEmoji(guild, name, imageBuffer) {
  const upload  = guild.emojis.create({ attachment: imageBuffer, name });
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error('Upload timed out after 20s')), 20000)
  );
  return Promise.race([upload, timeout]);
}

/**
 * Log cache status on bot startup.
 * Does NOT upload anything — use buildEmojiCache.js for that.
 */
function logCacheStatus(cards) {
  const cache   = load();
  const cached  = cards.filter(c => cache[c.id]).length;
  const missing = cards.length - cached;
  console.log(`😀 Emoji cache: ${cached}/${cards.length} cards ready.${missing > 0 ? ` (${missing} missing — run buildEmojiCache.js to upload)` : ''}`);
}

/**
 * Upload any cards not yet in the emoji cache.
 * Already-cached cards are skipped. Uses buffer download + timeout so it never hangs.
 * imgCache is the imageCache module (passed in to avoid circular deps).
 */
async function syncEmojis(client, cards, imgCache) {
  const cache = load();
  const todo  = cards.filter(c => !cache[c.id]);

  console.log(`😀 Emoji sync: ${cards.length - todo.length} already cached, ${todo.length} to upload...`);

  if (todo.length === 0) {
    console.log('😀 Emoji sync: all cards cached, nothing to do.');
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
    } catch (err) {
      console.warn(`😀 Emoji sync: could not fetch guild ${id}: ${err.message}`);
    }
  }

  let uploaded = 0;
  let failed   = 0;

  for (let i = 0; i < todo.length; i++) {
    const card = todo[i];

    let imageUrl = imgCache.getImage(card.id) ?? card.image ?? null;
    if (!imageUrl) {
      imageUrl = await imgCache.fetchFallbackImage(card.id, card.name).catch(() => null);
    }
    if (!imageUrl) {
      console.warn(`😀 Emoji sync: no image for ${card.id}, skipping.`);
      failed++;
      continue;
    }

    let imageBuffer;
    try {
      imageBuffer = await fetchBuffer(imageUrl);
    } catch (e) {
      console.error(`😀 Emoji sync: image download failed for ${card.id}: ${e.message}`);
      failed++;
      continue;
    }

    const emojiName = card.id.replace(/[^a-zA-Z0-9_]/g, '_').padEnd(2, '_');
    let uploadedOk  = false;

    for (let gi = 0; gi < guilds.length; gi++) {
      if (emojiCounts[gi] >= 50) continue;
      try {
        const emoji = await uploadEmoji(guilds[gi], emojiName, imageBuffer);
        cache[card.id] = { name: emoji.name, id: emoji.id };
        save(cache);
        emojiCounts[gi]++;
        uploaded++;
        uploadedOk = true;
        await sleep(600);
        break;
      } catch (err) {
        if (err.message && err.message.toLowerCase().includes('maximum number of emojis')) {
          emojiCounts[gi] = 50;
          continue;
        }
        console.error(`😀 Emoji sync: failed ${card.id} on server ${gi + 1}: ${err.message}`);
        break;
      }
    }

    if (!uploadedOk) failed++;
  }

  console.log(`😀 Emoji sync done: ${uploaded} uploaded, ${failed} failed.`);
}

/**
 * Delete every custom emoji from all EMOJI_SERVERS and wipe the local cache.
 * WARNING: Only call this when explicitly instructed to rebuild from scratch.
 */
async function deleteAllEmojis(client) {
  const cache = {};
  save(cache);

  let deleted = 0;
  let errors  = 0;

  for (const serverId of EMOJI_SERVERS) {
    try {
      const guild  = await client.guilds.fetch(serverId);
      const emojis = await guild.emojis.fetch();
      console.log(`🗑️  Deleting ${emojis.size} emojis from server ${serverId}...`);
      for (const [, emoji] of emojis) {
        try {
          await guild.emojis.delete(emoji.id);
          deleted++;
          await sleep(300);
        } catch (err) {
          console.error(`  Failed to delete ${emoji.name}: ${err.message}`);
          errors++;
        }
      }
    } catch (err) {
      console.error(`  Failed to access server ${serverId}: ${err.message}`);
      errors++;
    }
  }

  console.log(`🗑️  Emoji wipe done: ${deleted} deleted, ${errors} errors.`);
}

module.exports = { load, save, getEmoji, setEmoji, removeEmoji, logCacheStatus, syncEmojis, deleteAllEmojis, EMOJI_SERVERS };
