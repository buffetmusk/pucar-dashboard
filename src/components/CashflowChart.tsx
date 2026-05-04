import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTip, ReferenceLine, Cell, ResponsiveContainer } from 'recharts'
import type { CashPoint } from '../lib/model'
import { currency } from '../lib/formatters'
import { SectionHeader } from './Tooltip'

interface CashflowChartProps {
  data: CashPoint[]
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as CashPoint
  return (
    <div style={{ background: '#161a20', border: '1px solid #2a2f38' }} className="rounded px-3 py-2">
      <p className="text-xs font-mono text-white">
        {d.event === 0 ? 'After subscription paid' : `After PUC check #${d.event}`}
      </p>
      <p className="text-xs font-mono" style={{ color: d.phase === 'partner' ? '#3b82f6' : '#10b981' }}>
        {d.phase === 'partner' ? 'Partner centre' : 'Own machine'}
      </p>
      <p className="text-xs font-mono" style={{ color: d.balance >= 0 ? '#10b981' : '#ef4444' }}>
        Running balance: {currency(d.balance)}
      </p>
    </div>
  )
}

export default function CashflowChart({ data }: CashflowChartProps) {
  return (
    <div style={{ background: '#161a20', border: '1px solid #2a2f38' }} className="rounded-xl p-6">
      <div className="mb-1">
        <SectionHeader
          title="Cash Balance per PUC Event"
          tooltip="Tracks PUCAR's running cash position for one customer, event by event. Starts high (subscription collected upfront minus CAC), then steps down with each PUC test as costs are incurred. Blue bars = tests done at a partner centre (higher cost). Green bars = tests done on PUCAR's own machine (lower cost). The red dashed line is zero — dipping below means that customer has cost more than they paid."
          position="bottom"
        />
      </div>
      <p className="text-xs mb-4" style={{ color: '#4b5563' }}>
        Subscription drawn down event by event
      </p>
      <div className="flex gap-4 mb-3">
        <span className="text-xs flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm inline-block" style={{ background: '#3b82f6' }} />
          <span style={{ color: '#6b7280' }}>Partner centre</span>
        </span>
        <span className="text-xs flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm inline-block" style={{ background: '#10b981' }} />
          <span style={{ color: '#6b7280' }}>Own machine</span>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2f38" vertical={false} />
          <XAxis
            dataKey="event"
            tickFormatter={v => v === 0 ? 'Start' : `#${v}`}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={{ stroke: '#2a2f38' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => currency(v)}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={55}
          />
          <RechartsTip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
          <Bar dataKey="balance" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.phase === 'partner' ? '#3b82f6' : '#10b981'} opacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
