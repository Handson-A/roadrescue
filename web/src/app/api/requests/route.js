/**
 * Create Rescue Request Endpoint
 * Handles creation of new rescue requests from drivers
 * Stores location, vehicle info, and initiates mechanic matching
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => cookieStore.set(name, value, options),
          remove: (name, options) => cookieStore.delete(name),
        },
      }
    );

    const {
      driverId,
      latitude,
      longitude,
      vehicleDetails,
      issue,
      diagnostics,
    } = await request.json();

    if (!driverId || !latitude || !longitude || !vehicleDetails || !issue) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Create rescue request
    const { data, error } = await supabase
      .from('rescue_requests')
      .insert({
        driver_id: driverId,
        latitude,
        longitude,
        vehicle_details: vehicleDetails,
        issue,
        diagnostics,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) throw error;

    return new Response(JSON.stringify({ request: data[0] }), {
      status: 201,
    });
  } catch (error) {
    console.error('Request creation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create request' }),
      { status: 500 }
    );
  }
}
