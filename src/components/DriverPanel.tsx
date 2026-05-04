import type { DriverMetrics } from '../lib/model'
import { currency } from '../lib/formatters'
import { SectionHeader } from './Tooltip'

interface DriverPanelProps {
  metrics: DriverMetrics
  assumedCost: number
}

function Metric({ label, value, sub, color, tooltip }: {
  label: string
  value: string
  sub?: string
  color?: string
  tooltip?: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs" style={{ color: '#6b7280' }}>{label}</span>
      <span className="text-sm font-mono font-semibold" style={{ color: color || '#e5e7eb' }}>{value}</span>
      {sub && <span className="text-xs" style={{ color: '#4b5563' }}>{sub}</span>}
      {tooltip && <span className="text-xs italic" style={{ color: '#374151' }}>{tooltip}</span>}
    </div>
  )
}

export default function DriverPanel({ metrics, assumedCost }: DriverPanelProps) {
  const { trueDriverCostPerPickup, pickupMargin, maxCustomersPerDriver, driversNeededByYear } = metrics
  const isProfitCentre = pickupMargin >= 0

  return (
    <div style={{ background: '#161a20', border: '1px solid #2a2f38' }} className="rounded-xl p-6">
      <div className="mb-4">
        <SectionHeader
          title="Driver Efficiency"
          tooltip="Models the economics of PUCAR's pickup driver fleet. 'True cost per pickup' is calculated from the driver's monthly salary divided by their actual capacity (days × pickups/day). If the pickup charge covers this true cost, pickups become a second profit centre on top of the subscription. 'Max customers per driver' tells you when you need to hire the next driver."
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <Metric
          label="True cost per pickup (salary÷capacity)"
          value={currency(trueDriverCostPerPickup)}
          sub="from monthly salary ÷ working capacity"
          color="#f59e0b"
        />
        <Metric
          label="Your assumed driver cost"
          value={currency(assumedCost)}
          sub="set in the slider"
          color="#9ca3af"
        />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs" style={{ color: '#6b7280' }}>Pickup margin</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-semibold"
              style={{ color: isProfitCentre ? '#10b981' : '#ef4444' }}>
              {isProfitCentre ? '+' : ''}{currency(pickupMargin)}/pickup
            </span>
            {isProfitCentre && (
              <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                Profit centre
              </span>
            )}
          </div>
          <span className="text-xs" style={{ color: '#4b5563' }}>pickup charge − true cost</span>
        </div>
        <Metric
          label="Max customers per driver"
          value={maxCustomersPerDriver.toLocaleString('en-IN')}
          sub="before you need to hire another"
          color="#3b82f6"
        />
      </div>

      <div>
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#4b5563' }}>
          Drivers needed by year
        </span>
        <div className="flex gap-3 mt-2 flex-wrap">
          {driversNeededByYear.map(d => (
            <div key={d.year} className="flex flex-col items-center px-3 py-2 rounded"
              style={{ background: '#0d0f12', border: '1px solid #2a2f38' }}>
              <span className="text-xs" style={{ color: '#6b7280' }}>Y{d.year}</span>
              <span className="font-mono font-bold text-sm text-white">{d.drivers}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
