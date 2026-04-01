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
    R:  87.6, // Rare        87.6%  (~9 in 10 pulls)
    E:   8.6, // Epic         8.6%  (~1 in 12 pulls)
    L:   1.2, // Legendary    1.2%  (~1 in 83 pulls)
    MY:  2,   // Mythical     2%    (1 in 50 pulls)
    UR:  0.5, // Ultra-Rare   0.5%  (1 in 200 pulls)
    LT:  0.1, // Limited      0.1%  (1 in 1,000 pulls)
  },

  // ── Plating ───────────────────────────────────────────────
  // 0.1% chance per individual pull to also receive a plating.
  // If a plating drops, the tier is chosen by the weights below
  // (they must add up to 100).
  PLATING_CHANCE: 0.001,
  PLATING_TIERS: [
    { id: 'bronze',  label: 'Bronze',  emoji: '🥉', weight: 55, color: 0xCD7F32, statMult: 2.0 },
    { id: 'silver',  label: 'Silver',  emoji: '🥈', weight: 28, color: 0xC0C0C0, statMult: 3.0 },
    { id: 'gold',    label: 'Gold',    emoji: '🥇', weight: 13, color: 0xFFD700, statMult: 4.0 },
    { id: 'diamond', label: 'Diamond', emoji: '💎', weight:  4, color: 0xB9F2FF, statMult: 6.0 },
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

  // ── Rarity Metadata (display) ────────────────────────────
  RARITY_META: {
    R:  { label: 'Rare',       emoji: '🔵', color: 0x4A90D9, stars: '⭐'            },
    E:  { label: 'Epic',       emoji: '🟣', color: 0x9B59B6, stars: '⭐⭐'           },
    L:  { label: 'Legendary',  emoji: '🟡', color: 0xF1C40F, stars: '⭐⭐⭐'          },
    MY: { label: 'Mythical',   emoji: '🔴', color: 0xFF4757, stars: '⭐⭐⭐⭐'         },
    UR: { label: 'Ultra-Rare', emoji: '🩵', color: 0x00FFF0, stars: '⭐⭐⭐⭐⭐'        },
    LT: { label: 'Limited',    emoji: '💖', color: 0xFF69B4, stars: '✨ LIMITED ✨'  },
  },

};
