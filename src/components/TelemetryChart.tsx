import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmptyState } from '@/components/states'
import { RULE } from '@/domain/constants'
import type { Reading } from '@/domain/types'
import { formatFlow, formatLevel, formatTime } from '@/lib/format'
import { chartTooltip } from '@/lib/chart'

type Props = { readings: Reading[]; evidenceIds?: number[]; height?: number }

export function TelemetryChart({ readings, evidenceIds = [], height = 240 }: Props) {
  const latest = readings.at(-1)
  if (!latest) return <EmptyState title="Sem leituras" />
  return (
    <figure className="min-w-0">
      <figcaption className="sr-only">
        Nível da água e fluxo ao longo do tempo. Última leitura: nível{' '}
        {formatLevel(latest.waterLevel)}, fluxo {formatFlow(latest.waterFlow)}.
      </figcaption>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={readings} margin={{ top: 8, right: 0, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="id"
            tickFormatter={(id) =>
              formatTime(readings.find((item) => item.id === id)?.recordedAt ?? null)
            }
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            minTickGap={40}
          />
          <YAxis
            yAxisId="level"
            domain={[0, 100]}
            unit="%"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
          />
          <YAxis
            yAxisId="flow"
            orientation="right"
            domain={[0, (max: number) => Math.ceil(Math.max(max, 4))]}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
          />
          <Tooltip
            {...chartTooltip}
            labelFormatter={(id) =>
              formatTime(readings.find((item) => item.id === id)?.recordedAt ?? null)
            }
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine
            yAxisId="level"
            y={RULE.levelMin}
            stroke="var(--danger)"
            strokeDasharray="4 4"
          />
          <ReferenceLine
            yAxisId="flow"
            y={RULE.flowMax}
            stroke="var(--warning)"
            strokeDasharray="4 4"
          />
          <Line
            yAxisId="level"
            dataKey="waterLevel"
            name="Nível (%)"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="flow"
            dataKey="waterFlow"
            name="Fluxo (L/s)"
            stroke="var(--warning)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          {readings
            .filter((reading) => evidenceIds.includes(reading.id))
            .map((reading) => (
              <ReferenceDot
                key={reading.id}
                yAxisId="level"
                x={reading.id}
                y={reading.waterLevel}
                r={5}
                fill="var(--danger)"
                stroke="var(--card)"
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </figure>
  )
}
