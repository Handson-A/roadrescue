/**
 * App-wide Constants
 */

// Request statuses (state machine)
export const REQUEST_STATUSES = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

// User roles
export const USER_ROLES = {
  DRIVER: 'driver',
  MECHANIC: 'mechanic',
  ADMIN: 'admin',
};

// Request priority levels
export const PRIORITY_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

// Map constants
export const MAP_CONFIG = {
  DEFAULT_CENTER: [40.7128, -74.006], // New York City
  DEFAULT_ZOOM: 13,
  MECHANIC_SEARCH_RADIUS_KM: 10,
};

// API endpoints
export const API_ENDPOINTS = {
  DIAGNOSE: '/api/ai/diagnose',
  REQUESTS: '/api/requests',
  WEBHOOKS: '/api/webhooks',
};

// Toast notification durations (ms)
export const TOAST_DURATIONS = {
  SHORT: 3000,
  DEFAULT: 5000,
  LONG: 8000,
};

// Common error messages
export const ERROR_MESSAGES = {
  LOCATION_REQUIRED: 'Location access is required',
  INVALID_CREDENTIALS: 'Invalid email or password',
  NETWORK_ERROR: 'Network error occurred',
  SERVER_ERROR: 'Server error occurred',
  PERMISSION_DENIED: 'Permission denied',
};

// Success messages
export const SUCCESS_MESSAGES = {
  REQUEST_CREATED: 'Rescue request created successfully',
  REQUEST_CANCELLED: 'Request cancelled',
  BID_PLACED: 'Bid placed successfully',
  JOB_COMPLETED: 'Job marked as completed',
};
