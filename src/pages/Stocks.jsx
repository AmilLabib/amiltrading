import { useMemo } from 'react'
import { Link } from 'wouter'
import { useEntries } from '../lib/store.jsx'
import { fmtNumber, timeAgo } from '../lib/format.js'
import { Empty, Pnl, Spinner } from '../components/bits.jsx'

export default function Stocks() {
  const { entries, loading, ledger } = useEntries()

  const stocks = useMemo(() => {
    const meta = {}
    for (const e of entries) {
      for (const t of new Set(e.trades.map((t) => t.ticker))) {
        const m = (meta[t] ||= { entries: 0, last: e.date })
        m.entries++
        if (e.date > m.last) m.last = e.date
      }
    }
    return Object.values(ledger.positions)
      .map((p) => ({ ...p, ...meta[p.ticker] }))
      .sort((a, b) => (b.lots > 0) - (a.lots > 0) || b.last.localeCompare(a.last))
  }, [entries, ledger])

  if (loading && !entries.length) return <Spinner />

  const holding = stocks.filter((s) => s.lots > 0)
  const closed = stocks.filter((s) => s.lots === 0)

  return (
    <div className="fade-in">
      <p className="font-hand text-2xl text-muted">rak saham</p>
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">Saham yang pernah kamu sentuh</h1>

      {stocks.length === 0 ? (
        <div className="mt-8">
          <Empty title="Belum ada saham">Tambahkan transaksi di catatanmu, nanti sahamnya muncul di sini.</Empty>
        </div>
      ) : (
        <>
          {holding.length > 0 && <Group title="Masih dipegang" list={holding} />}
          {closed.length > 0 && <Group title="Sudah keluar" list={closed} />}
        </>
      )}
    </div>
  )
}

function Group({ title, list }) {
  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-3 mb-4 font-serif text-lg font-semibold text-ink-2">
        {title} <span className="h-px flex-1 bg-line" />
      </h2>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => (
          <Link key={s.ticker} href={`/saham/${s.ticker}`} className="card p-4 sm:p-5 transition hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-serif text-2xl font-semibold tracking-wide">{s.ticker}</div>
                <div className="text-xs text-muted mt-0.5">
                  {s.entries} catatan · {timeAgo(s.last)}
                </div>
              </div>
              {s.closed > 0 && <Pnl value={s.realized} className="text-sm" />}
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-line text-sm text-ink-2 tabular-nums">
              {s.lots > 0 ? (
                <>
                  <b className="text-ink">{fmtNumber(s.lots)} lot</b> · avg {fmtNumber(s.avg)}
                </>
              ) : (
                <span className="text-muted">
                  {s.closed} kali jual · {s.wins} untung
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
