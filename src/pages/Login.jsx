import { useState } from 'react'
import { api } from '../lib/api.js'
import Icon from '../components/Icon.jsx'

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.login(password, remember)
      onSuccess()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm fade-in">
        <div className="relative card px-7 pt-10 pb-8 sm:px-9 overflow-hidden">
          <span className="absolute left-6 inset-y-0 w-px bg-margin" aria-hidden="true" />
          <div className="pl-4">
            <p className="font-hand text-2xl text-loss -rotate-2">catatan pribadi</p>
            <h1 className="font-serif text-4xl font-semibold tracking-tight mt-1">Jurnal Trading</h1>
            <p className="mt-3 text-sm text-muted leading-relaxed">Cerita, rasa, dan keputusan di balik setiap eksekusi.</p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <div>
                <label htmlFor="pw" className="label">Password</label>
                <div className="relative">
                  <input
                    id="pw"
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    autoFocus
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-ink"
                    aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    <Icon name={show ? 'eyeOff' : 'eye'} className="size-4.5" />
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-ink-2 cursor-pointer select-none">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-[var(--ink)]" />
                Ingat saya di perangkat ini
              </label>

              {error && <p className="text-sm text-loss" role="alert">{error}</p>}

              <button type="submit" disabled={busy || !password} className="btn-primary w-full py-3!">
                <Icon name="lock" className="size-4" /> {busy ? 'Membuka…' : 'Buka jurnal'}
              </button>
            </form>
          </div>
        </div>
        <p className="mt-5 text-center text-xs text-muted">
          {remember ? 'Kamu akan tetap masuk selama 180 hari.' : 'Kamu akan keluar saat browser ditutup.'}
        </p>
      </div>
    </div>
  )
}
