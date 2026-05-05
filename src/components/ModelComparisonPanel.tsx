import type { ModelComparisonData, ModelInputs } from '../lib/model'
import { currency } from '../lib/formatters'
import { SectionHeader } from './Tooltip'
import ModelComparisonChart from './ModelComparisonChart'

interface Props {
  data: ModelComparisonData
  inputs: ModelInputs
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid #1e2228' }}>
      <span className="text-xs" style={{ color: '#9ca3af' }}>{label}</span>
      <span className="text-xs font-mono font-semibold" style={{ color: color ?? '#e5e7eb' }}>{value}</span>
    </div>
  )
}

function UnitEconCard({ scenario, inputs }: { scenario: ModelComparisonData['partner' | 'own']; inputs: ModelInputs }) {
  const { unit, label, totalMachineCapex } = scenario
  const isOwn = label === 'own'
  const accentColor = isOwn ? '#a855f7' : '#3b82f6'
  const profitColor = unit.netProfit >= 0 ? '#10b981' : '#ef4444'

  return (
    <div style={{ background: '#0d0f12', border: `1px solid ${accentColor}40` }} className="rounded-xl overflow-hidden">
      {/* Top stripe */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: `${accentColor}15`, borderBottom: `1px solid ${accentColor}40` }}>
        <span className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: accentColor }}>
          {isOwn ? 'Own machine' : 'Partner model'}
        </span>
        <span className="text-xs ml-auto" style={{ color: '#4b5563' }}>
          {isOwn
            ? `${inputs.avgTestsUsed} tests @ own unit`
            : `${inputs.avgTestsUsed} tests @ partner`}
        </span>
      </div>

      <div className="px-4 py-3 flex flex-col gap-0">
        <Row label="Subscription revenue" value={currency(inputs.subscriptionPrice)} />
        <Row label="Pickup revenue" value={currency(unit.pickupRevenue)} />
        <Row label="Float income" value={currency(unit.floatIncome)} />
        <Row label="Total revenue" value={currency(unit.totalRevenue + unit.floatIncome)} color="#e5e7eb" />

        <div className="mt-2 mb-0.5 text-xs font-semibold tracking-widest uppercase" style={{ color: '#4b5563' }}>Costs</div>
        <Row label="CAC" value={`-${currency(inputs.cac)}`} color="#fca5a5" />
        <Row
          label={`PUC cost (${inputs.avgTestsUsed}×)`}
          value={`-${currency(unit.pucCost)}`}
          color={isOwn ? '#a855f7' : '#3b82f6'}
        />
        <Row label="Driver cost" value={`-${currency(unit.driverCost)}`} color="#fca5a5" />
        <Row label="Total cost" value={`-${currency(unit.totalCost)}`} color="#e5e7eb" />

        {isOwn && (
          <Row
            label={`Capex (${inputs.ownMachineCount > 0 ? inputs.ownMachineCount : 1}× machine)`}
            value={`-${currency(totalMachineCapex)}`}
            color="#f59e0b"
          />
        )}

        <div className="mt-3 pt-2" style={{ borderTop: '2px solid #2a2f38' }}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold" style={{ color: '#9ca3af' }}>Net profit / customer</span>
            <span className="text-sm font-mono font-bold" style={{ color: profitColor }}>
              {unit.netProfit >= 0 ? '+' : ''}{currency(unit.netProfit)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs" style={{ color: '#6b7280' }}>Break-even price</span>
            <span className="text-xs font-mono" style={{ color: '#9ca3af' }}>{currency(unit.breakEvenPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ModelComparisonPanel({ data, inputs }: Props) {
  const { partner, own, verdict } = data

  const { color, bg, border, headline } = (() => {
    if (verdict.savingPerPUC <= 0) {
      return { color: '#3b82f6', bg: 'rgba(59,130,246,0.05)', border: 'rgba(59,130,246,0.2)', headline: 'PARTNER MODEL WINS' }
    }
    if (verdict.longTermWinner === 'own' && verdict.capexRecovered) {
      return { color: '#10b981', bg: 'rgba(16,185,129,0.05)', border: 'rgba(16,185,129,0.2)', headline: 'OWN MACHINE WINS' }
    }
    if (verdict.longTermWinner === 'partner') {
      return { color: '#3b82f6', bg: 'rgba(59,130,246,0.05)', border: 'rgba(59,130,246,0.2)', headline: 'PARTNER MODEL WINS' }
    }
    return { color: '#f59e0b', bg: 'rgba(245,158,11,0.05)', border: 'rgba(245,158,11,0.2)', headline: 'ROUGHLY EQUAL' }
  })()

  const profitDeltaAbs = Math.abs(Math.round(verdict.perCustomerProfitDelta))
  const balanceDeltaAbs = Math.abs(Math.round(verdict.finalBalanceDelta))

  return (
    <div className="flex flex-col gap-6">
      {/* Verdict banner */}
      <div className="rounded-xl px-5 py-4" style={{ background: bg, border: `1px solid ${border}` }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold tracking-widest uppercase" style={{ color }}>{headline}</span>
            <p className="text-xs leading-relaxed" style={{ color: '#9ca3af', maxWidth: 560 }}>{verdict.summary}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="rounded-lg px-3 py-2 text-center" style={{ background: '#0d0f12', border: '1px solid #2a2f38' }}>
              <p className="text-xs" style={{ color: '#6b7280' }}>Per-customer delta</p>
              <p className="text-sm font-mono font-bold" style={{ color: verdict.perCustomerProfitDelta >= 0 ? '#10b981' : '#ef4444' }}>
                {verdict.perCustomerProfitDelta >= 0 ? '+' : '-'}{currency(profitDeltaAbs)}
              </p>
              <p className="text-xs" style={{ color: '#4b5563' }}>own vs partner</p>
            </div>
            <div className="rounded-lg px-3 py-2 text-center" style={{ background: '#0d0f12', border: '1px solid #2a2f38' }}>
              <p className="text-xs" style={{ color: '#6b7280' }}>Crossover year</p>
              <p className="text-sm font-mono font-bold" style={{ color: verdict.crossoverYear ? '#f59e0b' : '#6b7280' }}>
                {verdict.crossoverYear ? `Year ${verdict.crossoverYear}` : 'Never'}
              </p>
              <p className="text-xs" style={{ color: '#4b5563' }}>own overtakes partner</p>
            </div>
            <div className="rounded-lg px-3 py-2 text-center" style={{ background: '#0d0f12', border: '1px solid #2a2f38' }}>
              <p className="text-xs" style={{ color: '#6b7280' }}>Final balance delta</p>
              <p className="text-sm font-mono font-bold" style={{ color: verdict.finalBalanceDelta >= 0 ? '#10b981' : '#ef4444' }}>
                {verdict.finalBalanceDelta >= 0 ? '+' : '-'}{currency(balanceDeltaAbs)}
              </p>
              <p className="text-xs" style={{ color: '#4b5563' }}>own vs partner</p>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-side unit economics */}
      <div style={{ background: '#161a20', border: '1px solid #2a2f38' }} className="rounded-xl p-6">
        <div className="mb-4">
          <SectionHeader
            title="Per-Customer Unit Economics"
            tooltip="Both models have identical revenue. The difference is entirely in cost: partner model pays a commission per test (no capex), own machine pays a lower per-test cost but requires upfront capital expenditure. Net profit here excludes capex — capex impact is shown in the bank-balance chart below."
            position="bottom"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <UnitEconCard scenario={partner} inputs={inputs} />
          <UnitEconCard scenario={own} inputs={inputs} />
        </div>
      </div>

      {/* Bank balance chart */}
      <ModelComparisonChart
        partner={partner.yearly}
        own={own.yearly}
        crossoverYear={verdict.crossoverYear}
      />

      {/* Math explanation */}
      <div style={{ background: '#161a20', border: '1px solid #2a2f38' }} className="rounded-xl p-6">
        <div className="mb-3">
          <SectionHeader
            title="Why the Numbers Look This Way"
            tooltip="A plain-English breakdown of what drives the difference between the two models."
            position="bottom"
          />
        </div>
        {verdict.savingPerPUC <= 0 ? (
          <div className="rounded-lg px-4 py-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-xs" style={{ color: '#fca5a5' }}>
              Own machine cost per test ({currency(inputs.ownUnitCostPerPUC)}) is ≥ partner commission ({currency(inputs.partnerPUCCommission)}).
              There is no per-test saving, so paying capex on top makes own machine unconditionally worse.
              Lower the own-machine cost or raise the partner commission to change this.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg p-3" style={{ background: '#0d0f12', border: '1px solid #2a2f38' }}>
                <p className="text-xs" style={{ color: '#6b7280' }}>Saving per test</p>
                <p className="text-lg font-mono font-bold" style={{ color: '#10b981' }}>{currency(verdict.savingPerPUC)}</p>
                <p className="text-xs" style={{ color: '#4b5563' }}>
                  {currency(inputs.partnerPUCCommission)} partner − {currency(inputs.ownUnitCostPerPUC)} own
                </p>
              </div>
              <div className="rounded-lg p-3" style={{ background: '#0d0f12', border: '1px solid #2a2f38' }}>
                <p className="text-xs" style={{ color: '#6b7280' }}>Total machine capex</p>
                <p className="text-lg font-mono font-bold" style={{ color: '#f59e0b' }}>
                  -{currency(own.totalMachineCapex)}
                </p>
                <p className="text-xs" style={{ color: '#4b5563' }}>
                  {Math.max(1, inputs.ownMachineCount)}× {currency(inputs.ownMachineSetupCost)} machine{inputs.ownMachineCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="rounded-lg p-3" style={{ background: '#0d0f12', border: '1px solid #2a2f38' }}>
                <p className="text-xs" style={{ color: '#6b7280' }}>Tests to recover capex</p>
                <p className="text-lg font-mono font-bold text-white">
                  {verdict.savingPerPUC > 0
                    ? Math.ceil(own.totalMachineCapex / verdict.savingPerPUC).toLocaleString('en-IN')
                    : '∞'}
                </p>
                <p className="text-xs" style={{ color: '#4b5563' }}>at {currency(verdict.savingPerPUC)}/test saving</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
              Every test run on the own machine saves {currency(verdict.savingPerPUC)} over the partner rate.
              Once cumulative savings cross {currency(own.totalMachineCapex)} (total capex),
              the own-machine model is permanently ahead.
              {verdict.crossoverYear
                ? ` At current growth, that happens in Year ${verdict.crossoverYear}.`
                : ` At current growth rates, savings don't cover capex within the forecast period — extend the horizon or grow faster.`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
