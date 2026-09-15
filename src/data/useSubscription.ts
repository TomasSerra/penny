import { useEffect, useState } from 'react'
import type { Unsubscribe } from 'firebase/firestore'

export interface LiveState<T> {
  data: T
  loading: boolean
  error: Error | null
}

type Subscribe<T> = (onData: (value: T) => void, onError: (error: Error) => void) => Unsubscribe

/**
 * Keeps React state in sync with a Firestore listener. `key` identifies the
 * query; when it changes the listener is replaced. Pass `null` to skip.
 */
export function useLive<T>(key: string | null, subscribe: Subscribe<T>, initial: T): LiveState<T> {
  const [state, setState] = useState<LiveState<T> & { key: string | null }>({
    key,
    data: initial,
    loading: key !== null,
    error: null,
  })

  // Reset synchronously when the query changes so stale data never shows for a new key.
  if (state.key !== key) {
    setState({ key, data: initial, loading: key !== null, error: null })
  }

  useEffect(() => {
    if (key === null) return
    return subscribe(
      (data) => setState({ key, data, loading: false, error: null }),
      (error) => {
        console.error(`[firestore] ${key}`, error)
        setState((previous) => ({ ...previous, key, loading: false, error }))
      },
    )
    // `subscribe` is recreated every render; the key fully describes the query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { data: state.key === key ? state.data : initial, loading: state.loading, error: state.error }
}
