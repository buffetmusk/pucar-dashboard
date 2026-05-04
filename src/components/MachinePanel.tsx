import type { MachineMetrics, ModelInputs } from '../lib/model'
import { currency } from '../lib/formatters'
import { SectionHeader } from './Tooltip'

interface MachinePanelProps {
  metrics: MachineMetrics
  inputs: ModelInputs
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs" style={{ color: '#6b7280' }}>{label}</span>
      <span className="text-sm font-mono font-semibold" style={{ color: color || '#e5e7eb' }}>{value}</span>
    </div>
  )
}

export default function MachinePanel({ metrics, inputs }: MachinePanelProps) {
  const { savingPerPUC, pucsToRecoverMachine, subscribersNeeded } = metrics
  const viable = savingPerPUC > 0

  return (
    <div style={{ background: '#161a20', border: '1px solid #2a2f38' }} className="rounded-xl p-6">
      <div className="mb-4">
        <SectionHeader
          title="Own Machine Launch Trigger"
          tooltip="When PUCAR buys its own PUC testing equipment, the per-test cost drops from the partner commission to the machine's running cost. This panel calculates how many tests (and how many subscribers) you need before that investment pays for itself. The recommendation tells you the exact subscriber milestone to watch for in a city before ordering the machine."
        />
      </div>

      {!viable ? (
        <p className="text-xs text-red-400">
          Own machine cost ({currency(inputs.ownUnitCostPerPUC)}) ≥ partner commission ({currency(inputs.partnerPUCCommission)}).
          No saving from own machine at current settings.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-5">
          <Metric label="Saving per PUC vs partner" value={currency(savingPerPUC)} color="#10b981" />
          <Metric label="Machine setup cost" value={currency(inputs.ownMachineSetupCost)} color="#f59e0b" />
          <Metric
            label="PUCs needed to recover machine"
            value={isFinite(pucsToRecoverMachine) ? pucsToRecoverMachine.toLocaleString('en-IN') : '∞'}
            color="#3b82f6"
          />
          <Metric
            label="Subscribers needed"
            value={isFinite(subscribersNeeded) ? subscribersNeeded.toLocaleString('en-IN') : '∞'}
            color="#a855f7"
          />
        </div>
      )}

      {viable && isFinite(subscribersNeeded) && (
        <div className="rounded-lg px-4 py-3"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p className="text-xs" style={{ color: '#9ca3af' }}>
            <span className="text-emerald-400 font-semibold">Recommendation:</span>{' '}
            Launch own unit when you hit{' '}
            <span className="font-mono font-bold text-white">
              {subscribersNeeded.toLocaleString('en-IN')}
            </span>{' '}
            subscribers in a city — that's when the machine pays for itself.
          </p>
        </div>
      )}
    </div>
  )
}
