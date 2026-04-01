// ============================================================
//  test BOT — TRADE MANAGER
//  Trades are in-memory only (reset on bot restart).
//
//  Trade object:
//    tradeId   – unique identifier
//    offerId   – userId of the person who created the trade
//    offerName – display name of the offerer
//    askId     – userId of the person being asked
//    askName   – display name of the asker target
//    offerItems – array of items the offerer is giving
//    askItems   – array of items the offerer wants in return
//    createdAt  – timestamp
//
//  Item format: { type: 'shard'|'plating'|'yen'|'stars', id?, amount }
// ============================================================

const pendingTrades  = new Map();
let   tradeCounter   = 1;
const TRADE_EXPIRY_MS = 5 * 60 * 1000;

function createTrade({ offerId, offerName, askId, askName, offerItems, askItems }) {
  pruneExpired();
  const tradeId = `T${tradeCounter++}`;
  pendingTrades.set(tradeId, {
    tradeId,
    offerId,
    offerName,
    askId,
    askName,
    offerItems,
    askItems,
    createdAt: Date.now(),
  });
  return tradeId;
}

function getTrade(tradeId) {
  pruneExpired();
  return pendingTrades.get(tradeId) ?? null;
}

function removeTrade(tradeId) {
  pendingTrades.delete(tradeId);
}

function getTradesFor(userId) {
  pruneExpired();
  return [...pendingTrades.values()].filter(t => t.askId === userId);
}

function pruneExpired() {
  const now = Date.now();
  for (const [id, trade] of pendingTrades.entries()) {
    if (now - trade.createdAt > TRADE_EXPIRY_MS) {
      pendingTrades.delete(id);
    }
  }
}

module.exports = { createTrade, getTrade, removeTrade, getTradesFor };
