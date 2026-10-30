import { requireAuth } from '../_lib/auth.js'
import { cleanEntry } from '../_lib/entry.js'
import { redis, ENTRIES_KEY, entryKey } from '../_lib/redis.js'

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return
  res.setHeader('Cache-Control', 'no-store')

  const id = String(req.query.id)
  const existing = await redis.get(entryKey(id))
  if (!existing) return res.status(404).json({ error: 'Catatan tidak ditemukan' })

  if (req.method === 'GET') return res.status(200).json(existing)

  if (req.method === 'PUT') {
    const entry = cleanEntry(req.body, existing)
    await redis
      .multi()
      .set(entryKey(id), entry)
      .zadd(ENTRIES_KEY, { score: new Date(entry.date).getTime(), member: id })
      .exec()
    return res.status(200).json(entry)
  }

  if (req.method === 'DELETE') {
    await redis.multi().del(entryKey(id)).zrem(ENTRIES_KEY, id).exec()
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
