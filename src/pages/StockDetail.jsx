import { useMemo } from 'react'
import { Link, useParams } from 'wouter'
import { useEntries } from '../lib/store.jsx'
import { fmtNumber, fmtRupiah } from '../lib/format.js'
import { entryTickers, tradeValue } from '../lib/ledger.js'
import EntryCard from '../components/EntryCard.jsx'
import { Empty, Pnl, Spinner } from '../components/bits.jsx'
import Icon from '../components/Icon.jsx'

export default function StockDetail() {
  const ticker = useParams().ticker.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const { entries, loading, ledger } = useEntries()

  const related = useMemo(() => entries.filter((e) => entryTickers(e).has(ticker)), [entries, ticker])
  const p = ledger.positions[ticker]

  if (loading && !entries.length) return <Spinner />

  const bought = related.flatMap((e) => e.trades).filter((t) => t.ticker === ticker && t.side === 'BUY')
  const totalBuy = bought.reduce((s, t) => s + tradeValue(t), 0)

  return (
    <div className="fade-in">
      <Link href="/saham" className="btn-ghost px-2! -ml-2 mb-4">
        <Icon name="back" className="size-4" /> Semua saham
      </Link>

      <div className="card relative overflow-hidden p-5 sm:p-8">
        <p className="font-hand text-2xl text-muted">kisah bersama</p>
        <h1 className="font-serif text-5xl sm:text-6xl font-semibold tracking-wide">{ticker}</h1>

        {p ? (
          <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <Stat label="Posisi sekarang" value={p.lots ? `${fmtNumber(p.lots)} lot` : 'Kosong'} />
            <Stat label="Harga rata-rata" value={p.lots ? fmtNumber(p.avg) : '–'} />
            <Stat label="Realized P/L" value={p.closed ? <Pnl value={p.realized} /> : '–'} />
            <Stat label="Total dibeli" value={fmtRupiah(totalBuy, { compact: true })} />
          </dl>
        ) : (
          <p className="mt-4 text-sm text-muted">Belum ada transaksi, hanya disebut di cerita.</p>
        )}
      </div>

      <h2 className="flex items-center gap-3 mt-10 mb-4 font-serif text-lg font-semibold text-ink-2">
        Catatan tentang {ticker} <span className="h-px flex-1 bg-line" />
        <span className="font-sans text-xs font-normal text-muted">{related.length}</span>
      </h2>
      {related.length ? (
        <div className="space-y-4">
          {related.map((e) => (
            <EntryCard key={e.id} entry={e} />
          ))}
        </div>
      ) : (
        <Empty title={`Belum ada cerita soal ${ticker}`} />
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-serif text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
