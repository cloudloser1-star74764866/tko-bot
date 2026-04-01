const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'data', 'emoji_cache.json');

const EMOJI_SERVERS = [
  '1488816245116768379',
  '1488815993416454166',
  '1488684823286648932',
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

    const serverIndex = Math.min(Math.floor(i / CARDS_PER_SERVER), EMOJI_SERVERS.length - 1);
    const serverId    = EMOJI_SERVERS[serverIndex];
    const imageUrl    = imgCache.getImage(card.id) ?? card.image ?? null;

    if (!imageUrl) {
      console.warn(`😀 Emoji sync: no image for ${card.id}, skipping.`);
      failed++;
      continue;
    }

    try {
      const guild = await client.guilds.fetch(serverId);
      const emoji = await guild.emojis.create({ attachment: imageUrl, name: card.id });
      cache[card.id] = { name: emoji.name, id: emoji.id };
      save(cache);
      uploaded++;
      await sleep(500);
    } catch (err) {
      console.error(`😀 Emoji sync: failed to upload ${card.id} → server ${serverId}: ${err.message}`);
      failed++;
    }
  }

  console.log(`😀 Emoji sync done: ${uploaded} uploaded, ${skipped} already cached, ${failed} failed.`);
}

module.exports = { load, save, getEmoji, setEmoji, removeEmoji, syncEmojis };
