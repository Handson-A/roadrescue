'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { 
  Wrench, Fuel, Search, Navigation, AlertTriangle, Star, 
  MapPin, Phone, ShieldCheck, ChevronRight, X, Clock, Compass, Eye
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { normalizeGeoPoint, formatDistance } from '@/lib/utils'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import OverpassFuelLayer from '@/components/map/OverpassFuelLayer'

// Dynamic imports for Leaflet components (SSR-safe)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center bg-[#F6F2E7]"><Spinner /></div> }
)
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false })

function MapController({ center, zoom }) {
  const { useMap } = require('react-leaflet')
  const map = useMap()
  useEffect(() => {
    if (map && center) {
      map.setView(center, zoom || map.getZoom())
      setTimeout(() => {
        map.invalidateSize()
      }, 100)
    }
  }, [map, center, zoom])
  return null
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function DriverExploreMap() {
  const router = useRouter()
  const [mechanics, setMechanics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter controls
  const [searchQuery, setSearchQuery] = useState('')
  const [showMechanics, setShowMechanics] = useState(true)
  const [showFuelStations, setShowFuelStations] = useState(true)
  const [availabilityFilter, setAvailabilityFilter] = useState('all') // 'all', 'online', 'offline'

  // User location
  const [userLocation, setUserLocation] = useState([5.6037, -0.1870]) // Default: Accra
  const [hasUserLocation, setHasUserLocation] = useState(false)

  // Selected mechanic for inspection drawer
  const [selectedMechanic, setSelectedMechanic] = useState(null)

  // Leaflet icons
  const [onlineIcon, setOnlineIcon] = useState(null)
  const [offlineIcon, setOfflineIcon] = useState(null)
  const [userIcon, setUserIcon] = useState(null)

  // Setup Leaflet marker icons
  useEffect(() => {
    if (typeof window === 'undefined') return
    const L = require('leaflet')
    delete L.Icon.Default.prototype._getIconUrl

    const online = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })

    const offline = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })

    const usr = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })

    setOnlineIcon(online)
    setOfflineIcon(offline)
    setUserIcon(usr)
  }, [])

  // Get current user GPS location
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude])
          setHasUserLocation(true)
        },
        (err) => {
          console.warn('[EXPLORE] User geolocation fallback to Accra:', err.message)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }, [])

  // Fetch approved mechanics and resolve marker rules
  const fetchApprovedMechanics = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      /**
       * Marker Query Rules:
       * 1. WHERE verification_status = 'approved' only (unverified/pending never appear)
       * 2. Query mechanic_profiles with exact confirmed column names:
       *    is_available, current_location, base_location, base_location_label, show_base_location_offline
       */
      const { data, error: fetchErr } = await supabase
        .from('mechanic_profiles')
        .select(`
          user_id,
          business_name,
          years_experience,
          specializations,
          rating_avg,
          rating_count,
          is_available,
          location_label,
          service_mode,
          current_location,
          base_location,
          base_location_label,
          show_base_location_offline,
          verification_status
        `)
        .eq('verification_status', 'approved')

      if (fetchErr) throw fetchErr

      // Process and apply strict marker filtering rules
      const validMechanics = []

      for (const m of (data || [])) {
        const isOnline = m.is_available === true

        if (isOnline) {
          // Rule: If online (is_available = true), render marker at current_location
          if (m.current_location) {
            const coords = normalizeGeoPoint(m.current_location)
            if (coords && coords[0] && coords[1]) {
              validMechanics.push({
                ...m,
                statusMode: 'online',
                markerCoordinates: coords,
                displayLocationLabel: m.location_label || 'Current GPS Location',
              })
            }
          }
        } else {
          // Rule: If offline (is_available = false), ONLY render if base_location is non-null AND show_base_location_offline is true
          if (m.show_base_location_offline === true && m.base_location) {
            const coords = normalizeGeoPoint(m.base_location)
            if (coords && coords[0] && coords[1]) {
              validMechanics.push({
                ...m,
                statusMode: 'offline',
                markerCoordinates: coords,
                displayLocationLabel: m.base_location_label || m.location_label || 'Workshop / Base',
              })
            }
          }
          // Otherwise suppressed entirely from results
        }
      }

      setMechanics(validMechanics)
    } catch (err) {
      console.error('[MAP DISCOVERY FETCH ERROR]:', err)
      setError(err.message || 'Failed to load mechanics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApprovedMechanics()
  }, [fetchApprovedMechanics])

  // Filtered mechanics based on search & availability filters
  const visibleMechanics = useMemo(() => {
    if (!showMechanics) return []
    return mechanics.filter((m) => {
      // Availability filter
      if (availabilityFilter === 'online' && m.statusMode !== 'online') return false
      if (availabilityFilter === 'offline' && m.statusMode !== 'offline') return false

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = m.business_name?.toLowerCase().includes(q)
        const matchLoc = m.displayLocationLabel?.toLowerCase().includes(q)
        const matchSpecs = Array.isArray(m.specializations)
          ? m.specializations.some((s) => s.toLowerCase().includes(q))
          : typeof m.specializations === 'string' && m.specializations.toLowerCase().includes(q)
        return matchName || matchLoc || matchSpecs
      }

      return true
    })
  }, [mechanics, showMechanics, availabilityFilter, searchQuery])

  // Selected mechanic distance
  const selectedDistance = useMemo(() => {
    if (!selectedMechanic?.markerCoordinates || !userLocation) return null
    return calculateDistanceKm(
      userLocation[0],
      userLocation[1],
      selectedMechanic.markerCoordinates[0],
      selectedMechanic.markerCoordinates[1]
    )
  }, [selectedMechanic, userLocation])

  return (
    <div className="relative w-full h-full flex-1 flex flex-col overflow-hidden bg-[#F6F2E7]">
      
      {/* ==================================================================== */}
      {/* FLOATING TOP CONTROLS & SEARCH BAR                                   */}
      {/* ==================================================================== */}
      <div className="absolute top-4 left-4 right-4 z-[500] max-w-lg mx-auto flex flex-col gap-2 pointer-events-auto">
        
        {/* Search Input Box */}
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-[#DCCDA9] shadow-lg">
          <Search size={18} className="text-[#7C6B44] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mechanics, skills, locations..."
            className="w-full bg-transparent text-xs font-semibold text-[#1F1B10] placeholder-[#7C6B44]/60 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Layer Filters (Mechanics vs Fuel Stations) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setShowMechanics(!showMechanics)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-wide border transition-all cursor-pointer shadow-sm shrink-0 ${
              showMechanics
                ? 'bg-[#1F1B10] text-white border-[#1F1B10]'
                : 'bg-white/90 text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Wrench size={13} className={showMechanics ? 'text-amber-400' : 'text-slate-500'} />
            Mechanics ({visibleMechanics.length})
          </button>

          <button
            onClick={() => setShowFuelStations(!showFuelStations)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-wide border transition-all cursor-pointer shadow-sm shrink-0 ${
              showFuelStations
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white/90 text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Fuel size={13} className={showFuelStations ? 'text-amber-200' : 'text-amber-600'} />
            Fuel Stations
          </button>

          {showMechanics && (
            <div className="flex items-center bg-white/90 border border-slate-200 rounded-full p-0.5 shadow-sm shrink-0">
              <button
                onClick={() => setAvailabilityFilter('all')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                  availabilityFilter === 'all' ? 'bg-[#1F1B10] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setAvailabilityFilter('online')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  availabilityFilter === 'online' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </button>
              <button
                onClick={() => setAvailabilityFilter('offline')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                  availabilityFilter === 'offline' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Offline Bases
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PERSISTENT FLOATING ACTION BUTTON: SKIP TO REQUEST                   */}
      {/* ==================================================================== */}
      <div className="absolute bottom-20 md:bottom-8 right-4 z-[500] pointer-events-auto">
        <Button
          onClick={() => router.push('/dashboard/driver/request/new')}
          className="h-12 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-[#1F1B10] font-black shadow-xl border-2 border-white flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <AlertTriangle size={18} className="text-[#1F1B10]" />
          <span>Skip to Request</span>
        </Button>
      </div>

      {/* Recenter button */}
      <div className="absolute bottom-36 md:bottom-24 right-4 z-[500] pointer-events-auto">
        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation([pos.coords.latitude, pos.coords.longitude])
                setHasUserLocation(true)
              })
            }
          }}
          className="h-10 w-10 bg-white/95 text-slate-700 rounded-xl border border-[#DCCDA9] shadow-lg flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
          title="Re-center on my location"
        >
          <Compass size={20} className="text-[#7C6B44]" />
        </button>
      </div>

      {/* ==================================================================== */}
      {/* EDGE-TO-EDGE LEAFLET MAP                                             */}
      {/* ==================================================================== */}
      <div className="w-full h-full flex-1 relative z-0">
        <MapContainer
          center={userLocation}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController center={userLocation} />

          {/* User Location Marker */}
          {userIcon && (
            <Marker position={userLocation} icon={userIcon} />
          )}

          {/* Mechanic Markers */}
          {showMechanics && visibleMechanics.map((m) => {
            const isOnline = m.statusMode === 'online'
            const icon = isOnline ? onlineIcon : offlineIcon
            if (!icon) return null

            return (
              <Marker
                key={m.user_id}
                position={m.markerCoordinates}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    setSelectedMechanic(m)
                  },
                }}
              />
            )
          })}

          {/* Overpass Live Fuel/EV Layer */}
          <OverpassFuelLayer isActive={showFuelStations} />
        </MapContainer>
      </div>

      {/* ==================================================================== */}
      {/* BOTTOM INSPECTION DRAWER FOR SELECTED MECHANIC                       */}
      {/* ==================================================================== */}
      {selectedMechanic && (
        <div className="absolute bottom-0 left-0 right-0 z-[600] p-4 bg-gradient-to-t from-black/20 to-transparent pointer-events-none">
          <div className="max-w-lg mx-auto bg-white rounded-3xl border border-[#DCCDA9] shadow-2xl overflow-hidden pointer-events-auto transition-all animate-in slide-in-from-bottom-6 duration-300">
            
            {/* Drawer Header Handle & Close */}
            <div className="relative px-5 pt-4 pb-3 border-b border-slate-100 flex items-start justify-between bg-[#FFF9EF]">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-[#1F1B10] flex items-center justify-center text-amber-400 shrink-0 font-black text-base shadow-sm">
                  {selectedMechanic.business_name?.[0] || 'M'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-[#1F1B10]">
                      {selectedMechanic.business_name || 'Certified Mechanic'}
                    </h3>
                    <Badge
                      variant={selectedMechanic.statusMode === 'online' ? 'success' : 'default'}
                      className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5"
                    >
                      {selectedMechanic.statusMode === 'online' ? (
                        <span className="flex items-center gap-1 text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                      ) : (
                        <span className="text-slate-600">Base / Offline</span>
                      )}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#7C6B44] flex items-center gap-1.5 mt-0.5">
                    <MapPin size={12} className="text-[#7C6B44]" />
                    {selectedMechanic.displayLocationLabel}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMechanic(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body: Metrics & Specializations */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-50 rounded-2xl p-2.5 text-center border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Rating</span>
                  <p className="text-sm font-black text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                    <Star size={13} className="text-amber-500 fill-amber-500" />
                    {selectedMechanic.rating_avg ? Number(selectedMechanic.rating_avg).toFixed(1) : '5.0'}
                    <span className="text-[10px] font-medium text-slate-400">({selectedMechanic.rating_count || 0})</span>
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-2.5 text-center border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Distance</span>
                  <p className="text-sm font-black text-slate-800 mt-0.5">
                    {selectedDistance !== null ? formatDistance(selectedDistance) : 'Nearby'}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-2.5 text-center border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Experience</span>
                  <p className="text-sm font-black text-slate-800 mt-0.5">
                    {selectedMechanic.years_experience ? `${selectedMechanic.years_experience} yrs` : 'Certified'}
                  </p>
                </div>
              </div>

              {/* Specializations list */}
              {selectedMechanic.specializations && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Specialized In
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(selectedMechanic.specializations)
                      ? selectedMechanic.specializations
                      : typeof selectedMechanic.specializations === 'string'
                      ? selectedMechanic.specializations.split(',')
                      : []
                    ).map((spec, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/60 text-[11px] font-bold"
                      >
                        {typeof spec === 'string' ? spec.trim() : spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Drawer Dual Actions: Directions & Request Assistance */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const [lat, lng] = selectedMechanic.markerCoordinates
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
                    window.open(url, '_blank', 'noopener,noreferrer')
                  }}
                  className="h-12 rounded-2xl border-2 border-slate-200 text-slate-800 font-black text-xs uppercase tracking-wider hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Navigation size={15} className="text-slate-600" />
                  Directions
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    router.push(`/dashboard/driver/request/new?mechanicId=${selectedMechanic.user_id}`)
                  }}
                  className="h-12 rounded-2xl bg-primary hover:bg-primary-hover text-[#1F1B10] font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Wrench size={15} className="text-[#1F1B10]" />
                  Request Help
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
