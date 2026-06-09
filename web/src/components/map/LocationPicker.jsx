'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useRef, useCallback } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const ACCRA_LAT = 5.6037
const ACCRA_LNG = -0.1870

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <div style={{ height: '300px' }} className="animate-pulse bg-slate-100 rounded-xl" /> }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

function MapClickHandler({ onClick }) {
  const { useMapEvent } = require('react-leaflet')
  useMapEvent('click', (event) => {
    onClick(event.latlng.lat, event.lng)
  })
  return null
}

function MapController({ center, zoom }) {
  const { useMap } = require('react-leaflet')
  const map = useMap()
  useEffect(() => {
    if (map) {
      map.setView(center, zoom)
    }
  }, [map, center, zoom])
  return null
}

export default function LocationPicker({ onSelect, onLocationSelect }) {
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [address, setAddress] = useState('')
  const [mapCenter, setMapCenter] = useState([ACCRA_LAT, ACCRA_LNG])
  const callbackRef = useRef(null)

  useEffect(() => {
    callbackRef.current = onSelect || onLocationSelect
  }, [onSelect, onLocationSelect])

  const reverseGeocode = useCallback(async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { 'Accept': 'application/json' } }
      )
      if (!response.ok) return null
      const data = await response.json()
      return data?.display_name || null
    } catch (error) {
      console.warn('Reverse geocoding failed:', error)
      return null
    }
  }, [])

  const placeMarkerValue = useCallback((latitude, longitude) => {
    const nextLat = Number(latitude.toFixed(6))
    const nextLng = Number(longitude.toFixed(6))

    setLat(String(nextLat))
    setLng(String(nextLng))
    setMapCenter([nextLat, nextLng])

    void reverseGeocode(nextLat, nextLng).then((geocodedAddress) => {
      const label = geocodedAddress || `${nextLat.toFixed(4)}, ${nextLng.toFixed(4)}`
      setAddress(label)

      if (callbackRef.current) {
        callbackRef.current({
          lat: nextLat,
          lng: nextLng,
          latitude: nextLat,
          longitude: nextLng,
          address: label,
        })
      }
    })
  }, [reverseGeocode])

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      placeMarkerValue(ACCRA_LAT, ACCRA_LNG)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => placeMarkerValue(position.coords.latitude, position.coords.longitude),
      (error) => {
        console.warn('Geolocation error:', error)
        placeMarkerValue(ACCRA_LAT, ACCRA_LNG)
      }
    )
  }, [placeMarkerValue])

  // Initialize location on mount - this is acceptable for location detection initialization
  useEffect(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    if (typeof window !== 'undefined') {
      detectLocation()
    }
  }, [])

  function confirmManualLocation() {
    const nextLat = Number(lat)
    const nextLng = Number(lng)
    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) return
    placeMarkerValue(nextLat, nextLng)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
        <MapContainer
          center={mapCenter}
          zoom={14}
          style={{ height: '300px', width: '100%' }}
          className="rounded-[1.25rem] border border-slate-200"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {(lat && lng) && (
            <Marker position={[Number(lat), Number(lng)]} />
          )}
          <MapClickHandler onClick={placeMarkerValue} />
          <MapController center={mapCenter} zoom={14} />
        </MapContainer>
      </div>

      <Button variant="outline" fullWidth onClick={detectLocation} className="h-11 rounded-xl text-xs font-bold uppercase tracking-wider">
        📍 Detect My Location
      </Button>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Position Parameter Descriptors</p>
        
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          label="Confirmed Incident Address"
          placeholder="Verifying location landmarks..."
          className="bg-slate-50/50"
        />

        <div className="grid gap-3 grid-cols-2">
          <Input value={lat} onChange={(e) => setLat(e.target.value)} label="Latitude Coordinates" placeholder="5.6037" type="number" step="0.0001" />
          <Input value={lng} onChange={(e) => setLng(e.target.value)} label="Longitude Coordinates" placeholder="-0.1870" type="number" step="0.0001" />
        </div>

        <Button
          fullWidth
          onClick={confirmManualLocation}
          disabled={!lat || !lng}
          className="bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider h-11"
        >
          Confirm Destination Target
        </Button>
      </div>
    </div>
  )
}