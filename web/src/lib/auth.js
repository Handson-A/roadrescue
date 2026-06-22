// import { createClient } from '@/lib/supabase/client'

// // SIGNUP
// // We pass role, full_name, phone as metadata here.
// // Supabase stores this in auth.users.raw_user_meta_data.
// // Our handle_new_user trigger reads from there to create the profile row.
// // So the profile is created automatically — we never call profiles insert manually.
// export async function signUp({ email, password, fullName, phone, role }) {
//   const supabase = createClient()

//   const { data, error } = await supabase.auth.signUp({
//     email,
//     password,
//     options: {
//       data: {
//         // these keys must match exactly what the trigger reads
//         full_name: fullName,
//         phone,
//         role,  // 'driver' | 'mechanic' | 'admin'
//       }
//     }
//   })

//   if (error) throw error
//   return data
// }

// // LOGIN
// // Supabase handles session creation and stores JWT in cookies automatically.
// // After this, every server request carries the JWT — RLS activates.
// export async function signIn({ email, password }) {
//   const supabase = createClient()

//   const { data, error } = await supabase.auth.signInWithPassword({
//     email,
//     password,
//   })

//   if (error) throw error
//   return data
// }

// // LOGOUT
// // Clears the session cookie. JWT is invalidated.
// export async function signOut() {
//   const supabase = createClient()
//   const { error } = await supabase.auth.signOut()
//   if (error) throw error
// }

// // GET CURRENT USER + PROFILE
// // auth.getUser() returns the Supabase auth user (id, email).
// // We then fetch their profile to get role, full_name, phone.
// // This is the function useAuth hook will call.
// export async function getCurrentUser() {
//   const supabase = createClient()

//   const { data: { user }, error: authError } = await supabase.auth.getUser()
//   if (authError || !user) return null

//   const fallbackProfile = {
//     id: user.id,
//     email: user.email,
//     full_name: user.user_metadata?.full_name || null,
//     phone: user.user_metadata?.phone || null,
//     role: user.user_metadata?.role || null,
//   }

//   const { data: profile, error: profileError } = await supabase
//     .from('profiles')
//     .select('*')
//     .eq('id', user.id)
//     .maybeSingle()

//   if (profileError) return fallbackProfile

//   const extendedProfile = profile ? { ...profile } : { ...fallbackProfile }

//   const role = profile?.role || fallbackProfile.role

//   if (role === 'mechanic') {
//     const { data: mechanicProfile } = await supabase
//       .from('mechanic_profiles')
//       .select('*')
//       .eq('user_id', user.id)
//       .maybeSingle()

//     if (mechanicProfile) {
//       extendedProfile.mechanic_profile = mechanicProfile
//     }
//   }

//   if (role === 'driver') {
//     const { data: driverProfile } = await supabase
//       .from('driver_profiles')
//       .select('*')
//       .eq('user_id', user.id)
//       .maybeSingle()

//     if (driverProfile) {
//       extendedProfile.driver_profile = driverProfile
//     }
//   }

//   // merge auth user and profile into one object
//   // this is what the rest of the app uses as "the current user"
//   return {
//     id: user.id,
//     email: user.email,
//     ...extendedProfile  // full_name, phone, role, avatar_url, plus role-specific profile
//   }
// }


// export async function getSession() {
//   const supabase = createClient()
//   const {
//     data: { session },
//   } = await supabase.auth.getSession()

//   return session
// }


// export async function getUserRole() {
//   const currentUser = await getCurrentUser()
//   return currentUser?.role || null
// }
import { createClient } from '@/lib/supabase/client'

// SIGNUP
export async function signUp({ email, password, fullName, phone, role }) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        role, // 'driver' | 'mechanic'
      }
    }
  })

  if (error) throw error
  return data
}

// LOGIN
export async function signIn({ email, password }) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// LOGOUT
export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// GET CURRENT USER + PROFILE
export async function getCurrentUser() {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const fallbackProfile = {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || '',
    phone: user.user_metadata?.phone || '',
    role: user.user_metadata?.role || 'driver',
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) return fallbackProfile

  const extendedProfile = profile ? { ...profile } : { ...fallbackProfile }
  const role = profile?.role || fallbackProfile.role

  if (role === 'mechanic') {
    const { data: mechanicProfile } = await supabase
      .from('mechanic_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (mechanicProfile) {
      extendedProfile.mechanic_profile = mechanicProfile
    }
  }

  if (role === 'driver') {
    const { data: driverProfile } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (driverProfile) {
      extendedProfile.driver_profile = driverProfile
    }
  }

  return {
    id: user.id,
    email: user.email,
    ...extendedProfile
  }
}

export async function getSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUserRole() {
  const currentUser = await getCurrentUser()
  return currentUser?.role || null
}