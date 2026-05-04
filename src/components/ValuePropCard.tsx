import type { UnitEcon, ModelInputs } from '../lib/model'
import { currency } from '../lib/formatters'
import { SectionHeader } from './Tooltip'

interface ValuePropCardProps {
  unit: UnitEcon
  inputs: ModelInputs
}

export default function ValuePropCard({ unit, inputs }: ValuePropCardProps) {
  const saves = unit.customerSaving > 0
  return (
    <div style={{ background: '#161a20', border: '1px solid #2a2f38' }} className="rounded-xl p-6">
      <div className="mb-4">
        <SectionHeader
          title="Customer Value Proposition"
          tooltip="Shows what the customer actually pays with PUCAR versus what they would pay going to a PUC centre on their own. A positive saving means PUCAR is cheaper for the customer — this is your sales pitch. If the saving goes negative, the subscription is no longer a good deal for the buyer."
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-sm" style={{ color: '#9ca3af' }}>Market rate ({inputs.totalPUCChecks} checks)</span>
          <span className="font-mono text-sm line-through" style={{ color: '#6b7280' }}>
            {currency(unit.marketCost)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm" style={{ color: '#9ca3af' }}>PUCAR total customer pays</span>
          <span className="font-mono text-sm font-semibold text-white">{currency(unit.pucarTotalCustomerPays)}</span>
        </div>

        <div className="border-t pt-3 flex justify-between items-center" style={{ borderColor: '#2a2f38' }}>
          <span className="text-sm font-semibold" style={{ color: '#9ca3af' }}>Customer saves</span>
          <span className="font-mono text-lg font-bold" style={{ color: saves ? '#10b981' : '#ef4444' }}>
            {saves ? '+' : ''}{currency(unit.customerSaving)}
          </span>
        </div>

        <div className="rounded-lg p-3 mt-1" style={{ background: '#0d0f12', border: '1px solid #2a2f38' }}>
          <p className="text-xs" style={{ color: '#9ca3af' }}>
            <span className="text-white font-semibold">{inputs.totalPUCChecks} PUC checks</span>
            {' '}at{' '}
            <span className="font-mono">{currency(unit.pucarTotalCustomerPays / inputs.totalPUCChecks)}/check</span>
            {' '}vs{' '}
            <span className="font-mono">{currency(inputs.marketRatePerPUC)} market</span>
            {inputs.firstPickupFree && <span className="text-emerald-400"> — first pickup free</span>}
          </p>
        </div>
      </div>
    </div>
  )
}
