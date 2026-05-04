import { useState } from 'react'
import type { ModelInputs } from '../lib/model'
import { DEFAULT_INPUTS } from '../lib/model'
import { currency, pct } from '../lib/formatters'
import Tooltip from './Tooltip'

interface SliderDef {
  key: keyof ModelInputs
  label: string
  min: number
  max: number
  step: number
  format: (v: number) => string
}

interface ToggleDef {
  key: keyof ModelInputs
  label: string
  isToggle: true
}

type FieldDef = SliderDef | ToggleDef

const LEFT_FIELDS: FieldDef[] = [
  { key: 'subscriptionPrice', label: 'Subscription price', min: 500, max: 5000, step: 50, format: currency },
  { key: 'totalPUCChecks', label: 'Lifetime PUC checks', min: 5, max: 20, step: 1, format: v => `${v} checks` },
  { key: 'pickupCharge', label: 'Pickup charge (2nd+ test)', min: 0, max: 250, step: 10, format: currency },
  { key: 'firstPickupFree', label: 'First pickup free?', isToggle: true },
  { key: 'marketRatePerPUC', label: 'Market rate per PUC', min: 100, max: 300, step: 10, format: currency },
  { key: 'pucFrequency', label: 'PUC tests per year', min: 1, max: 2, step: 1, format: v => v === 1 ? 'Annual' : 'Biannual' },
  { key: 'year1Subscribers', label: 'Subscribers per partner per year', min: 5, max: 2000, step: 5, format: v => `${v}/partner` },
  { key: 'annualGrowthRate', label: 'Annual growth rate', min: 0, max: 500, step: 10, format: pct },
  { key: 'avgTestsUsed', label: 'Avg tests used per subscriber', min: 1, max: 10, step: 1, format: v => `${v} tests` },
  { key: 'forecastYears', label: 'Forecast horizon', min: 3, max: 7, step: 1, format: v => `${v} years` },
]

const RIGHT_COST_FIELDS: FieldDef[] = [
  { key: 'cac', label: 'CAC (paid ads)', min: 0, max: 1000, step: 10, format: currency },
  { key: 'partnerPUCCommission', label: 'Commission to partner PUC centre', min: 40, max: 200, step: 5, format: currency },
  { key: 'ownUnitCostPerPUC', label: 'Cost with own PUC machine', min: 10, max: 100, step: 5, format: currency },
  { key: 'driverCostPerPickup', label: 'Driver cost per pickup', min: 20, max: 200, step: 5, format: currency },
  { key: 'floatReturnRate', label: 'Float return rate', min: 4, max: 20, step: 1, format: pct },
]

const RIGHT_OPS_FIELDS: FieldDef[] = [
  { key: 'driverPickupsPerDay', label: 'Pickups per driver per day', min: 5, max: 30, step: 1, format: v => `${v}/day` },
  { key: 'driverMonthlyCost', label: 'Driver salary + fuel / month', min: 15000, max: 40000, step: 500, format: currency },
  { key: 'ownMachineSetupCost', label: 'Own machine setup cost (capex)', min: 50000, max: 1000000, step: 10000, format: currency },
]

const PARTNER_FIELDS: FieldDef[] = [
  { key: 'partnerUnitsYear1', label: 'Partner centres — Year 1', min: 1, max: 50, step: 1, format: v => `${v} partners` },
  { key: 'partnerUnitsYear2', label: 'Partner centres — Year 2', min: 1, max: 100, step: 1, format: v => `${v} partners` },
  { key: 'partnerGrowthRateFromYear3', label: 'Partner growth rate (Year 3+)', min: 0, max: 200, step: 5, format: pct },
  { key: 'partnerTestsPerDayEach', label: 'Tests per partner per day', min: 5, max: 100, step: 5, format: v => `${v} tests/day` },
  { key: 'partnerOnboardingFee', label: 'Partner onboarding fee (one-time)', min: 0, max: 50000, step: 500, format: currency },
]

interface SliderPanelProps {
  inputs: ModelInputs
  onChange: (key: keyof ModelInputs, value: number | boolean) => void
  onReset: () => void
  preset: string
  onPreset: (p: string) => void
}

const PRESETS: Record<string, Partial<ModelInputs>> = {
  conservative: {
    subscriptionPrice: 800, year1Subscribers: 20, annualGrowthRate: 20,
    avgTestsUsed: 7, cac: 150, partnerTestsCount: 7,
  },
  base: DEFAULT_INPUTS,
  optimistic: {
    subscriptionPrice: 1500, year1Subscribers: 80, annualGrowthRate: 60,
    avgTestsUsed: 4, cac: 80, partnerTestsCount: 2,
  },
}

