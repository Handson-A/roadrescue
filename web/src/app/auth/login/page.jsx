"use client"

import Link from 'next/link'

import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="items-center justify-center space-y-2">
      <div className="flex flex-col items-center justify-centerspace-y-2">
       <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-amber-800">
          Roadrescue
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