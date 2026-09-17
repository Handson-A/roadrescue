'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { 
  ChartColumn, Gauge, History, Home, LifeBuoy, LogOut, Radar, Settings, 
  ShieldCheck, User, ClipboardList, WifiSync, Brain, PlusCircle, MapPin, 
  X, AlertTriangle 
} from 'lucide-react'

import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card' // Ensure this path correctly targets your custom Card component
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'
import toast from 'react-hot-toast'
import { useMechanicStatus } from '@/hooks/useMechanicStatus'

const navByRole = {
  driver: [
    { href: '/dashboard/driver', label: 'Dashboard', icon: Home },
    { href: '/dashboard/driver/explore', label: 'Explore Map', icon: MapPin },
    { href: '/dashboard/driver/ai', label: 'AI Diagnostics', icon: Brain },
    { href: '/dashboard/driver/history', label: 'Incident Archive', icon: History },
    { href: '/dashboard/driver/account', label: 'Account', icon: User },
  ],
  mechanic: [
    { href: '/dashboard/mechanic', label: 'Dashboard', icon: Home },
    { href: '/dashboard/mechanic/requests', label: 'Active Jobs', icon: Radar },
    { href: '/dashboard/mechanic/history', label: 'Job History', icon: History },
    { href: '/dashboard/mechanic/navigation', label: 'Navigation', icon: MapPin },
    { href: '/dashboard/mechanic/support', label: 'Support', icon: LifeBuoy },
    { href: '/dashboard/mechanic/account', label: 'Profile', icon: User },
  ],
  admin: [
    { href: '/dashboard/admin', label: 'Dashboard', icon: Gauge },
    { href: '/dashboard/admin/reviews', label: 'Edits Review', icon: ShieldCheck },
    { href: '/dashboard/admin/requests', label: 'Incidents', icon: Radar },
    { href: '/dashboard/admin/mechanics', label: 'Mechanics', icon: User },
    { href: '/dashboard/admin/reports', label: 'Analytics', icon: ChartColumn },
    { href: '/dashboard/admin/users', label: 'Identity Hub', icon: ShieldCheck },
    { href: '/dashboard/admin/account', label: 'Account', icon: Settings },
  ],
}

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { profile, user } = useAuth()

  const role = profile?.role || 'driver'
  const links = navByRole[role] || []
  
  const isAdmin = role === 'admin'
  const isMechanic = role === 'mechanic'
  const isDriver = role === 'driver'

  // Hook state tracking declarations
  const [showOfflineModal, setShowOfflineModal] = useState(false)
  const { isAvailable, updateStatus } = useMechanicStatus(isMechanic ? user?.id : null)

  const handleAvailabilityToggle = async () => {
    if (isAvailable) {
      setShowOfflineModal(true)
    } else {
      try {
        await updateStatus('available')
        toast.success('Duty status configured: Online')
      } catch (e) {
        toast.error('Failed to go online')
      }
    }
  }

  const executeStatusUpdate = async (nextAvailableStatus) => {
    setShowOfflineModal(false)
    try {
      await updateStatus(nextAvailableStatus ? 'available' : 'offline')
      toast.success(`Duty status configured: ${nextAvailableStatus ? 'Online' : 'Offline'}`)
    } catch (err) {
      toast.error('Failed to update duty status')
    }
  }

  async function handleSignOut() {
    await signOut()
    router.replace('/auth/login')
  }

  // Base theme definitions matching your exact color scheme matrix
  const sidebarClass = isAdmin
    ? 'bg-[#2A261C] text-[#EFE8D4] border-r border-[#3A3428]'
    : 'bg-[#F1EAD6] text-[#2A261C] border-r border-[#D8CCAE]'

  const activeClass = isAdmin
    ? 'bg-primary text-[#2A261C] shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]'
    : 'bg-primary text-[#2A261C] shadow-sm'

  const idleClass = isAdmin
    ? 'text-[#E2D9C2] hover:bg-[#383223] hover:text-[#F5EED9]'
    : 'text-[#433C2B] hover:bg-[#E8DFC6] hover:text-[#2A261C]'

  return (
    <>
      {/* Tablet-first shell: show the sidebar from md upward and keep mobile on bottom nav only */}
      <aside className={`hidden md:fixed md:left-0 md:top-0 md:z-40 md:flex md:h-screen md:w-64 md:flex-col ${sidebarClass}`}>
        
        {/* BRANDING LOGO BLOCK */}
        <div className="px-5 pb-5 pt-6 text-center border-b border-black/5 mb-4">
          <Image
            src="/images/logo.png"
            alt="RoadRescue"
            width={42}
            height={42}
            className="mx-auto rounded-full h-auto w-auto shadow-sm"
          />
          <p className={`mt-2 text-[10px] font-black uppercase tracking-[0.2em] ${isAdmin ? 'text-[#C1B596]' : 'text-[#786D53]'}`}>
            {isAdmin ? 'Ghana Operations' : isMechanic ? 'Mechanic Hub' : 'Driver Hub'}
          </p>
        </div>

        {/* CORE INTERACTIVE NAV LINKS */}
        <nav className="flex-1 space-y-1 px-3">
          {(() => {
            const activeHref = links.reduce((best, l) => {
              if (pathname === l.href || pathname.startsWith(`${l.href}/`)) {
                return !best || l.href.length > best.length ? l.href : best
              }
              return best
            }, '')

            return links.map((link) => {
              const Icon = link.icon
              const isActive = link.href === activeHref || pathname === link.href

              return (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-black uppercase tracking-wider transition ${isActive ? activeClass : idleClass}`}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span>{link.label}</span>
                </Link>
              )
            })
          })()}
        </nav>

        {/* FOOTER USER MANAGEMENT & CTA HUB */}
        <div className="px-3 pb-4 pt-3 space-y-3 border-t border-black/5 bg-black/1">
          {isAdmin ? (
            <Link
              href="/dashboard/admin/requests"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-black uppercase tracking-wider text-[#2A261C] shadow-sm"
            >
              <ClipboardList size={14} /> Incident Log
            </Link>
          ) : isDriver ? (
            <Link
              href="/dashboard/driver/request/new"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-slate-800 transition"
            >
              <PlusCircle size={14} /> Request Aid
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAvailabilityToggle}
              className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] cursor-pointer ${
                isAvailable 
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                  : 'bg-primary text-[#2A261C] hover:bg-primary/90'
              }`}
            >
              <WifiSync size={14} className={isAvailable ? 'animate-pulse' : ''} />
            
            </button>
          )}

          {/* ACCOUNT SNAPSHOT PROFILE BOX */}
          <div className={`rounded-xl border p-3 ${isAdmin ? 'border-[#4A4230] bg-[#2F2A20]' : 'border-[#D8CCAE]/60 bg-[#EAE0C7]/50'}`}>
            <div className="flex items-center gap-3">
              <Avatar name={profile?.full_name || 'User'} src={profile?.avatar_url} size="md" />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-xs font-black tracking-tight ${isAdmin ? 'text-[#F2EAD7]' : 'text-[#2A261C]'}`}>{profile?.full_name || 'RoadRescue User'}</p>
                <p className={`text-[10px] uppercase font-black tracking-widest mt-0.5 ${isAdmin ? 'text-[#B6AA8D]' : 'text-[#6E644D]'}`}>{role}</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className={`mt-3 inline-flex h-8 w-full items-center justify-center gap-2 rounded-lg border text-[11px] font-black uppercase tracking-wider transition ${isAdmin ? 'border-[#534B38] text-[#F2EAD7] hover:bg-[#3A3428]' : 'border-[#CDBD97] text-[#3D3627] hover:bg-[#E1D6BA]'}`}
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ================= CONFIRMATION OFFLINE MODAL VECTOR ================= */}
      {showOfflineModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-white rounded-2xl shadow-xl border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setShowOfflineModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>
            
            <div className="flex gap-3.5 items-start">
              <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 tracking-tight">Disconnect from Dispatch?</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Going offline removes your workshop profile from the active emergency network system. You will need to be online to track broadcast breakdown signals to your terminal.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 justify-end pt-2">
              <button 
                onClick={() => setShowOfflineModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Stay Online
              </button>
              <button 
                onClick={() => executeStatusUpdate(false)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800 transition-colors shadow-sm"
              >
                Confirm Offline
              </button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}