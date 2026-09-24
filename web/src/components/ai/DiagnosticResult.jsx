import { AlertTriangle, Sparkles } from 'lucide-react'
import Badge from '@/components/ui/Badge'

const severityVariantMap = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
}

export default function DiagnosticResult({ diagnosis }) {
  if (!diagnosis) return null

  const { problem, severity, recommendations = [], estimated_causes = [], isFallback, fallbackReason } = diagnosis

  return (
    <div className="space-y-3.5">
      {isFallback && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-2.5 text-xs text-amber-900 flex items-start gap-2 shadow-2xs">
          <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800 block">
              Basic Guidance (Offline / Fallback)
            </span>
            <p className="text-[11px] text-amber-700 leading-snug font-medium">
              {fallbackReason || 'Full AI diagnosis temporarily unavailable. Showing standard preliminary checks.'}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pb-2 border-b border-[#E5D0A7]/50">
        <div className="flex items-center gap-1.5">
          {!isFallback && <Sparkles size={13} className="text-[#A18A4D]" />}
          <span className="text-xs font-bold text-[#7C6B44] uppercase tracking-wider">
            {isFallback ? 'Preliminary Assessment' : 'AI Diagnosis'}
          </span>
        </div>
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
