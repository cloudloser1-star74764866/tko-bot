# test Bot

A Discord card-collecting bot. Pull anime & game character cards, build your collection, and trade with other server members.

## Architecture

- **bot.js** — Main entry point. All Discord command handling.
- **cards.js** — Card pool (38 cards across 6 rarities) and weighted pull logic.
- **config.js** — Pull rates, shard values, rarity display metadata, command prefix.
- **inventory.js** — JSON file persistence for user cards and shards (`data/inventory.json`).
- **trades.js** — In-memory trade manager with 5-minute expiry.

## Running

The bot runs via the "Start application" workflow (`node bot.js`). It requires a `DISCORD_TOKEN` secret set in Replit Secrets.

## Commands

- `!tko pull` — Pull a random card (30s cooldown)
- `!tko inventory [@user]` — View card collection
- `!tko card <id>` — Inspect a card
- `!tko shards` — Check shard balance
- `!tko trade @user <cardId> <shards>` — Offer a trade
- `!tko accept <tradeId>` / `!tko decline <tradeId>` — Respond to trades
- `!tko trades` — View incoming trade offers
- `!tko help` — Show all commands

## Rarity Tiers

| Rarity | Code | Pull Rate | Dupe Shards |
|--------|------|-----------|-------------|
| Rare | R | 45% | 10 |
| Epic | E | 28% | 25 |
| Legendary | L | 15% | 60 |
| Mythical | MY | 7% | 120 |
| Ultra-Rare | UR | 4% | 250 |
| Limited | LT | 1% | 500 |

## Dependencies

- `discord.js` ^14.26.0
- `dotenv` ^16.4.5
