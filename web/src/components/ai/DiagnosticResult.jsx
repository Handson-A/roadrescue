'use client';

/**
 * DiagnosticResult Component
 * Displays AI diagnostic results and recommendations
 */

export default function DiagnosticResult({ diagnosis, severity = 'medium' }) {
  const severityColor = {
    low: 'bg-green-100 border-green-400 text-green-800',
    medium: 'bg-yellow-100 border-yellow-400 text-yellow-800',
    high: 'bg-red-100 border-red-400 text-red-800',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Diagnostic Results</h3>

      <div className={`p-4 border-l-4 rounded ${severityColor[severity]} mb-4`}>
        <p className="font-semibold mb-2">Severity: {severity.toUpperCase()}</p>
        <p>{diagnosis}</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mt-4">
        <p className="text-sm text-gray-700">
          <strong>Recommendation:</strong> Please have a certified mechanic inspect this issue.
          Immediate attention is required if you notice any safety concerns.
        </p>
      </div>
    </div>
  );
}
