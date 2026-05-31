import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createMockClient, isMockAuthEnabled } from './mockClient' // adjust path to your mock client file

export async function createClient() {
  // If keys are missing, map server pipelines cleanly to your mock simulator data
  if (isMockAuthEnabled()) {
    return createMockClient()
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
            // Next.js will sometimes throw errors if cookies are written to 
            // inside a read-only Server Component layout route. It's safe to drop.
          }
        },
      },
    }
  )
}

export async function createServiceClient() {
  if (isMockAuthEnabled()) {
    return createMockClient()
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY, // Master super-admin key
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
          } catch {}
        },
      },
    }
  )
}