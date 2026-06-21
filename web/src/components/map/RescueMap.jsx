'use client'


import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'

// FIXED: Import useMap directly via standard module paths
import { useMap } from 'react-leaflet' 


const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <div style={{ height: '420px' }} className="animate-pulse bg-slate-100 rounded-xl" /> }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)


const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
)

function FitBounds({ positions }) {
  const mapHook = useMap()
  useEffect(() => {
    if (mapHook && positions.length > 0) {
      const L = require('leaflet')
      const bounds = L.latLngBounds(positions)
      mapHook.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [mapHook, positions])
  return null
}

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
  const [driverIcon, setDriverIcon] = useState(null)
  const [mechanicIcon, setMechanicIcon] = useState(null)

  useEffect(() => {
    // Require leaflet and create icons synchronously but set state in a microtask
    const L = require('leaflet')
    delete L.Icon.Default.prototype._getIconUrl
    const driver = new L.Icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
    const mechanic = new L.Icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
    // Defer state updates to avoid setState during render/effect synchronous phase
    Promise.resolve().then(() => {
      setDriverIcon(driver)
      setMechanicIcon(mechanic)
    })
  }, [])

  const mapCenter = useMemo(() => {
    if (driver?.lat && driver?.lng) {
      return [driver.lat, driver.lng]
    }
    return [5.6037, -0.1870]
  }, [driver])

  const positions = useMemo(() => {
    const pos = []
    if (driver?.lat && driver?.lng) pos.push([driver.lat, driver.lng])
    if (mechanic?.lat && mechanic?.lng) pos.push([mechanic.lat, mechanic.lng])
    return pos
  }, [driver, mechanic])

  const routePositions = useMemo(() => {
    if (!driver || !mechanic) return []
    return [[driver.lat, driver.lng], [mechanic.lat, mechanic.lng]]
  }, [driver, mechanic])

  return (
  <div className="w-full h-full relative flex flex-col justify-between" style={{ minHeight: height }}>
    <MapContainer
      center={mapCenter}
      zoom={14}
      style={{ height: '100%', width: '100%', flex: '1 1 auto' }}
      className="relative z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <FitBounds positions={positions} />

      {driver && driverIcon && (
        <Marker position={[driver.lat, driver.lng]} icon={driverIcon}>
          <Popup>
            <div className="p-1 min-w-[120px]">
              <p className="font-bold text-red-600 text-xs uppercase tracking-wider">Driver Position</p>
              <p className="font-semibold text-sm mt-1">{request?.vehicle_make || 'Vehicle Breakdown'}</p>
              <p className="text-[10px] font-mono text-gray-500 mt-0.5">{driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {mechanic && mechanicIcon && (
        <Marker position={[mechanic.lat, mechanic.lng]} icon={mechanicIcon}>
          <Popup>
            <div className="p-1 min-w-[120px]">
              <p className="font-bold text-blue-600 text-xs uppercase tracking-wider">Assigned Mechanic</p>
              <p className="font-semibold text-sm mt-1">En Route</p>
              <p className="text-[10px] font-mono text-gray-500 mt-0.5">{mechanic.lat.toFixed(4)}, {mechanic.lng.toFixed(4)}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {routePositions.length === 2 && (
        <Polyline positions={routePositions} color="#0ea5e9" dashArray="8, 12" />
      )}
    </MapContainer>

    {/* Live coordinate info panel footer */}
    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/80 backdrop-blur-xs z-20">
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[9px] font-bold">Incident Coordinates</p>
          <p className="font-mono font-bold text-slate-800 mt-0.5">
            {driver ? `${driver.lat.toFixed(4)}, ${driver.lng.toFixed(4)}` : 'Waiting'}
          </p>
        </div>
        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[9px] font-bold">Your Location</p>
          <p className="font-mono font-bold text-slate-800 mt-0.5">
            {mechanic ? `${mechanic.lat.toFixed(4)}, ${mechanic.lng.toFixed(4)}` : 'Broadcasting Active'}
          </p>
        </div>
      </div>
    </div>
  </div>
);
}