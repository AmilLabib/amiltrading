import { checkPassword, setSession } from './_lib/auth.js'
import { redis } from './_lib/redis.js'

const MAX_ATTEMPTS = 10
const WINDOW_SECONDS = 15 * 60

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const ip = String(req.headers['x-forwarded-for'] || 'local').split(',')[0].trim()
  const failKey = `td:login-fail:${ip}`
  const fails = Number(await redis.get(failKey)) || 0
  if (fails >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi 15 menit lagi.' })
  }

  const { password, remember } = req.body || {}
  if (!checkPassword(password)) {
    await redis.multi().incr(failKey).expire(failKey, WINDOW_SECONDS).exec()
    return res.status(401).json({ error: 'Password salah' })
  }

  await redis.del(failKey)
  setSession(req, res, Boolean(remember))
  res.status(200).json({ ok: true })
}
