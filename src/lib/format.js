export const LOT_SIZE = 100

export const MOODS = [
  { id: 'tenang', label: 'Tenang', emoji: '😌' },
  { id: 'yakin', label: 'Yakin', emoji: '💪' },
  { id: 'sabar', label: 'Sabar', emoji: '🧘' },
  { id: 'excited', label: 'Excited', emoji: '🤩' },
  { id: 'fomo', label: 'FOMO', emoji: '🏃' },
  { id: 'serakah', label: 'Serakah', emoji: '🤑' },
  { id: 'ragu', label: 'Ragu', emoji: '🤔' },
  { id: 'takut', label: 'Takut', emoji: '😨' },
  { id: 'panik', label: 'Panik', emoji: '😱' },
  { id: 'kesal', label: 'Kesal', emoji: '😤' },
]
export const moodById = Object.fromEntries(MOODS.map((m) => [m.id, m]))

export const VERDICTS = [
  { id: 'benar', label: 'Keputusan tepat', short: 'Tepat', emoji: '✅' },
  { id: 'salah', label: 'Keputusan keliru', short: 'Keliru', emoji: '❌' },
  { id: 'netral', label: 'Masih abu-abu', short: 'Abu-abu', emoji: '➖' },
]
export const verdictById = Object.fromEntries(VERDICTS.map((v) => [v.id, v]))

const num = new Intl.NumberFormat('id-ID')
export const fmtNumber = (n) => num.format(Math.round(n))

export function fmtRupiah(n, { sign = false, compact = false } = {}) {
  const abs = Math.abs(n)
  let body
  if (compact && abs >= 1e9) body = `${(abs / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`
  else if (compact && abs >= 1e6) body = `${(abs / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 2 })} jt`
  else if (compact && abs >= 1e3) body = `${(abs / 1e3).toLocaleString('id-ID', { maximumFractionDigits: 1 })} rb`
  else body = num.format(Math.round(abs))
  const prefix = n < 0 ? '−' : sign && n > 0 ? '+' : ''
  return `${prefix}Rp ${body}`
}

export const fmtPct = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`

export const fmtDate = (iso, opts = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  new Date(iso).toLocaleDateString('id-ID', opts)
export const fmtTime = (iso) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
export const fmtMonth = (iso) => new Date(iso).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
export const fmtWeekday = (iso) => new Date(iso).toLocaleDateString('id-ID', { weekday: 'long' })

export function timeAgo(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'hari ini'
  if (days === 1) return 'kemarin'
  if (days < 30) return `${days} hari lalu`
  if (days < 365) return `${Math.floor(days / 30)} bulan lalu`
  return `${Math.floor(days / 365)} tahun lalu`
}

// Value for <input type="datetime-local"> in the viewer's local time.
export function toLocalInput(iso) {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}
