import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SegmentedControl } from './SegmentedControl'

interface ChartCardProps {
  title: string
  description?: ReactNode
  legend?: ReactNode
  /** Accessible table twin of the chart */
  table?: ReactNode
  children: ReactNode
  className?: string
}

export function ChartCard({ title, description, legend, table, children, className }: ChartCardProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  return (
    <section className={cn('paper-flat flex min-w-0 flex-col rounded-4xl p-5 md:p-6', className)}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {table && (
          <SegmentedControl
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: 'chart', label: 'Gráfico' },
              { value: 'table', label: 'Tabla' },
            ]}
          />
        )}
      </header>
      {view === 'chart' ? (
        <>
          {legend && <div className="mb-3">{legend}</div>}
          {children}
        </>
      ) : (
        <div className="max-h-80 overflow-auto">{table}</div>
      )}
    </section>
  )
}

export function ChartLegend({ items }: { items: { label: string; color: string; shape?: 'rect' | 'line' }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={item.shape === 'line' ? 'h-0.5 w-3.5 rounded-full' : 'size-2.5 rounded-[3px]'}
            style={{ background: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

export function DataTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-(--paper-card) text-xs text-muted-foreground">
        <tr>
          {columns.map((column, index) => (
            <th key={column} className={cn('px-2 py-2 font-medium', index === 0 ? 'text-left' : 'text-right')}>
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, index) => (
              <td key={index} className={cn('px-2 py-2', index === 0 ? 'text-left' : 'text-right tabular-nums')}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function ChartTooltipBox({
  title,
  rows,
}: {
  title: ReactNode
  rows: { label: string; value: ReactNode; color?: string }[]
}) {
  return (
    <div className="paper-raised min-w-44 rounded-2xl px-3 py-2.5 text-xs">
      <p className="mb-1.5 font-medium text-muted-foreground">{title}</p>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2 py-0.5">
          {row.color ? <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: row.color }} /> : <span className="w-3" />}
          <span className="flex-1 text-muted-foreground">{row.label}</span>
          <span className="font-semibold text-foreground tabular-nums">{row.value}</span>
        </div>
      ))}
    </div>
  )
}
