// /**
//  * Shared Utility Functions
//  */

// /**
//  * Format distance in kilometers to user-friendly string
//  */
// export function formatDistance(km) {
//   if (km < 1) {
//     return `${Math.round(km * 1000)}m`;
//   }
//   return `${km.toFixed(1)}km`;
// }

// /**
//  * Calculate great-circle distance between two points
//  */
// export function calculateDistance(lat1, lon1, lat2, lon2) {
//   const R = 6371; // Earth radius in kilometers
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLon = ((lon2 - lon1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// /**
//  * Format timestamp to readable date time
//  */
// export function formatDateTime(date) {
//   return new Date(date).toLocaleString('en-US', {
//     year: 'numeric',
//     month: 'short',
//     day: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit',
//   });
// }

// /**
//  * Validate email format
//  */
// export function isValidEmail(email) {
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return emailRegex.test(email);
// }

// /**
//  * Validate phone format (basic)
//  */
// export function isValidPhone(phone) {
//   const phoneRegex = /^[\d\s\-+()]+$/;
//   return phoneRegex.test(phone) && phone.length >= 10;
// }

// /**
//  * Generate random ID
//  */
// export function generateId() {
//   return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
// }

// /**
//  * Truncate string to max length with ellipsis
//  */
// export function truncateText(text, maxLength = 100) {
//   if (text.length <= maxLength) return text;
//   return text.substr(0, maxLength) + '...';
// }

// /**
//  * Sleep function for delays
//  */
// export function sleep(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// /**
//  * Retry logic for API calls
//  */
// export async function retryAsync(fn, maxRetries = 3, delay = 1000) {
//   let lastError;
//   for (let i = 0; i < maxRetries; i++) {
//     try {
//       return await fn();
//     } catch (error) {
//       lastError = error;
//       if (i < maxRetries - 1) {
//         await sleep(delay);
//       }
//     }
//   }
//   throw lastError;
// }

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