import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import type { Currency, MonthKey } from '@shared/types'
import { ChartCard, ChartTooltipBox, DataTable } from '@/components/common/ChartCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { useExpenseComposer } from '@/features/expenses/ExpenseComposer'
import { formatAxis, formatMoney, formatMonth } from '@/lib/format'

export interface CumulativeDatum {
  key: MonthKey
  label: string
  value: number | null
}

const config = { value: { label: 'Acumulado', color: 'var(--chart-1)' } } satisfies ChartConfig

export function CumulativeChart({ data, currency, year }: { data: CumulativeDatum[]; currency: Currency; year: number }) {
  const composer = useExpenseComposer()
  const lastIndex = data.reduce((last, item, index) => (item.value !== null ? index : last), -1)
  const last = lastIndex >= 0 ? data[lastIndex] : null

  // A line pinned to zero all year reads as a bug, not as "no spending yet".
  if (!last?.value) {
    return (
      <ChartCard title="Gasto acumulado">
        <EmptyState
          compact
          pose="base"
          title={`Todavía no hay nada que acumular en ${year}`}
          description="Esta curva suma tus gastos mes a mes, para ver si el año viene más caro o más tranquilo que el anterior."
          action={<Button variant="outline" onClick={() => composer.open()}>Cargar un gasto</Button>}
        />
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title="Gasto acumulado"
      description={last?.value ? `${formatMoney(last.value, currency)} en ${year}` : String(year)}
      table={
        <DataTable
          columns={['Mes', 'Acumulado']}
          rows={data.filter((item) => item.value !== null).map((item) => [formatMonth(item.key, { year: false }), formatMoney(item.value ?? 0, currency)])}
        />
      }
    >
      <ChartContainer config={config} className="aspect-auto h-60 w-full">
        <AreaChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="cumulative-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--ink)" strokeOpacity={0.15} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" fontSize={11} />
          <YAxis tickLine={false} axisLine={false} width={44} fontSize={11} tickFormatter={(value: number) => formatAxis(value, currency)} />
          <Tooltip
            cursor={{ stroke: 'var(--muted-foreground)', strokeOpacity: 0.4, strokeWidth: 1 }}
            content={({ active, payload }) => {
              const item = payload?.[0]?.payload as CumulativeDatum | undefined
              if (!active || !item || item.value === null) return null
              return (
                <ChartTooltipBox
                  title={formatMonth(item.key)}
                  rows={[{ label: 'Acumulado', value: formatMoney(item.value, currency), color: 'var(--chart-1)' }]}
                />
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--ink)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#cumulative-fill)"
            connectNulls={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--background)', fill: 'var(--color-value)' }}
            dot={(props: { cx?: number; cy?: number; index?: number }) =>
              props.index === lastIndex && props.cx !== undefined && props.cy !== undefined ? (
                <g key="end">
                  <circle cx={props.cx} cy={props.cy} r={5} fill="var(--color-value)" stroke="var(--ink)" strokeWidth={2} />
                </g>
              ) : (
                <g key={`dot-${props.index}`} />
              )
            }
            isAnimationActive
            animationDuration={900}
          />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  )
}
