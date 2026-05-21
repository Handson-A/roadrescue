// /**
//  * Supabase Client (Browser)
//  * Used for client-side operations in the browser
//  */

// import { createBrowserClient } from '@supabase/ssr';

// export const supabase = createBrowserClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// );

// /**
//  * SignUp - Create new user account
//  */
// export async function signUp(email, password, userData) {
//   const { data, error } = await supabase.auth.signUp({
//     email,
//     password,
//     options: {
//       data: userData,
//     },
//   });

//   return { data, error };
// }

// /**
//  * SignIn - Authenticate user
//  */
// export async function signIn(email, password) {
//   const { data, error } = await supabase.auth.signInWithPassword({
//     email,
//     password,
//   });

//   return { data, error };
// }

// /**
//  * SignOut - Log out current user
//  */
// export async function signOut() {
//   const { error } = await supabase.auth.signOut();
//   return { error };
// }

// /**
//  * GetUser - Get current authenticated user
//  */
// export async function getUser() {
//   const { data } = await supabase.auth.getUser();
//   return data;
// }


// web/src/lib/supabase/client.js

import { createBrowserClient } from '@supabase/ssr'

// This runs in the browser.
// Uses the anon key — safe to expose, RLS handles protection.
// Call this inside components and hooks.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}