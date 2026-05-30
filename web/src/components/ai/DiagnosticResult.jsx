
import Badge from '@/components/ui/Badge'

export default function DiagnosticResult({ diagnosis, isFallback, className = '' }) {
  if (!diagnosis) return null

  return (
    <div className={`bg-surface-raised border border-surface-border rounded-card p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-amber uppercase tracking-wider">
          ⚡ AI Diagnosis
        </span>
        {isFallback && (
          <span className="text-xs text-text-muted">Service unavailable — manual mode</span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-text-primary">{diagnosis.fault_category}</span>
        <Badge label={diagnosis.urgency} variant={diagnosis.urgency} dot />
      </div>

      <p className="text-sm text-text-secondary leading-relaxed">{diagnosis.summary}</p>

      {/* safety advice highlighted */}
      <div className="flex items-start gap-2 bg-amber/5 border border-amber/20 rounded-btn px-3 py-2">
        <span className="text-amber text-sm mt-0.5">⚠</span>
        <p className="text-xs text-text-primary">{diagnosis.safety_advice}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted">Can drive:</span>
        <span className={`text-xs font-semibold ${diagnosis.can_drive ? 'text-emerald-400' : 'text-red-400'}`}>
          {diagnosis.can_drive ? 'Yes — drive slowly to a mechanic' : 'No — stay put'}
        </span>
      </div>
    </div>
  )
}