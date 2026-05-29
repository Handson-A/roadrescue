// 'use client';

// /**
//  * Login Page
//  * User authentication endpoint
//  * Supports email/password authentication via Supabase
//  */

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import LoginForm from '@/components/auth/LoginForm';

// export default function LoginPage() {
//   const router = useRouter();
//   const [error, setError] = useState('');
//   const [isLoading, setIsLoading] = useState(false);

//   const handleLoginSuccess = () => {
//     // Navigate to appropriate dashboard based on user role
//     router.push('/driver');
//   };

//   return (
//     <div>
//       <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>
      
//       {error && (
//         <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
//           {error}
//         </div>
//       )}

//       <LoginForm 
//         onSuccess={handleLoginSuccess}
//         onError={setError}
//         isLoading={isLoading}
//         setIsLoading={setIsLoading}
//       />

//       <p className="mt-6 text-center text-gray-600">
//         Don't have an account?{' '}
//         <a href="/register" className="text-red-600 hover:text-red-700 font-semibold">
//           Register here
//         </a>
//       </p>
//     </div>
//   );
// }


// web/src/app/(auth)/login/page.jsx

// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import Link from 'next/link'
// import { signIn, getCurrentUser } from '@/lib/auth'
// import Input from '@/components/ui/Input'
// import Button from '@/components/ui/Button'
// import Card from '@/components/ui/Card'

// export default function LoginPage() {
//   const router = useRouter()
//   const [form, setForm]     = useState({ email: '', password: '' })
//   const [error, setError]   = useState('')
//   const [loading, setLoading] = useState(false)

//   function handleChange(e) {
//     setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
//     setError('')
//   }

//   async function handleSubmit(e) {
//     e.preventDefault()
//     setLoading(true)
//     setError('')

//     try {
//       await signIn({ email: form.email, password: form.password })

//       // fetch profile to get role for redirect
//       const user = await getCurrentUser()
//       router.replace(`/${user.role}`)
//     } catch (err) {
//       setError('Invalid email or password')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <Card>
//       <h2 className="text-lg font-semibold mb-1">Sign in</h2>
//       <p className="text-sm text-text-muted mb-6">Welcome back to RoadRescue</p>

//       <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//         <Input
//           label="Email"
//           name="email"
//           type="email"
//           placeholder="you@example.com"
//           value={form.email}
//           onChange={handleChange}
//           required
//         />
//         <Input
//           label="Password"
//           name="password"
//           type="password"
//           placeholder="••••••••"
//           value={form.password}
//           onChange={handleChange}
//           required
//         />

//         {error && (
//           <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-btn px-3 py-2">
//             {error}
//           </p>
//         )}

//         <Button type="submit" fullWidth loading={loading}>
//           Sign in
//         </Button>
//       </form>

//       <p className="text-sm text-text-muted text-center mt-5">
//         No account?{' '}
//         <Link href="/register" className="text-amber hover:text-amber-light transition-colors">
//           Register here
//         </Link>
//       </p>
//     </Card>
//   )
// }

import Image from 'next/image'
import Link from 'next/link'

import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-amber-800">
          RoadRescue Secure Gate
        </span>
        <h1 className="text-3xl font-black text-slate-950">Welcome Back</h1>
        <p className="text-sm text-slate-500">Sign in to access emergency assistance and manage your roadside recovery requests.</p>
      </div>

      <LoginForm />

  

      <p className="text-center text-sm text-slate-500">
        Don’t have an account? <Link href="/auth/register" className="font-bold text-amber-600">Register</Link>
      </p>
    </div>
  )
}