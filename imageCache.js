// ============================================================
//  imageCache.js — Character image URL cache
//  Loads confirmed images instantly; fetches remaining ones
//  from AniList API in the background at startup.
// ============================================================

const fs   = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, 'data', 'image_cache.json');

// ── Seed: confirmed working image URLs ───────────────────────
const SEED = {
  // Naruto
  naruto_r:        'https://s4.anilist.co/file/anilistcdn/character/large/b17-phjcWCkRuIhu.png',
  sasuke_e:        'https://s4.anilist.co/file/anilistcdn/character/large/b13-SISLEw1oAD7a.png',
  itachi_l:        'https://s4.anilist.co/file/anilistcdn/character/large/b14-9Kb1E5oel1ke.png',
  madara_my:       'https://s4.anilist.co/file/anilistcdn/character/large/b53901-HnRKSoHMG5Vg.png',
  kaguya_ur:       'https://static.wikia.nocookie.net/naruto/images/6/6c/Kaguya_%C5%8Ctsutsuki.png/revision/latest',
  sage_naruto_lt:  'https://s4.anilist.co/file/anilistcdn/character/large/b17-phjcWCkRuIhu.png',
  // Dragon Ball
  goku_r:          'https://s4.anilist.co/file/anilistcdn/character/large/246-wsRRr6z1kii8.png',
  goku_ssj4_l:     'https://s4.anilist.co/file/anilistcdn/character/large/246-wsRRr6z1kii8.png',
  ultra_goku_lt:   'https://s4.anilist.co/file/anilistcdn/character/large/246-wsRRr6z1kii8.png',
  vegeta_e:        'https://s4.anilist.co/file/anilistcdn/character/large/b913-NIFkKazWM8VO.png',
  beerus_my:       'https://s4.anilist.co/file/anilistcdn/character/large/b76348-pGWrznfxgPIV.png',
  // One Piece
  luffy_r:         'https://s4.anilist.co/file/anilistcdn/character/large/b40-MNypXsxSRb1R.png',
  gear5_luffy_lt:  'https://s4.anilist.co/file/anilistcdn/character/large/b40-MNypXsxSRb1R.png',
  zoro_e:          'https://s4.anilist.co/file/anilistcdn/character/large/b62-S7oAeA9WInjV.png',
  nami_r:          'https://s4.anilist.co/file/anilistcdn/character/large/b723-vp5hPptgnNEC.png',
  usopp_r:         'https://s4.anilist.co/file/anilistcdn/character/large/b724-GFGgI9AJQkfy.jpg',
  chopper_r:       'https://s4.anilist.co/file/anilistcdn/character/large/b309-H64NhbJ2ywIQ.jpg',
  sanji_r:         'https://s4.anilist.co/file/anilistcdn/character/large/b305-6lisPmHtCnLT.png',
  robin_r:         'https://s4.anilist.co/file/anilistcdn/character/large/b61-ywXUyyocEEqt.png',
  ace_e:           'https://s4.anilist.co/file/anilistcdn/character/large/b2072-Lc6jEdsueJUK.jpg',
  law_e:           'https://s4.anilist.co/file/anilistcdn/character/large/b13767-U604OJN9dxCn.jpg',
  kid_e:           'https://s4.anilist.co/file/anilistcdn/character/large/b14989-uykLqnBTdAc2.jpg',
  shanks_l:        'https://s4.anilist.co/file/anilistcdn/character/large/b727-wUJx7M1z5xON.png',
  mihawk_l:        'https://s4.anilist.co/file/anilistcdn/character/large/n2064-OpnF4nLi6bvL.png',
  whitebeard_my:   'https://s4.anilist.co/file/anilistcdn/character/large/b2751-NnzW0N2vCTjX.jpg',
  kaido_my:        'https://s4.anilist.co/file/anilistcdn/character/large/b90112-KVRcvbKBKLxY.png',
  blackbeard_ur:   'https://s4.anilist.co/file/anilistcdn/character/large/b3331-7ZJDc4BNv9Yp.jpg',
  joyboy_ur:       'https://s4.anilist.co/file/anilistcdn/character/large/b341936-l61bq77sTJBM.png',
  // Bleach
  ichigo_r:        'https://s4.anilist.co/file/anilistcdn/character/large/b5-a7bkJgjhhigE.png',
  ichigo_bankai_ur:'https://s4.anilist.co/file/anilistcdn/character/large/b5-a7bkJgjhhigE.png',
  // Attack on Titan
  levi_e:          'https://static.wikia.nocookie.net/shingekinokyojin/images/9/94/Levi_Ackerman_character_image.png/revision/latest',
};

