/**
 * Supabase Server Client
 * Used for server-side operations in API routes and server components
 */

import { createServerClient, parse, serialize } from '@supabase/ssr';

export function createClient(cookies) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return cookies().getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookies().set(name, value, options);
            });
          } catch {}
        },
      },
    }
  );
}

/**
 * GetUserProfile - Fetch user profile from profiles table
 */
export async function getUserProfile(supabase, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { data, error };
}

/**
 * CreateRescueRequest - Insert new rescue request
 */
export async function createRescueRequest(supabase, requestData) {
  const { data, error } = await supabase
    .from('rescue_requests')
    .insert([requestData])
    .select();

  return { data, error };
}

/**
 * GetMechanicsNearby - Find mechanics within distance
 */
export async function getMechanicsNearby(supabase, latitude, longitude, radiusKm = 10) {
  // In production, use PostGIS query for distance calculation
  const { data, error } = await supabase
    .from('mechanic_profiles')
    .select('*, profiles(*)')
    .eq('verified', true)
    .neq('status', 'offline');

  return { data, error };
}
