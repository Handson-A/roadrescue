// /**
//  * Supabase Server Client
//  * Used for server-side operations in API routes and server components
//  */

// import { createServerClient, parse, serialize } from '@supabase/ssr';

// export function createClient(cookies) {
//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL,
//     process.env.SUPABASE_SERVICE_ROLE_KEY,
//     {
//       cookies: {
//         getAll() {
//           return cookies().getAll();
//         },
//         setAll(cookiesToSet) {
//           try {
//             cookiesToSet.forEach(({ name, value, options }) => {
//               cookies().set(name, value, options);
//             });
//           } catch {}
//         },
//       },
//     }
//   );
// }

// /**
//  * GetUserProfile - Fetch user profile from profiles table
//  */
// export async function getUserProfile(supabase, userId) {
//   const { data, error } = await supabase
//     .from('profiles')
//     .select('*')
//     .eq('id', userId)
//     .single();

//   return { data, error };
// }

// /**
//  * CreateRescueRequest - Insert new rescue request
//  */
// export async function createRescueRequest(supabase, requestData) {
//   const { data, error } = await supabase
//     .from('rescue_requests')
//     .insert([requestData])
//     .select();

//   return { data, error };
// }

// /**
//  * GetMechanicsNearby - Find mechanics within distance
//  */
// export async function getMechanicsNearby(supabase, latitude, longitude, radiusKm = 10) {
//   // In production, use PostGIS query for distance calculation
//   const { data, error } = await supabase
//     .from('mechanic_profiles')
//     .select('*, profiles(*)')
//     .eq('verified', true)
//     .neq('status', 'offline');

//   return { data, error };
// }


// web/src/lib/supabase/server.js

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// This runs only on the server — API route handlers and server components.
// Same anon key here for normal user-context server calls.
// RLS still applies because the user's JWT is passed via cookies.
export async function createClient() {
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
            // server component calling setAll — safe to ignore
          }
        },
      },
    }
  )
}

// Service role client — bypasses RLS entirely.
// ONLY use this in admin API routes where you intentionally
// need to read/write data outside of user-level restrictions.
// Never expose this to the browser. Ever.
export async function createServiceClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
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
