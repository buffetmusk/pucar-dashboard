import type { UnitEcon, ModelInputs } from '../lib/model'
import { currency } from '../lib/formatters'
import { SectionHeader } from './Tooltip'

interface PnLCardProps {
  unit: UnitEcon
  inputs: ModelInputs
  pickupMargin: number
}

function Row({ label, value, indent = false, bold = false, positive }: {
  label: string
  value: string
  indent?: boolean
  bold?: boolean
  positive?: boolean | null
}) {
  const vc = positive === true ? '#10b981' : positive === false ? '#ef4444' : '#e5e7eb'
  return (
    <div className={`flex justify-between items-center py-1 ${bold ? 'border-t mt-1 pt-2' : ''}`}
      style={bold ? { borderColor: '#2a2f38' } : {}}>
      <span className={`text-xs ${indent ? 'pl-4' : ''}`}
        style={{ color: bold ? '#e5e7eb' : '#9ca3af' }}>
        {label}
      </span>
      <span className={`text-xs font-mono ${bold ? 'font-bold text-sm' : 'font-medium'}`}
        style={{ color: vc }}>
        {value}
      </span>
    </div>
  )
}

export default function PnLCard({ unit, inputs, pickupMargin }: PnLCardProps) {
  const profitable = unit.netProfit >= 0
  const beYears = unit.lifetimeDurationYears.toFixed(1)

  return (
    <div style={{ background: '#161a20', border: '1px solid #2a2f38' }} className="rounded-xl p-6">
      <div className="mb-4">
        <SectionHeader
          title="Per-Customer P&L"
          tooltip="Itemised profit & loss for a single average subscriber — from the moment they pay the subscription to the last PUC test they use. All numbers are per-customer. Change the sliders to see how each cost and revenue line shifts."
        />
      </div>

      {/* Revenue */}
      <div className="mb-3">
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#3b82f6' }}>Revenue</span>
        <Row label="+ Subscription" value={currency(inputs.subscriptionPrice)} indent positive={true} />
        <Row label={`+ Pickup revenue (${unit.paidPickups} × ${currency(inputs.pickupCharge)})`}
          value={currency(unit.pickupRevenue)} indent positive={true} />
        <Row label="+ Float income" value={currency(unit.floatIncome)} indent positive={true} />
        <Row label="= Total revenue" value={currency(unit.totalRevenue + unit.floatIncome)} bold positive={true} />
      </div>

      {/* Costs */}
      <div className="mb-3">
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#ef4444' }}>Costs</span>
        <Row label="– CAC" value={currency(inputs.cac)} indent positive={false} />
        <Row
          label={`– PUC cost (${unit.partnerTests}×${currency(inputs.partnerPUCCommission)} + ${unit.ownTests}×${currency(inputs.ownUnitCostPerPUC)})`}
          value={currency(unit.pucCost)} indent positive={false} />
        <Row label={`– Driver cost (${inputs.avgTestsUsed} × ${currency(inputs.driverCostPerPickup)})`}
          value={currency(unit.driverCost)} indent positive={false} />
        <Row label="= Total cost" value={currency(unit.totalCost)} bold positive={false} />
      </div>

      {/* Net */}
      <div className="rounded-lg px-4 py-3 flex items-center justify-between mt-3"
        style={{
          background: profitable ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${profitable ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
        }}>
        <span className="font-semibold text-sm">NET PROFIT</span>
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-lg" style={{ color: profitable ? '#10b981' : '#ef4444' }}>
            {unit.netProfit >= 0 ? '+' : ''}{currency(unit.netProfit)}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded"
            style={{
              background: profitable ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
              color: profitable ? '#10b981' : '#ef4444',
            }}>
            {profitable ? 'PROFITABLE' : 'LOSS-MAKING'}
          </span>
        </div>
      </div>

      {/* Footer stats */}
      <div className="mt-3 flex gap-4 flex-wrap">
        <span className="text-xs" style={{ color: '#6b7280' }}>
          Break-even price: <span className="font-mono text-white">{currency(unit.breakEvenPrice)}</span>
        </span>
        <span className="text-xs" style={{ color: '#6b7280' }}>
          Duration: <span className="font-mono text-white">{beYears} yrs</span>
        </span>
        <span className="text-xs" style={{ color: '#6b7280' }}>
          Pickup margin:{' '}
          <span className="font-mono" style={{ color: pickupMargin >= 0 ? '#10b981' : '#ef4444' }}>
            {currency(pickupMargin)}/pickup
          </span>
        </span>
      </div>
    </div>
  )
}
