// One-shot script: delete all emojis from emoji servers and re-sync every card.
// Run with: node refreshEmojis.js

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const emojiCache = require('./emojiCache');
const imgCache   = require('./imageCache');
const { CARDS }  = require('./cards');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Cards to sync: ${CARDS.length}`);

  console.log('\n--- Step 1: Deleting all emojis ---');
  await emojiCache.deleteAllEmojis(client);

  console.log('\n--- Step 2: Refreshing missing images ---');
  await imgCache.refreshMissing();

  console.log('\n--- Step 3: Syncing emojis ---');
  await emojiCache.syncEmojis(client, CARDS, imgCache);

  console.log('\nDone! Logging out.');
  client.destroy();
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
