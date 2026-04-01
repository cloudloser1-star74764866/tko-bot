// ============================================================
//  test BOT — TRADE MANAGER
//  Trades are in-memory only (reset on bot restart).
//  Each trade: one user offers shards/platings, asks for
//  shards/platings in return.
//
//  Item format: { type: 'shard'|'plating', id: string, amount: number }
//    shard   → id = cardId     (e.g. 'naruto_r')
//    plating → id = tier id    (e.g. 'gold')
// ============================================================

const pendingTrades = new Map();
let   tradeCounter  = 1;
const TRADE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function createTrade({ fromUserId, toUserId, offer, ask }) {
  pruneExpired();
  const tradeId = `T${tradeCounter++}`;
  pendingTrades.set(tradeId, {
    tradeId,
    fromUserId,
    toUserId,
    offer,   // { type, id, amount }
    ask,     // { type, id, amount }
    createdAt: Date.now(),
    offerMessage: null,
  });
  return tradeId;
}

function setOfferMessage(tradeId, message) {
  const trade = pendingTrades.get(tradeId);
  if (trade) trade.offerMessage = message;
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

function getTradesForUser(userId) {
  pruneExpired();
  return [...pendingTrades.values()].filter(t => t.toUserId === userId);
}

module.exports = { createTrade, setOfferMessage, getTrade, cancelTrade, getTradesForUser };
