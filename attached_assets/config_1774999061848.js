// ============================================================
//  TKO BOT — CONFIGURATION
//  ✏️  Edit this file to customize everything about your bot
// ============================================================

module.exports = {

  // ── Bot Settings ──────────────────────────────────────────
  PREFIX: '!tko',
  PULL_COOLDOWN_SECONDS: 30,    // Cooldown between pulls (seconds)

  // ── Shard Values (duplicates) ─────────────────────────────
  // When you pull a duplicate card it auto-converts to shards
  SHARD_VALUES: {
    R:  10,    // Rare        = 10  💎
    E:  25,    // Epic        = 25  💎
    L:  60,    // Legendary   = 60  💎
    MY: 120,   // Mythical    = 120 💎
    UR: 250,   // Ultra-Rare  = 250 💎
    LT: 500,   // Limited     = 500 💎
  },

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
