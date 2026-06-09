'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'

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

const useMap = dynamic(
  () => import('react-leaflet').then((mod) => mod.useMap),
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

  /* eslint-disable react-hooks/react-compiler/react-compiler */
  useEffect(() => {
    const L = require('leaflet')
    delete L.Icon.Default.prototype._getIconUrl
    setDriverIcon(new L.Icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    }))
    setMechanicIcon(new L.Icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    }))
  }, [])
  /* eslint-enable react-hooks/react-compiler/react-compiler */

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
    <div className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-soft" style={{ minHeight: height }}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Live tracking</p>
          <h3 className="mt-1 font-semibold">Route and location feed</h3>
        </div>
        <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">Realtime</span>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={14}
        style={{ height: '420px', width: '100%' }}
        className="relative"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds positions={positions} />

        {driver && driverIcon && (
          <Marker position={[driver.lat, driver.lng]} icon={driverIcon}>
            <Popup>
              <div className="text-xs">
                <strong>Driver</strong>
                <br />
                {driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}
              </div>
            </Popup>
          </Marker>
        )}

        {mechanic && mechanicIcon && (
          <Marker position={[mechanic.lat, mechanic.lng]} icon={mechanicIcon}>
            <Popup>
              <div className="text-xs">
                <strong>Mechanic</strong>
                <br />
                {mechanic.lat.toFixed(4)}, {mechanic.lng.toFixed(4)}
              </div>
            </Popup>
          </Marker>
        )}

        {routePositions.length === 2 && (
          <Polyline positions={routePositions} color="#0ea5e9" dashArray="8, 12" />
        )}
      </MapContainer>

      <div className="px-4 py-3 lg:px-6 border-t border-border bg-slate-50/50">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-muted uppercase tracking-wider text-[10px]">Driver</p>
            <p className="font-medium text-foreground">
              {driver ? `${driver.lat.toFixed(4)}, ${driver.lng.toFixed(4)}` : 'Waiting'}
            </p>
          </div>
          <div>
            <p className="text-muted uppercase tracking-wider text-[10px]">Mechanic</p>
            <p className="font-medium text-foreground">
              {mechanic ? `${mechanic.lat.toFixed(4)}, ${mechanic.lng.toFixed(4)}` : 'Broadcasting soon'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}