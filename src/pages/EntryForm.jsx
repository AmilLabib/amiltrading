import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'wouter'
import { useEntries } from '../lib/store.jsx'
import { fmtNumber, fmtRupiah, MOODS, toLocalInput } from '../lib/format.js'
import { tradeValue } from '../lib/ledger.js'
import { Empty, MoodChip, Spinner } from '../components/bits.jsx'
import Icon from '../components/Icon.jsx'

const DRAFT_KEY = 'draft:new-entry'
const blankTrade = () => ({ ticker: '', side: 'BUY', price: '', lots: '' })
const blank = () => ({ date: toLocalInput(new Date().toISOString()), title: '', story: '', decision: '', moods: [], trades: [] })

const readDraft = () => {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY))
  } catch {
    return null
  }
}

// Keyed so moving between "edit" and "new" never carries form state over.
export default function EntryFormRoute() {
  const { id } = useParams()
  return <EntryForm key={id || 'new'} id={id} />
}

function EntryForm({ id }) {
  const [, navigate] = useLocation()
  const { entries, loading, save } = useEntries()
  const existing = id ? entries.find((e) => e.id === id) : null

  const [form, setForm] = useState(() => (id ? null : readDraft() || blank()))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (existing && !form) setForm({ ...existing, date: toLocalInput(existing.date) })
  }, [existing, form])

  // Keep an unsent new entry around if the tab closes or the phone locks.
  useEffect(() => {
    if (id || !form) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
    } catch {}
  }, [id, form])

  if (id && !existing) return loading ? <Spinner /> : <Empty title="Catatan tidak ditemukan" />
  if (!form) return <Spinner />

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const setTrade = (i, patch) => set({ trades: form.trades.map((t, j) => (j === i ? { ...t, ...patch } : t)) })
  const toggleMood = (m) => set({ moods: form.moods.includes(m) ? form.moods.filter((x) => x !== m) : [...form.moods, m] })

  const incomplete = form.trades.some((t) => t.ticker || t.price || t.lots) && form.trades.some((t) => !t.ticker || !(+t.price > 0) || !(+t.lots > 0))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.story.trim() && !form.decision.trim() && !form.trades.length) {
      setError('Tulis sesuatu dulu, minimal cerita atau keputusanmu.')
      return
    }
    if (incomplete) {
      setError('Lengkapi kode saham, harga, dan jumlah lot di setiap transaksi (atau hapus barisnya).')
      return
    }
    setBusy(true)
    setError('')
    try {
      const saved = await save(
        {
          ...form,
          date: new Date(form.date).toISOString(),
          trades: form.trades.map((t) => ({ ...t, price: +t.price, lots: +t.lots })),
        },
        id,
      )
      if (!id) localStorage.removeItem(DRAFT_KEY)
      navigate(`/catatan/${saved.id}`, { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setForm(blank())
  }

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto fade-in">
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link href={id ? `/catatan/${id}` : '/'} className="btn-ghost px-2! -ml-2">
          <Icon name="back" className="size-4" /> Kembali
        </Link>
        {!id && (form.story || form.title || form.decision) && (
          <button type="button" onClick={discardDraft} className="text-xs text-muted underline underline-offset-4 hover:text-ink">
            Buang draf
          </button>
        )}
      </div>

      <div className="card relative overflow-hidden">
        <span className="hidden sm:block absolute left-8 inset-y-0 w-px bg-margin" aria-hidden="true" />
        <div className="p-5 sm:p-8 sm:pl-14 space-y-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-hand text-2xl text-loss">{id ? 'menyunting catatan' : 'catatan baru'}</p>
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => set({ date: e.target.value })}
              className="input w-auto! py-1.5! text-sm"
              aria-label="Tanggal dan jam"
              required
            />
          </div>

          <input
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Judul (opsional)"
            className="w-full bg-transparent font-serif text-2xl sm:text-3xl font-semibold placeholder:text-muted/60 outline-none"
            maxLength={200}
          />

          <div>
            <span className="label">Perasaan saat ini</span>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <MoodChip key={m.id} id={m.id} size="md" active={form.moods.includes(m.id)} onClick={() => toggleMood(m.id)} />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="story" className="label">Cerita</label>
            <textarea
              id="story"
              value={form.story}
              onChange={(e) => set({ story: e.target.value })}
              placeholder="Apa yang terjadi? Apa yang menarik perhatianmu? Apa yang kamu rasakan?"
              rows={8}
              className="ruled w-full resize-y bg-transparent font-serif text-[17px] outline-none placeholder:text-muted/70"
            />
            <p className="mt-1 text-xs text-muted">
              Tips: <b>**tebal**</b>, <i>*miring*</i>, <span className="highlight">==stabilo==</span>, <code>- </code>daftar, <code>$BBCA</code> jadi link ke saham.
            </p>
          </div>

          <div className="rounded-xl bg-marker/35 p-4 sm:p-5">
            <label htmlFor="decision" className="label text-ink-2!">Keputusan & alasan</label>
            <textarea
              id="decision"
              value={form.decision}
              onChange={(e) => set({ decision: e.target.value })}
              placeholder="Kenapa masuk / keluar? Apa rencana TP & cut loss-nya?"
              rows={4}
              className="ruled w-full resize-y bg-transparent font-serif text-[17px] outline-none placeholder:text-muted/80"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="label mb-0!">Eksekusi</span>
              <button type="button" onClick={() => set({ trades: [...form.trades, blankTrade()] })} className="btn-outline py-1.5! px-3! text-xs">
                <Icon name="plus" className="size-3.5" /> Tambah transaksi
              </button>
            </div>

            {form.trades.length === 0 ? (
              <p className="text-sm text-muted italic">Belum ada transaksi. Nggak apa-apa, kadang cuma mau cerita.</p>
            ) : (
              <div className="space-y-3">
                {form.trades.map((t, i) => (
                  <TradeRow key={i} trade={t} onChange={(p) => setTrade(i, p)} onRemove={() => set({ trades: form.trades.filter((_, j) => j !== i) })} />
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-loss" role="alert">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Link href={id ? `/catatan/${id}` : '/'} className="btn-ghost">Batal</Link>
            <button type="submit" disabled={busy} className="btn-primary sm:px-8!">
              {busy ? 'Menyimpan…' : 'Simpan catatan'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

function TradeRow({ trade, onChange, onRemove }) {
  const value = +trade.price > 0 && +trade.lots > 0 ? tradeValue({ price: +trade.price, lots: +trade.lots }) : 0
  return (
    <div className="rounded-xl border border-line bg-paper/50 p-3">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:grid-cols-[7rem_auto_1fr_6.5rem_auto] gap-2 items-center">
        <input
          value={trade.ticker}
          onChange={(e) => onChange({ ticker: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
          placeholder="KODE"
          maxLength={10}
          className="input py-2! font-semibold tracking-wider uppercase"
          aria-label="Kode saham"
        />
        <div className="flex rounded-full border border-line p-0.5 bg-card text-xs font-semibold" role="radiogroup" aria-label="Jenis transaksi">
          {['BUY', 'SELL'].map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={trade.side === s}
              onClick={() => onChange({ side: s })}
              className={`px-3 py-1.5 rounded-full transition ${
                trade.side === s ? (s === 'BUY' ? 'bg-gain text-white' : 'bg-loss text-white') : 'text-muted'
              }`}
            >
              {s === 'BUY' ? 'Beli' : 'Jual'}
            </button>
          ))}
        </div>
        <label className="relative order-4 sm:order-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted">Rp</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={trade.price}
            onChange={(e) => onChange({ price: e.target.value })}
            placeholder="Harga"
            className="input py-2! pl-9! tabular-nums"
            aria-label="Harga per lembar"
          />
        </label>
        <label className="relative order-5 col-span-2 sm:order-0 sm:col-span-1">
          <input
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={trade.lots}
            onChange={(e) => onChange({ lots: e.target.value })}
            placeholder="Lot"
            className="input py-2! pr-10! tabular-nums"
            aria-label="Jumlah lot"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">lot</span>
        </label>
        <button type="button" onClick={onRemove} className="btn-ghost p-2! justify-self-end order-3 sm:order-0" aria-label="Hapus transaksi">
          <Icon name="trash" className="size-4" />
        </button>
      </div>
      {value > 0 && (
        <p className="mt-2 text-xs text-muted tabular-nums">
          {fmtNumber(+trade.lots * 100)} lembar · nilai {fmtRupiah(value)}
        </p>
      )}
    </div>
  )
}
