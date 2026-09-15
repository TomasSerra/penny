import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { fetchQuotes, quoteToSnapshot, type DolarQuote } from '@shared/rates'
import type { RateConfig, RateSnapshot } from '@shared/types'

const CACHE_KEY = 'penny-quotes'

function readCache(): { quotes: DolarQuote[]; savedAt: number } | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

/** All dolarapi quotes, cached locally so conversions keep working offline. */
export function useQuotes() {
  const cached = readCache()
  const result = useQuery({
    queryKey: ['quotes'],
    queryFn: () => fetchQuotes(),
    staleTime: 10 * 60_000,
    refetchInterval: 15 * 60_000,
    initialData: cached?.quotes,
    initialDataUpdatedAt: cached?.savedAt,
  })

  useEffect(() => {
    if (result.data && result.dataUpdatedAt !== cached?.savedAt) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ quotes: result.data, savedAt: result.dataUpdatedAt }))
    }
  }, [result.data, result.dataUpdatedAt, cached?.savedAt])

  return result
}

export function useRate(config: RateConfig | undefined): RateSnapshot | undefined {
  const { data } = useQuotes()
  if (!config || !data) return undefined
  const quote = data.find((item) => item.casa === config.type)
  if (!quote) return undefined
  try {
    return quoteToSnapshot(quote, config.side)
  } catch {
    return undefined
  }
}
