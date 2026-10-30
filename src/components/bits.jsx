import { Link } from 'wouter'
import { fmtNumber, fmtRupiah, moodById } from '../lib/format.js'

export function MoodChip({ id, active, onClick, size = 'sm' }) {
  const m = moodById[id]
  if (!m) return null
  const cls = `inline-flex items-center gap-1 rounded-full border whitespace-nowrap transition ${
    size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1.5 text-sm'
  } ${active ? 'bg-ink text-paper border-ink' : 'bg-card border-line text-ink-2'}`
  const body = (
    <>
      <span aria-hidden="true">{m.emoji}</span>
      {m.label}
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={active} className={`${cls} hover:border-ink-2`}>
      {body}
    </button>
  ) : (
    <span className={cls}>{body}</span>
  )
}

export function TradePill({ trade, link = true }) {
  const buy = trade.side === 'BUY'
  const content = (
    <>
      <span className={`size-1.5 rounded-full ${buy ? 'bg-gain' : 'bg-loss'}`} />
      <span className="font-semibold tracking-wide text-ink">{trade.ticker}</span>
      <span className="text-muted">
        {buy ? 'beli' : 'jual'} {fmtNumber(trade.lots)} lot @ {fmtNumber(trade.price)}
      </span>
    </>
  )
  const cls = 'inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper/60 px-2 py-1 text-xs'
  return link ? (
    <Link href={`/saham/${trade.ticker}`} className={`${cls} hover:border-ink-2`}>
      {content}
    </Link>
  ) : (
    <span className={cls}>{content}</span>
  )
}

// P/L with sign + arrow, so gain/loss never relies on color alone.
export function Pnl({ value, compact = true, className = '' }) {
  const up = value > 0
  const flat = value === 0
  return (
    <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${flat ? 'text-muted' : up ? 'text-gain' : 'text-loss'} ${className}`}>
      {!flat && <span aria-hidden="true" className="text-[0.75em]">{up ? '▲' : '▼'}</span>}
      {fmtRupiah(value, { sign: true, compact })}
    </span>
  )
}

export function Empty({ title, children, action }) {
  return (
    <div className="card px-6 py-12 text-center fade-in">
      <p className="font-hand text-3xl text-ink-2">{title}</p>
      {children && <p className="mt-2 text-sm text-muted max-w-sm mx-auto">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex justify-center py-20" role="status" aria-label="Memuat">
      <span className="size-6 rounded-full border-2 border-line border-t-ink animate-spin" />
    </div>
  )
}
