'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PageWrapper from '@/components/layout/PageWrapper'
import RescueMap from '@/components/map/RescueMap'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { timeAgo } from '@/lib/utils'

export default function MechanicPage() {
  const { user } = useAuth()
  const [incomingJobs, setIncomingJobs] = useState([])
  const [activeJobs, setActiveJobs] = useState([])
  const [available, setAvailable] = useState(false)
  const [mechProfile, setMechProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    let mounted = true

    async function loadJobs() {
      const supabase = createClient()
      const { data: mechanicData } = await supabase
        .from('mechanic_profiles')
        .select('business_name, is_available, verification_status, current_status, service_radius_km, hourly_rate')
        .eq('user_id', user.id)
        .maybeSingle()

      const { data: pending } = await supabase
        .from('rescue_requests')
        .select('id, status, service_type, problem_description, incident_address, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      const { data: active } = await supabase
        .from('rescue_requests')
        .select(`
          id,
          status,
          service_type,
          problem_description,
          incident_address,
          created_at,
          driver:driver_id (id, full_name, phone)
        `)
        .eq('mechanic_id', user.id)
        .in('status', ['accepted', 'en_route', 'arrived', 'in_progress'])
        .order('created_at', { ascending: false })

      if (mounted) {
        setMechProfile(mechanicData || null)
        setAvailable(Boolean(mechanicData?.is_available))
        setIncomingJobs(pending || [])
        setActiveJobs(active || [])
        setLoading(false)
      }
    }

    loadJobs()
    const interval = setInterval(loadJobs, 10000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [user?.id])

  const toggleAvailability = async () => {
    const nextAvailability = !available
    setAvailable(nextAvailability)
    const supabase = createClient()
    await supabase.from('mechanic_profiles').update({ is_available: nextAvailability }).eq('user_id', user.id)
  }

  return (
    <PageWrapper title="Mechanic dashboard" description="Manage deployment status, active tickets, and dispatch opportunities in a single responder portal.">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="hidden lg:grid lg:grid-cols-[1.5fr_0.7fr] gap-4">
          <Card className="rounded-xl border-[#7C7767]/25 bg-[#F3F4F6] p-0 overflow-hidden">
            <div className="border-b border-[#7C7767]/25 bg-[#111827] px-4 py-3 flex items-center justify-between text-[#F3F4F6]">
              <h3 className="text-lg font-semibold text-[#F3F4F6]">Dashboard Overview</h3>
              <span className="rounded-full bg-[#FFD700] px-2 py-1 text-[10px] font-bold uppercase text-[#111827]">{available ? 'Online' : 'Offline'}</span>
            </div>
            <div className="p-4">
              <div className="h-72 rounded-lg border border-[#7C7767]/25 bg-[radial-gradient(circle_at_65%_35%,rgba(255,215,0,0.18),transparent_30%),linear-gradient(150deg,#111827_0%,#1f2937_40%,#111827_100%)]" />
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="rounded-xl border-[#7C7767]/25 bg-[#FFD700] p-5 text-[#111827]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#111827]/80">Open requests</p>
              <p className="mt-2 text-5xl font-black text-[#111827]">{incomingJobs.length}</p>
              <p className="mt-1 text-sm font-semibold text-[#111827]/80">Nearby pending requests</p>
            </Card>
            <Card className="rounded-xl border-[#7C7767]/25 bg-[#F3F4F6] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7C7767]">Active deployments</p>
              <p className="mt-2 text-4xl font-black text-[#111827]">{activeJobs.length}</p>
              <p className="text-sm text-[#7C7767]">Responders on active jobs</p>
            </Card>
          </div>
        </div>

        <div className="bento-card border-l-4 border-l-[#FFD700] bg-[#F3F4F6]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C7767]">Garage Status</p>
              <h2 className="mt-1 text-xl font-black text-[#111827]">{available ? 'Active Dispatch Grid On' : 'Offline from dispatch pool'}</h2>
              <p className="mt-1 text-sm text-[#7C7767]">
                {mechProfile?.verification_status || 'verification pending'} · radius {mechProfile?.service_radius_km ?? '—'} km
              </p>
            </div>
            <Button variant={available ? 'outline' : 'primary'} onClick={toggleAvailability}>
              {available ? 'Mark offline' : 'Go online'}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bento-card">
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C7767]">Active jobs</p>
            <p className="mt-2 text-3xl font-black text-[#111827]">{activeJobs.length}</p>
          </div>
          <div className="bento-card">
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C7767]">Incoming requests</p>
            <p className="mt-2 text-3xl font-black text-[#111827]">{incomingJobs.length}</p>
          </div>
          <div className="bento-card">
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C7767]">Hourly rate</p>
            <p className="mt-2 text-3xl font-black text-[#111827]">{mechProfile?.hourly_rate ? `$${Number(mechProfile.hourly_rate).toFixed(0)}` : '—'}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <RescueMap request={activeJobs[0]} height="370px" />

            {activeJobs.length > 0 && (
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider">Active deployment targets</h3>
                  <span className="text-xs font-mono text-[#7C7767]">Keep these moving</span>
                </div>
                <div className="space-y-3">
                  {activeJobs.map((job) => (
                    <div key={job.id} className="rounded-xl border border-[#7C7767]/25 bg-[#F3F4F6] p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge label={job.status} variant={job.status} dot />
                            <Badge label={job.service_type} variant="default" />
                          </div>
                          <p className="mt-2 text-sm font-semibold text-[#111827]">{job.problem_description}</p>
                          <p className="mt-1 text-xs text-[#7C7767]">{job.incident_address || 'Location pending'}</p>
                        </div>
                        <Link href={`/dashboard/mechanic/job/${job.id}`} className="inline-flex h-10 items-center justify-center rounded-xl bg-[#111827] px-4 text-xs font-black uppercase tracking-wider text-[#F3F4F6] hover:opacity-90">
                          Open job
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-4 lg:col-span-5">
            <Card className="p-0 overflow-hidden bg-[#F3F4F6]">
              <div className="border-b border-[#7C7767]/25 bg-[#111827] p-4 text-[#F3F4F6]">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-[#FFD700]">Urgent Dispatch Feed</h4>
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="py-12 flex justify-center"><Spinner /></div>
                ) : incomingJobs.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[#7C7767]">No open corridor breakdown alerts right now.</p>
                ) : (
                  <div className="space-y-3">
                    {incomingJobs.map((job) => (
                      <div key={job.id} className="rounded-xl border border-[#7C7767]/25 bg-[#F3F4F6] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <Badge label={job.service_type} variant="pending" dot />
                          <span className="text-[11px] text-[#7C7767]">{timeAgo(job.created_at)}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-[#111827]">{job.problem_description}</p>
                        <p className="mt-1 text-xs text-[#7C7767]">{job.incident_address || 'Location pending'}</p>
                        <Link href={`/dashboard/mechanic/job/${job.id}`} className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl border border-[#7C7767]/25 bg-[#111827] text-[11px] font-black uppercase tracking-wider text-[#F3F4F6] hover:opacity-90">
                          Review Job
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="hidden lg:block rounded-xl border-[#7C7767]/25 bg-[#F3F4F6] p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[#111827]">Available Requests</h4>
                <span className="text-xs text-[#7C7767]">{incomingJobs.length} nearby</span>
              </div>
              <div className="space-y-2">
                {incomingJobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="rounded-lg border border-[#7C7767]/25 bg-[#F3F4F6] px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#111827]">{job.service_type}</p>
                      <p className="text-sm font-semibold text-[#111827]">{job.estimated_price ? `$${Number(job.estimated_price).toFixed(2)}` : '—'}</p>
                    </div>
                    <p className="text-xs text-[#7C7767]">{job.incident_address || 'Location pending'}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
