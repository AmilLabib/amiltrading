import crypto from 'node:crypto'

const COOKIE = 'td_session'
const REMEMBER_DAYS = 180
const SESSION_HOURS = 12

const secret = () => {
  const s = process.env.AUTH_SECRET
  if (!s || s.length < 16) throw new Error('AUTH_SECRET belum di-set (minimal 16 karakter)')
  return s
}

const sign = (data) => crypto.createHmac('sha256', secret()).update(data).digest('base64url')

const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest()
  const hb = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(ha, hb)
}

export const checkPassword = (input) => {
  const pw = process.env.APP_PASSWORD
  if (!pw) throw new Error('APP_PASSWORD belum di-set')
  return safeEqual(input || '', pw)
}

const cookieAttrs = (req) => {
  const secure = req.headers['x-forwarded-proto'] === 'https' || process.env.VERCEL_ENV === 'production'
  return `Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`
}

export function setSession(req, res, remember) {
  const ttl = remember ? REMEMBER_DAYS * 86400 : SESSION_HOURS * 3600
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + ttl * 1000 })).toString('base64url')
  const token = `${payload}.${sign(payload)}`
  // Without "ingat saya" the cookie dies with the browser session (and at most after SESSION_HOURS).
  const maxAge = remember ? `; Max-Age=${ttl}` : ''
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; ${cookieAttrs(req)}${maxAge}`)
}

export function clearSession(req, res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; ${cookieAttrs(req)}; Max-Age=0`)
}

export function isAuthed(req) {
  const token = req.cookies?.[COOKIE]
  if (!token) return false
  const [payload, sig] = token.split('.')
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return false
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return typeof exp === 'number' && exp > Date.now()
  } catch {
    return false
  }
}

// Returns true when the request may continue; otherwise responds 401.
export function requireAuth(req, res) {
  if (isAuthed(req)) return true
  res.status(401).json({ error: 'Belum login' })
  return false
}
