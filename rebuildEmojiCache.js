// ============================================================
//  rebuildEmojiCache.js
//  Reads all existing emojis from the Discord emoji servers
//  and rebuilds emoji_cache.json from them.
//  Run this when the cache file is empty but emojis already
//  exist on the servers.
//
//  Usage: node rebuildEmojiCache.js
// ============================================================

const { Client, GatewayIntentBits } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const { CARDS }         = require('./cards');
const { EMOJI_SERVERS } = require('./emojiCache');

const CACHE_FILE = path.join(__dirname, 'data', 'emoji_cache.json');

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌  DISCORD_TOKEN env var not set.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
  console.log(`✅  Logged in as ${client.user.tag}`);

  // Build a lookup: emojiName → cardId
  // (mirrors the name transformation used when uploading)
  const nameToCardId = {};
  for (const card of CARDS) {
    const emojiName = card.id.replace(/[^a-zA-Z0-9_]/g, '_').padEnd(2, '_');
    nameToCardId[emojiName] = card.id;
  }

  const cache = {};
  let matched  = 0;
  let unmatched = 0;

  for (const serverId of EMOJI_SERVERS) {
    let guild;
    try {
      guild = await client.guilds.fetch(serverId);
    } catch (err) {
      console.warn(`⚠️  Could not fetch guild ${serverId}: ${err.message}`);
      continue;
    }

    let emojis;
    try {
      emojis = await guild.emojis.fetch();
    } catch (err) {
      console.warn(`⚠️  Could not fetch emojis from ${serverId}: ${err.message}`);
      continue;
    }

    console.log(`📦  Server ${serverId}: ${emojis.size} emojis found`);

    for (const [, emoji] of emojis) {
      const cardId = nameToCardId[emoji.name];
      if (cardId) {
        cache[cardId] = { name: emoji.name, id: emoji.id };
        matched++;
      } else {
        console.log(`   ⚠️  No card match for emoji: ${emoji.name} (${emoji.id})`);
        unmatched++;
      }
    }
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  console.log(`\n✅  Done! Cached ${matched} emojis. (${unmatched} unmatched)`);
  console.log(`   Saved to ${CACHE_FILE}`);

  client.destroy();
});

client.login(token).catch(err => {
  console.error('❌  Login failed:', err.message);
  process.exit(1);
});
