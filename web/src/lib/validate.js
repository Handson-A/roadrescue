// web/src/lib/validate.js
// Simple validation helpers used in route handlers.
// No external library needed — keeps dependencies lean.

// checks a value is a non-empty string
export function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0
}

// checks a value is a valid latitude (-90 to 90)
export function isValidLat(val) {
  return typeof val === 'number' && val >= -90 && val <= 90
}

// checks a value is a valid longitude (-180 to 180)
export function isValidLng(val) {
  return typeof val === 'number' && val >= -180 && val <= 180
}

// checks a value is one of an allowed set
export function isOneOf(val, allowed) {
  return allowed.includes(val)
}

// checks a value is a positive integer
export function isPositiveInt(val) {
  return Number.isInteger(val) && val > 0
}

// validates a full rescue request body
// returns { valid: true } or { valid: false, errors: [...] }
export function validateRequestBody(body) {
  const errors = []
  const { SERVICE_TYPE } = require('@/lib/constants')

  if (!isValidLat(body.incidentLat)) {
    errors.push('incidentLat must be a valid latitude')
  }

  if (!isValidLng(body.incidentLng)) {
    errors.push('incidentLng must be a valid longitude')
  }

  if (!isOneOf(body.serviceType, Object.values(SERVICE_TYPE))) {
    errors.push(`serviceType must be one of: ${Object.values(SERVICE_TYPE).join(', ')}`)
  }

  if (body.problemDescription && body.problemDescription.length > 1000) {
    errors.push('problemDescription must be under 1000 characters')
  }

  if (body.vehicleYear && (body.vehicleYear < 1970 || body.vehicleYear > new Date().getFullYear())) {
    errors.push('vehicleYear is out of valid range')
  }

  return errors.length > 0
    ? { valid: false, errors }
    : { valid: true }
}

export function sanitizeInput(val) {
  if (val === null || val === undefined) {
    return val
  }

  if (Array.isArray(val)) {
    return val.map(item => sanitizeInput(item))
  }

  if (typeof val === 'object') {
    const cleaned = {}
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        cleaned[key] = sanitizeInput(val[key])
      }
    }
    return cleaned
  }

  if (typeof val === 'string') {
    let str = val

    // 1. Strip script tags case-insensitively
    str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

    // 2. Strip general HTML tags
    str = str.replace(/<[^>]*>/g, '')

    // 3. Strip javascript: URI protocol
    str = str.replace(/javascript:/gi, '')

    // 4. Strip inline event handlers: e.g. onload=, onclick=, onerror=
    str = str.replace(/\bon\w+\s*=\s*(['"][^'"]*['"]|[^\s>]+(?=\s|>))/gi, '')

    // 5. Escape dangerous HTML characters (preserving safe formatting)
    str = str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')

    // 6. Trim whitespace
    return str.trim()
  }

  return val
}
