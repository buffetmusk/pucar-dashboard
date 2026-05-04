import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTip,
  Legend, ResponsiveContainer
} from 'recharts'
import type { YearlyRow } from '../lib/model'
import { currency } from '../lib/formatters'
import { SectionHeader } from './Tooltip'

interface YearlyChartProps {
  data: YearlyRow[]
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

export default function YearlyChart({ data }: YearlyChartProps) {
  return (
    <div style={{ background: '#161a20', border: '1px solid #2a2f38' }} className="rounded-xl p-6">
      <div className="mb-4">
        <SectionHeader
          title="Year-by-Year P&L + Bank Balance"
          tooltip="Stacked bars show revenue sources (blue = subscriptions, green = pickup fees, teal = float income) vs cost buckets (light red = CAC, red = PUC costs, amber = driver costs) for each year. The purple line on the right axis is the cumulative cash in bank — this is what matters for survival. A rising line means the business is accumulating cash."
          position="bottom"
        />
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2f38" vertical={false} />
          <XAxis
            dataKey="year"
            tickFormatter={v => `Y${v}`}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={{ stroke: '#2a2f38' }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={v => currency(v)}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={65}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={v => currency(v)}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={65}
          />
          <RechartsTip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Legend wrapperStyle={{ fontSize: 10, color: '#6b7280', paddingTop: 8 }} />

          <Bar yAxisId="left" dataKey="subRevenue" name="Sub Revenue" stackId="rev" fill="#3b82f6" opacity={0.85} />
          <Bar yAxisId="left" dataKey="pickupRevenue" name="Pickup Rev" stackId="rev" fill="#10b981" opacity={0.85} />
          <Bar yAxisId="left" dataKey="floatIncome" name="Float" stackId="rev" fill="#14b8a6" opacity={0.85} />
          <Bar yAxisId="left" dataKey="partnerOnboardingRevenue" name="Partner Fees" stackId="rev" fill="#a78bfa" opacity={0.85} radius={[3, 3, 0, 0]} />

          <Bar yAxisId="left" dataKey="cacSpend" name="CAC" stackId="cost" fill="#fca5a5" opacity={0.7} />
          <Bar yAxisId="left" dataKey="pucCost" name="PUC Cost" stackId="cost" fill="#ef4444" opacity={0.7} />
          <Bar yAxisId="left" dataKey="driverCost" name="Driver" stackId="cost" fill="#f59e0b" opacity={0.7} />
          <Bar yAxisId="left" dataKey="machineCapex" name="Machine Capex" stackId="cost" fill="#a855f7" opacity={0.8} radius={[3, 3, 0, 0]} />

          <Line
            yAxisId="right"
            type="monotone"
            dataKey="bankBalance"
            name="Bank Balance"
            stroke="#a855f7"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#a855f7' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
