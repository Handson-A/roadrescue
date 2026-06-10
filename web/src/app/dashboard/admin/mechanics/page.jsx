'use client'

import { useState, useEffect } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { ShieldCheck, User, Wrench, Check, X, Mail, Phone, Briefcase } from 'lucide-react'

export default function MechanicsVerificationPage() {
  const [mechanics, setMechanics] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  async function loadMechanics() {
    try {
      const response = await fetch('/api/admin/mechanics?status=pending', { cache: 'no-store' })
      const payload = await response.json()
      
      if (response.ok) {
        // Strict Client Guard: Exclude any accounts with an administrative role 
        // to prevent admins from cluttering the Mechanics vetting queue.
        const filteredMechanics = (payload.mechanics || []).filter(
          (mech) => mech.user?.role !== 'admin' && mech.user_id !== mech.user?.id?.startsWith('admin')
        )
        setMechanics(filteredMechanics)
      }
    } catch (error) {
      toast.error('Failed to update verification queue parameters')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    // call asynchronously to avoid synchronous setState inside effect
    setTimeout(() => { if (mounted) loadMechanics() }, 0)
    return () => { mounted = false }
  }, [])

  const handleAction = async (mechanicUserId, action) => {
    setActionLoading(mechanicUserId)
    const newStatus = action === 'approve' ? 'verified' : 'rejected'
    
    try {
      const response = await fetch('/api/admin/mechanics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mechanicUserId, newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update credentials')
      
      toast.success(`Service provider successfully ${action === 'approve' ? 'verified' : 'rejected'}`)
      setMechanics((current) => current.filter((m) => m.user_id !== mechanicUserId))
    } catch (error) {
      toast.error(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <PageWrapper 
      title="Identity Clearances" 
      description="Approve verified field service professionals and authorize terminal deployment privileges."
    >
      <div className="mx-auto max-w-5xl space-y-4 pb-12">
        {loading ? (
          <Card className="rounded-2xl border-slate-200 bg-white py-16 flex justify-center shadow-sm">
            <Spinner />
          </Card>
        ) : mechanics.length === 0 ? (
          /* placeholder for empty-state setup */
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/40 py-16 px-4 text-center max-w-md mx-auto mt-12">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-3.5 border border-slate-200/60 shadow-sm">
              <ShieldCheck size={20} className="text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Clear Clearance Backlog</h3>
            <p className="mx-auto mt-1 max-w-xs text-xs text-slate-400 font-medium leading-relaxed">
              All incoming service provider registration rows are fully vetted. No pending credentials require manual admin evaluation.
            </p>
          </div>
        ) : (
          mechanics.map((mech) => (
            <Card key={mech.id} className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-all">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center">
                
                {/* COLUMN 1: ACCOUNT IDENTIFICATION */}
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <User size={12} /> Account Identity
                  </span>
                  <p className="text-base font-black text-slate-900 tracking-tight">{mech.user?.full_name || 'New Specialist'}</p>
                  <div className="text-xs text-slate-500 font-medium space-y-0.5 pt-0.5">
                    <p className="flex items-center gap-1.5"><Mail size={12} className="text-slate-400" /> {mech.user?.email}</p>
                    <p className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400" /> {mech.user?.phone || 'No phone registered'}</p>
                  </div>
                </div>

                {/* COLUMN 2: WORKPLACE MATRIX */}
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <Briefcase size={12} /> Workplace Node
                  </span>
                  <p className="text-sm font-bold text-slate-800 truncate">{mech.business_name || 'Independent Operator'}</p>
                  <p className="text-xs text-slate-400 font-semibold pt-0.5">
                    {mech.years_experience ? `${mech.years_experience} Yrs Experience` : 'Tenure documentation pending'}
                  </p>
                </div>

                {/* COLUMN 3: SPECIALIZATIONS */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block flex items-center gap-1">
                    <Wrench size={12} /> Vetted Core Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {mech.specializations && mech.specializations.length > 0 ? (
                      mech.specializations.slice(0, 3).map((spec) => (
                        <Badge key={spec} label={spec.replace('_', ' ')} variant="default" />
                      ))
                    ) : (
                      <span className="text-xs italic text-slate-400 font-medium">General Mechanics</span>
                    )}
                  </div>
                </div>

                {/* COLUMN 4: ACTION TRIGGER CONTROLLERS */}
                <div className="flex items-center gap-2 border-t border-slate-50 pt-4 lg:border-0 lg:pt-0 shrink-0">
                  <Button 
                    disabled={actionLoading !== null}
                    loading={actionLoading === mech.user_id}
                    onClick={() => handleAction(mech.user_id, 'approve')} 
                    className="flex-1 lg:w-32 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider h-10 flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Check size={14} strokeWidth={2.5} />
                    <span>Authorize</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    disabled={actionLoading !== null}
                    onClick={() => handleAction(mech.user_id, 'reject')} 
                    className="flex-1 lg:w-28 border-slate-200 hover:bg-red-50 hover:text-red-600 rounded-xl text-xs font-bold uppercase tracking-wider h-10 bg-white text-slate-600 flex items-center justify-center gap-1"
                  >
                    <X size={14} strokeWidth={2.5} />
                    <span>Deny</span>
                  </Button>
                </div>

              </div>
            </Card>
          ))
        )}
      </div>
    </PageWrapper>
  )
}