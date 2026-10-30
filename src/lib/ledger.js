import { LOT_SIZE } from './format.js'

// Replays every trade in time order with the average-cost method.
// Sells beyond the lots recorded in the diary are ignored for P/L (they came from outside the diary).
export function buildLedger(entries) {
  const trades = entries
    .flatMap((e) => e.trades.map((t, i) => ({ ...t, i, date: e.date, entryId: e.id, moods: e.moods })))
    .sort((a, b) => a.date.localeCompare(b.date) || a.i - b.i)

  const positions = {}
  const realized = []

  for (const t of trades) {
    const p = (positions[t.ticker] ||= { ticker: t.ticker, lots: 0, avg: 0, realized: 0, trades: 0, wins: 0, closed: 0 })
    p.trades++
    if (t.side === 'BUY') {
      p.avg = (p.avg * p.lots + t.price * t.lots) / (p.lots + t.lots)
      p.lots += t.lots
      continue
    }
    const qty = Math.min(t.lots, p.lots)
    if (!qty) continue
    const pnl = (t.price - p.avg) * qty * LOT_SIZE
    realized.push({ ticker: t.ticker, entryId: t.entryId, date: t.date, moods: t.moods, qty, pnl, pct: (t.price / p.avg - 1) * 100 })
    p.realized += pnl
    p.closed++
    if (pnl > 0) p.wins++
    p.lots -= qty
    if (!p.lots) p.avg = 0
  }

  const byEntry = {}
  for (const r of realized) byEntry[r.entryId] = (byEntry[r.entryId] || 0) + r.pnl

  return { positions, realized, byEntry }
}

export const tradeValue = (t) => t.price * t.lots * LOT_SIZE
