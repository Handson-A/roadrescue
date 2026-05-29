'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { getCurrentUser, signIn } from '@/lib/auth'

export default function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      setLoading(true)
      const data = await signIn(formData)

      const currentUser = await getCurrentUser()
      toast.success('Login successful')

      const resolvedRole = currentUser?.role || data?.user?.user_metadata?.role || 'driver'
      router.push(`/dashboard/${resolvedRole}`)
    } catch (err) {
      toast.error(err?.message || 'Unable to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">
          Email
        </label>
        <Input
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">
          Password
        </label>
        <Input
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
      </div>

      <Button type="submit" className="w-full bg-slate-900 text-xs font-black uppercase tracking-wider hover:bg-slate-800" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  )
}