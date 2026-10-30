import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import Icon from './Icon.jsx'

const NAV = [
  { href: '/', label: 'Catatan', icon: 'book' },
  { href: '/saham', label: 'Saham', icon: 'layers' },
  { href: '/statistik', label: 'Statistik', icon: 'chart' },
]

const isActive = (loc, href) => (href === '/' ? loc === '/' || loc.startsWith('/catatan') : loc.startsWith(href))

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', next ? '#1a1814' : '#f6f1e7')
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {}
  }
  return [dark, toggle]
}

export default function Layout({ children, onLogout }) {
  const [loc] = useLocation()
  const [dark, toggleTheme] = useTheme()

  return (
    <div className="min-h-dvh pb-28 md:pb-12">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 md:h-16 flex items-center gap-4">
          <Link href="/" className="flex items-baseline gap-1.5 shrink-0">
            <span className="font-serif text-xl md:text-2xl font-semibold tracking-tight">Jurnal</span>
            <span className="font-hand text-xl md:text-2xl text-loss">trading</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-6">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`px-3.5 py-2 rounded-full text-sm font-medium transition ${
                  isActive(loc, n.href) ? 'bg-sunken text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Link href="/tulis" className="btn-primary hidden md:inline-flex mr-2">
              <Icon name="pen" className="size-4" /> Tulis catatan
            </Link>
            <button onClick={toggleTheme} className="btn-ghost p-2.5!" aria-label={dark ? 'Mode terang' : 'Mode gelap'} title={dark ? 'Mode terang' : 'Mode gelap'}>
              <Icon name={dark ? 'sun' : 'moon'} />
            </button>
            <button onClick={onLogout} className="btn-ghost p-2.5!" aria-label="Keluar" title="Keluar">
              <Icon name="logout" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-6 md:pt-10">{children}</main>

      {/* mobile tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-line bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4 h-16">
          {NAV.slice(0, 2).map((n) => (
            <TabLink key={n.href} {...n} active={isActive(loc, n.href)} />
          ))}
          <TabLink href="/tulis" label="Tulis" icon="pen" active={loc === '/tulis'} />
          <TabLink {...NAV[2]} active={isActive(loc, NAV[2].href)} />
        </div>
      </nav>
    </div>
  )
}

function TabLink({ href, label, icon, active }) {
  return (
    <Link href={href} className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${active ? 'text-ink' : 'text-muted'}`}>
      <span className={`grid place-items-center rounded-full px-4 py-1 transition ${active ? 'bg-sunken' : ''}`}>
        <Icon name={icon} className="size-5" />
      </span>
      {label}
    </Link>
  )
}
