// 'use client';

// /**
//  * DiagnosticResult Component
//  * Displays AI diagnostic results and recommendations
//  */

// export default function DiagnosticResult({ diagnosis, severity = 'medium' }) {
//   const severityColor = {
//     low: 'bg-green-100 border-green-400 text-green-800',
//     medium: 'bg-yellow-100 border-yellow-400 text-yellow-800',
//     high: 'bg-red-100 border-red-400 text-red-800',
//   };

//   return (
//     <div className="bg-white rounded-lg shadow p-6">
//       <h3 className="text-lg font-semibold text-gray-900 mb-4">Diagnostic Results</h3>

//       <div className={`p-4 border-l-4 rounded ${severityColor[severity]} mb-4`}>
//         <p className="font-semibold mb-2">Severity: {severity.toUpperCase()}</p>
//         <p>{diagnosis}</p>
//       </div>

//       <div className="bg-blue-50 p-4 rounded-lg mt-4">
//         <p className="text-sm text-gray-700">
//           <strong>Recommendation:</strong> Please have a certified mechanic inspect this issue.
//           Immediate attention is required if you notice any safety concerns.
//         </p>
//       </div>
//     </div>
//   );
// }


// web/src/components/ai/DiagnosticResult.jsx
// Displays AI diagnosis result in the request form

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