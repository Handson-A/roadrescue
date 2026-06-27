'use client'

import { useEffect, useState } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { 
  Users, Mail, Phone, Wrench, Car, 
  X, CheckCircle, Info, Calendar, Star 
} from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [inspecting, setInspecting] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadUsers() {
      if (mounted) setLoading(true)
      try {
        const response = await fetch('/api/admin/users', { cache: 'no-store' })
        const payload = await response.json()
        if (response.ok && mounted) {
          setUsers(payload.users || [])
        }
      } catch (err) {
        console.error('Failed to parse identity registry:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadUsers()
    return () => { mounted = false }
  }, [])

  const handleInspect = (user) => {
    setSelectedUser(user)
    setInspecting(true)
  }

  return (
    <PageWrapper 
      title="Identity Framework" 
      description="Track structural platform accounts, manage core user access classifications, and inspect role parameters."
    >
      <div className="mx-auto flex w-full max-w-7xl gap-6 pb-12">
        
        {/* ================= LEFT SIDE: USER REGISTRY MAIN FEED ================= */}
        <div className={`flex-1 space-y-3.5 transition-all duration-300 ${inspecting ? 'max-w-2xl hidden lg:block' : 'w-full'}`}>
          {loading ? (
            <Card className="rounded-2xl border-slate-200 bg-white py-16 flex justify-center shadow-sm">
              <Spinner />
            </Card>
          ) : users.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/40 py-16 px-4 text-center max-w-md mx-auto mt-12">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-3.5">
                <Users size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Account Registries Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">There are currently no active driver or mechanic profiles logged in the system registry database.</p>
            </div>
          ) : (
            users.map((user) => (
              <Card 
                key={user.id} 
                className={`rounded-2xl border transition-all p-5 shadow-sm ${
                  selectedUser?.id === user.id && inspecting 
                    ? 'border-[#FFD700] bg-amber-50/10 shadow-md' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1 min-w-0">
                    <p className="text-base font-black text-slate-900 tracking-tight truncate">
                      {user.full_name || 'Unnamed System Member'}
                    </p>
                    <div className="text-xs text-slate-500 font-medium space-y-0.5">
                      <p className="flex items-center gap-1.5"><Mail size={12} className="text-slate-400 shrink-0" /> {user.email}</p>
                      <p className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400 shrink-0" /> {user.phone || 'Phone not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-slate-50 pt-3 sm:border-0 sm:pt-0 shrink-0">
                    <Badge label={user.role} variant={user.role} dot />
                    <Button 
                      variant="outline" 
                      onClick={() => handleInspect(user)}
                      className="h-9 px-4 rounded-xl font-bold uppercase tracking-wider text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    >
                      Inspect
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* ================= RIGHT SIDE: EXPANDABLE SPECIFIC ROLE DEEP INSPECTION SIDEBAR ================= */}
        {inspecting && selectedUser && (
          <div className="w-full lg:w-[420px] shrink-0 animate-in fade-in slide-in-from-right-4 duration-200 sticky top-24 self-start">
            <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-md relative overflow-hidden">
              
              {/* Close Button */}
              <button 
                onClick={() => setInspecting(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 active:scale-90 transition-transform p-1 rounded-lg bg-slate-50 border border-slate-100"
              >
                <X size={16} strokeWidth={2.5} />
              </button>

              {/* Inspection Header */}
              <div className="border-b border-slate-100 pb-5 mb-5 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <Info size={14} /> Profile Inspection Matrix
                </span>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{selectedUser.full_name || 'Member Log'}</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">UID: <span className="font-mono text-[11px]">{selectedUser.id}</span></p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge label={selectedUser.role} variant={selectedUser.role} />
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200/60 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                    <CheckCircle size={10} className="text-emerald-500" /> Active Session
                  </span>
                </div>
              </div>

              {/* Role Inspection Information Fields */}
              <div className="space-y-5">
                
                {/* Core Contact Matrix */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Contact Validation</span>
                  <div className="rounded-xl border border-slate-50 bg-slate-50/40 p-3.5 space-y-2 text-xs font-medium text-slate-700">
                    <p className="flex items-center gap-2 truncate"><Mail size={13} className="text-slate-400" /> {selectedUser.email}</p>
                    <p className="flex items-center gap-2"><Phone size={13} className="text-slate-400" /> {selectedUser.phone || 'No direct phone data'}</p>
                    <p className="flex items-center gap-2"><Calendar size={13} className="text-slate-400" /> Synced Profile: Verified</p>
                  </div>
                </div>

                {/* Mechanic deep details pane */}
                {selectedUser.role === 'mechanic' && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block flex items-center gap-1">
                      <Wrench size={12} /> Technical Operator Parameters
                    </span>
                    <div className="space-y-2.5">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Affiliated Garage Workshop</span>
                        <p className="text-xs font-bold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 mt-1">
                          {selectedUser.mechanic_profile?.business_name || 'Independent Specialist Fleet'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Vetting Score</span>
                          <p className="text-sm font-black text-slate-800 mt-0.5 flex items-center gap-1">
                            <Star size={12} className="text-[#FFD700] fill-[#FFD700]" />
                            {selectedUser.mechanic_profile?.rating_avg ? Number(selectedUser.mechanic_profile.rating_avg).toFixed(1) : '5.0'}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Field Experience</span>
                          <p className="text-sm font-black text-slate-800 mt-0.5">
                            {selectedUser.mechanic_profile?.years_experience ? `${selectedUser.mechanic_profile.years_experience} Years` : '0 Years'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Active Skill Specialities</span>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {selectedUser.mechanic_profile?.specializations && selectedUser.mechanic_profile.specializations.length > 0 ? (
                            selectedUser.mechanic_profile.specializations.map(s => (
                              <Badge key={s} label={s.replace('_', ' ')} variant="default" />
                            ))
                          ) : (
                            <span className="text-xs italic text-slate-400 pl-1">No custom skills specified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Driver deep details pane */}
                {selectedUser.role === 'driver' && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block flex items-center gap-1">
                      <Car size={12} /> Registered Transit Attributes
                    </span>
                    <div className="space-y-2.5">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Primary Mapped Vehicle</span>
                        <p className="text-xs font-bold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 mt-1 capitalize">
                          {selectedUser.driver_profile?.vehicle_make 
                            ? `${selectedUser.driver_profile.vehicle_color || ''} ${selectedUser.driver_profile.vehicle_make} ${selectedUser.driver_profile.vehicle_model || ''}`
                            : 'No baseline vehicle configured'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">License Plate Reg</span>
                          <p className="text-xs font-mono font-black text-slate-800 mt-0.5 uppercase">
                            {selectedUser.driver_profile?.vehicle_plate || '—'}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Emergency Contact</span>
                          <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                            {selectedUser.driver_profile?.emergency_contact_phone || 'None linked'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </Card>
          </div>
        )}

      </div>
    </PageWrapper>
  )
}