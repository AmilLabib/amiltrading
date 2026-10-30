import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './api.js'
import { buildLedger } from './ledger.js'

const EntriesContext = createContext(null)

const byDateDesc = (a, b) => b.date.localeCompare(a.date)

export function EntriesProvider({ children }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setEntries((await api.listEntries()).sort(byDateDesc))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const save = useCallback(async (data, id) => {
    const saved = id ? await api.updateEntry(id, data) : await api.createEntry(data)
    setEntries((list) => [saved, ...list.filter((e) => e.id !== saved.id)].sort(byDateDesc))
    return saved
  }, [])

  const remove = useCallback(async (id) => {
    await api.deleteEntry(id)
    setEntries((list) => list.filter((e) => e.id !== id))
  }, [])

  const ledger = useMemo(() => buildLedger(entries), [entries])

  const value = useMemo(
    () => ({ entries, loading, error, reload, save, remove, ledger }),
    [entries, loading, error, reload, save, remove, ledger],
  )
  return <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>
}

export const useEntries = () => useContext(EntriesContext)
