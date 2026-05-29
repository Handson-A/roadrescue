'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CarFront, PhoneCall, MessageCircle, Clock3, MapPin } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'
import RescueMap from '@/components/map/RescueMap'
import RequestTimeline from '@/components/request/RequestTimeline'
import { useRequestStatus } from '@/hooks/useRequestStatus'
import { useWatchMechanicLocation } from '@/hooks/useMechanicLocation'
import { timeAgo } from '@/lib/utils'

export default function DriverRequestTrackingPage() {
  const { id } = useParams()
  const { request, loading } = useRequestStatus(id)
  const { mechanicLocation } = useWatchMechanicLocation(id)

  if (loading) {
    return (
      <PageWrapper title="Live tracking" description="Follow the assignment in realtime.">
        <div className="h-[50vh] flex items-center justify-center">
          <Spinner />
        </div>
      </PageWrapper>
    )
  }

  if (!request) {
    return (
      <PageWrapper title="Live tracking" description="Follow the assignment in realtime.">
        <Card>
          <p className="text-sm text-muted">Request not found.</p>
        </Card>
      </PageWrapper>
    )
  }

  const mechanic = request.mechanic
  const etaMinutes = request.eta_minutes || (request.status === 'en_route' ? 10 : request.status === 'arrived' ? 2 : 18)

  return (
    <PageWrapper title="Live tracking" description="Track the dispatcher, assigned mechanic, and current lifecycle state.">
      <div className="space-y-4 lg:hidden">
        <div className="overflow-hidden rounded-4xl bg-[#F3F4F6] shadow-soft ring-1 ring-[#7C7767]/25">
          <RescueMap request={request} driverLocation={request.incident_location} mechanicLocation={mechanicLocation} height="320px" />
        </div>

        <div className="rounded-[1.75rem] bg-[#111827] px-4 py-4 text-[#F3F4F6] shadow-[0_18px_50px_rgba(17,24,39,0.25)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FFD700]">Arriving in</p>
              <h2 className="mt-1 text-2xl font-black leading-none text-[#F3F4F6]">{etaMinutes} mins</h2>
            </div>
            <div className="rounded-full bg-[#FFD700]/10 p-3 text-[#FFD700]">
              <Clock3 size={24} />
            </div>
          </div>
        </div>

        <Card className="rounded-[1.75rem] border-[#7C7767]/25 bg-[#F3F4F6] p-0 overflow-hidden">
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-2 text-[#7C7767]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FFD700]" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">On the way</span>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFD700] text-lg font-black text-[#111827]">{mechanic?.full_name?.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'RR'}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-black text-[#111827]">{mechanic?.full_name || 'Assigned mechanic'}</p>
                <p className="truncate text-sm text-[#7C7767]">{mechanic?.mechanic_profiles?.business_name || 'Certified recovery specialist'}</p>
                <p className="mt-1 text-sm text-[#FFD700]">★★★★★ 4.9</p>
              </div>
              <div className="flex flex-col gap-2">
                <button className="flex h-12 w-12 items-center justify-center rounded-full bg-[#111827] text-[#F3F4F6]" aria-label="Call mechanic">
                  <PhoneCall size={18} />
                </button>
                <button className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6] text-[#7C7767]" aria-label="Message mechanic">
                  <MessageCircle size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="mx-4 mb-4 rounded-[1.25rem] bg-[#F3F4F6] p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-[#7C7767]">
              <span>Vehicle</span>
              <span>Plate</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#111827]">{request.vehicle?.model || request.service_type || 'White Ford Tow Truck'}</p>
                <p className="text-xs text-[#7C7767]">{request.incident_address || 'Location pending'}</p>
              </div>
              <div className="rounded-xl bg-[#111827] px-3 py-2 text-sm font-black tracking-[0.2em] text-[#FFD700]">{request.vehicle_plate || 'GR-2847-21'}</div>
            </div>
          </div>
        </Card>

        <Card className="rounded-[1.75rem] p-4">
          <RequestTimeline status={request.status} />
        </Card>

        <Card className="rounded-[1.75rem] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Incident</p>
          <p className="mt-2 text-sm font-medium text-foreground">{request.problem_description}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted">
            <MapPin size={14} />
            <span>{request.incident_address || 'Address pending'}</span>
          </div>
          <Link href="/dashboard/driver" className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-surfaceAlt">
            Back to dashboard
          </Link>
        </Card>
      </div>

      <div className="hidden grid-cols-1 gap-4 lg:grid lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Dispatch status</p>
              <Badge label={request.status} variant={request.status} dot />
            </div>
            <p className="mb-3 mt-3 text-xs text-muted">Opened {timeAgo(request.created_at)}</p>
            <RequestTimeline status={request.status} />
          </Card>

          {mechanic && (
            <Card>
              <p className="mb-3 text-xs uppercase tracking-[0.22em] text-muted">Assigned mechanic</p>
              <div className="flex items-center gap-3">
                <Avatar name={mechanic.full_name} src={mechanic.avatar_url} online />
                <div>
                  <p className="text-sm font-semibold">{mechanic.full_name}</p>
                  <p className="text-xs text-muted">{mechanic.phone || 'Contact pending'}</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted">
                {mechanic.mechanic_profiles?.business_name || 'Verified mechanic'}
              </div>
            </Card>
          )}

          <Card>
            <p className="mb-2 text-xs uppercase tracking-[0.22em] text-muted">Incident</p>
            <p className="text-sm font-medium">{request.problem_description}</p>
            <p className="mt-2 text-xs text-muted">{request.incident_address || 'Address pending'}</p>
            <Link href="/dashboard/driver" className="mt-4 inline-flex h-12 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-surfaceAlt">
              Back to dashboard
            </Link>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <RescueMap
            request={request}
            driverLocation={request.incident_location}
            mechanicLocation={mechanicLocation}
            height="560px"
          />
        </div>
      </div>
    </PageWrapper>
  )
}
