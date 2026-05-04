import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTip, Legend, ResponsiveContainer } from 'recharts'
import type { ScenarioLine } from '../lib/model'
import { currency } from '../lib/formatters'
import { SectionHeader } from './Tooltip'

interface ScenarioChartProps {
  scenarios: ScenarioLine[]
  avgTestsUsed: number
  forecastYears: number
}

const COLORS = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#3b82f6', '#a855f7']

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

export default function ScenarioChart({ scenarios, avgTestsUsed, forecastYears }: ScenarioChartProps) {
  const pivoted = Array.from({ length: forecastYears }, (_, i) => {
    const row: Record<string, number> = { year: i + 1 }
    scenarios.forEach(s => {
      const pt = s.data.find(d => d.year === i + 1)
      if (pt) row[s.label] = pt.bankBalance
    })
    return row
  })

  return (
    <div style={{ background: '#161a20', border: '1px solid #2a2f38' }} className="rounded-xl p-6">
      <div className="mb-1">
        <SectionHeader
          title="Bank Balance — Utilisation Scenarios"
          tooltip="The most important chart in the model. Each line asks: 'what if all our customers only used N tests?' A real customer base is a mix of these — some churn after 1 test (great for cash), some use all 10 (thin margin). The thicker highlighted line is your current 'avg tests used' assumption. Lines higher up = more cash. This shows how sensitive your bank balance is to churn behaviour."
          position="bottom"
        />
      </div>
      <p className="text-xs mb-4" style={{ color: '#4b5563' }}>
        Highlighted line = current avg tests used setting
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={pivoted} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
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
            width={65}
          />
          <RechartsTip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, color: '#6b7280', paddingTop: 8 }} />
          {scenarios.map((s, i) => (
            <Line
              key={s.label}
              type="monotone"
              dataKey={s.label}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={s.testsUsed === avgTestsUsed ? 3 : 1.5}
              strokeOpacity={s.testsUsed === avgTestsUsed ? 1 : 0.5}
              dot={s.testsUsed === avgTestsUsed ? { r: 3 } : false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
