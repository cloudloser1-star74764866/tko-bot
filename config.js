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
    R:  45,    // Rare        45%
    E:  28,    // Epic        28%
    L:  15,    // Legendary   15%
    MY:  7,    // Mythical     7%
    UR:  4,    // Ultra-Rare   4%
    LT:  1,    // Limited      1%
  },

  // ── Plating ───────────────────────────────────────────────
  // 0.1% chance per individual pull to also receive a plating.
  // If a plating drops, the tier is chosen by the weights below
  // (they must add up to 100).
  PLATING_CHANCE: 0.001,
  PLATING_TIERS: [
    { id: 'bronze',  label: 'Bronze',  emoji: '🥉', weight: 55, color: 0xCD7F32 },
    { id: 'silver',  label: 'Silver',  emoji: '🥈', weight: 28, color: 0xC0C0C0 },
    { id: 'gold',    label: 'Gold',    emoji: '🥇', weight: 13, color: 0xFFD700 },
    { id: 'diamond', label: 'Diamond', emoji: '💎', weight:  4, color: 0xB9F2FF },
  ],

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
