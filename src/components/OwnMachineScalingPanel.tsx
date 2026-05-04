import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTip,
  Legend, ResponsiveContainer
} from 'recharts'
import type { MachineScalingPoint } from '../lib/model'
import { currency } from '../lib/formatters'
import { SectionHeader } from './Tooltip'

interface Props {
  scaling: MachineScalingPoint[]
  currentCount: number
}

const PALETTE = ['#6b7280', '#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#14b8a6']

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

export default function OwnMachineScalingPanel({ scaling, currentCount }: Props) {
  // Build chart data: one row per year, columns per machine count
  const years = scaling[0]?.yearlyData.map(d => d.year) ?? []
  const chartData = years.map(yr => {
    const point: Record<string, number> = { year: yr }
    scaling.forEach(s => {
      point[`${s.machineCount}m`] = s.yearlyData.find(d => d.year === yr)?.bankBalance ?? 0
    })
    return point
  })

  return (
    <div style={{ background: '#161a20', border: '1px solid #2a2f38' }} className="rounded-xl p-6">
      <div className="mb-4">
        <SectionHeader
          title="Own Machine Scaling — Bank Balance by Year"
          tooltip="Shows how your cumulative cash balance changes across the forecast period for different numbers of own PUC machines (0 = all partner, 1, 2, 3, 5, 8, 10). More machines mean higher upfront capex but lower per-test costs — find the line that stays highest without going deeply negative early on. The highlighted line matches your current machine count setting."
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
          {scaling.map((s, i) => (
            <Line
              key={s.machineCount}
              type="monotone"
              dataKey={`${s.machineCount}m`}
              name={`${s.machineCount} machine${s.machineCount !== 1 ? 's' : ''}`}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={s.machineCount === currentCount ? 2.5 : 1.5}
              strokeDasharray={s.machineCount === currentCount ? undefined : '4 2'}
              dot={s.machineCount === currentCount ? { r: 3, fill: PALETTE[i % PALETTE.length] } : false}
              opacity={s.machineCount === currentCount ? 1 : 0.55}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Summary table */}
      <div className="mt-5">
        <span className="text-xs font-semibold tracking-widest uppercase mb-2 block" style={{ color: '#4b5563' }}>
          Final Year Comparison
        </span>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2f38' }}>
                {['Machines', 'Total Capex', 'Final Bank Balance', 'vs 0 machines'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold tracking-wider whitespace-nowrap"
                    style={{ color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scaling.map((s, i) => {
                const baseline = scaling[0]?.finalBankBalance ?? 0
                const delta = s.finalBankBalance - baseline
                const isActive = s.machineCount === currentCount
                return (
                  <tr key={s.machineCount}
                    style={{
                      borderBottom: '1px solid #1e2228',
                      background: isActive ? 'rgba(255,255,255,0.03)' : undefined,
                    }}>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs font-semibold"
                        style={{ color: isActive ? PALETTE[i % PALETTE.length] : '#9ca3af' }}>
                        {s.machineCount} {s.machineCount === currentCount && '←'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs" style={{ color: s.totalCapex > 0 ? '#a855f7' : '#4b5563' }}>
                        {s.totalCapex > 0 ? `-${currency(s.totalCapex)}` : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs font-semibold"
                        style={{ color: s.finalBankBalance >= 0 ? '#10b981' : '#ef4444' }}>
                        {currency(s.finalBankBalance)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {delta === 0
                        ? <span className="text-xs" style={{ color: '#4b5563' }}>baseline</span>
                        : <span className="font-mono text-xs font-semibold"
                            style={{ color: delta > 0 ? '#10b981' : '#ef4444' }}>
                            {delta > 0 ? '+' : ''}{currency(delta)}
                          </span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
