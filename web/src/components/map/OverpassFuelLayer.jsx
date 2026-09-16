'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useMap } from 'react-leaflet'

export default function OverpassFuelLayer({ isActive, onSelectPickup }) {
  const map = useMap()
  const layerGroupRef = useRef(null)
  const debounceTimerRef = useRef(null)

  const fetchFuelStations = useCallback(async () => {
    if (!map || !isActive) return

    const bounds = map.getBounds()
    const south = bounds.getSouth()
    const west = bounds.getWest()
    const north = bounds.getNorth()
    const east = bounds.getEast()

    // Overpass QL query: Fetch fuel amenities within bounding box (nodes and ways)
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="fuel"](${south},${west},${north},${east});
        way["amenity"="fuel"](${south},${west},${north},${east});
      );
      out center;
    `
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`

    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Overpass API error: ${response.statusText}`)
      const data = await response.json()

      // If active state changed during the fetch request, exit early
      if (!isActive) return

      const L = require('leaflet')

      // Clear previous markers
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers()
      }

      const fuelIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })

      if (data.elements) {
        data.elements.forEach((element) => {
          // Extract latitude and longitude. For ways, Overpass with "out center" returns center.lat/lon
          const lat = element.lat || (element.center && element.center.lat)
          const lng = element.lon || (element.center && element.center.lon)

          if (!lat || !lng) return

          const name = element.tags?.name || 'Fuel Station'
          const brand = element.tags?.brand || ''
          const operator = element.tags?.operator || ''
          const openingHours = element.tags?.['opening_hours'] || ''

          // Build custom DOM element for popup with native events
          const popupDiv = document.createElement('div')
          popupDiv.className = 'p-1 min-w-[170px] font-sans'

          const title = document.createElement('h4')
          title.className = 'font-bold text-sm text-slate-800 m-0'
          title.innerText = name
          popupDiv.appendChild(title)

          if (brand) {
            const pBrand = document.createElement('p')
            pBrand.className = 'text-[11px] text-slate-500 mt-1 mb-0'
            pBrand.innerText = `Brand: ${brand}`
            popupDiv.appendChild(pBrand)
          }

          if (operator && operator !== brand) {
            const pOperator = document.createElement('p')
            pOperator.className = 'text-[10px] text-slate-400 mt-0.5 mb-0'
            pOperator.innerText = `Operator: ${operator}`
            popupDiv.appendChild(pOperator)
          }

          if (openingHours) {
            const pTime = document.createElement('p')
            pTime.className = 'text-[10px] text-emerald-600 font-semibold mt-1 mb-0'
            pTime.innerText = `Hours: ${openingHours}`
            popupDiv.appendChild(pTime)
          }

          const badge = document.createElement('span')
          badge.className = 'inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 mt-2 mb-2'
          badge.innerText = 'Fuel Station'
          popupDiv.appendChild(badge)

          if (onSelectPickup) {
            const button = document.createElement('button')
            button.type = 'button'
            button.className = 'w-full text-center py-1.5 rounded-lg bg-[#1F1B10] text-primary font-bold text-[10px] uppercase hover:bg-slate-800 transition-colors cursor-pointer'
            button.innerText = 'Select as Pickup'
            button.addEventListener('click', () => {
              onSelectPickup(lat, lng)
            })
            popupDiv.appendChild(button)
          }

          const marker = L.marker([lat, lng], { icon: fuelIcon }).bindPopup(popupDiv)

          if (layerGroupRef.current) {
            layerGroupRef.current.addLayer(marker)
          }
        })
      }
    } catch (error) {
      console.error('Error fetching live fuel stations:', error)
    }
  }, [map, isActive, onSelectPickup])

  // Initialize L.layerGroup and mount to map
  useEffect(() => {
    if (!map) return

    const L = require('leaflet')
    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map)
    }

    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers()
        layerGroupRef.current.remove()
        layerGroupRef.current = null
      }
    }
  }, [map])

  // Set up moveend listener with debounce timer when active
  useEffect(() => {
    if (!map) return

    if (!isActive) {
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers()
      }
      return
    }

    // Load initial bounding box stations
    fetchFuelStations()

    const handleMoveEnd = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        fetchFuelStations()
      }, 500)
    }

    map.on('moveend', handleMoveEnd)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      map.off('moveend', handleMoveEnd)
    }
  }, [map, isActive, fetchFuelStations])

  return null
}