function SliderField({ def, value, onChange }: {
  def: SliderDef
  value: number
  onChange: (v: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const commit = (raw: string) => {
    const n = parseFloat(raw.replace(/,/g, ''))
    if (!isNaN(n) && n >= def.min) onChange(n)
    setEditing(false)
  }

  // slider range extends to cover typed values above the defined max
  const sliderMax = Math.max(def.max, value)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs" style={{ color: '#9ca3af' }}>{def.label}</span>
        {editing ? (
          <input
            type="number"
            value={draft}
            autoFocus
            className="w-24 text-xs font-mono text-right outline-none"
            style={{ background: 'transparent', borderBottom: '1px solid #10b981', color: '#10b981' }}
            onChange={e => setDraft(e.target.value)}
            onBlur={e => commit(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
              if (e.key === 'Escape') setEditing(false)
            }}
          />
        ) : (
          <span
            className="text-xs font-mono font-semibold cursor-text select-none"
            style={{ color: '#10b981' }}
            title="Click to type a value"
            onClick={() => { setDraft(String(value)); setEditing(true) }}
          >
            {def.format(value)}
          </span>
        )}
      </div>
      <input
        type="range"
        min={def.min}
        max={sliderMax}
        step={def.step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  )
}

// Split bar + two sliders for partner / own test split
function TestSplitControl({ inputs, onChange }: {
  inputs: ModelInputs
  onChange: (key: keyof ModelInputs, value: number) => void
}) {
  const maxTests = inputs.totalPUCChecks
  const partnerCount = Math.min(inputs.partnerTestsCount, maxTests)
  const ownCount = Math.max(0, inputs.avgTestsUsed - partnerCount)
  const allPartner = partnerCount >= inputs.avgTestsUsed
  const allOwn = partnerCount === 0

  // Visual split bar widths
  const partnerPct = maxTests > 0 ? (partnerCount / maxTests) * 100 : 0
  const ownPct = maxTests > 0 ? (Math.min(ownCount, maxTests - partnerCount) / maxTests) * 100 : 0

  return (
    <div className="flex flex-col gap-3 rounded-lg p-3"
      style={{ background: '#0d0f12', border: '1px solid #2a2f38' }}>

      {/* Section label */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#6b7280' }}>
          PUC Test Allocation
        </span>
        <span className="text-xs font-mono" style={{ color: '#4b5563' }}>
          of {maxTests} lifetime checks
        </span>
      </div>

      {/* Split bar */}
      <div className="flex h-2 rounded-full overflow-hidden" style={{ background: '#1e2228' }}>
        <div
          className="transition-all"
          style={{ width: `${partnerPct}%`, background: '#3b82f6' }}
        />
        <div
          className="transition-all"
          style={{ width: `${ownPct}%`, background: '#10b981' }}
        />
      </div>

      <div className="flex gap-3 text-xs" style={{ color: '#6b7280' }}>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#3b82f6' }} />
          Partner: <span className="font-mono font-semibold text-white ml-1">{partnerCount}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#10b981' }} />
          Own unit: <span className="font-mono font-semibold text-white ml-1">{ownCount}</span>
        </span>
        {allPartner && (
          <span className="ml-auto text-blue-400 font-semibold">All partner</span>
        )}
        {allOwn && (
          <span className="ml-auto text-emerald-400 font-semibold">All own</span>
        )}
      </div>

      {/* Partner slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: '#9ca3af' }}>Tests at partner PUC</span>
          <span className="text-xs font-mono font-semibold" style={{ color: '#3b82f6' }}>
            {partnerCount} tests
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={maxTests}
          step={1}
          value={partnerCount}
          style={{ accentColor: '#3b82f6' }}
          onChange={e => onChange('partnerTestsCount', Number(e.target.value))}
        />
      </div>

      {/* Own unit — derived read-out + its own range for clarity */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: '#9ca3af' }}>Tests at own machine</span>
          <span className="text-xs font-mono font-semibold" style={{ color: '#10b981' }}>
            {ownCount} tests
          </span>
        </div>
        {/* Read-only visual bar for own tests — drag partner to change */}
        <div className="h-1 rounded-full" style={{ background: '#2a2f38' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${maxTests > 0 ? (ownCount / maxTests) * 100 : 0}%`,
              background: '#10b981',
            }}
          />
        </div>
        <span className="text-xs" style={{ color: '#4b5563' }}>
          Derived: avgTestsUsed ({inputs.avgTestsUsed}) − partner ({partnerCount})
        </span>
      </div>
    </div>
  )
}

export default function SliderPanel({ inputs, onChange, onReset, preset, onPreset }: SliderPanelProps) {
  return (
    <div style={{ background: '#161a20', border: '1px solid #2a2f38' }} className="rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <h2 className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#6b7280' }}>
          Model Inputs
        </h2>
        <div className="flex gap-2 items-center">
          <select
            value={preset}
            onChange={e => onPreset(e.target.value)}
            style={{ background: '#0d0f12', border: '1px solid #2a2f38', color: '#9ca3af' }}
            className="text-xs rounded px-2 py-1 font-mono"
          >
            <option value="custom">Custom</option>
            <option value="conservative">Conservative</option>
            <option value="base">Base Case</option>
            <option value="optimistic">Optimistic</option>
          </select>
          <button
            onClick={onReset}
            style={{ background: '#0d0f12', border: '1px solid #2a2f38', color: '#9ca3af' }}
            className="text-xs rounded px-3 py-1 hover:border-emerald-500 hover:text-emerald-400 transition-all"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left column — Revenue & Forecast */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#3b82f6' }}>
              Revenue &amp; Forecast
            </span>
            <Tooltip text="Levers that affect how much money comes in. Subscription price and pickup charge are your pricing decisions. PUC frequency and avg tests used determine how intensively customers use the service — these drive both revenue and cost." />
          </div>
          {LEFT_FIELDS.map(def => {
            if ('isToggle' in def) {
              const val = inputs[def.key] as boolean
              return (
                <div key={def.key as string} className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#9ca3af' }}>{def.label}</span>
                  <button
                    onClick={() => onChange(def.key, !val)}
                    className={`text-xs font-mono px-3 py-0.5 rounded transition-all ${
                      val ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'border text-gray-500'
                    }`}
                    style={!val ? { borderColor: '#2a2f38' } : {}}
                  >
                    {val ? 'YES' : 'NO'}
                  </button>
                </div>
              )
            }
            return (
              <SliderField
                key={def.key as string}
                def={def as SliderDef}
                value={inputs[def.key] as number}
                onChange={v => onChange(def.key, v)}
              />
            )
          })}
        </div>

        {/* Right column — Costs & Ops */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#f59e0b' }}>
              Costs &amp; Operations
            </span>
            <Tooltip text="Levers that affect how much money goes out. PUC test allocation controls the split between expensive partner centres and cheaper own-machine tests. Driver economics show whether pickups make or lose money. Float return rate is the yield PUCAR earns by investing upfront subscription cash." />
          </div>

          {/* Test allocation widget */}
          <TestSplitControl inputs={inputs} onChange={onChange} />

          {RIGHT_COST_FIELDS.map(def => (
            <SliderField
              key={def.key as string}
              def={def as SliderDef}
              value={inputs[def.key] as number}
              onChange={v => onChange(def.key, v)}
            />
          ))}

          {/* Partner network sub-section */}
          <div className="flex items-center gap-1.5 pt-1" style={{ borderTop: '1px solid #2a2f38' }}>
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#3b82f6' }}>
              Partner Network
            </span>
            <Tooltip text="Control how many partner PUC centres you have signed up and how many tests each can handle per day. This determines your total network capacity and whether it keeps up with subscriber growth." />
          </div>

          {PARTNER_FIELDS.map(def => (
            <SliderField
              key={def.key as string}
              def={def as SliderDef}
              value={inputs[def.key] as number}
              onChange={v => onChange(def.key, v)}
            />
          ))}

          {/* Driver / ops sub-section */}
          <div className="flex items-center gap-1.5 pt-1" style={{ borderTop: '1px solid #2a2f38' }}>
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#f59e0b' }}>
              Driver &amp; Machine
            </span>
            <Tooltip text="Operational costs for the pickup driver fleet and the own PUC machine investment. Driver salary and daily capacity determine the true cost per pickup. Machine setup cost sets the threshold for switching away from partner centres." />
          </div>

          {RIGHT_OPS_FIELDS.map(def => (
            <SliderField
              key={def.key as string}
              def={def as SliderDef}
              value={inputs[def.key] as number}
              onChange={v => onChange(def.key, v)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export { PRESETS }
