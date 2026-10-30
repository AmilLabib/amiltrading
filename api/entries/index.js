import { requireAuth } from '../_lib/auth.js'
import { cleanEntry } from '../_lib/entry.js'
import { redis, ENTRIES_KEY, entryKey } from '../_lib/redis.js'

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    const ids = await redis.zrange(ENTRIES_KEY, 0, -1, { rev: true })
    if (!ids.length) return res.status(200).json([])
    const entries = await redis.mget(...ids.map(entryKey))
    return res.status(200).json(entries.filter(Boolean))
  }

  if (req.method === 'POST') {
    const entry = cleanEntry(req.body)
    await redis
      .multi()
      .set(entryKey(entry.id), entry)
      .zadd(ENTRIES_KEY, { score: new Date(entry.date).getTime(), member: entry.id })
      .exec()
    return res.status(201).json(entry)
  }

  res.status(405).end()
}
