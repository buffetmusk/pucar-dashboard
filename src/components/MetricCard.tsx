import Tooltip from './Tooltip'

interface MetricCardProps {
  label: string
  value: string
  sub?: string
  positive?: boolean | null
  tooltip?: string
}

export default function MetricCard({ label, value, sub, positive, tooltip }: MetricCardProps) {
  const valueColor =
    positive === true ? 'text-emerald-400' :
    positive === false ? 'text-red-400' :
    'text-white'

  return (
    <div style={{ background: '#161a20', border: '1px solid #2a2f38' }}
      className="rounded-xl p-5 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium tracking-widest uppercase" style={{ color: '#6b7280' }}>
          {label}
        </span>
        {tooltip && <Tooltip text={tooltip} position="bottom" />}
      </div>
      <span className={`text-2xl font-mono font-semibold ${valueColor}`}>{value}</span>
      {sub && <span className="text-xs" style={{ color: '#6b7280' }}>{sub}</span>}
    </div>
  )
}
