import Badge from '@/components/ui/Badge'

const severityVariantMap = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
}

export default function DiagnosticResult({ diagnosis }) {
  if (!diagnosis) return null

  const { problem, severity, recommendations = [], estimated_causes = [] } = diagnosis

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-[#E5D0A7]/50">
        <span className="text-xs font-bold text-[#7C6B44] uppercase tracking-wider">
          AI Diagnosis
        </span>
        <Badge label={severity} variant={severityVariantMap[severity] || 'default'} dot />
      </div>

      <div>
        <h4 className="text-sm font-black text-[#1F1B10] leading-snug">{problem}</h4>
      </div>

      {estimated_causes.length > 0 && (
        <div className="space-y-1 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7C6B44]">Likely Causes</p>
          <ul className="list-disc list-inside space-y-1">
            {estimated_causes.map((cause, idx) => (
              <li key={idx} className="text-xs text-slate-700 leading-relaxed">{cause}</li>
            ))}
          </ul>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-1 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7C6B44]">Recommendations</p>
          <ul className="list-disc list-inside space-y-1">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="text-xs text-slate-700 leading-relaxed">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
