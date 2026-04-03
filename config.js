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
    { id: 'bronze',  label: 'Bronze',  emoji: '🥉', weight: 60, color: 0xCD7F32, statMult: 2.0 },
    { id: 'silver',  label: 'Silver',  emoji: '🥈', weight: 25, color: 0xC0C0C0, statMult: 3.0 },
    { id: 'gold',    label: 'Gold',    emoji: '🥇', weight: 20, color: 0xFFD700, statMult: 4.0 },
    { id: 'diamond', label: 'Diamond', emoji: '💠', weight:  5, color: 0xB9F2FF, statMult: 6.0 },
  ],

  // ── Fight Rewards ─────────────────────────────────────────
  FIGHT_YEN_MIN:   10000,
  FIGHT_YEN_MAX:  100000,
  FIGHT_STAR_MIN:   1000,
  FIGHT_STAR_MAX:  10000,
  FIGHT_COOLDOWN_SECONDS: 60,

  // ── Bot Fight Rewards ─────────────────────────────────────
  BOT_FIGHT_YEN_MIN:   1000,
  BOT_FIGHT_YEN_MAX:  10000,
  BOT_FIGHT_STAR_MIN:   10,
  BOT_FIGHT_STAR_MAX:  100,

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

  // ── Raid ──────────────────────────────────────────────────
  // Drop chance per single pull for each ticket tier.
  RAID_TICKET_CHANCES: {
    raid_ticket:          0.0015,   // 0.15%
    mythical_raid_ticket: 0.00075,  // 0.075%
    omega_raid_ticket:    0.0005,   // 0.05%
    hellish_raid_ticket:  0.0001,   // 0.01%
  },

  // Tier definitions: boss pool, stat multiplier applied to Lv-100 card stats.
  RAID_TICKET_TIERS: [
    { id: 'raid_ticket',          label: 'Raid Ticket',          emoji: '🎟️', color: 0xFF6B6B, bossPools: ['R','E','L'], statMult: 4, useCmd: 'ZP raid'         },
    { id: 'mythical_raid_ticket', label: 'Mythical Raid Ticket', emoji: '🌙', color: 0xFF4757, bossPools: ['MY'],        statMult: 5, useCmd: 'ZP raid mythical' },
    { id: 'omega_raid_ticket',    label: 'Omega Raid Ticket',    emoji: '⚡', color: 0x00FFF0, bossPools: ['UR'],         statMult: 5, useCmd: 'ZP raid omega'   },
    { id: 'hellish_raid_ticket',  label: 'Hellish Raid Ticket',  emoji: '💀', color: 0xFF0000, bossPools: ['LT'],         statMult: 4, useCmd: 'ZP raid hellish' },
  ],

  // ── Items ─────────────────────────────────────────────────
  // Items usable via `ZP use <id>` (or their custom useCmd).
  ITEMS: [
    { id: 'liberation',          name: 'Liberation',            emoji: '☀️',  cardId: 'gear5_luffy_lt',    desc: 'Awakens the power of the Sun God within Luffy.' },
    { id: 'tattoos',             name: "Sukuna's Tattoos",       emoji: '🔱',  cardId: 'sukuna_fp_lt',      desc: 'Cursed marks of the King of Curses in their full glory.' },
    { id: 'instincts',           name: "Goku's Instincts",       emoji: '🌀',  cardId: 'ultra_goku_lt',     desc: 'The divine technique of pure autonomous movement.' },
    { id: 'ramen',               name: 'Ramen',                  emoji: '🍜',  cardId: 'sage_naruto_lt',    desc: 'A bowl of ramen carrying the chakra of the Sage of Six Paths.' },
    { id: 'drugs',               name: 'Drugs',                  emoji: '💊', cardId: 'daniel_park_ui_lt', desc: 'An unknown substance that awakens Ultra Instinct in Daniel Park.' },
    { id: 'unknown_tube',        name: 'Unknown Tube',          emoji: '🧪',  cardId: 'ditto_lt',          desc: 'A mysterious tube containing shifting purple matter. Use it to awaken Ditto.' },
    { id: 'raid_ticket',         name: 'Raid Ticket',           emoji: '🎟️', cardId: null, useCmd: 'ZP raid',         desc: '0.15% drop. Fight a Rare–Legendary Raid Boss!' },
    { id: 'mythical_raid_ticket',name: 'Mythical Raid Ticket',  emoji: '🌙', cardId: null, useCmd: 'ZP raid mythical', desc: '0.075% drop. Fight a Mythical Raid Boss!' },
    { id: 'omega_raid_ticket',   name: 'Omega Raid Ticket',     emoji: '⚡', cardId: null, useCmd: 'ZP raid omega',   desc: '0.05% drop. Fight an Ultra Rare Raid Boss!' },
    { id: 'hellish_raid_ticket', name: 'Hellish Raid Ticket',   emoji: '💀', cardId: null, useCmd: 'ZP raid hellish', desc: '0.01% drop. Fight a Limited Raid Boss for massive rewards!' },
    { id: 'level_scroll',        name: 'Level Scroll',          emoji: '📜', cardId: null, useCmd: 'ZP use level_scroll <cardId>', desc: 'Use on any card to instantly raise its level by 1. Obtained from fights, raids, and daily rewards.' },
  ],

  // ── Weapon Evolution Tiers ────────────────────────────────
  // Cost per evolution: WEAPON_EVOLVE_SHARDS weapon shards + WEAPON_EVOLVE_PRESTIGE weapon prestige
  // statMult: bonus applied to equipped card → boost = 1 + statMult × (weaponLevel / 100)
  WEAPON_EVOLVE_SHARDS:   10,
  WEAPON_EVOLVE_PRESTIGE: 300,
  WEAPON_EVOLUTION_TIERS: [
    { tier: 1, name: 'Basic',      emoji: '⚙️',  statMult: 0.10 },
    { tier: 2, name: 'Refined',    emoji: '🔧',  statMult: 0.20 },
    { tier: 3, name: 'Enhanced',   emoji: '⚔️',  statMult: 0.40 },
    { tier: 4, name: 'Masterwork', emoji: '🔥',  statMult: 0.70 },
    { tier: 5, name: 'Legendary',  emoji: '⚡',  statMult: 1.00 },
  ],

  // ── Rarity Metadata (display) ────────────────────────────
  RARITY_META: {
    R:  { label: 'Rare',       emoji: '💙',  color: 0x4A90D9, stars: '*'        },
    E:  { label: 'Epic',       emoji: '💜',  color: 0x9B59B6, stars: '**'       },
    L:  { label: 'Legendary',  emoji: '💛',  color: 0xF1C40F, stars: '***'      },
    MY: { label: 'Mythical',   emoji: '❤️',  color: 0xFF4757, stars: '****'     },
    UR: { label: 'Ultra-Rare', emoji: '🩵',  color: 0x00FFF0, stars: '*****'    },
    LT: { label: 'Limited',    emoji: '🩷',  color: 0xFF69B4, stars: 'LIMITED'  },
  },

};
