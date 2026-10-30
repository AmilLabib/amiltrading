import { useMemo, useState } from 'react'
import { Link } from 'wouter'
import { useEntries } from '../lib/store.jsx'
import { fmtMonth, MOODS, timeAgo } from '../lib/format.js'
import EntryCard from '../components/EntryCard.jsx'
import { Empty, MoodChip, Pnl, Spinner } from '../components/bits.jsx'
import Icon from '../components/Icon.jsx'

function greeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 19) return 'Selamat sore'
  return 'Selamat malam'
}

export default function Timeline() {
  const { entries, loading, error, reload, ledger } = useEntries()
  const [q, setQ] = useState('')
  const [mood, setMood] = useState(null)
  const [ticker, setTicker] = useState('')

  const tickers = useMemo(() => Object.keys(ledger.positions).sort(), [ledger])
  const totalPnl = useMemo(() => ledger.realized.reduce((s, r) => s + r.pnl, 0), [ledger])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return entries.filter(
      (e) =>
        (!mood || e.moods.includes(mood)) &&
        (!ticker || e.trades.some((t) => t.ticker === ticker)) &&
        (!needle ||
          [e.title, e.story, e.decision, ...e.trades.map((t) => t.ticker), ...e.reviews.map((r) => r.text)]
            .join(' ')
            .toLowerCase()
            .includes(needle)),
    )
  }, [entries, q, mood, ticker])

  const groups = useMemo(() => {
    const map = new Map()
    for (const e of filtered) {
      const k = fmtMonth(e.date)
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(e)
    }
    return [...map]
  }, [filtered])

  if (loading && !entries.length) return <Spinner />
  if (error)
    return (
      <Empty title="Gagal memuat catatan" action={<button className="btn-outline" onClick={reload}>Coba lagi</button>}>
        {error}
      </Empty>
    )

  const filtering = q || mood || ticker

  return (
    <div>
      <section className="mb-8">
        <p className="font-hand text-2xl text-muted">{greeting()},</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
          Apa yang kamu rasakan di market hari ini?
        </h1>
        {entries.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
            <span><b className="font-semibold text-ink tabular-nums">{entries.length}</b> catatan</span>
            <span>terakhir menulis <b className="font-semibold text-ink">{timeAgo(entries[0].date)}</b></span>
            {ledger.realized.length > 0 && (
              <span className="inline-flex items-center gap-1.5">realized <Pnl value={totalPnl} /></span>
            )}
          </div>
        )}
      </section>

      {entries.length === 0 ? (
        <Empty
          title="Halaman pertama masih kosong"
          action={
            <Link href="/tulis" className="btn-primary">
              <Icon name="pen" className="size-4" /> Tulis catatan pertama
            </Link>
          }
        >
          Ceritakan apa yang menarik perhatianmu, apa yang kamu rasakan, dan keputusan apa yang kamu ambil.
        </Empty>
      ) : (
        <>
          <div className="sticky top-14 md:top-16 z-20 -mx-4 px-4 sm:-mx-6 sm:px-6 py-3 bg-paper/90 backdrop-blur-md space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Icon name="search" className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari cerita, saham, alasan…"
                  className="input pl-10! rounded-full!"
                  aria-label="Cari catatan"
                />
              </div>
              {tickers.length > 0 && (
                <select value={ticker} onChange={(e) => setTicker(e.target.value)} className="input w-auto! max-w-[38%] sm:max-w-none rounded-full! pr-8!" aria-label="Filter saham">
                  <option value="">Semua saham</option>
                  {tickers.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {MOODS.map((m) => (
                <MoodChip key={m.id} id={m.id} active={mood === m.id} onClick={() => setMood(mood === m.id ? null : m.id)} />
              ))}
            </div>
          </div>

          {filtering && (
            <div className="mt-2 flex items-center justify-between text-sm text-muted">
              <span>{filtered.length} catatan ditemukan</span>
              <button className="underline underline-offset-4 hover:text-ink" onClick={() => (setQ(''), setMood(null), setTicker(''))}>
                Hapus filter
              </button>
            </div>
          )}

          {groups.length === 0 ? (
            <div className="mt-6">
              <Empty title="Nggak ketemu">Coba kata kunci atau filter lain.</Empty>
            </div>
          ) : (
            groups.map(([month, list]) => (
              <section key={month} className="mt-8">
                <h2 className="flex items-center gap-3 mb-4 font-serif text-lg font-semibold text-ink-2">
                  <span className="capitalize">{month}</span>
                  <span className="h-px flex-1 bg-line" />
                  <span className="font-sans text-xs font-normal text-muted">{list.length} catatan</span>
                </h2>
                <div className="space-y-4">
                  {list.map((e) => (
                    <EntryCard key={e.id} entry={e} />
                  ))}
                </div>
              </section>
            ))
          )}
        </>
      )}
    </div>
  )
}
