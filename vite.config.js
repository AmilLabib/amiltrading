import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Dev-only: serve /api/* from the same files Vercel deploys as serverless functions.
function vercelApi() {
  return {
    name: 'vercel-api-dev',
    apply: 'serve',
    configureServer(server) {
      Object.assign(process.env, loadEnv('development', process.cwd(), ''))

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        if (!url.pathname.startsWith('/api/')) return next()

        const parts = url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean)
        const query = Object.fromEntries(url.searchParams)
        let file
        if (parts[0] === 'entries' && parts[1]) {
          file = '/api/entries/[id].js'
          query.id = decodeURIComponent(parts[1])
        } else if (parts[0] === 'entries') file = '/api/entries/index.js'
        else file = `/api/${parts[0]}.js`

        let handler
        try {
          handler = (await server.ssrLoadModule(file)).default
        } catch {
          res.statusCode = 404
          return res.end('Not found')
        }

        let raw = ''
        for await (const chunk of req) raw += chunk
        req.body = raw ? JSON.parse(raw) : undefined
        req.query = query
        req.cookies = Object.fromEntries(
          (req.headers.cookie || '').split(';').filter(Boolean).map((c) => {
            const i = c.indexOf('=')
            return [c.slice(0, i).trim(), decodeURIComponent(c.slice(i + 1).trim())]
          }),
        )
        res.status = (code) => ((res.statusCode = code), res)
        res.json = (data) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        }

        try {
          await handler(req, res)
        } catch (err) {
          console.error(err)
          res.statusCode = 500
          res.json({ error: err.message })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), vercelApi()],
})
