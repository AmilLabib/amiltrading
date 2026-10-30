import { lazy, Suspense, useEffect, useState } from 'react'
import { Route, Switch, useLocation } from 'wouter'
import { api, setUnauthorizedHandler } from './lib/api.js'
import { EntriesProvider } from './lib/store.jsx'
import Layout from './components/Layout.jsx'
import { Spinner } from './components/bits.jsx'
import Login from './pages/Login.jsx'
import Timeline from './pages/Timeline.jsx'

const EntryForm = lazy(() => import('./pages/EntryForm.jsx'))
const EntryDetail = lazy(() => import('./pages/EntryDetail.jsx'))
const Stocks = lazy(() => import('./pages/Stocks.jsx'))
const StockDetail = lazy(() => import('./pages/StockDetail.jsx'))
const Stats = lazy(() => import('./pages/Stats.jsx'))

function ScrollToTop() {
  const [loc] = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [loc])
  return null
}

export default function App() {
  const [authed, setAuthed] = useState(null)

  useEffect(() => {
    setUnauthorizedHandler(() => setAuthed(false))
    api.me().then((r) => setAuthed(r.authed)).catch(() => setAuthed(false))
  }, [])

  const logout = async () => {
    await api.logout().catch(() => {})
    setAuthed(false)
  }

  if (authed === null) return <Spinner />
  if (!authed) return <Login onSuccess={() => setAuthed(true)} />

  return (
    <EntriesProvider>
      <ScrollToTop />
      <Layout onLogout={logout}>
        <Suspense fallback={<Spinner />}>
          <Switch>
            <Route path="/" component={Timeline} />
            <Route path="/tulis" component={EntryForm} />
            <Route path="/catatan/:id/edit" component={EntryForm} />
            <Route path="/catatan/:id" component={EntryDetail} />
            <Route path="/saham" component={Stocks} />
            <Route path="/saham/:ticker" component={StockDetail} />
            <Route path="/statistik" component={Stats} />
            <Route>
              <p className="text-center text-muted py-20">Halaman tidak ditemukan.</p>
            </Route>
          </Switch>
        </Suspense>
      </Layout>
    </EntriesProvider>
  )
}
