
// web/src/lib/utils.js
// Shared helpers used across components and lib functions.

// format a distance for display
// e.g. 0.8 → "800 m", 2.4 → "2.4 km"
export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

// format a timestamp to a readable string
// e.g. "2 mins ago", "Just now"
export function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000)

  if (seconds < 30) return 'Just now'
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`

  return new Date(timestamp).toLocaleDateString()
}

// capitalize first letter of a string
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// convert snake_case status to readable label
// e.g. "en_route" → "En Route"
export function formatStatus(status) {
  return status
    .split('_')
    .map(word => capitalize(word))
    .join(' ')
}

// build a PostGIS point string from lat/lng
// always longitude first — PostGIS convention
export function toPostGISPoint(lat, lng) {
  return `POINT(${lng} ${lat})`
}

// truncate long text for previews
export function truncate(str, maxLength = 80) {
  if (!str || str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + '...'
}

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}