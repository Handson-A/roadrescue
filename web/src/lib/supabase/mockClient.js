const DB_KEY = 'roadrescue_mock_db'
const SESSION_KEY = 'roadrescue_mock_session'

export function isMockAuthEnabled() {
  return (
    process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function hasWindow() {
  return typeof window !== 'undefined'
}

function readJson(key, fallback) {
  if (!hasWindow()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  if (!hasWindow()) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function seedDb() {
  const now = new Date().toISOString()

  return {
    profiles: [
      { id: 'driver-1', email: 'driver@roadrescue.gh', full_name: 'Demo Driver', phone: '+233 000 000 001', role: 'driver', avatar_url: '', city: 'Accra' },
      { id: 'mechanic-1', email: 'mechanic@roadrescue.gh', full_name: 'Demo Mechanic', phone: '+233 000 000 002', role: 'mechanic', avatar_url: '', city: 'Kumasi', license_number: 'MECH-2048' },
      { id: 'admin-1', email: 'admin@roadrescue.gh', full_name: 'Demo Admin', phone: '+233 000 000 003', role: 'admin', avatar_url: '', city: 'Tema' },
    ],
    mechanic_profiles: [
      { id: 'mechanic-1', user_id: 'mechanic-1', rating_avg: 4.92, specializations: ['towing', 'battery_jump'], business_name: 'RoadRescue Pro Garage', verified: true, status: 'available', years_experience: 7, location_label: 'Kumasi, Ashanti Region', license_number: 'MECH-2048', license_expiry: '2028-12-31', is_available: true },
    ],
    rescue_requests: [
      { id: 'request-1', driver_id: 'driver-1', status: 'pending', issue: 'Flat tire on highway', location: 'Spintex Road', created_at: now, mechanic_id: null },
      { id: 'request-2', driver_id: 'driver-1', status: 'accepted', issue: 'Dead battery', location: 'Airport Junction', created_at: now, mechanic_id: 'mechanic-1' },
    ],
    notifications: [
      { id: 'notif-1', user_id: 'mechanic-1', title: 'New job available', message: 'A new pending rescue request is available near you.', type: 'new_request', is_read: false, created_at: now },
      { id: 'notif-2', user_id: 'driver-1', title: 'Mechanic en route', message: 'Your assigned mechanic is heading to your location.', type: 'mechanic_en_route', is_read: false, created_at: now },
    ],
  }
}

function loadDb() {
  return readJson(DB_KEY, seedDb())
}

function saveDb(db) {
  writeJson(DB_KEY, db)
}

function getDefaultSession() {
  const db = loadDb()
  const profile =
    db.profiles.find((row) => row.role === 'mechanic') ||
    ensureUser(db, {
      email: 'mechanic@roadrescue.gh',
      full_name: 'Demo Mechanic',
      phone: '+233 000 000 002',
      role: 'mechanic',
    })

  return { user: profile }
}

function loadSession() {
  const session = readJson(SESSION_KEY, null)
  if (session) return session

  const defaultSession = getDefaultSession()
  saveSession(defaultSession)
  return defaultSession
}

function saveSession(session) {
  writeJson(SESSION_KEY, session)
  authListeners.forEach((listener) => listener('SIGNED_IN', session))
}

function clearSession() {
  if (hasWindow()) window.localStorage.removeItem(SESSION_KEY)
  authListeners.forEach((listener) => listener('SIGNED_OUT', null))
}

function ensureUser(db, { email, full_name, phone, role }) {
  const id = `${role}-${email.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`
  const profile = {
    id,
    email,
    full_name: full_name || email.split('@')[0],
    phone: phone || '',
    role: role || 'driver',
    avatar_url: '',
    city: 'Accra',
  }

  const existingIndex = db.profiles.findIndex((row) => row.email === email)
  if (existingIndex >= 0) {
    db.profiles[existingIndex] = { ...db.profiles[existingIndex], ...profile }
  } else {
    db.profiles.push(profile)
  }

  if (profile.role === 'mechanic' && !db.mechanic_profiles.some((row) => row.id === id)) {
    db.mechanic_profiles.push({
      id,
      user_id: id,
      rating_avg: 4.92,
      specializations: ['towing', 'battery_jump'],
      business_name: 'RoadRescue Pro Garage',
      verified: true,
      status: 'available',
      years_experience: 5,
      location_label: 'Accra Metropolitan',
      license_number: '',
      license_expiry: '',
      is_available: false,
    })
  }

  saveDb(db)
  return profile
}

function getCurrentUser() {
  const session = loadSession()
  return session?.user || null
}

function filterRows(rows, filters) {
  return filters.reduce((acc, filter) => acc.filter((row) => row[filter.field] === filter.value), rows)
}

function sortRows(rows, sort) {
  if (!sort) return rows
  return [...rows].sort((a, b) => {
    const aValue = a[sort.field]
    const bValue = b[sort.field]
    if (aValue === bValue) return 0
    if (sort.ascending) return aValue > bValue ? 1 : -1
    return aValue < bValue ? 1 : -1
  })
}

function buildQuery(db, tableName) {
  const state = {
    filters: [],
    sort: null,
    payload: null,
    mode: 'select',
  }

  const resolveRows = () => {
    const rows = Array.isArray(db[tableName]) ? db[tableName] : []
    return sortRows(filterRows(rows, state.filters), state.sort)
  }

  const applySelect = async () => {
    const rows = resolveRows()
    return { data: rows, error: null }
  }

  const applySingle = async () => {
    const rows = resolveRows()
    return rows[0] ? { data: rows[0], error: null } : { data: null, error: { message: 'No rows found' } }
  }

  const applyInsert = async () => {
    const values = Array.isArray(state.payload) ? state.payload : [state.payload]
    const inserted = values.map((value) => ({ id: value.id || `${tableName}-${Date.now()}`, ...value }))
    db[tableName] = [...(db[tableName] || []), ...inserted]
    saveDb(db)
    return { data: inserted, error: null }
  }

  const applyUpdate = async () => {
    const rows = db[tableName] || []
    const updated = []
    db[tableName] = rows.map((row) => {
      const matches = filterRows([row], state.filters).length > 0
      if (!matches) return row
      const next = { ...row, ...state.payload }
      updated.push(next)
      return next
    })
    saveDb(db)
    return { data: updated, error: null }
  }

  const applyDelete = async () => {
    const rows = db[tableName] || []
    const remaining = []
    const removed = []
    rows.forEach((row) => {
      const matches = filterRows([row], state.filters).length > 0
      if (matches) removed.push(row)
      else remaining.push(row)
    })
    db[tableName] = remaining
    saveDb(db)
    return { data: removed, error: null }
  }

  return {
    select() {
      state.mode = 'select'
      return this
    },
    eq(field, value) {
      state.filters.push({ field, value })
      return this
    },
    order(field, options = {}) {
      state.sort = { field, ascending: options.ascending !== false }
      return this
    },
    async single() {
      return applySingle()
    },
    async insert(payload) {
      state.mode = 'insert'
      state.payload = payload
      return applyInsert()
    },
    async update(payload) {
      state.mode = 'update'
      state.payload = payload
      return applyUpdate()
    },
    async delete() {
      state.mode = 'delete'
      return applyDelete()
    },
  }
}

function createMockChannel() {
  return {
    on() {
      return this
    },
    subscribe() {
      return this
    },
  }
}

const authListeners = new Set()

export function createMockClient() {
  const auth = {
    async getSession() {
      const session = loadSession()
      return { data: { session }, error: null }
    },
    async getUser() {
      const session = loadSession()
      return { data: { user: session?.user || null }, error: null }
    },
    async signInWithPassword({ email, password }) {
      const db = loadDb()
      const role = (hasWindow() && window.localStorage.getItem('mock_role')) || 'driver'
      const profile = ensureUser(db, {
        email,
        full_name: email.split('@')[0],
        phone: '',
        role,
      })
      const session = { user: profile }
      saveSession(session)
      return { data: { user: profile, session }, error: null }
    },
    async signUp({ email, options }) {
      const db = loadDb()
      const meta = options?.data || {}
      const profile = ensureUser(db, {
        email,
        full_name: meta.full_name,
        phone: meta.phone,
        role: meta.role || 'driver',
      })
      const session = { user: profile }
      saveSession(session)
      return { data: { user: profile, session }, error: null }
    },
    async signOut() {
      clearSession()
      return { error: null }
    },
    onAuthStateChange(callback) {
      const listener = (_event, session) => callback(_event, session)
      authListeners.add(listener)
      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners.delete(listener)
            },
          },
        },
      }
    },
  }

  return {
    auth,
    from(tableName) {
      const db = loadDb()
      return buildQuery(db, tableName)
    },
    async rpc(name) {
      const db = loadDb()
      if (name === 'find_nearby_mechanics') {
        return {
          data: db.profiles.filter((profile) => profile.role === 'mechanic').map((profile) => ({
            ...profile,
            mechanic_profiles: db.mechanic_profiles.find((row) => row.id === profile.id) || null,
          })),
          error: null,
        }
      }
      return { data: [], error: null }
    },
    channel() {
      return createMockChannel()
    },
    removeChannel() {
      return Promise.resolve()
    },
  }
}