// ── AniList search terms for remaining cards ─────────────────
// card_id -> search name used to query AniList API
const SEARCH_TERMS = {
  rukia_r:     'Rukia Kuchiki',        renji_r:     'Renji Abarai',
  uryu_r:      'Uryu Ishida',          orihime_r:   'Orihime Inoue',
  chad_r:      'Yasutora Sado',        byakuya_e:   'Byakuya Kuchiki',
  grimmjow_e:  'Grimmjow Jaegerjaquez',ulquiorra_e: 'Ulquiorra Cifer',
  aizen_l:     'Sosuke Aizen',         gin_l:       'Gin Ichimaru',
  yhwach_my:   'Yhwach',
  joseph_r:    'Joseph Joestar',       caesar_r:    'Caesar Zeppeli',
  noriaki_r:   'Noriaki Kakyoin',      jotaro_e:    'Jotaro Kujo',
  giorno_e:    'Giorno Giovanna',      josuke_e:    'Josuke Higashikata',
  dio_l:       'Dio Brando',           kira_my:     'Yoshikage Kira',
  dio_wr_ur:   'DIO',
  deku_r:      'Izuku Midoriya',       bakugo_e:    'Katsuki Bakugo',
  allmight_l:  'All Might',            eren_r:      'Eren Yeager',
  tanjiro_r:   'Tanjiro Kamado',       nezuko_r:    'Nezuko Kamado',
  zenitsu_r:   'Zenitsu Agatsuma',     inosuke_r:   'Inosuke Hashibira',
  rengoku_e:   'Kyojuro Rengoku',      tengen_e:    'Tengen Uzui',
  muzan_my:    'Muzan Kibutsuji',
  edward_r:    'Edward Elric',         alphonse_r:  'Alphonse Elric',
  winry_r:     'Winry Rockbell',       roy_e:       'Roy Mustang',
  armstrong_e: 'Alex Louis Armstrong', father_l:    'Father',
  itadori_r:   'Yuji Itadori',         nobara_r:    'Nobara Kugisaki',
  gojo_e:      'Satoru Gojo',          todo_e:      'Aoi Todo',
  yuta_l:      'Yuta Okkotsu',         sukuna_my:   'Ryomen Sukuna',
  sukuna_fp_lt:'Ryomen Sukuna',
  gon_r:       'Gon Freecss',          kurapika_r:  'Kurapika',
  killua_e:    'Killua Zoldyck',       hisoka_l:    'Hisoka Morow',
  netero_l:    'Isaac Netero',
  natsu_r:     'Natsu Dragneel',       gray_r:      'Gray Fullbuster',
  erza_r:      'Erza Scarlet',         laxus_e:     'Laxus Dreyar',
  gildarts_e:  'Gildarts Clive',       mavis_l:     'Mavis Vermillion',
  acnologia_my:'Acnologia',
  light_r:     'Light Yagami',         l_r:         'L Lawliet',
  near_l:      'Near',
  mob_r:       'Shigeo Kageyama',      reigen_r:    'Reigen Arataka',
  denji_r:     'Denji',                power_r:     'Power',
  makima_e:    'Makima',
  loid_r:      'Loid Forger',          yor_r:       'Yor Briar',
  anya_r:      'Anya Forger',
  subaru_r:    'Subaru Natsuki',       emilia_r:    'Emilia',
  rem_e:       'Rem',
  gintoki_r:   'Gintoki Sakata',       inuyasha_r:  'Inuyasha',
  okabe_r:     'Rintarou Okabe',       yusuke_r:    'Yusuke Urameshi',
  hiei_e:      'Hiei',                 kurama_e:    'Kurama',
  albedo_e:    'Albedo',
  asta_r:      'Asta',                 noelle_r:    'Noelle Silva',
  yuno_r:      'Yuno',                 yami_e:      'Yami Sukehiro',
  julius_e:    'Julius Novachrono',    licht_l:     'Licht',
  sebastian_e: 'Sebastian Michaelis',
  ban_e:       'Ban',                  escanor_my:  'Escanor',
  thorfinn_e:  'Thorfinn',             askeladd_e:  'Askeladd',
  lelouch_e:   'Lelouch Lamperouge',
  kamina_e:    'Kamina',               simon_l:     'Simon',
  saitama_my:  'Saitama',             genos_l:     'Genos',
  rimuru_l:    'Rimuru Tempest',
  kirito_r:    'Kazuto Kirigaya',      asuna_r:     'Asuna Yuuki',
  spike_r:     'Spike Spiegel',
  zeno_ur:     'Zeno',
  link_r:      'Link',                 cloud_r:     'Cloud Strife',
  sephiroth_e: 'Sephiroth',            kratos_e:    'Kratos',
  pikachu_r:   'Pikachu',              mewtwo_my:   'Mewtwo',
  arceus_ur:   'Arceus',
};

// ── In-memory cache (card_id -> imageUrl) ────────────────────
let cache = { ...SEED };

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const saved = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      cache = { ...SEED, ...saved };
    }
  } catch (_) {}
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (_) {}
}

/** Synchronous lookup — returns URL or null */
function getImage(cardId) {
  return cache[cardId] ?? null;
}

/** Fetch a single character image from AniList by search name */
async function fetchFromAniList(searchName) {
  try {
    const resp = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        query: `{ Character(search: "${searchName.replace(/"/g, '\\"')}") { image { large } } }`,
      }),
    });
    if (resp.status === 429) return null; // rate limited
    const json = await resp.json();
    return json.data?.Character?.image?.large ?? null;
  } catch (_) {
    return null;
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Background refresh: for every card that doesn't have a cached image yet,
 * query AniList (with 700ms delay between requests to stay under rate limit).
 * Saves after each successful fetch.
 */
async function refreshMissing() {
  const missing = Object.entries(SEARCH_TERMS).filter(([id]) => !cache[id]);
  if (missing.length === 0) {
    console.log('🖼️  Image cache: all images already cached.');
    return;
  }
  console.log(`🖼️  Image cache: fetching ${missing.length} missing character images from AniList...`);
  let fetched = 0;
  for (const [cardId, searchName] of missing) {
    const url = await fetchFromAniList(searchName);
    if (url) {
      cache[cardId] = url;
      fetched++;
    }
    await sleep(700); // stay well under AniList's 90 req/min limit
  }
  saveCache();
  console.log(`🖼️  Image cache: fetched ${fetched}/${missing.length} images. Cache saved.`);
}

loadCache();

module.exports = { getImage, refreshMissing };
