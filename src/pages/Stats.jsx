import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'wouter'
import { useEntries } from '../lib/store.jsx'
import { fmtDate, fmtRupiah, moodById, MOODS, VERDICTS } from '../lib/format.js'
import { Empty, Pnl, Spinner } from '../components/bits.jsx'

export default function Stats() {
  const { entries, loading, ledger } = useEntries()

  const s = useMemo(() => {
    const { realized, positions } = ledger
    const total = realized.reduce((a, r) => a + r.pnl, 0)
    const wins = realized.filter((r) => r.pnl > 0).length

    const moodCount = Object.fromEntries(MOODS.map((m) => [m.id, 0]))
    for (const e of entries) for (const m of e.moods) moodCount[m]++

    const moodResult = MOODS.map((m) => {
      const rs = realized.filter((r) => r.moods.includes(m.id))
      return { id: m.id, n: rs.length, avg: rs.length ? rs.reduce((a, r) => a + r.pnl, 0) / rs.length : 0, wins: rs.filter((r) => r.pnl > 0).length }
    }).filter((m) => m.n > 0)

    const months = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('id-ID', { month: 'short' }), full: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }), n: 0 })
    }
    for (const e of entries) {
      const d = new Date(e.date)
      const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`)
      if (m) m.n++
    }

    const verdicts = Object.fromEntries(VERDICTS.map((v) => [v.id, 0]))
    for (const e of entries) for (const r of e.reviews) verdicts[r.verdict]++

    let run = 0
    const curve = realized.map((r) => ({ ...r, cum: (run += r.pnl) }))

    const topTickers = Object.values(positions).sort((a, b) => b.trades - a.trades).slice(0, 5)

    return {
      total,
      wins,
      closed: realized.length,
      trades: entries.reduce((a, e) => a + e.trades.length, 0),
      moodCount,
      moodResult,
      months,
      verdicts,
      curve,
      topTickers,
    }
  }, [entries, ledger])

  if (loading && !entries.length) return <Spinner />
  if (!entries.length) return <Empty title="Belum ada data">Statistik muncul setelah kamu menulis beberapa catatan.</Empty>

  const moodMax = Math.max(1, ...Object.values(s.moodCount))
  const topMoods = MOODS.filter((m) => s.moodCount[m.id] > 0).sort((a, b) => s.moodCount[b.id] - s.moodCount[a.id])
  const reviewTotal = Object.values(s.verdicts).reduce((a, b) => a + b, 0)

  return (
    <div className="fade-in">
      <p className="font-hand text-2xl text-muted">refleksi</p>
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">Pola dirimu di market</h1>

      <dl className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Catatan" value={entries.length} />
        <Kpi label="Transaksi" value={s.trades} />
        <Kpi label="Realized P/L" value={<Pnl value={s.total} />} />
        <Kpi label="Win rate" value={s.closed ? `${Math.round((s.wins / s.closed) * 100)}%` : '–'} hint={s.closed ? `${s.wins} dari ${s.closed} penjualan` : 'belum ada penjualan'} />
      </dl>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Panel title="Perjalanan P/L" sub="Akumulasi realized profit/loss setiap kali kamu menjual" className="lg:col-span-2">
          {s.curve.length >= 2 ? <PnlCurve points={s.curve} /> : <Hint>Butuh minimal 2 penjualan untuk menggambar kurva.</Hint>}
        </Panel>

        <Panel title="Mood yang paling sering" sub="Dari semua catatan">
          {topMoods.length ? (
            <ul className="space-y-2.5">
              {topMoods.map((m) => (
                <li key={m.id} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-3 text-sm">
                  <span className="text-ink-2 truncate">{m.emoji} {m.label}</span>
                  <span className="h-2.5 rounded-full bg-sunken overflow-hidden">
                    <span className="block h-full rounded-full bg-ink-2" style={{ width: `${(s.moodCount[m.id] / moodMax) * 100}%` }} />
                  </span>
                  <span className="text-right tabular-nums text-ink">{s.moodCount[m.id]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Hint>Belum ada mood yang dicatat.</Hint>
          )}
        </Panel>

        <Panel title="Mood vs hasil" sub="Rata-rata P/L per penjualan, menurut perasaanmu saat menjual">
          {s.moodResult.length ? <MoodResult rows={s.moodResult} /> : <Hint>Muncul setelah ada penjualan yang punya mood.</Hint>}
        </Panel>

        <Panel title="Aktivitas menulis" sub="Jumlah catatan, 12 bulan terakhir">
          <MonthBars months={s.months} />
        </Panel>

        <Panel title="Hasil review" sub="Penilaian ulang atas keputusanmu">
          {reviewTotal ? (
            <>
              <div className="flex h-3 gap-0.5 rounded-full overflow-hidden">
                {VERDICTS.filter((v) => s.verdicts[v.id]).map((v) => (
                  <span key={v.id} className={VERDICT_FILL[v.id]} style={{ flex: s.verdicts[v.id] }} title={`${v.label}: ${s.verdicts[v.id]}`} />
                ))}
              </div>
              <ul className="mt-4 space-y-1.5 text-sm">
                {VERDICTS.map((v) => (
                  <li key={v.id} className="flex items-center gap-2 text-ink-2">
                    <span className={`size-2.5 rounded-full ${VERDICT_FILL[v.id]}`} />
                    {v.emoji} {v.label}
                    <span className="ml-auto tabular-nums text-ink">{s.verdicts[v.id]}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Hint>Belum ada review. Buka catatan lama dan tulis apa yang kamu pelajari.</Hint>
          )}
        </Panel>

        {s.topTickers.length > 0 && (
          <Panel title="Saham favorit" sub="Paling sering ditransaksikan" className="lg:col-span-2">
            <ul className="divide-y divide-line">
              {s.topTickers.map((p, i) => (
                <li key={p.ticker}>
                  <Link href={`/saham/${p.ticker}`} className="flex items-center gap-3 py-2.5 hover:bg-sunken/60 -mx-2 px-2 rounded-lg">
                    <span className="font-hand text-xl text-muted w-5">{i + 1}</span>
                    <span className="font-semibold tracking-wide">{p.ticker}</span>
                    <span className="text-sm text-muted">{p.trades} transaksi</span>
                    <span className="ml-auto text-sm">{p.closed ? <Pnl value={p.realized} /> : <span className="text-muted">belum dijual</span>}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </div>
  )
}

const VERDICT_FILL = { benar: 'bg-gain', salah: 'bg-loss', netral: 'bg-muted/50' }

function Kpi({ label, value, hint }) {
  return (
    <div className="card p-4 sm:p-5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-serif text-xl sm:text-3xl font-semibold tabular-nums whitespace-nowrap">{value}</dd>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

function Panel({ title, sub, children, className = '' }) {
  return (
    <section className={`card min-w-0 p-4 sm:p-6 ${className}`}>
      <h2 className="font-serif text-lg font-semibold">{title}</h2>
      {sub && <p className="text-xs text-muted mb-5">{sub}</p>}
      {children}
    </section>
  )
}

const Hint = ({ children }) => <p className="text-sm text-muted italic py-4">{children}</p>

function MoodResult({ rows }) {
  const max = Math.max(...rows.map((r) => Math.abs(r.avg)), 1)
  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const m = moodById[r.id]
        const w = (Math.abs(r.avg) / max) * 50
        return (
          <li key={r.id} className="text-sm" title={`${r.n} penjualan, ${r.wins} untung`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-ink-2">{m.emoji} {m.label} <span className="text-xs text-muted">· {r.n}×</span></span>
              <Pnl value={r.avg} className="text-xs" />
            </div>
            <div className="relative mt-1.5 h-2 rounded-full bg-sunken">
              <span className="absolute left-1/2 -top-0.5 -bottom-0.5 w-px bg-muted/60" aria-hidden="true" />
              <span
                className={`absolute inset-y-0 ${r.avg >= 0 ? 'bg-gain rounded-r-full' : 'bg-loss rounded-l-full'}`}
                style={r.avg >= 0 ? { left: '50%', width: `${w}%` } : { right: '50%', width: `${w}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function MonthBars({ months }) {
  const max = Math.max(1, ...months.map((m) => m.n))
  return (
    <div className="grid grid-cols-12 gap-1 sm:gap-1.5 items-end h-36">
      {months.map((m) => (
        <div key={m.key} className="flex flex-col items-center justify-end h-full gap-1" title={`${m.full}: ${m.n} catatan`}>
          <span className="text-[10px] tabular-nums text-muted">{m.n || ''}</span>
          <span className={`w-full max-w-6 rounded-t ${m.n ? 'bg-ink-2' : 'bg-sunken'}`} style={{ height: `${m.n ? Math.max(6, (m.n / max) * 100) : 4}%` }} />
          <span className="text-[10px] text-muted">{m.label.slice(0, 3)}</span>
        </div>
      ))}
    </div>
  )
}

function useWidth() {
  const ref = useRef(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    setW(ref.current.clientWidth)
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, Math.max(w, 120)]
}

function PnlCurve({ points }) {
  const [ref, w] = useWidth()
  const [hover, setHover] = useState(null)
  const h = 220
  const pad = { t: 16, r: 12, b: 24, l: 12 }
  const vals = points.map((p) => p.cum)
  const lo = Math.min(0, ...vals)
  const hi = Math.max(0, ...vals)
  const span = hi - lo || 1
  const x = (i) => pad.l + (i / (points.length - 1)) * (w - pad.l - pad.r)
  const y = (v) => pad.t + (1 - (v - lo) / span) * (h - pad.t - pad.b)
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.cum).toFixed(1)}`).join('')
  const last = points[points.length - 1]

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const i = Math.round(((e.clientX - r.left - pad.l) / (w - pad.l - pad.r)) * (points.length - 1))
    setHover(Math.max(0, Math.min(points.length - 1, i)))
  }

  const hp = hover !== null ? points[hover] : null

  return (
    <div ref={ref} className="relative min-w-0">
      <div className="mb-3 text-sm text-ink-2">
        Total sekarang <Pnl value={last.cum} compact={false} />
      </div>
      <svg width={w} height={h} className="block max-w-full touch-none" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label={`Kurva P/L kumulatif, ${points.length} penjualan, total ${fmtRupiah(last.cum, { sign: true })}`}>
        <line x1={pad.l} x2={w - pad.r} y1={y(0)} y2={y(0)} stroke="var(--muted)" strokeDasharray="3 4" strokeWidth="1" />
        <text x={w - pad.r} y={y(0) - 6} textAnchor="end" className="fill-muted text-[10px]">Rp 0</text>
        <path d={`${path}L${x(points.length - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill="var(--ink)" opacity="0.05" />
        <path d={path} fill="none" stroke="var(--ink-2)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.cum)} r={hover === i ? 5 : 3} fill={p.pnl >= 0 ? 'var(--gain)' : 'var(--loss)'} stroke="var(--card)" strokeWidth="2" />
        ))}
        {hp && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={h - pad.b} stroke="var(--ink-2)" strokeWidth="1" opacity="0.4" />}
        <text x={pad.l} y={h - 6} className="fill-muted text-[10px]">{fmtDate(points[0].date, { month: 'short', year: '2-digit' })}</text>
        <text x={w - pad.r} y={h - 6} textAnchor="end" className="fill-muted text-[10px]">{fmtDate(last.date, { month: 'short', year: '2-digit' })}</text>
      </svg>
      {hp && (
        <div
          className="pointer-events-none absolute z-10 card px-3 py-2 text-xs shadow-lg whitespace-nowrap"
          style={{ left: Math.min(Math.max(x(hover) - 80, 0), w - 170), top: Math.max(y(hp.cum) - 20, 30) }}
        >
          <div className="font-semibold text-ink">{hp.ticker} · {fmtDate(hp.date, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          <div className="mt-0.5 text-ink-2">Jual ini: <Pnl value={hp.pnl} /></div>
          <div className="text-ink-2">Akumulasi: <Pnl value={hp.cum} /></div>
        </div>
      )}
    </div>
  )
}
