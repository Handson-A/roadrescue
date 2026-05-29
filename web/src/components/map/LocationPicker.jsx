'use client'

import { useState, useEffect, useRef } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
// 1. Notice the new import: we import the functional utilities, NOT the Loader class
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

export default function LocationPicker({ onSelect, onLocationSelect }) {
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [address, setAddress] = useState('')
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(null)
  const mapContainer = useRef(null)
  const map = useRef(null)
  const marker = useRef(null)
  const geocoder = useRef(null)
  
  const AdvancedMarkerRef = useRef(null)
  const callback = onSelect || onLocationSelect

  // Initialize Google Map
  useEffect(() => {
    if (!mapContainer.current || mapLoaded) return

    const initMap = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!apiKey) {
          setMapError('Google Maps API key not configured')
          return
        }

        // 2. Configure the loader globally using the new functional API
        setOptions({
          apiKey,
          version: 'weekly',
        })

        // 3. Directly call importLibrary (no "new Loader()" anymore)
        const { Map } = await importLibrary('maps')
        const { AdvancedMarkerElement } = await importLibrary('marker')
        const { Geocoder } = await importLibrary('geocoding')

        AdvancedMarkerRef.current = AdvancedMarkerElement
        geocoder.current = new Geocoder()

        // Default to Accra, Ghana or user's current location
        const defaultLat = 5.6037
        const defaultLng = -0.1870

        map.current = new Map(mapContainer.current, {
          zoom: 14,
          center: { lat: defaultLat, lng: defaultLng },
          mapId: 'roadrescue-map', 
          disableDefaultUI: false,
          fullscreenControl: true,
          zoomControl: true,
          mapTypeControl: true,
        })

        // Add click listener to place marker
        map.current.addListener('click', async (event) => {
          const clickedLat = event.latLng.lat()
          const clickedLng = event.latLng.lng()
          await placeMarker(clickedLat, clickedLng)
        })

        // Get user's current location and center map
        fetchCurrentLocation()
        setMapLoaded(true)
      } catch (error) {
        console.error('Map initialization error:', error)
        setMapError('Failed to load Google Maps')
      }
    }

    initMap()
  }, [mapLoaded])

  async function reverseGeocode(latitude, longitude) {
    if (!geocoder.current) return null

    try {
      const result = await geocoder.current.geocode({
        location: { lat: latitude, lng: longitude },
      })

      if (result.results && result.results[0]) {
        return result.results[0].formatted_address
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }

    return null
  }

  async function placeMarker(latitude, longitude) {
    const nextLat = Number(latitude.toFixed(6))
    const nextLng = Number(longitude.toFixed(6))

    setLat(String(nextLat))
    setLng(String(nextLng))

    const geocodedAddress = await reverseGeocode(nextLat, nextLng)
    const label = geocodedAddress || `${nextLat.toFixed(4)}, ${nextLng.toFixed(4)}`
    setAddress(label)

    if (map.current && AdvancedMarkerRef.current) {
      if (marker.current) {
        marker.current.map = null 
      }

      const AdvancedMarkerElement = AdvancedMarkerRef.current
      marker.current = new AdvancedMarkerElement({
        map: map.current,
        position: { lat: nextLat, lng: nextLng },
        title: label,
      })

      map.current.panTo({ lat: nextLat, lng: nextLng })
    }

    emitLocation(nextLat, nextLng, label)
  }

  function emitLocation(nextLat, nextLng, nextAddress) {
    if (!callback) return
    callback({
      lat: nextLat,
      lng: nextLng,
      latitude: nextLat,
      longitude: nextLng,
      address: nextAddress || `${nextLat.toFixed(4)}, ${nextLng.toFixed(4)}`,
    })
  }

  function fetchCurrentLocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLat = Number(position.coords.latitude.toFixed(6))
        const nextLng = Number(position.coords.longitude.toFixed(6))
        await placeMarker(nextLat, nextLng)
      },
      (error) => {
        console.warn('Geolocation error:', error)
        const defaultLat = 5.6037
        const defaultLng = -0.1870
        placeMarker(defaultLat, defaultLng)
      }
    )
  }

  function confirmManualLocation() {
    const nextLat = Number(lat)
    const nextLng = Number(lng)
    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) return
    placeMarker(nextLat, nextLng)
  }

  return (
    <div className="space-y-4">
      {/* Google Map Container */}
      <div className="rounded-[1.75rem] border border-border bg-slate-100 p-4 shadow-soft">
        {mapError ? (
          <div className="flex min-h-75 items-center justify-center rounded-[1.25rem] border border-dashed border-red-300 bg-red-50 px-6 text-center text-sm text-red-600">
            <div>
              <p className="font-semibold">Map Not Available</p>
              <p className="mt-2 text-xs">{mapError}</p>
              <p className="mt-2 text-xs">Enter coordinates manually below</p>
            </div>
          </div>
        ) : (
          <div
            ref={mapContainer}
            className="h-75 w-full rounded-[1.25rem] border border-slate-200 bg-white"
            style={{ minHeight: '300px' }}
          />
        )}
      </div>

      <Button variant="outline" fullWidth onClick={fetchCurrentLocation}>
        📍 Use current location
      </Button>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-600">Manual Entry</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            label="Latitude"
            placeholder="5.6037"
            type="number"
            step="0.0001"
          />
          <Input
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            label="Longitude"
            placeholder="-0.1870"
            type="number"
            step="0.0001"
          />
        </div>

        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          label="Address label"
          placeholder="Landmark or street"
          className="mt-3"
        />

        <Button
          fullWidth
          onClick={confirmManualLocation}
          disabled={!lat || !lng}
          className="mt-3"
        >
          Confirm pickup point
        </Button>
      </div>
    </div>
  )
}