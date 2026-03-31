// ============================================================
//  TKO BOT — TRADE MANAGER
//  Trades are stored in memory (reset on bot restart).
//  Each trade: one user offers a card, asks for shards in return.
// ============================================================

// pendingTrades: Map<tradeId, TradeOffer>
// TradeOffer {
//   tradeId:      string,
//   fromUserId:   string,
//   toUserId:     string,
//   offeredCardId:string,
//   askingShards: number,
//   createdAt:    number,
// }

const pendingTrades = new Map();
let   tradeCounter  = 1;
const TRADE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function createTrade({ fromUserId, toUserId, offeredCardId, askingShards }) {
  // Clean expired trades first
  pruneExpired();

  const tradeId = `T${tradeCounter++}`;
  pendingTrades.set(tradeId, {
    tradeId,
    fromUserId,
    toUserId,
    offeredCardId,
    askingShards,
    createdAt: Date.now(),
  });
  return tradeId;
}

function getTrade(tradeId) {
  pruneExpired();
  return pendingTrades.get(tradeId) ?? null;
}

function cancelTrade(tradeId) {
  pendingTrades.delete(tradeId);
}

function pruneExpired() {
  const now = Date.now();
  for (const [id, trade] of pendingTrades.entries()) {
    if (now - trade.createdAt > TRADE_EXPIRY_MS) {
      pendingTrades.delete(id);
    }
  }
}

// Get all pending trades targeting a specific user
function getTradesForUser(userId) {
  pruneExpired();
  return [...pendingTrades.values()].filter(t => t.toUserId === userId);
}

module.exports = { createTrade, getTrade, cancelTrade, getTradesForUser };
