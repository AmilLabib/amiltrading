import { Link } from 'wouter'
import { fmtTime, fmtWeekday } from '../lib/format.js'
import { useEntries } from '../lib/store.jsx'
import { MoodChip, Pnl, TradePill } from './bits.jsx'
import Icon from './Icon.jsx'

const excerpt = (text, n = 220) => {
  const plain = (text || '').replace(/[*=>#]|^\s*[-•]\s+/gm, '').replace(/\$([A-Za-z]{2,6})/g, (_, t) => t.toUpperCase()).replace(/\s+/g, ' ').trim()
  return plain.length > n ? `${plain.slice(0, n).trimEnd()}…` : plain
}

export default function EntryCard({ entry }) {
  const { ledger } = useEntries()
  const pnl = ledger.byEntry[entry.id]
  const d = new Date(entry.date)

  return (
    <Link href={`/catatan/${entry.id}`} className="group flex gap-3 sm:gap-5 fade-in">
      <div className="w-12 sm:w-16 shrink-0 pt-4 text-center">
        <div className="font-serif text-3xl sm:text-4xl font-semibold leading-none tabular-nums">{d.getDate()}</div>
        <div className="font-hand text-lg text-muted leading-tight mt-1 capitalize">{fmtWeekday(entry.date).slice(0, 3)}</div>
      </div>

      <article className="card relative flex-1 min-w-0 p-4 sm:p-5 sm:pl-8 transition group-hover:-translate-y-0.5 group-hover:shadow-[0_1px_0_var(--line),0_14px_30px_-18px_rgb(0_0_0/0.45)]">
        <span className="hidden sm:block absolute left-4 inset-y-0 w-px bg-margin" aria-hidden="true" />

        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-lg sm:text-xl font-semibold leading-snug text-balance">
            {entry.title || excerpt(entry.story, 60) || 'Tanpa judul'}
          </h3>
          {pnl !== undefined && <Pnl value={pnl} className="text-sm shrink-0 mt-1" />}
        </div>

        <div className="mt-1 text-xs text-muted">{fmtTime(entry.date)}</div>

        {entry.story && <p className="mt-3 font-serif text-[15px] leading-relaxed text-ink-2 line-clamp-3">{excerpt(entry.story)}</p>}

        {(entry.trades.length > 0 || entry.moods.length > 0) && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {entry.trades.map((t, i) => (
              <TradePill key={i} trade={t} link={false} />
            ))}
            {entry.moods.map((m) => (
              <MoodChip key={m} id={m} />
            ))}
          </div>
        )}

        {entry.reviews.length > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted">
            <Icon name="message" className="size-3.5" /> {entry.reviews.length} catatan review
          </div>
        )}
      </article>
    </Link>
  )
}
