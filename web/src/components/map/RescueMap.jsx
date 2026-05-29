'use client'

function normalizePoint(point) {
  if (!point) return null
  if (typeof point.latitude === 'number' && typeof point.longitude === 'number') {
    return { lat: point.latitude, lng: point.longitude }
  }
  if (typeof point.lat === 'number' && typeof point.lng === 'number') {
    return { lat: point.lat, lng: point.lng }
  }
  if (point.coordinates?.length === 2) {
    return { lat: point.coordinates[1], lng: point.coordinates[0] }
  }
  return null
}

export default function RescueMap({ request, driverLocation, mechanicLocation, height = '360px' }) {
  const driver = normalizePoint(driverLocation) || normalizePoint(request?.incident_location)
  const mechanic = normalizePoint(mechanicLocation)

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-soft" style={{ minHeight: height }}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Live tracking</p>
          <h3 className="mt-1 font-semibold">Route and location feed</h3>
        </div>
        <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">Realtime</span>
      </div>

      <div className="relative flex min-h-[420px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(215,153,0,0.16),transparent_40%),linear-gradient(180deg,#faf8f2_0%,#f4f1ea_100%)]">
        <div className="absolute inset-0 opacity-50" style={{
          backgroundImage: 'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div className="absolute left-[18%] top-[30%] h-4 w-4 rounded-full border-4 border-white bg-primary shadow-lg" title="Driver" />
        <div className="absolute right-[18%] top-[58%] h-4 w-4 rounded-full border-4 border-white bg-sky-600 shadow-lg" title="Mechanic" />
        <div className="absolute left-[26%] top-[37%] h-[2px] w-[46%] origin-left rotate-[18deg] border-t-2 border-dashed border-primary/70" />

        <div className="relative z-10 flex flex-col items-center gap-3 rounded-[1.75rem] border border-border bg-white/90 px-4 py-5 shadow-lift backdrop-blur-lg">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Scene status</p>
          <p className="text-sm font-semibold text-foreground">{request?.status || 'pending'}</p>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted">
            <div className="rounded-2xl bg-surfaceAlt px-3 py-2">Driver <span className="block font-semibold text-foreground">{driver ? `${driver.lat.toFixed(4)}, ${driver.lng.toFixed(4)}` : 'Waiting'}</span></div>
            <div className="rounded-2xl bg-surfaceAlt px-3 py-2">Mechanic <span className="block font-semibold text-foreground">{mechanic ? `${mechanic.lat.toFixed(4)}, ${mechanic.lng.toFixed(4)}` : 'Broadcasting soon'}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
