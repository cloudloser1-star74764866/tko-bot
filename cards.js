// ============================================================
//  test BOT — CARD POOL
//  Add your own cards here! Format:
//  { id: 'unique_id', name: 'Character Name', series: 'Series',
//    rarity: 'R/E/L/MY/UR/LT', desc: 'Flavour text', image: 'https://...' }
// ============================================================

const { PULL_RATES } = require('./config');

const CARDS = [

  // ── Rare (R) ──────────────────────────────────────────────
  { id: 'naruto_r',       name: 'Naruto Uzumaki',          series: 'Naruto',               rarity: 'R',  desc: 'The unpredictable ninja of the Hidden Leaf.' },
  { id: 'goku_r',         name: 'Goku',                    series: 'Dragon Ball Z',         rarity: 'R',  desc: 'A pure-hearted Saiyan warrior.' },
  { id: 'luffy_r',        name: 'Monkey D. Luffy',         series: 'One Piece',             rarity: 'R',  desc: 'Future King of the Pirates.' },
  { id: 'ichigo_r',       name: 'Ichigo Kurosaki',         series: 'Bleach',                rarity: 'R',  desc: 'A Soul Reaper protecting the living world.' },
  { id: 'deku_r',         name: 'Izuku Midoriya',          series: 'My Hero Academia',      rarity: 'R',  desc: 'The successor of One For All.' },
  { id: 'link_r',         name: 'Link',                    series: 'The Legend of Zelda',   rarity: 'R',  desc: 'The Hero of Time, chosen by the Triforce.' },
  { id: 'cloud_r',        name: 'Cloud Strife',            series: 'Final Fantasy VII',     rarity: 'R',  desc: 'Ex-SOLDIER turned mercenary.' },
  { id: 'eren_r',         name: 'Eren Yeager',             series: 'Attack on Titan',       rarity: 'R',  desc: 'A boy who swore to destroy the Titans.' },
  { id: 'pikachu_r',      name: 'Pikachu',                 series: 'Pokémon',               rarity: 'R',  desc: 'The iconic Electric-type partner.' },
  { id: 'spike_r',        name: 'Spike Spiegel',           series: 'Cowboy Bebop',          rarity: 'R',  desc: 'A bounty hunter drifting through space.' },

  // ── Epic (E) ──────────────────────────────────────────────
  { id: 'sasuke_e',       name: 'Sasuke Uchiha',           series: 'Naruto',               rarity: 'E',  desc: 'Last survivor of the Uchiha clan.' },
  { id: 'vegeta_e',       name: 'Vegeta',                  series: 'Dragon Ball Z',         rarity: 'E',  desc: 'The proud Prince of all Saiyans.' },
  { id: 'zoro_e',         name: 'Roronoa Zoro',            series: 'One Piece',             rarity: 'E',  desc: 'Swordsman aiming to be the world\'s greatest.' },
  { id: 'bakugo_e',       name: 'Katsuki Bakugo',          series: 'My Hero Academia',      rarity: 'E',  desc: 'Explosive hero with a fiery spirit.' },
  { id: 'levi_e',         name: 'Levi Ackerman',           series: 'Attack on Titan',       rarity: 'E',  desc: 'Humanity\'s strongest soldier.' },
  { id: 'kratos_e',       name: 'Kratos',                  series: 'God of War',            rarity: 'E',  desc: 'The Ghost of Sparta, slayer of gods.' },
  { id: 'sephiroth_e',    name: 'Sephiroth',               series: 'Final Fantasy VII',     rarity: 'E',  desc: 'A legendary SOLDIER turned destroyer.' },
  { id: 'killua_e',       name: 'Killua Zoldyck',          series: 'Hunter x Hunter',       rarity: 'E',  desc: 'An assassin heir with lightning reflexes.' },

  // ── Legendary (L) ─────────────────────────────────────────
  { id: 'itachi_l',       name: 'Itachi Uchiha',           series: 'Naruto',               rarity: 'L',  desc: 'A shinobi who bore the weight of sacrifice.' },
  { id: 'goku_ssj4_l',    name: 'Goku SSJ4',               series: 'Dragon Ball GT',        rarity: 'L',  desc: 'The pinnacle of Saiyan transformation.' },
  { id: 'shanks_l',       name: 'Red-Hair Shanks',         series: 'One Piece',             rarity: 'L',  desc: 'One of the Four Emperors of the Sea.' },
  { id: 'allmight_l',     name: 'All Might',               series: 'My Hero Academia',      rarity: 'L',  desc: 'The Symbol of Peace. Plus Ultra!' },
  { id: 'genos_l',        name: 'Genos',                   series: 'One Punch Man',         rarity: 'L',  desc: 'A cyborg hero seeking the truth of his power.' },
  { id: 'hisoka_l',       name: 'Hisoka Morow',            series: 'Hunter x Hunter',       rarity: 'L',  desc: 'A twisted magician who lives to fight the strong.' },

  // ── Mythical (MY) ─────────────────────────────────────────
  { id: 'madara_my',      name: 'Madara Uchiha',           series: 'Naruto',               rarity: 'MY', desc: 'A god of shinobi with unrivalled power.' },
  { id: 'beerus_my',      name: 'Beerus',                  series: 'Dragon Ball Super',     rarity: 'MY', desc: 'God of Destruction. Do not wake him.' },
  { id: 'whitebeard_my',  name: 'Whitebeard',              series: 'One Piece',             rarity: 'MY', desc: 'The man who stood atop the world.' },
  { id: 'saitama_my',     name: 'Saitama',                 series: 'One Punch Man',         rarity: 'MY', desc: 'Defeated every enemy with a single punch.' },
  { id: 'mewtwo_my',      name: 'Mewtwo',                  series: 'Pokémon',               rarity: 'MY', desc: 'A genetically engineered Pokémon of immense psy-power.' },

  // ── Ultra-Rare (UR) ───────────────────────────────────────
  { id: 'kaguya_ur',      name: 'Kaguya Ōtsutsuki',        series: 'Naruto',               rarity: 'UR', desc: 'The progenitor of chakra itself.' },
  { id: 'zeno_ur',        name: 'Zeno',                    series: 'Dragon Ball Super',     rarity: 'UR', desc: 'The Omni-King who can erase universes.' },
  { id: 'joyboy_ur',      name: 'Joy Boy',                 series: 'One Piece',             rarity: 'UR', desc: 'A legend from the Void Century.' },
  { id: 'arceus_ur',      name: 'Arceus',                  series: 'Pokémon',               rarity: 'UR', desc: 'The Alpha Pokémon who shaped the universe.' },

  // ── Limited (LT) ──────────────────────────────────────────
  { id: 'sage_naruto_lt', name: 'Naruto (Six Paths Sage)', series: 'Naruto',               rarity: 'LT', desc: 'Bestowed power by the Sage of Six Paths himself.' },
  { id: 'ultra_goku_lt',  name: 'Goku (Ultra Instinct)',   series: 'Dragon Ball Super',     rarity: 'LT', desc: 'A state beyond the gods — pure autonomous movement.' },
  { id: 'gear5_luffy_lt', name: 'Luffy (Gear 5)',          series: 'One Piece',             rarity: 'LT', desc: 'The most ridiculous power in the world. Joy Boy awakened.' },

];

/**
 * Pull a random card weighted by PULL_RATES.
 */
function pullCard() {
  const roll = Math.random() * 100;
  let cumulative = 0;
  let chosen = 'R';

  for (const [rarity, rate] of Object.entries(PULL_RATES)) {
    cumulative += rate;
    if (roll < cumulative) { chosen = rarity; break; }
  }

  const pool = CARDS.filter(c => c.rarity === chosen);
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : CARDS[0];
}

module.exports = { CARDS, pullCard };
