import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTip,
  Legend, ReferenceLine, ResponsiveContainer
} from 'recharts'
import type { YearlyRow } from '../lib/model'
import { currency } from '../lib/formatters'
import { SectionHeader } from './Tooltip'

interface Props {
  partner: YearlyRow[]
  own: YearlyRow[]
  crossoverYear: number | null
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#161a20', border: '1px solid #2a2f38' }} className="rounded px-3 py-2 text-xs">
      <p className="font-semibold text-white mb-1">Year {label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-mono" style={{ color: p.color }}>
          {p.name}: {currency(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function ModelComparisonChart({ partner, own, crossoverYear }: Props) {
  const chartData = partner.map((r, i) => ({
    year: r.year,
    'Partner model': r.bankBalance,
    'Own machine': own[i]?.bankBalance ?? 0,
  }))

  return (
    <div style={{ background: '#161a20', border: '1px solid #2a2f38' }} className="rounded-xl p-6">
      <div className="mb-4">
        <SectionHeader
          title="Bank Balance — Partner vs Own Machine"
          tooltip="Cumulative cash in the bank year by year for each model. The partner model avoids upfront capex so it starts higher; the own-machine model dips initially but the per-test savings compound over time. The crossover point (if any) is where own-machine overtakes partner."
          position="bottom"
        />
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2f38" vertical={false} />
          <XAxis
            dataKey="year"
            tickFormatter={v => `Y${v}`}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={{ stroke: '#2a2f38' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => currency(v)}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={70}
          />
          <RechartsTip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: '#6b7280', paddingTop: 8 }} />
          {crossoverYear !== null && (
            <ReferenceLine
              x={crossoverYear}
              stroke="#f59e0b"
              strokeDasharray="4 2"
              label={{ value: 'Crossover', fill: '#f59e0b', fontSize: 9, position: 'insideTopRight' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="Partner model"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#3b82f6' }}
          />
          <Line
            type="monotone"
            dataKey="Own machine"
            stroke="#a855f7"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#a855f7' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
