import { Bar, BarChart, CartesianGrid, LabelList, Tooltip, XAxis, YAxis } from 'recharts'
import type { Currency, MonthKey } from '@shared/types'
import { ChartCard, ChartLegend, ChartTooltipBox, DataTable } from '@/components/common/ChartCard'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { formatAxis, formatCompact, formatMoney, formatMonth } from '@/lib/format'

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
  return <path d={path} fill={fill} fillOpacity={dimmed ? 0.45 : 1} className="transition-[fill-opacity] duration-300" />
}

export function MonthlyChart({
  data,
  selected,
  currency,
  onSelect,
}: {
  data: MonthlyDatum[]
  selected: MonthKey
  currency: Currency
  onSelect: (month: MonthKey) => void
}) {
  const desktop = useIsDesktop()
  const selectedIndex = data.findIndex((item) => item.key === selected)
  const money = (value: number) => formatMoney(value, currency)

  return (
    <ChartCard
      title="Gastos por mes"
      description={`${selected.slice(0, 4)} · tocá un mes para verlo`}
      legend={<ChartLegend items={[{ label: 'Necesario', color: 'var(--chart-1)' }, { label: 'No necesario', color: 'var(--chart-2)' }]} />}
      table={
        <DataTable
          columns={['Mes', 'Necesario', 'No necesario', 'Total']}
          rows={data.map((item) => [formatMonth(item.key, { year: false }), money(item.necessary), money(item.unnecessary), money(item.total)])}
        />
      }
    >
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <BarChart data={data} margin={{ top: 24, right: 0, left: 0, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
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
            className="cursor-pointer"
            onClick={(entry) => onSelect((entry.payload as MonthlyDatum).key)}
            shape={(props: SegmentProps) => (
              <Segment {...props} top={(props.payload?.unnecessary ?? 0) <= 0} dimmed={props.payload?.key !== selected} />
            )}
          />
          <Bar
            dataKey="unnecessary"
            stackId="spend"
            fill="var(--color-unnecessary)"
            maxBarSize={24}
            className="cursor-pointer"
            onClick={(entry) => onSelect((entry.payload as MonthlyDatum).key)}
            shape={(props: SegmentProps) => <Segment {...props} top dimmed={props.payload?.key !== selected} />}
          >
            <LabelList
              dataKey="total"
              content={(props) => {
                const { index, x = 0, y = 0, width = 0, value } = props as { index?: number; x?: number; y?: number; width?: number; value?: number }
                if (index !== selectedIndex || !value) return null
                return (
                  <text x={Number(x) + Number(width) / 2} y={Number(y) - 8} textAnchor="middle" className="fill-foreground text-[11px] font-semibold">
                    {formatCompact(value, currency)}
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
