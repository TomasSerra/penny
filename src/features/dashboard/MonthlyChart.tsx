import { Bar, BarChart, CartesianGrid, LabelList, Tooltip, XAxis, YAxis } from 'recharts'
import type { Currency, MonthKey } from '@shared/types'
import { ChartCard, ChartLegend, ChartTooltipBox, DataTable } from '@/components/common/ChartCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { useExpenseComposer } from '@/features/expenses/ExpenseComposer'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { currencySymbol, formatAxis, formatMoney, formatMonth } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface MonthlyDatum {
  key: MonthKey
  label: string
  necessary: number
  unnecessary: number
  total: number
}

const config = {
  necessary: { label: 'Necesario', color: 'var(--chart-1)' },
  unnecessary: { label: 'No necesario', color: 'var(--chart-2)' },
} satisfies ChartConfig

const GAP = 2
const RADIUS = 4

interface SegmentProps {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  payload?: MonthlyDatum
}

/** Rounded data-end, square baseline, and a surface gap under the segment above. */
function Segment({ x = 0, y = 0, width = 0, height = 0, fill, top, dimmed }: SegmentProps & { top: boolean; dimmed: boolean }) {
  const h = top ? height : height - GAP
  const offsetY = top ? y : y + GAP
  if (h <= 0 || width <= 0) return null
  const r = top ? Math.min(RADIUS, width / 2, h) : 0
  const path = `M${x},${offsetY + h} V${offsetY + r} Q${x},${offsetY} ${x + r},${offsetY} H${x + width - r} Q${x + width},${offsetY} ${x + width},${offsetY + r} V${offsetY + h} Z`
  return (
    <path
      d={path}
      fill={fill}
      fillOpacity={dimmed ? 0.45 : 1}
      stroke="var(--ink)"
      strokeWidth={2}
      strokeLinejoin="round"
      className="transition-[fill-opacity] duration-300"
    />
  )
}

export function MonthlyChart({
  data,
  selected,
  currency,
}: {
  data: MonthlyDatum[]
  selected: MonthKey
  currency: Currency
}) {
  const desktop = useIsDesktop()
  const composer = useExpenseComposer()
  const money = (value: number) => formatMoney(value, currency)
  // Twelve empty months draw a grid with nothing in it, which says less than a sentence does.
  const year = selected.slice(0, 4)
  const empty = data.every((item) => item.total === 0)

  if (empty) {
    return (
      <ChartCard className="h-full" title="Gastos por mes">
        <EmptyState
          compact
          className="my-auto"
          pose="base"
          title={`Nada cargado en ${year}`}
          description="Acá vas a ver mes a mes cuánto gastaste y qué parte no era necesaria. Empieza a llenarse con tu primer gasto."
          action={<Button variant="outline" onClick={() => composer.open()}>Cargar un gasto</Button>}
        />
      </ChartCard>
    )
  }

  return (
    <ChartCard
      className="h-full"
      title="Gastos por mes"
      description={year}
      legend={<ChartLegend items={[{ label: 'Necesario', color: 'var(--chart-1)' }, { label: 'No necesario', color: 'var(--chart-2)' }]} />}
      table={
        <DataTable
          columns={['Mes', 'Necesario', 'No necesario', 'Total']}
          rows={data.map((item) => [formatMonth(item.key, { year: false }), money(item.necessary), money(item.unnecessary), money(item.total)])}
        />
      }
    >
      <ChartContainer config={config} className="aspect-auto h-full w-full min-h-64 flex-1">
        <BarChart data={data} margin={{ top: 24, right: 0, left: 0, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="var(--ink)" strokeOpacity={0.15} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            fontSize={11}
            // Twelve short names don't fit on a phone; initials do.
            tickFormatter={(label: string) => (desktop ? label : label.charAt(0).toUpperCase())}
          />
          <YAxis tickLine={false} axisLine={false} width={44} fontSize={11} tickFormatter={(value: number) => formatAxis(value, currency)} />
          <Tooltip
            cursor={{ fill: 'var(--foreground)', fillOpacity: 0.04, radius: 10 }}
            content={({ active, payload }) => {
              const item = payload?.[0]?.payload as MonthlyDatum | undefined
              if (!active || !item) return null
              return (
                <ChartTooltipBox
                  title={formatMonth(item.key)}
                  rows={[
                    { label: 'Necesario', value: money(item.necessary), color: 'var(--chart-1)' },
                    { label: 'No necesario', value: money(item.unnecessary), color: 'var(--chart-2)' },
                    { label: 'Total', value: money(item.total) },
                  ]}
                />
              )
            }}
          />
          <Bar
            dataKey="necessary"
            stackId="spend"
            fill="var(--color-necessary)"
            maxBarSize={24}
            shape={(props: SegmentProps) => (
              <Segment {...props} top={(props.payload?.unnecessary ?? 0) <= 0} dimmed={props.payload?.key !== selected} />
            )}
          />
          <Bar
            dataKey="unnecessary"
            stackId="spend"
            fill="var(--color-unnecessary)"
            maxBarSize={24}
            shape={(props: SegmentProps) => <Segment {...props} top dimmed={props.payload?.key !== selected} />}
          >
            <LabelList
              dataKey="total"
              content={(props) => {
                const { index, x = 0, y = 0, width = 0, value } = props as { index?: number; x?: number; y?: number; width?: number; value?: number }
                if (!value) return null
                const current = data[index ?? -1]?.key === selected
                // Twelve labels share a phone's width, so they lose the currency symbol there.
                const label = desktop ? formatAxis(value, currency) : formatAxis(value, currency).replace(currencySymbol(currency), '')
                return (
                  <text
                    x={Number(x) + Number(width) / 2}
                    y={Number(y) - 6}
                    textAnchor="middle"
                    className={cn(desktop ? 'text-[11px]' : 'text-[9px]', current ? 'fill-foreground font-semibold' : 'fill-muted-foreground font-medium')}
                  >
                    {label}
                  </text>
                )
              }}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}
