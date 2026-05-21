'use client';

/**
 * RequestTimeline Component
 * Visual state machine progress for rescue request lifecycle
 */

export default function RequestTimeline({ request }) {
  const states = [
    { key: 'PENDING', label: 'Requested', icon: '📋' },
    { key: 'ASSIGNED', label: 'Mechanic Assigned', icon: '✓' },
    { key: 'IN_PROGRESS', label: 'En Route', icon: '🚗' },
    { key: 'COMPLETED', label: 'Completed', icon: '✓✓' },
  ];

  const currentIndex = states.findIndex((s) => s.key === request.status);

  return (
    <div className="space-y-4">
      {states.map((state, index) => (
        <div key={state.key} className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
              index <= currentIndex
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {state.icon}
          </div>
          <div>
            <p className={`font-semibold ${index <= currentIndex ? 'text-gray-900' : 'text-gray-500'}`}>
              {state.label}
            </p>
            {index === currentIndex && (
              <p className="text-sm text-gray-600">Currently here</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
