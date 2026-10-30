// In-memory stand-in for the few Upstash commands we use, so `npm run dev` works without credentials.
// Data disappears when the dev server restarts.
export function createMemoryRedis() {
  const kv = new Map()
  const zsets = new Map()
  const clone = (v) => (v === undefined ? null : structuredClone(v))

  const cmd = {
    get: async (k) => clone(kv.get(k)),
    set: async (k, v) => (kv.set(k, clone(v)), 'OK'),
    del: async (...ks) => ks.filter((k) => kv.delete(k)).length,
    mget: async (...ks) => ks.map((k) => clone(kv.get(k))),
    incr: async (k) => (kv.set(k, (Number(kv.get(k)) || 0) + 1), kv.get(k)),
    expire: async () => 1,
    zadd: async (k, { score, member }) => {
      if (!zsets.has(k)) zsets.set(k, new Map())
      zsets.get(k).set(member, score)
      return 1
    },
    zrem: async (k, member) => (zsets.get(k)?.delete(member) ? 1 : 0),
    zrange: async (k, start, stop, opts = {}) => {
      const sorted = [...(zsets.get(k) || new Map())].sort((a, b) => a[1] - b[1]).map(([m]) => m)
      if (opts.rev) sorted.reverse()
      return sorted.slice(start, stop === -1 ? undefined : stop + 1)
    },
  }

  cmd.multi = () => {
    const queue = []
    const tx = new Proxy({}, {
      get: (_, name) => name === 'exec'
        ? async () => { const out = []; for (const [n, a] of queue) out.push(await cmd[n](...a)); return out }
        : (...args) => (queue.push([name, args]), tx),
    })
    return tx
  }
  return cmd
}
