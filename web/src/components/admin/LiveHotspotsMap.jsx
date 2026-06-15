'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Wrench, Phone } from 'lucide-react'
import L from 'leaflet'

// Crucial: Leaflet CSS stylesheet imports must be accessible on client side
import 'leaflet/dist/leaflet.css'

// Fix for Leaflet's default marker icon path resolution breaking inside Next.js/Webpack builds
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

export default function LiveHotspotsMap({ mechanics }) {
  // Center default viewpoint to Accra/Kasoa coordinate grids
  const defaultPosition = [5.6037, -0.1870]

  // Parsing helper: Extract coords safely from PostGIS POINT coordinates arrays
  const extractCoords = (locationField) => {
    if (!locationField || !locationField.coordinates) return null
    // PostGIS POINT format: [longitude, latitude]
    return {
      lng: locationField.coordinates[0],
      lat: locationField.coordinates[1]
    }
  };

  return (
    <div className="w-full h-full min-h-[26rem] rounded-xl overflow-hidden bg-slate-100 border border-[#DCCDA9] z-10 relative">
      <MapContainer 
        center={defaultPosition} 
        zoom={12} 
        scrollWheelZoom={true}
        className="w-full h-full min-h-[26rem]"
      >
        {/* OpenStreetMap public free map tile provider config block */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Iterate over active database available mechanic entities */}
        {mechanics?.map((m) => {
          const coords = extractCoords(m.current_location)
          if (!coords) return null

          return (
            <Marker 
              key={m.user_id} 
              position={[coords.lat, coords.lng]} 
              icon={customMarkerIcon}
            >
              <Popup>
                <div className="p-1 min-w-[160px] font-sans text-[#1F1B10]">
                  <h4 className="font-black text-sm text-slate-900 m-0 flex items-center gap-1.5">
                    <Wrench size={12} className="text-amber-500" /> {m.business_name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 mb-0">
                    Operator: {m.profiles?.full_name || 'Verified Technician'}
                  </p>
                  
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                      Online
                    </span>
                    <a 
                      href={`tel:${m.profiles?.phone}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 hover:text-amber-600 no-underline"
                    >
                      <Phone size={10} /> Call Radio
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}