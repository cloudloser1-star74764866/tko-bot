# test Bot

A Discord card-collecting and RPG bot. Pull anime and game character cards, build your collection, battle players, form clans, and trade with other server members.

## Architecture

- **bot.js** — Main entry point. All Discord command handling and game logic.
- **cards.js** — Card pool and weighted pull logic.
- **config.js** — Pull rates, plating tiers, rarity display metadata, command prefix (`ZP`).
- **inventory.js** — JSON file persistence for user data (`data/inventory.json`). Handles cards, shards, platings, clans, duos, wish, prestige, level caps, guild settings.
- **trades.js** — In-memory trade manager with 5-minute expiry.
- **imageCache.js** — Fetches and caches card artwork from AniList.
- **emojiCache.js** — Uploads card art as custom Discord emojis.

## Running

The bot runs via the "Start application" workflow (`node bot.js`). Requires a `DISCORD_TOKEN` secret.

## Command Prefix

`ZP` — e.g. `ZP pull`, `ZP help`

## Command Categories

### Collection
- `ZP pull` / `ZP p` — Pull a random card
- `ZP allpull` / `ZP ap` — Spend all charges at once
- `ZP wish <cardId>` — Set a wish card (guaranteed after 200 pulls)
- `ZP collection` / `ZP col` — Browse your collection
- `ZP all` — Browse every card in the game
- `ZP card <id>` / `ZP c <id>` — Inspect a card
- `ZP mycard <id>` / `ZP mc <id>` — Inspect your own card (shows prestige points)
- `ZP cardinfo <id>` / `ZP ci <id>` — View base game info for any card

### Economy
- `ZP wallet` / `ZP balance` / `ZP bal` — View yen, stars, candy tokens
- `ZP shards` — View your character shards
- `ZP absorb shard:<id>:<count>` — Level up a card using shards
- `ZP increaselevelcap <id> <count>` / `ZP ilc` — Raise a card's level cap using shards
- `ZP kill <cardId> <shardId>:<count>` — Kill shards for yen + prestige points on the killer card
- `ZP trade @user <offer> for <ask>` — Trade shards, platings, yen, stars

### Team & Battle
- `ZP team` — View your battle team
- `ZP add <id>` / `ZP team add <id>` — Add card to team
- `ZP remove <id>` / `ZP team remove <id>` — Remove card from team
- `ZP swap <id1> <id2>` — Swap two team card positions
- `ZP team equip/unequip <id> <plating>` — Manage platings
- `ZP fight @user` — Turn-based team battle
- `ZP duofight @user` / `ZP df @user` — Fight with duo partner's combined team

### Clan System
- `ZP clancreate <name>` — Create a clan
- `ZP clan` — View your clan
- `ZP clanadd @user` — Add member (owner only)
- `ZP clanremove @user` — Remove member (owner only)
- `ZP clanleave` — Leave clan
- `ZP clandelete` — Delete clan (owner only)
- `ZP clanfundadd <yen>` — Donate to clan fund
- `ZP clanfundtake <yen>` — Withdraw from clan fund (owner only)

### Duo System
- `ZP duocreate @user` — Create duo partnership
- `ZP duo` — View your duo
- `ZP duoremove` — Disband duo

### Utility
- `ZP profile` / `ZP pro` — View player profile
- `ZP vote` — Get voting link
- `ZP privacy` — Toggle profile privacy
- `ZP help` / `ZP h` — Show all commands

### Bot Admin (owner only)
- `ZP setrarity`, `ZP setplating`, `ZP resetcooldown`
- `ZP giveyen`, `ZP givestars`, `ZP givecandytokens`, `ZP giveitem`

## Kill Yen Rewards (per shard)

| Rarity | Yen |
|--------|-----|
| Rare (R) | ¥50 |
| Epic (E) | ¥150 |
| Legendary (L) | ¥350 |
| Mythical (MY) | ¥600 |
| Ultra-Rare (UR) | ¥1,000 |
| Limited (LT) | ¥2,000 |

## Key Game Mechanics

- **Wish Pity**: Set a wish card with `ZP wish`. After 200 pulls, you receive it guaranteed.
- **Level Cap**: Default cap is 100. Use `ZP ilc <cardId> <count>` to raise it using shards.
- **Kill / Prestige**: Use `ZP kill <killerCard> <shardCard>:<count>` to destroy shards, earn yen, and gain prestige points on the killer card.
- **Clans**: Social guilds with a shared fund. Owner controls membership and withdrawals.
- **Duos**: 2-person partnerships for `ZP duofight` — combines both members' teams.

## Dependencies

- `discord.js` ^14.26.0
- `dotenv` ^16.4.5
