import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Regular Authenticated Client Factory
export async function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing public Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Safe to drop inside read-only layouts
          }
        },
      },
    }
  )
}

export async function createServiceClient() {
  // Enforce strict server-side validation only when called
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Bypass Blocked: Missing backend environment variables. Ensure SUPABASE_SERVICE_ROLE_KEY is active in your .env.local.')
  }

  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Safe to drop inside read-only layouts
          }
        },
      },
    }
  )
}