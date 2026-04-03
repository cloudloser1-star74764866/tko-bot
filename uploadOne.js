// Quick single-emoji uploader — targets a specific server directly
// Usage: node uploadOne.js <cardId> <imageUrl> <serverId>

const { Client, GatewayIntentBits } = require('discord.js');
const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');

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
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timed out')); });
  });
}

async function run(client) {
  const [,, cardId, imageUrl, serverId] = process.argv;
  if (!cardId || !imageUrl || !serverId) {
    console.error('Usage: node uploadOne.js <cardId> <imageUrl> <serverId>');
    process.exit(1);
  }

  console.log(`Fetching image...`);
  const buffer = await fetchBuffer(imageUrl);
  console.log(`Downloaded ${(buffer.length / 1024).toFixed(1)} KB`);

  const guild = await client.guilds.fetch(serverId);
  console.log(`Uploading to "${guild.name}"...`);

  const emojiName = cardId.replace(/[^a-zA-Z0-9_]/g, '_').padEnd(2, '_');
  const emoji = await guild.emojis.create({ attachment: buffer, name: emojiName });

  const cache = loadCache();
  cache[cardId] = { name: emoji.name, id: emoji.id };
  saveCache(cache);

  console.log(`✅ Done! <:${emoji.name}:${emoji.id}>`);
  console.log(`emoji_cache.json updated for "${cardId}"`);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once('clientReady', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try { await run(client); }
  catch (e) { console.error('Error:', e.message); }
  client.destroy();
  process.exit(0);
});
client.login(process.env.DISCORD_TOKEN).catch(e => {
  console.error('Login failed:', e.message);
  process.exit(1);
});
