import { clearSession } from './_lib/auth.js'

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  clearSession(req, res)
  res.status(200).json({ ok: true })
}
