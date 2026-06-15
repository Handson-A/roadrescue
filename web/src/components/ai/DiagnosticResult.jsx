import Badge from '@/components/ui/Badge'

const severityVariantMap = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
}

export default function DiagnosticResult({ diagnosis, className = '' }) {
  if (!diagnosis) return null

  const { problem, severity, recommendations = [], estimated_causes = [] } = diagnosis

  return (
    <div className={`bg-surface-raised border border-surface-border rounded-card p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-amber uppercase tracking-wider">
          AI Diagnosis
        </span>
        <Badge label={severity} variant={severityVariantMap[severity] || 'default'} dot />
      </div>

      <div>
        <span className="text-sm font-semibold text-text-primary">{problem}</span>
      </div>

      {estimated_causes.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Likely Causes</p>
          <ul className="list-disc list-inside space-y-0.5">
            {estimated_causes.map((cause, idx) => (
              <li key={idx} className="text-xs text-text-secondary">{cause}</li>
            ))}
          </ul>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Recommendations</p>
          <ul className="list-disc list-inside space-y-0.5">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="text-xs text-text-secondary">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
