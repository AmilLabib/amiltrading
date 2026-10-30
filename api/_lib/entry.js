import crypto from 'node:crypto'

const MOODS = ['tenang', 'yakin', 'excited', 'fomo', 'ragu', 'takut', 'panik', 'serakah', 'kesal', 'sabar']
const VERDICTS = ['benar', 'salah', 'netral']

const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '')
const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

const cleanTrade = (t) => ({
  ticker: str(t?.ticker, 10).toUpperCase().replace(/[^A-Z0-9]/g, ''),
  side: t?.side === 'SELL' ? 'SELL' : 'BUY',
  price: num(t?.price),
  lots: Math.floor(num(t?.lots)),
})

const cleanReview = (r) => ({
  id: str(r?.id, 40) || crypto.randomUUID(),
  date: str(r?.date, 40) || new Date().toISOString(),
  text: str(r?.text, 10000),
  verdict: VERDICTS.includes(r?.verdict) ? r.verdict : 'netral',
})

// Whitelists and normalizes user input so only known fields reach Redis.
export function cleanEntry(input, existing) {
  const date = new Date(input?.date)
  return {
    id: existing?.id || crypto.randomUUID(),
    date: Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(),
    title: str(input?.title, 200),
    story: str(input?.story, 50000),
    decision: str(input?.decision, 20000),
    moods: Array.isArray(input?.moods) ? [...new Set(input.moods.filter((m) => MOODS.includes(m)))] : [],
    trades: Array.isArray(input?.trades)
      ? input.trades.map(cleanTrade).filter((t) => t.ticker && t.lots > 0 && t.price > 0)
      : [],
    reviews: Array.isArray(input?.reviews) ? input.reviews.map(cleanReview).filter((r) => r.text) : [],
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
