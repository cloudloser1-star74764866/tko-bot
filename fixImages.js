// ============================================================
//  fixImages.js — Verify & fix every card's image via AniList
//  Batches 5 cards per request; falls back to individual queries
//  when a batch contains an un-found character.
//  Run once: node fixImages.js
// ============================================================

const fs   = require('fs');
const path = require('path');
const { CARDS } = require('./cards.js');

const CACHE_FILE = path.join(__dirname, 'data', 'image_cache.json');

// Cards whose images should NOT be touched
const SKIP_IDS = new Set([
  'link', 'cloud', 'sephiroth', 'kratos',
  'pikachu', 'mewtwo', 'arceus',
  'sage_naruto', 'ultra_goku', 'gear5_luffy',
  'sukuna_fp', 'ichigo_bankai', 'goku_ssj4', 'kaguya',
]);

const SERIES_KEYWORDS = {
  'Naruto':                                   ['naruto'],
  'Dragon Ball Z':                            ['dragon ball'],
  'Dragon Ball Super':                        ['dragon ball'],
  'Dragon Ball GT':                           ['dragon ball gt', 'dragon ball'],
  'One Piece':                                ['one piece'],
  'Bleach':                                   ['bleach'],
  'My Hero Academia':                         ['hero academia', 'boku no hero'],
  'Attack on Titan':                          ['shingeki', 'attack on titan'],
  "JoJo's Bizarre Adventure":                 ['jojo'],
  'Black Clover':                             ['black clover'],
  'Demon Slayer':                             ['kimetsu', 'demon slayer'],
  'Fullmetal Alchemist: Brotherhood':         ['fullmetal', 'alchemist'],
  'Sword Art Online':                         ['sword art online'],
  'Jujutsu Kaisen':                           ['jujutsu kaisen'],
  'Fairy Tail':                               ['fairy tail'],
  'Death Note':                               ['death note'],
  'Mob Psycho 100':                           ['mob psycho'],
  'Hunter x Hunter':                          ['hunter x hunter'],
  'Chainsaw Man':                             ['chainsaw man'],
  'Spy x Family':                             ['spy x family', 'spy family'],
  'Re:Zero':                                  ['re:zero', 're zero', 'rezero'],
  'Gintama':                                  ['gintama'],
  'Inuyasha':                                 ['inuyasha'],
  'Steins;Gate':                              ['steins'],
  'Yu Yu Hakusho':                            ['yu yu hakusho', 'yuu yuu'],
  'Overlord':                                 ['overlord'],
  'One Punch Man':                            ['one punch man', 'one-punch'],
  'Code Geass':                               ['code geass'],
  'Gurren Lagann':                            ['gurren lagann', 'tengen toppa'],
  'Black Butler':                             ['black butler', 'kuroshitsuji'],
  'Vinland Saga':                             ['vinland saga'],
  'The Seven Deadly Sins':                    ['seven deadly sins', 'nanatsu no taizai'],
  'That Time I Got Reincarnated as a Slime':  ['slime', 'tensei shitara'],
  'Hajime no Ippo':                           ['hajime no ippo', 'fighting spirit', 'ippo'],
  'Eromanga-sensei':                          ['eromanga'],
  'Cowboy Bebop':                             ['cowboy bebop'],
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function seriesMatch(mediaNodes, series) {
  const keywords = SERIES_KEYWORDS[series] ?? [];
  if (!keywords.length) return true;
  const titles = (mediaNodes ?? [])
    .flatMap(n => [(n.title?.romaji ?? '').toLowerCase(), (n.title?.english ?? '').toLowerCase()])
    .join(' ');
  return keywords.some(k => titles.includes(k));
}

// Build a GraphQL query for an array of cards (aliases = card IDs)
function buildQuery(cards) {
  const fields = cards.map(c => {
    const safeName = c.name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `${c.id}: Character(search: "${safeName}") {
      name { full }
      image { large }
      media(type: ANIME, sort: POPULARITY_DESC, perPage: 5) {
        nodes { title { romaji english } }
      }
    }`;
  });
  return `{ ${fields.join('\n')} }`;
}

async function anilistPost(query) {
  const resp = await fetch('https://graphql.anilist.co', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body:    JSON.stringify({ query }),
    signal:  AbortSignal.timeout(12000),
  });
  if (resp.status === 429) {
    const wait = parseInt(resp.headers.get('Retry-After') ?? '60', 10) + 5;
    console.warn(`  ⏳ Rate-limited — waiting ${wait}s`);
    await sleep(wait * 1000);
    return null; // signal caller to retry or skip
  }
  const json = await resp.json();
  return json.data ?? null;
}

function applyResult(card, charData, cache) {
  if (!charData) { console.log(`  [${card.id}] ⚠️  not found — keeping`); return false; }
  if (!seriesMatch(charData.media?.nodes, card.series)) {
    console.log(`  [${card.id}] ⚠️  "${charData.name?.full}" wrong series — keeping`);
    return false;
  }
  const url = charData.image?.large;
  if (!url) { console.log(`  [${card.id}] ⚠️  no image — keeping`); return false; }
  cache[card.id] = url;
  console.log(`  [${card.id}] ✅  ${charData.name?.full}`);
  return true;
}

async function processBatch(cards, cache, CACHE_FILE) {
  const query = buildQuery(cards);
  const data  = await anilistPost(query);

  if (data && Object.keys(data).length > 0) {
    // Batch succeeded (at least partially)
    let fixed = 0;
    for (const card of cards) {
      if (applyResult(card, data[card.id], cache)) fixed++;
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    return;
  }

  // Batch returned null/empty — fall back to individual queries
  console.log(`  ↩  Batch failed — querying ${cards.length} cards individually...`);
  for (const card of cards) {
    const q = buildQuery([card]);
    const d = await anilistPost(q);
    if (d) applyResult(card, d[card.id], cache);
    else    console.log(`  [${card.id}] ⚠️  rate-limited/error — keeping`);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    await sleep(1200);
  }
}

async function main() {
  const cache  = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  const toFix  = CARDS.filter(c => !SKIP_IDS.has(c.id));
  const BATCH  = 5;

  console.log(`\n🔧  Fixing ${toFix.length} cards (${BATCH} per batch)...\n`);

  for (let i = 0; i < toFix.length; i += BATCH) {
    const batch = toFix.slice(i, i + BATCH);
    console.log(`\n--- Batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(toFix.length / BATCH)} ---`);
    await processBatch(batch, cache, CACHE_FILE);
    if (i + BATCH < toFix.length) await sleep(800);
  }

  console.log('\n✅  All done!');
}

main().catch(err => { console.error(err); process.exit(1); });
