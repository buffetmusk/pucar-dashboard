import { useState, useMemo } from 'react'
import { DEFAULT_INPUTS, computeAll } from './lib/model'
import type { ModelInputs } from './lib/model'
import { currency } from './lib/formatters'
import MetricCard from './components/MetricCard'
import SliderPanel, { PRESETS } from './components/SliderPanel'
import PnLCard from './components/PnLCard'
import ValuePropCard from './components/ValuePropCard'
import UtilChart from './components/UtilChart'
import CashflowChart from './components/CashflowChart'
import YearlyChart from './components/YearlyChart'
import YearlyTable from './components/YearlyTable'
import ScenarioChart from './components/ScenarioChart'
import DriverPanel from './components/DriverPanel'
import MachinePanel from './components/MachinePanel'
import PartnerPanel from './components/PartnerPanel'

type Tab = 'unit' | 'forecast' | 'scenarios'

export default function App() {
  const [inputs, setInputs] = useState<ModelInputs>(DEFAULT_INPUTS)
  const [preset, setPreset] = useState<string>('base')
  const [tab, setTab] = useState<Tab>('unit')

  const computed = useMemo(() => computeAll(inputs), [inputs])

  const handleChange = (key: keyof ModelInputs, value: number | boolean) => {
    setInputs(prev => ({ ...prev, [key]: value }))
    setPreset('custom')
  }

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS)
    setPreset('base')
  }

  const handlePreset = (p: string) => {
    setPreset(p)
    if (p !== 'custom' && PRESETS[p]) {
      setInputs({ ...DEFAULT_INPUTS, ...PRESETS[p] })
    }
  }

  const { unit, utilCurve, cashflow, yearly, scenarios, driver, machine, partnerNetwork, ltv, cacPaybackMonths } = computed

  const TABS: { id: Tab; label: string }[] = [
    { id: 'unit', label: 'Unit Economics' },
    { id: 'forecast', label: 'Forecast' },
    { id: 'scenarios', label: 'Scenarios' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0d0f12' }}>
      {/* Header */}
      <div style={{ background: '#161a20', borderBottom: '1px solid #2a2f38' }}>
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
              style={{ background: '#10b981', color: '#0d0f12' }}>PUC</div>
            <div>
              <h1 className="text-sm font-semibold text-white">PUCAR Unit Economics</h1>
              <p className="text-xs" style={{ color: '#6b7280' }}>Financial Modelling Dashboard</p>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1" style={{ background: '#0d0f12', borderRadius: 8, padding: 3, border: '1px solid #2a2f38' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`text-xs px-4 py-1.5 rounded transition-all font-medium ${
                  tab === t.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
                style={tab === t.id ? { background: '#161a20' } : {}}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="text-xs font-mono" style={{ color: '#4b5563' }}>
            {preset !== 'custom' && (
              <span className="px-2 py-0.5 rounded text-emerald-400"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                {preset.charAt(0).toUpperCase() + preset.slice(1)} Case
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-6 flex flex-col gap-6">
        {/* Top summary strip */}
        <div className="grid grid-cols-4 xl:grid-cols-6 gap-4">
          <MetricCard
            label="Revenue / customer"
            value={currency(unit.totalRevenue + unit.floatIncome)}
            sub="incl. float income"
            positive={true}
            tooltip="Total money PUCAR collects from one average subscriber: subscription fee + pickup charges for tests 2 onwards + interest earned on the upfront cash float."
          />
          <MetricCard
            label="Cost / customer"
            value={currency(unit.totalCost)}
            sub="CAC + PUC + driver"
            positive={false}
            tooltip="Total money PUCAR spends to acquire and serve one subscriber: customer acquisition cost (ads) + all PUC centre commissions or own-machine costs + driver pickup costs for every test."
          />
          <MetricCard
            label="Net profit / customer"
            value={`${unit.netProfit >= 0 ? '+' : ''}${currency(unit.netProfit)}`}
            sub={unit.netProfit >= 0 ? 'profitable' : 'loss-making'}
            positive={unit.netProfit >= 0}
            tooltip="Revenue minus cost per customer. Positive = every subscriber makes money. Negative = you're losing money on each one and need to adjust the subscription price, cut costs, or improve utilisation."
          />
          <MetricCard
            label="Break-even price"
            value={currency(unit.breakEvenPrice)}
            sub="min. subscription needed"
            positive={null}
            tooltip="The minimum subscription price at which PUCAR exactly breaks even on a customer (net profit = ₹0). If your current subscription is above this, you're profitable. Below it, you're loss-making. Calculated by binary search holding all other inputs fixed."
          />
          <MetricCard
            label="Customer LTV"
            value={currency(ltv)}
            sub="total lifetime revenue"
            positive={true}
            tooltip="Lifetime Value — the total revenue PUCAR earns from one subscriber over their entire subscription (subscription + pickups + float). This is different from net profit because it doesn't subtract costs."
          />
          <MetricCard
            label="CAC Payback"
            value={isFinite(cacPaybackMonths) ? `${cacPaybackMonths}mo` : '∞'}
            sub="months to recover CAC"
            positive={cacPaybackMonths < 24}
            tooltip="How many months it takes for a customer's revenue to repay the cost of acquiring them. Under 12 months is excellent. Over 24 months is a red flag — you're funding too much growth upfront before seeing returns."
          />
        </div>

        {/* Tab content */}
        {tab === 'unit' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-5 gap-6">
              <div className="col-span-3">
                <SliderPanel
                  inputs={inputs}
                  onChange={handleChange}
                  onReset={handleReset}
                  preset={preset}
                  onPreset={handlePreset}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-6">
                <PnLCard unit={unit} inputs={inputs} pickupMargin={driver.pickupMargin} />
                <ValuePropCard unit={unit} inputs={inputs} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <UtilChart data={utilCurve} avgTestsUsed={inputs.avgTestsUsed} />
              <CashflowChart data={cashflow} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <DriverPanel metrics={driver} assumedCost={inputs.driverCostPerPickup} />
              <MachinePanel metrics={machine} inputs={inputs} />
            </div>

            <PartnerPanel metrics={partnerNetwork} inputs={inputs} />
          </div>
        )}

        {tab === 'forecast' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1">
                <SliderPanel
                  inputs={inputs}
                  onChange={handleChange}
                  onReset={handleReset}
                  preset={preset}
                  onPreset={handlePreset}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-6">
                <YearlyChart data={yearly} />
                <YearlyTable data={yearly} />
              </div>
            </div>
          </div>
        )}

        {tab === 'scenarios' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1">
                <SliderPanel
                  inputs={inputs}
                  onChange={handleChange}
                  onReset={handleReset}
                  preset={preset}
                  onPreset={handlePreset}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-6">
                <ScenarioChart
                  scenarios={scenarios}
                  avgTestsUsed={inputs.avgTestsUsed}
                  forecastYears={inputs.forecastYears}
                />
                <div className="grid grid-cols-2 gap-6">
                  <UtilChart data={utilCurve} avgTestsUsed={inputs.avgTestsUsed} />
                  <CashflowChart data={cashflow} />
                </div>
                {/* Scenario summary cards */}
                <div style={{ background: '#161a20', border: '1px solid #2a2f38' }} className="rounded-xl p-6">
                  <h2 className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: '#6b7280' }}>
                    Final Year Bank Balance by Scenario
                  </h2>
                  <div className="grid grid-cols-3 gap-3">
                    {scenarios.map((s) => {
                      const lastBal = s.data[s.data.length - 1]?.bankBalance ?? 0
                      return (
                        <div key={s.label} className={`rounded-lg p-3 ${s.testsUsed === inputs.avgTestsUsed ? 'ring-1 ring-emerald-500/40' : ''}`}
                          style={{ background: '#0d0f12', border: '1px solid #2a2f38' }}>
                          <p className="text-xs" style={{ color: '#6b7280' }}>{s.label} used</p>
                          <p className="text-sm font-mono font-bold"
                            style={{ color: lastBal >= 0 ? '#10b981' : '#ef4444' }}>
                            {currency(lastBal)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4" style={{ borderTop: '1px solid #2a2f38' }}>
          <p className="text-xs" style={{ color: '#374151' }}>
            PUCAR Financial Model — all computation is client-side, no data leaves your browser
          </p>
        </div>
      </div>
    </div>
  )
}
