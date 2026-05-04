import type { PartnerNetworkMetrics, ModelInputs } from '../lib/model'
import { SectionHeader } from './Tooltip'

interface PartnerPanelProps {
  metrics: PartnerNetworkMetrics
  inputs: ModelInputs
}

function utilisationColor(pct: number): string {
  if (pct > 100) return '#ef4444'
  if (pct > 80) return '#f59e0b'
  return '#10b981'
}

function UtilBar({ pct }: { pct: number }) {
  const clamped = Math.min(pct, 100)
  const over = pct > 100
  return (
    <div className="h-1.5 rounded-full w-full" style={{ background: '#2a2f38' }}>
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${clamped}%`,
          background: utilisationColor(pct),
          boxShadow: over ? '0 0 6px #ef4444' : undefined,
        }}
      />
    </div>
  )
}

export default function PartnerPanel({ metrics, inputs }: PartnerPanelProps) {
  const { totalDailyCapacity, maxSubscribersSupported, yearRows } = metrics

  return (
    <div style={{ background: '#161a20', border: '1px solid #2a2f38' }} className="rounded-xl p-6">
      <div className="mb-4">
        <SectionHeader
          title="Partner Network Capacity"
          tooltip="Models how many PUC tests your partner network can physically handle. Each partner centre has a daily test capacity. As subscriber numbers grow, you need to sign up more partners or the network hits its limit. Red = over capacity (tests are getting rejected), amber = approaching limit, green = headroom available."
        />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg p-3" style={{ background: '#0d0f12', border: '1px solid #2a2f38' }}>
          <p className="text-xs" style={{ color: '#6b7280' }}>Partners Year 1 → 2</p>
          <p className="text-lg font-mono font-bold text-white">
            {inputs.partnerUnitsYear1} → {inputs.partnerUnitsYear2}
          </p>
          <p className="text-xs" style={{ color: '#4b5563' }}>then +{inputs.partnerGrowthRateFromYear3}%/yr</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: '#0d0f12', border: '1px solid #2a2f38' }}>
          <p className="text-xs" style={{ color: '#6b7280' }}>Total daily capacity</p>
          <p className="text-lg font-mono font-bold text-white">{Math.round(totalDailyCapacity)} tests/day</p>
          <p className="text-xs" style={{ color: '#4b5563' }}>across all partners</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: '#0d0f12', border: '1px solid #2a2f38' }}>
          <p className="text-xs" style={{ color: '#6b7280' }}>Max subscribers supported</p>
          <p className="text-lg font-mono font-bold"
            style={{ color: '#3b82f6' }}>
            {maxSubscribersSupported.toLocaleString('en-IN')}
          </p>
          <p className="text-xs" style={{ color: '#4b5563' }}>at current partner count</p>
        </div>
      </div>

      {/* Year-by-year partner capacity table */}
      <div>
        <span className="text-xs font-semibold tracking-widest uppercase mb-2 block" style={{ color: '#4b5563' }}>
          Capacity vs Demand by Year
        </span>
        <div className="flex flex-col gap-2">
          {yearRows.map(row => {
            const over = row.utilisationPct > 100
            const warn = row.utilisationPct > 80 && !over
            return (
              <div key={row.year}
                className="rounded-lg px-4 py-3"
                style={{
                  background: over ? 'rgba(239,68,68,0.06)' : warn ? 'rgba(245,158,11,0.06)' : '#0d0f12',
                  border: `1px solid ${over ? 'rgba(239,68,68,0.25)' : warn ? 'rgba(245,158,11,0.2)' : '#2a2f38'}`,
                }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold text-white">Year {row.year}</span>
                    <span className="text-xs font-mono" style={{ color: '#a78bfa' }}>
                      {row.partners} partners
                    </span>
                    <span className="text-xs" style={{ color: '#6b7280' }}>
                      {row.activeSubs.toLocaleString('en-IN')} subs
                    </span>
                    <span className="text-xs font-mono" style={{ color: '#6b7280' }}>
                      {row.dailyDemand.toFixed(1)} tests/day
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold"
                      style={{ color: utilisationColor(row.utilisationPct) }}>
                      {row.utilisationPct.toFixed(0)}% utilisation
                    </span>
                    {over && (
                      <span className="text-xs px-2 py-0.5 rounded font-semibold"
                        style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
                        Need {row.partnersNeeded} partners
                      </span>
                    )}
                    {!over && (
                      <span className="text-xs" style={{ color: '#4b5563' }}>
                        {row.surplus.toFixed(1)} tests/day spare
                      </span>
                    )}
                  </div>
                </div>
                <UtilBar pct={row.utilisationPct} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Recommendation */}
      {(() => {
        const firstOverYear = yearRows.find(r => r.utilisationPct > 80)
        if (!firstOverYear) return (
          <p className="text-xs mt-4" style={{ color: '#6b7280' }}>
            Scheduled partner growth covers demand for the full forecast period.
          </p>
        )
        const shortfall = Math.max(0, firstOverYear.partnersNeeded - firstOverYear.partners)
        return (
          <div className="rounded-lg px-4 py-3 mt-4"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p className="text-xs" style={{ color: '#9ca3af' }}>
              <span className="text-amber-400 font-semibold">Heads-up:</span>{' '}
              Demand hits{' '}
              <span className="font-mono font-bold text-white">{firstOverYear.utilisationPct.toFixed(0)}%</span>
              {' '}of scheduled capacity in{' '}
              <span className="font-mono font-bold text-white">Year {firstOverYear.year}</span>
              {' '}({firstOverYear.partners} partners planned, {firstOverYear.partnersNeeded} needed
              {shortfall > 0 ? ` — sign ${shortfall} more` : ''}).
            </p>
          </div>
        )
      })()}
    </div>
  )
}
