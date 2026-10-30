import { useState } from 'react'
import { Link, useLocation, useParams } from 'wouter'
import { useEntries } from '../lib/store.jsx'
import { fmtDate, fmtNumber, fmtRupiah, fmtTime, fmtWeekday, timeAgo, VERDICTS, verdictById } from '../lib/format.js'
import { tradeValue } from '../lib/ledger.js'
import Markdown from '../components/Markdown.jsx'
import { Empty, MoodChip, Pnl, Spinner } from '../components/bits.jsx'
import Icon from '../components/Icon.jsx'

export default function EntryDetail() {
  const { id } = useParams()
  const [, navigate] = useLocation()
  const { entries, loading, save, remove, ledger } = useEntries()
  const entry = entries.find((e) => e.id === id)
  const [busy, setBusy] = useState(false)

  if (!entry) return loading ? <Spinner /> : <Empty title="Catatan tidak ditemukan" action={<Link href="/" className="btn-outline">Kembali</Link>} />

  const realized = ledger.realized.filter((r) => r.entryId === id)

  const del = async () => {
    if (!confirm('Hapus catatan ini? Tindakan ini tidak bisa dibatalkan.')) return
    setBusy(true)
    try {
      await remove(id)
      navigate('/', { replace: true })
    } catch (e) {
      alert(e.message)
      setBusy(false)
    }
  }

  const saveReviews = (reviews) => save({ ...entry, reviews }, id)

  return (
    <div className="max-w-3xl mx-auto fade-in">
      <div className="flex items-center justify-between gap-2 mb-6">
        <Link href="/" className="btn-ghost px-2! -ml-2">
          <Icon name="back" className="size-4" /> Semua catatan
        </Link>
        <div className="flex gap-1">
          <Link href={`/catatan/${id}/edit`} className="btn-ghost px-3!">
            <Icon name="edit" className="size-4" /> <span className="hidden sm:inline">Sunting</span>
          </Link>
          <button onClick={del} disabled={busy} className="btn-ghost px-3! hover:text-loss!">
            <Icon name="trash" className="size-4" /> <span className="hidden sm:inline">Hapus</span>
          </button>
        </div>
      </div>

      <article className="card relative overflow-hidden">
        <span className="hidden sm:block absolute left-8 inset-y-0 w-px bg-margin" aria-hidden="true" />
        <div className="p-5 sm:p-8 sm:pl-14">
          <p className="font-hand text-2xl text-loss capitalize">
            {fmtWeekday(entry.date)}, {fmtDate(entry.date)} · {fmtTime(entry.date)}
          </p>
          <h1 className="mt-1 font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-balance">{entry.title || 'Tanpa judul'}</h1>

          {entry.moods.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {entry.moods.map((m) => (
                <MoodChip key={m} id={m} size="md" />
              ))}
            </div>
          )}

          {entry.story && (
            <div className="mt-7">
              <Markdown text={entry.story} />
            </div>
          )}

          {entry.decision && (
            <section className="mt-8 rounded-xl bg-marker/35 p-4 sm:p-5">
              <h2 className="label text-ink-2!">Keputusan & alasan</h2>
              <Markdown text={entry.decision} />
            </section>
          )}

          {entry.trades.length > 0 && (
            <section className="mt-8">
              <h2 className="label">Eksekusi</h2>
              <ul className="divide-y divide-line border-y border-line">
                {entry.trades.map((t, i) => (
                  <li key={i} className="flex items-center gap-3 py-3">
                    <span className={`w-12 text-center rounded-md py-0.5 text-[11px] font-bold tracking-wider text-white ${t.side === 'BUY' ? 'bg-gain' : 'bg-loss'}`}>
                      {t.side === 'BUY' ? 'BELI' : 'JUAL'}
                    </span>
                    <Link href={`/saham/${t.ticker}`} className="font-semibold tracking-wide hover:underline underline-offset-4">
                      {t.ticker}
                    </Link>
                    <span className="text-sm text-ink-2 tabular-nums">
                      {fmtNumber(t.lots)} lot @ {fmtNumber(t.price)}
                    </span>
                    <span className="ml-auto text-sm text-muted tabular-nums">{fmtRupiah(tradeValue(t), { compact: true })}</span>
                  </li>
                ))}
              </ul>
              {realized.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  {realized.map((r, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-ink-2">
                      Realized {r.ticker}: <Pnl value={r.pnl} /> <span className="text-muted tabular-nums">({r.pct > 0 ? '+' : ''}{r.pct.toFixed(1)}%)</span>
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </article>

      <Reviews entry={entry} onSave={saveReviews} />
    </div>
  )
}

function Reviews({ entry, onSave }) {
  const [text, setText] = useState('')
  const [verdict, setVerdict] = useState('netral')
  const [busy, setBusy] = useState(false)

  const add = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    try {
      await onSave([...entry.reviews, { id: crypto.randomUUID(), date: new Date().toISOString(), text: text.trim(), verdict }])
      setText('')
      setVerdict('netral')
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  const del = async (rid) => {
    if (!confirm('Hapus review ini?')) return
    await onSave(entry.reviews.filter((r) => r.id !== rid)).catch((err) => alert(err.message))
  }

  return (
    <section className="mt-10">
      <h2 className="font-serif text-2xl font-semibold">Melihat ke belakang</h2>
      <p className="mt-1 text-sm text-muted">Setelah beberapa waktu, apa yang kamu pelajari dari keputusan ini?</p>

      {entry.reviews.length > 0 && (
        <ol className="mt-6 relative border-l-2 border-line ml-2 space-y-6">
          {entry.reviews.map((r) => {
            const v = verdictById[r.verdict]
            return (
              <li key={r.id} className="pl-6 relative group">
                <span className="absolute -left-[9px] top-1 size-4 rounded-full bg-card border-2 border-ink-2" aria-hidden="true" />
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="font-semibold text-ink-2">{v.emoji} {v.short}</span>·
                  <span title={fmtDate(r.date)}>{fmtDate(r.date, { day: 'numeric', month: 'short', year: 'numeric' })} ({timeAgo(r.date)})</span>
                  <button onClick={() => del(r.id)} className="ml-auto p-1 opacity-60 sm:opacity-0 group-hover:opacity-100 hover:text-loss transition" aria-label="Hapus review">
                    <Icon name="x" className="size-3.5" />
                  </button>
                </div>
                <Markdown text={r.text} className="prose-journal mt-1 text-base!" />
              </li>
            )
          })}
        </ol>
      )}

      <form onSubmit={add} className="card mt-6 p-4 sm:p-5 space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Ternyata…"
          className="w-full resize-y bg-transparent font-serif text-base outline-none placeholder:text-muted"
          aria-label="Tulis review"
        />
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Penilaian keputusan">
            {VERDICTS.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={verdict === v.id}
                onClick={() => setVerdict(v.id)}
                className={`rounded-full border px-3 py-1 text-xs transition ${verdict === v.id ? 'bg-ink text-paper border-ink' : 'border-line text-ink-2 hover:border-ink-2'}`}
              >
                {v.emoji} {v.label}
              </button>
            ))}
          </div>
          <button type="submit" disabled={busy || !text.trim()} className="btn-primary py-2!">
            {busy ? 'Menyimpan…' : 'Tambah review'}
          </button>
        </div>
      </form>
    </section>
  )
}
