import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { monthKeyOf } from '@shared/dates'
import type { MonthKey } from '@shared/types'

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

/** The selected month lives in the URL (`?mes=2026-09`) so it survives reloads and is shared across pages. */
export function useMonthParam(): [MonthKey, (month: MonthKey) => void] {
  const [params, setParams] = useSearchParams()
  const current = monthKeyOf(new Date())
  const raw = params.get('mes')
  const month = raw && MONTH_PATTERN.test(raw) ? raw : current

  const setMonth = useCallback(
    (next: MonthKey) =>
      setParams(
        (previous) => {
          const updated = new URLSearchParams(previous)
          if (next === monthKeyOf(new Date())) updated.delete('mes')
          else updated.set('mes', next)
          return updated
        },
        { replace: true },
      ),
    [setParams],
  )

  return [month, setMonth]
}

/** Search string that keeps the selected month when navigating between sections. */
export function useMonthSearch(): string {
  const [params] = useSearchParams()
  const month = params.get('mes')
  return month && MONTH_PATTERN.test(month) ? `?mes=${month}` : ''
}
