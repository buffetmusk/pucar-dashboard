import type { YearlyRow } from '../lib/model'
import { currency } from '../lib/formatters'
import { SectionHeader } from './Tooltip'

interface YearlyTableProps {
  data: YearlyRow[]
}

function C({ v, forcePosNeg = true }: { v: number; forcePosNeg?: boolean }) {
  const color = !forcePosNeg ? '#e5e7eb' : v >= 0 ? '#10b981' : '#ef4444'
  return <span className="font-mono text-xs" style={{ color }}>{currency(v)}</span>
}

function N({ v }: { v: number }) {
  return <span className="font-mono text-xs" style={{ color: '#e5e7eb' }}>{v.toLocaleString('en-IN')}</span>
}

export default function YearlyTable({ data }: YearlyTableProps) {
  const totals = data.reduce(
    (acc, r) => ({
      newSubs: acc.newSubs + r.newSubs,
      subRevenue: acc.subRevenue + r.subRevenue,
      pickupRevenue: acc.pickupRevenue + r.pickupRevenue,
      floatIncome: acc.floatIncome + r.floatIncome,
      partnerOnboardingRevenue: acc.partnerOnboardingRevenue + r.partnerOnboardingRevenue,
      cacSpend: acc.cacSpend + r.cacSpend,
      pucCost: acc.pucCost + r.pucCost,
      driverCost: acc.driverCost + r.driverCost,
      machineCapex: acc.machineCapex + r.machineCapex,
      ebitda: acc.ebitda + r.ebitda,
    }),
    { newSubs: 0, subRevenue: 0, pickupRevenue: 0, floatIncome: 0, partnerOnboardingRevenue: 0, cacSpend: 0, pucCost: 0, driverCost: 0, machineCapex: 0, ebitda: 0 }
  )

  const exportCSV = () => {
    const headers = ['Year', 'New Subs', 'Active Subs', 'Sub Revenue', 'Pickup Rev', 'Float Income', 'CAC Spend', 'PUC Cost', 'Driver Cost', 'EBITDA', 'Bank Balance']
    const rows = data.map(r => [
      r.year, r.newSubs, r.activeSubs, r.subRevenue, r.pickupRevenue,
      r.floatIncome, r.cacSpend, r.pucCost, r.driverCost, r.ebitda, r.bankBalance,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
    a.download = 'pucar-forecast.csv'
    a.click()
  }

  const th = 'px-3 py-2 text-left text-xs font-semibold tracking-wider whitespace-nowrap'
  const td = 'px-3 py-2 text-right whitespace-nowrap'

  return (
    <div style={{ background: '#161a20', border: '1px solid #2a2f38' }} className="rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <SectionHeader
          title="Detailed Forecast Table"
          tooltip="Year-by-year breakdown of every revenue and cost line across all cohorts. 'Active Subs' = all subscribers who still have tests remaining. EBITDA = revenue minus costs for that year only. Bank Balance = cumulative cash from day one. Use 'Export CSV' to pull this into a spreadsheet."
          position="bottom"
        />
        <button
          onClick={exportCSV}
          style={{ background: '#0d0f12', border: '1px solid #2a2f38', color: '#9ca3af' }}
          className="text-xs rounded px-3 py-1 hover:border-emerald-500 hover:text-emerald-400 transition-all"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2f38' }}>
              {['Year', 'New Subs', 'Active Subs', 'Sub Rev', 'Pickup Rev', 'Float', 'Partner Fee', 'CAC', 'PUC Cost', 'Driver', 'Machine', 'EBITDA', 'Bank Bal'].map(h => (
                <th key={h} className={th} style={{ color: '#6b7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(r => (
              <tr key={r.year} style={{ borderBottom: '1px solid #1e2228' }}
                className="hover:bg-white/[0.02] transition-all">
                <td className={`${td} font-mono text-xs font-semibold text-white`}>Y{r.year}</td>
                <td className={td}><N v={r.newSubs} /></td>
                <td className={td}><N v={r.activeSubs} /></td>
                <td className={td}><C v={r.subRevenue} /></td>
                <td className={td}><C v={r.pickupRevenue} /></td>
                <td className={td}><C v={r.floatIncome} /></td>
                <td className={td}><C v={r.partnerOnboardingRevenue} /></td>
                <td className={td}><C v={r.cacSpend} forcePosNeg={false} /></td>
                <td className={td}><C v={r.pucCost} forcePosNeg={false} /></td>
                <td className={td}><C v={r.driverCost} forcePosNeg={false} /></td>
                <td className={td}>
                  {r.machineCapex > 0
                    ? <span className="font-mono text-xs font-bold" style={{ color: '#a855f7' }}>-{currency(r.machineCapex)}</span>
                    : <span className="text-xs" style={{ color: '#374151' }}>—</span>}
                </td>
                <td className={td}><C v={r.ebitda} /></td>
                <td className={td}><C v={r.bankBalance} /></td>
              </tr>
            ))}
            <tr style={{ borderTop: '2px solid #2a2f38' }}>
              <td className={`${td} font-mono text-xs font-bold text-white`}>TOTAL</td>
              <td className={td}><N v={totals.newSubs} /></td>
              <td className={td}><span className="text-xs text-gray-500">—</span></td>
              <td className={td}><C v={totals.subRevenue} /></td>
              <td className={td}><C v={totals.pickupRevenue} /></td>
              <td className={td}><C v={totals.floatIncome} /></td>
              <td className={td}><C v={totals.partnerOnboardingRevenue} /></td>
              <td className={td}><C v={totals.cacSpend} forcePosNeg={false} /></td>
              <td className={td}><C v={totals.pucCost} forcePosNeg={false} /></td>
              <td className={td}><C v={totals.driverCost} forcePosNeg={false} /></td>
              <td className={td}><C v={totals.machineCapex} forcePosNeg={false} /></td>
              <td className={td}><C v={totals.ebitda} /></td>
              <td className={td}><span className="text-xs text-gray-500">—</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
