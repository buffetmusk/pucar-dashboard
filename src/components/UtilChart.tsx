import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTip, ReferenceLine, Cell, ResponsiveContainer } from 'recharts'
import type { UtilPoint } from '../lib/model'
import { currency } from '../lib/formatters'
import { SectionHeader } from './Tooltip'

interface UtilChartProps {
  data: UtilPoint[]
  avgTestsUsed: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as UtilPoint
  return (
    <div style={{ background: '#161a20', border: '1px solid #2a2f38' }} className="rounded px-3 py-2">
      <p className="text-xs font-mono text-white">{d.testsUsed} test{d.testsUsed > 1 ? 's' : ''} used</p>
      <p className="text-xs font-mono" style={{ color: d.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
        {d.netProfit >= 0 ? '+' : ''}{currency(d.netProfit)} profit
      </p>
    </div>
  )
}

export default function UtilChart({ data, avgTestsUsed }: UtilChartProps) {
  const breakEvenIdx = data.findIndex((d, i) =>
    d.netProfit >= 0 && (i === 0 || data[i - 1].netProfit < 0)
  )
  const breakEvenTests = breakEvenIdx >= 0 ? data[breakEvenIdx].testsUsed : null
  const pureProfit = breakEvenTests ? breakEvenTests - 1 : 0

  return (
    <div style={{ background: '#161a20', border: '1px solid #2a2f38' }} className="rounded-xl p-6">
      <div className="mb-4">
        <SectionHeader
          title="Profit by Utilisation"
          tooltip="Each bar shows how much PUCAR makes (or loses) per customer depending on how many tests that customer actually uses. Customers who churn early (few tests) are most profitable — like gym members who never show up. The highlighted bar is your current 'avg tests used' assumption. The dashed line at zero is break-even."
        />
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2f38" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={v => currency(v)}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={{ stroke: '#2a2f38' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="testsUsed"
            tickFormatter={v => `${v} test${v > 1 ? 's' : ''}`}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <RechartsTip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <ReferenceLine x={0} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
          <Bar dataKey="netProfit" radius={[0, 3, 3, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.testsUsed}
                fill={entry.netProfit >= 0 ? '#10b981' : '#ef4444'}
                opacity={entry.testsUsed === avgTestsUsed ? 1 : 0.55}
                stroke={entry.testsUsed === avgTestsUsed ? '#fff' : 'none'}
                strokeWidth={entry.testsUsed === avgTestsUsed ? 1 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {breakEvenTests !== null && (
        <p className="text-xs mt-3" style={{ color: '#6b7280' }}>
          Users who leave after ≤<span className="font-mono text-white">{pureProfit}</span> tests = pure profit.
          Break-even at <span className="font-mono text-white">{breakEvenTests}</span> tests used.
        </p>
      )}
    </div>
  )
}
