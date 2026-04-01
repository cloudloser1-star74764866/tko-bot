// ============================================================
//  test BOT — CONFIGURATION
//  Edit this file to customize everything about your bot
// ============================================================

module.exports = {

  // ── Bot Settings ──────────────────────────────────────────
  PREFIX: 'ZP',
  PULL_COOLDOWN_SECONDS: 30,    // Seconds to regenerate 1 pull charge
  MAX_PULL_CHARGES: 20,         // Maximum stored pull charges

  // ── Pull Rates ────────────────────────────────────────────
  // Must add up to exactly 100
  PULL_RATES: {
    R:  80.7,
    E:   10.6,
    L:   5,
    MY:  2.7,
    UR:  1,
  },

  // ── Plating ───────────────────────────────────────────────
  // 0.1% chance per individual pull to also receive a plating.
  // If a plating drops, the tier is chosen by the weights below
  // (they must add up to 100).
  PLATING_CHANCE: 0.001,
  PLATING_TIERS: [
    { id: 'bronze',  label: 'Bronze',  emoji: '', weight: 55, color: 0xCD7F32, statMult: 2.0 },
    { id: 'silver',  label: 'Silver',  emoji: '', weight: 28, color: 0xC0C0C0, statMult: 3.0 },
    { id: 'gold',    label: 'Gold',    emoji: '', weight: 13, color: 0xFFD700, statMult: 4.0 },
    { id: 'diamond', label: 'Diamond', emoji: '', weight:  4, color: 0xB9F2FF, statMult: 6.0 },
  ],

  // ── Fight Rewards ─────────────────────────────────────────
  FIGHT_YEN_MIN:   100,
  FIGHT_YEN_MAX:  1000,
  FIGHT_STAR_MIN:   10,
  FIGHT_STAR_MAX:  100,
  FIGHT_COOLDOWN_SECONDS: 60,

  // ── Card Stats (scale by rarity) ─────────────────────────
  // Each card gets deterministic HP and DMG based on its card ID
  // (same card always has the same stats). Values are a range
  // within which the specific card's stats are generated.
  STAT_RANGES: {
    R:  { hpMin:  100, hpMax:  180, dmgMin:  15, dmgMax:  28 },
    E:  { hpMin:  220, hpMax:  320, dmgMin:  35, dmgMax:  55 },
    L:  { hpMin:  380, hpMax:  500, dmgMin:  65, dmgMax:  90 },
    MY: { hpMin:  550, hpMax:  720, dmgMin: 100, dmgMax: 140 },
    UR: { hpMin:  780, hpMax: 1000, dmgMin: 160, dmgMax: 220 },
    LT: { hpMin: 1100, hpMax: 1500, dmgMin: 280, dmgMax: 400 },
  },

  // ── Limited Items ─────────────────────────────────────────
  // Items granted by admins that give a specific LT card when used.
  ITEMS: [
    { id: 'liberation', name: 'Liberation',       emoji: '', cardId: 'gear5_luffy_lt', desc: 'Awakens the power of the Sun God within Luffy.' },
    { id: 'tattoos',    name: "Sukuna's Tattoos",  emoji: '', cardId: 'sukuna_fp_lt',   desc: 'Cursed marks of the King of Curses in their full glory.' },
    { id: 'instincts',  name: "Goku's Instincts",  emoji: '', cardId: 'ultra_goku_lt',  desc: 'The divine technique of pure autonomous movement.' },
    { id: 'ramen',      name: 'Ramen',             emoji: '', cardId: 'sage_naruto_lt', desc: 'A bowl of ramen carrying the chakra of the Sage of Six Paths.' },
  ],

  // ── Rarity Metadata (display) ────────────────────────────
  RARITY_META: {
    R:  { label: 'Rare',       emoji: '', color: 0x4A90D9, stars: '*'        },
    E:  { label: 'Epic',       emoji: '', color: 0x9B59B6, stars: '**'       },
    L:  { label: 'Legendary',  emoji: '', color: 0xF1C40F, stars: '***'      },
    MY: { label: 'Mythical',   emoji: '', color: 0xFF4757, stars: '****'     },
    UR: { label: 'Ultra-Rare', emoji: '', color: 0x00FFF0, stars: '*****'    },
    LT: { label: 'Limited',    emoji: '', color: 0xFF69B4, stars: 'LIMITED'  },
  },

};
