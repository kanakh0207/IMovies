import { useEffect, useState } from 'react'
import { api } from './api'

// GET helper: const { data, error, loading, reload } = useApi('/movies?limit=8')
// Pass null as the path to skip fetching. Old data stays on screen while a refetch runs.
export function useApi(path) {
  const [tick, setTick] = useState(0)
  const [state, setState] = useState({ key: null, data: null, error: null })
  const key = path ? `${path}#${tick}` : null

  useEffect(() => {
    if (!path) return undefined
    let live = true
    const k = `${path}#${tick}`
    api
      .get(path)
      .then((data) => live && setState({ key: k, data, error: null }))
      .catch((e) => live && setState({ key: k, data: null, error: e.message }))
    return () => {
      live = false
    }
  }, [path, tick])

  return {
    data: path ? state.data : null,
    error: path ? state.error : null,
    loading: key !== null && state.key !== key,
    reload: () => setTick((t) => t + 1),
  }
}
