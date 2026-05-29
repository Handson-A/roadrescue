export const REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  EN_ROUTE: 'en_route',
  ARRIVED: 'arrived',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const SERVICE_TYPE = {
  REPAIR: 'repair',
  TOWING: 'towing',
  TYRE_CHANGE: 'tyre_change',
  BATTERY_JUMP: 'battery_jump',
  FUEL_DELIVERY: 'fuel_delivery',
  OTHER: 'other',
}

export const USER_ROLE = {
  DRIVER: 'driver',
  MECHANIC: 'mechanic',
  ADMIN: 'admin',
}

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
}

export const NOTIFICATION_TYPE = {
  NEW_REQUEST: 'new_request',
  MECHANIC_BID: 'mechanic_bid',
  BID_ACCEPTED: 'bid_accepted',
  BID_MISSED: 'bid_missed',
  MECHANIC_EN_ROUTE: 'mechanic_en_route',
  MECHANIC_ARRIVED: 'mechanic_arrived',
  JOB_COMPLETED: 'job_completed',
  REQUEST_CANCELLED: 'request_cancelled',
  SYSTEM_ALERT: 'system_alert',
}

export const BID_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  MISSED: 'missed',
  WITHDRAWN: 'withdrawn',
}

// how far we search for mechanics by default
export const DEFAULT_SEARCH_RADIUS_KM = 10

// how many minutes before a mechanic location is