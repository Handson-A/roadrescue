'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import { Wrench, Phone, AlertTriangle, User, ShieldCheck } from 'lucide-react'
import L from 'leaflet'

import 'leaflet/dist/leaflet.css'
import Badge from '@/components/ui/Badge'

// ============================================================================
// HIGH-VISIBILITY COLOR MAP MARKER DESIGNS
// ============================================================================
const baseLayout = {
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}

// 🔵 BLUE: Standby active units waiting for assignments
const standbyMechanicIcon = new L.Icon({
  ...baseLayout,
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
})

// 🟡 YELLOW: Standby active units waiting for assignments
const yellowMechanicIcon = new L.Icon({
  ...baseLayout,
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
})

// 🔴 RED: Distressed drivers stranded in the field
const strandedDriverIcon = new L.Icon({
  ...baseLayout,
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
})

// 🟢 GREEN: En-route field assets dispatched to an incident scene
const dispatchedMechanicIcon = new L.Icon({
  ...baseLayout,
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
})

export default function LiveHotspotsMap({ mechanics = [], activeIncidents = [] }) {
  const defaultPosition = [5.6037, -0.1870] // Accra Operations Baseline Hub Center Coordinates
  const [liveLocations, setLiveLocations] = useState({})
  const [liveIncidents, setLiveIncidents] = useState(activeIncidents)
  const [onlineMechanics, setOnlineMechanics] = useState({})
  const [liveMechanics, setLiveMechanics] = useState(mechanics)

  useEffect(() => {
    Promise.resolve().then(() => {
      setLiveMechanics(mechanics)
    })
  }, [mechanics])

  useEffect(() => {
    const { createClient } = require('@/lib/supabase/client')
    const supabase = createClient()

    const channel = supabase
      .channel('admin-mechanic-profiles-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'mechanic_profiles' },
        (payload) => {
          const updated = payload.new
          setLiveMechanics((prev) => 
            prev.map((m) => m.user_id === updated.user_id ? { ...m, ...updated } : m)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Keep liveIncidents synced with parent activeIncidents props
  useEffect(() => {
    Promise.resolve().then(() => {
      setLiveIncidents(activeIncidents)
    })
  }, [activeIncidents])

  // 1. Subscribe to INSERT and UPDATE events on rescue_requests to render driver pins instantly
  useEffect(() => {
    const { createClient } = require('@/lib/supabase/client')
    const supabase = createClient()

    const channel = supabase
      .channel('admin-requests-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rescue_requests' },
        (payload) => {
          const newRequest = payload.new
          const isActive = ['pending', 'accepted', 'en_route', 'arrived', 'in_progress'].includes(newRequest.status)
          if (!isActive) return

          setLiveIncidents((prev) => {
            if (prev.some((req) => req.id === newRequest.id)) return prev
            return [newRequest, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rescue_requests' },
        (payload) => {
          const updatedRequest = payload.new
          const isActive = ['pending', 'accepted', 'en_route', 'arrived', 'in_progress'].includes(updatedRequest.status)

          setLiveIncidents((prev) => {
            if (isActive) {
              if (prev.some((req) => req.id === updatedRequest.id)) {
                return prev.map((req) => req.id === updatedRequest.id ? { ...req, ...updatedRequest } : req)
              } else {
                return [updatedRequest, ...prev]
              }
            } else {
              return prev.filter((req) => req.id !== updatedRequest.id)
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 2. Subscribe to Supabase Presence to track online mechanics immediately
  useEffect(() => {
    const { createClient } = require('@/lib/supabase/client')
    const supabase = createClient()
    const channel = supabase.channel('mechanic-presence')

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const keys = Object.keys(state)
        const onlineMap = {}
        keys.forEach((key) => {
          onlineMap[key] = true
        })
        setOnlineMechanics(onlineMap)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 3. Subscribe to the standby online-mechanics broadcast channel
  useEffect(() => {
    const { createClient } = require('@/lib/supabase/client')
    const supabase = createClient()
    const channel = supabase
      .channel('online-mechanics')
      .on('broadcast', { event: 'location_update' }, (payload) => {
        const { mechanicId, latitude, longitude } = payload.payload
        setLiveLocations((prev) => ({
          ...prev,
          [mechanicId]: { lat: latitude, lng: longitude }
        }))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 4. Dynamically subscribe to active job channels (location-${requestId}) for fanned-out assigned locations
  useEffect(() => {
    if (!liveIncidents || liveIncidents.length === 0) return

    const { createClient } = require('@/lib/supabase/client')
    const supabase = createClient()
    const activeChannels = []

    liveIncidents.forEach((incident) => {
      if (!['accepted', 'en_route', 'arrived', 'in_progress'].includes(incident.status)) return

      const ch = supabase
        .channel(`location-${incident.id}`)
        .on('broadcast', { event: 'location_update' }, (payload) => {
          const { mechanicId, latitude, longitude } = payload.payload
          setLiveLocations((prev) => ({
            ...prev,
            [mechanicId]: { lat: latitude, lng: longitude }
          }))
        })
      
      ch.subscribe()
      activeChannels.push(ch)
    })

    return () => {
      activeChannels.forEach((ch) => supabase.removeChannel(ch))
    }
  }, [liveIncidents])

  // Robust parsing utility targeting multiple relational database string patterns
  const extractCoords = (locationField) => {
    if (!locationField) return null
    
    // Pattern A: Standard raw array coordinates [longitude, latitude]
    if (locationField.coordinates && locationField.coordinates.length === 2) {
      return {
        lng: locationField.coordinates[0],
        lat: locationField.coordinates[1]
      }
    }
    
    // Pattern B: Flat geometry/location parameters mapping fallback
    if (typeof locationField.lat === 'number' && typeof locationField.lng === 'number') {
      return { lat: locationField.lat, lng: locationField.lng }
    }
    if (typeof locationField.latitude === 'number' && typeof locationField.longitude === 'number') {
      return { lat: locationField.latitude, lng: locationField.longitude }
    }

    return null
  }

  return (
  <div className="w-full h-full min-h-[30rem] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 z-10 relative">
    <MapContainer 
      center={defaultPosition} 
      zoom={12} 
      scrollWheelZoom={true}
      className="w-full h-full min-h-[30rem]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* ======================= LAYER 1: STRANDED DRIVERS & SECTOR INCIDENTS ======================= */}
      {liveIncidents?.map((incident) => {
        const driverCoords = extractCoords(incident.incident_location) || 
                             (incident.incident_lat && incident.incident_lng ? { lat: Number(incident.incident_lat), lng: Number(incident.incident_lng) } : null)
        
        if (!driverCoords) return null

        return (
          <Marker 
            key={`incident-${incident.id}`} 
            position={[driverCoords.lat, driverCoords.lng]} 
            icon={strandedDriverIcon}
          >
            <Popup>
              <div className="p-1 min-w-[170px] font-sans">
                <h4 className="font-black text-sm text-red-600 m-0 flex items-center gap-1.5 uppercase tracking-wide">
                  <AlertTriangle size={13} /> Breakdown Alert
                </h4>
                <p className="font-bold text-slate-800 text-xs mt-1.5 mb-0 capitalize">
                  {incident.service_type?.replace('_', ' ')}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 mb-0 leading-normal">
                  {incident.problem_description || 'Awaiting structural relief vectors.'}
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <Badge variant={incident.status} label={incident.status} />
                  <span className="text-[10px] font-mono text-slate-400">
                    ID: ...{incident.id?.slice(-4)}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {/* ======================= LAYER 2: FIELD SERVICE MECHANICS (FLATTENED) ======================= */}
      {liveMechanics?.map((m) => {
        const activeAssignment = liveIncidents.find(
          (inc) => inc.mechanic_id === m.user_id && ['accepted', 'en_route', 'arrived', 'in_progress'].includes(inc.status)
        )

        const isOnline = m.is_available

        // Only show if available (online)
        if (!isOnline) return null

        const liveLoc = liveLocations[m.user_id]
        const mechCoords = liveLoc || extractCoords(m.current_location)
        if (!mechCoords) return null

        return (
          <Marker 
            key={`mech-marker-${m.user_id}`} // Flattened top-level key
            position={[mechCoords.lat, mechCoords.lng]} 
            icon={activeAssignment ? dispatchedMechanicIcon : yellowMechanicIcon}
          >
            <Popup>
              <div className="p-1 min-w-[170px] font-sans">
                <h4 className="font-black text-sm text-slate-900 m-0 flex items-center gap-1.5">
                  <Wrench size={12} className={activeAssignment ? "text-emerald-500" : "text-amber-500"} /> 
                  {m.business_name || 'Independent Specialist'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 mb-0 font-bold">
                  Name: {m.user?.full_name || m.profiles?.full_name || 'Vetted Specialist'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 mb-0 font-medium">
                  Phone: {m.user?.phone || m.profiles?.phone || '—'}
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5 mb-0 font-black">
                  Status: {activeAssignment ? 'Online / Dispatched' : 'Online / Ready'}
                </p>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    activeAssignment ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                    {activeAssignment ? 'Dispatched' : 'Online / Ready'}
                  </span>
                  {(m.user?.phone || m.profiles?.phone) && (
                    <a 
                      href={`tel:${m.user?.phone || m.profiles?.phone}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 hover:text-emerald-600 no-underline"
                    >
                      <Phone size={10} /> Call Node
                    </a>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {/* ======================= LAYER 3: ROUTING VECTOR PASSES (SEPARATE FLATTENED STREAM) ======================= */}
      {mechanics?.map((m) => {
        const liveLoc = liveLocations[m.user_id]
        const mechCoords = liveLoc || extractCoords(m.current_location)
        if (!mechCoords) return null

        const activeAssignment = liveIncidents.find(
          (inc) => inc.mechanic_id === m.user_id && ['accepted', 'en_route', 'arrived', 'in_progress'].includes(inc.status)
        )
        if (!activeAssignment) return null

        const driverCoords = extractCoords(activeAssignment.incident_location) || 
                             (activeAssignment.incident_lat && activeAssignment.incident_lng ? { lat: Number(activeAssignment.incident_lat), lng: Number(activeAssignment.incident_lng) } : null)
        
        if (!driverCoords) return null

        return (
          <Polyline 
            key={`route-trail-${m.user_id}`} // Clean standalone sibling entry
            positions={[
              [mechCoords.lat, mechCoords.lng],
              [driverCoords.lat, driverCoords.lng]
            ]} 
            color="#10b981" 
            weight={3}
            dashArray="6, 10" 
          />
        )
      })}
    </MapContainer>
  </div>
);
}