// import { createBrowserClient } from '@supabase/ssr'

// let browserClient

// export function createClient() {
//   if (!browserClient) {
//     browserClient = createBrowserClient(
//       process.env.NEXT_PUBLIC_SUPABASE_URL,
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
//     )
//   }

//   return browserClient
// }

// export const supabase = createClient()

import { createBrowserClient } from '@supabase/ssr'
import { createMockClient, isMockAuthEnabled } from './mockClient' // adjust path to your mock client file

let browserClient

export function createClient() {
  // Graceful fallback to the mock engine if credentials aren't loaded yet
  if (isMockAuthEnabled()) {
    return createMockClient()
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }

  return browserClient
}

export const supabase = createClient()