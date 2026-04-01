const fs   = require('fs');
const path = require('path');

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

/**
 * At bot startup: upload each card's image as a custom emoji, split across
 * the 3 EMOJI_SERVERS (up to 50 per server). Already-cached cards are skipped.
 * imgCache is the imageCache module (passed in to avoid circular deps).
 */
async function syncEmojis(client, cards, imgCache) {
  const cache = load();
  console.log(`Emoji sync: checking ${cards.length} cards across ${EMOJI_SERVERS.length} servers...`);

  let uploaded = 0;
  let skipped  = 0;
  let failed   = 0;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];

    if (cache[card.id]) {
      skipped++;
      continue;
    }

    const imageUrl = imgCache.getImage(card.id) ?? card.image ?? null;

    if (!imageUrl) {
      console.warn(`😀 Emoji sync: no image for ${card.id}, skipping.`);
      failed++;
      continue;
    }

    // Try each server starting from the preferred one; fall back if full
    const preferredIndex = Math.min(Math.floor(i / CARDS_PER_SERVER), EMOJI_SERVERS.length - 1);
    let uploadedOk = false;

    for (let si = preferredIndex; si < EMOJI_SERVERS.length; si++) {
      const serverId = EMOJI_SERVERS[si];
      try {
        const guild = await client.guilds.fetch(serverId);
        const emoji = await guild.emojis.create({ attachment: imageUrl, name: card.id });
        cache[card.id] = { name: emoji.name, id: emoji.id };
        save(cache);
        uploaded++;
        await sleep(500);
        uploadedOk = true;
        break;
      } catch (err) {
        if (err.message && err.message.includes('Maximum number of emojis reached')) {
          console.warn(`😀 Emoji sync: server ${serverId} full, trying next...`);
          continue;
        }
        console.error(`😀 Emoji sync: failed to upload ${card.id} → server ${serverId}: ${err.message}`);
        break;
      }
    }

    if (!uploadedOk) {
      failed++;
    }
  }

  console.log(`😀 Emoji sync done: ${uploaded} uploaded, ${skipped} already cached, ${failed} failed.`);
}

/**
 * Delete every custom emoji from all EMOJI_SERVERS, then wipe the local cache.
 * Call this before re-syncing to get fresh emojis from updated images.
 */
async function deleteAllEmojis(client) {
  const cache = {};
  save(cache); // clear cache file immediately

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

module.exports = { load, save, getEmoji, setEmoji, removeEmoji, syncEmojis, deleteAllEmojis, EMOJI_SERVERS };
