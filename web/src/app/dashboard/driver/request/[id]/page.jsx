'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { BusFront, Clock3, ExternalLink, MapPin, PhoneCall } from 'lucide-react'
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

const ACTIVE_DRIVER_REQUEST_STATUSES = ['accepted', 'en_route', 'arrived', 'in_progress']

function normalizeGeoPoint(point) {
  if (!point) return null

  if (typeof point.latitude === 'number' && typeof point.longitude === 'number') {
    return { lat: point.latitude, lng: point.longitude }
  }

  if (typeof point.lat === 'number' && typeof point.lng === 'number') {
    return { lat: point.lat, lng: point.lng }
  }

  if (Array.isArray(point.coordinates) && point.coordinates.length === 2) {
    return { lat: point.coordinates[1], lng: point.coordinates[0] }
  }

  if (typeof point === 'string') {
    const match = point.match(/POINT\((-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)/i)
    if (match) {
      return { lat: Number(match[2]), lng: Number(match[1]) }
    }
  }

  return null
}

function buildTransitLinks(point) {
  if (!point) return { primary: '', fallback: '' }

  const encodedLocation = encodeURIComponent(`${point.lat},${point.lng}`)
  return {
    primary: `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${point.lat}&pickup[longitude]=${point.lng}`,
    fallback: `https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}&zoom=16`,
  }
}

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
  const incidentPoint = normalizeGeoPoint(request.incident_location)
  const transitLinks = buildTransitLinks(incidentPoint)
  const isActiveDispatch = ACTIVE_DRIVER_REQUEST_STATUSES.includes(request.status)
  const workshopLabel = [
    mechanic?.mechanic_profiles?.business_name,
    mechanic?.mechanic_profiles?.location_label,
  ].filter(Boolean).join(' · ')

  return (
    <PageWrapper title="Live tracking" description="Track the dispatcher, assigned mechanic, and current lifecycle state.">
      <div className="space-y-4 lg:hidden">
        <div className="overflow-hidden rounded-4xl bg-[#F3F4F6] shadow-soft ring-1 ring-[#7C7767]/25">
          <RescueMap request={request} driverLocation={request.incident_location} mechanicLocation={mechanicLocation} height="320px" />
        </div>

        <Card className="rounded-[1.75rem] border-[#1F2937]/15 bg-[#F3F4F6] p-0">
          <button
            type="button"
            onClick={() => {
              const targetUrl = transitLinks.primary || transitLinks.fallback
              if (targetUrl) window.open(targetUrl, '_blank', 'noopener,noreferrer')
            }}
            disabled={!transitLinks.primary && !transitLinks.fallback}
            className="w-full rounded-[1.75rem] p-4 text-left transition hover:bg-[#E8EAF0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#0F172A]">Alternative Transit Operator</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#111827]">Arrange ride support while help is on-site</p>
                <p className="mt-1 text-xs text-[#475569]">Uses your pinned breakdown coordinate for ride-hailing and transit routing.</p>
              </div>
              <div className="rounded-xl bg-[#0F172A] p-2 text-[#F8FAFC]">
                <BusFront size={16} />
              </div>
            </div>
            {transitLinks.fallback && (
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                Open transit options
                <ExternalLink size={12} />
              </span>
            )}
          </button>
        </Card>

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

        {mechanic && isActiveDispatch && (
        <Card className="rounded-[1.75rem] border-[#0F172A]/20 bg-[#F3F4F6] p-0 overflow-hidden">
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-2 text-[#7C7767]">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#0F172A]">Mechanic comms live</span>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFD700] text-lg font-black text-[#111827]">{mechanic?.full_name?.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'RR'}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-black text-[#111827]">{mechanic?.full_name || 'Assigned mechanic'}</p>
                <p className="truncate text-sm text-[#334155]">{workshopLabel || 'Certified recovery specialist'}</p>
                <p className="mt-1 text-sm text-[#FFD700]">★★★★★ 4.9</p>
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href={mechanic?.phone ? `tel:${mechanic.phone}` : undefined}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[#111827] text-[#F3F4F6]"
                  aria-label="Call mechanic"
                >
                  <PhoneCall size={18} />
                </a>
              </div>
            </div>
            <a
              href={mechanic?.phone ? `tel:${mechanic.phone}` : undefined}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white"
            >
              <PhoneCall size={14} />
              Call {mechanic?.phone || 'mechanic'}
            </a>
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
        )}

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

          {mechanic && isActiveDispatch && (
            <Card className="border-[#0F172A]/20 bg-[#0F172A] text-[#F8FAFC]">
              <p className="mb-3 text-xs uppercase tracking-[0.22em] text-[#94A3B8]">Assigned mechanic</p>
              <div className="flex items-center gap-3">
                <Avatar name={mechanic.full_name} src={mechanic.avatar_url} online />
                <div>
                  <p className="text-sm font-semibold text-white">{mechanic.full_name}</p>
                  <p className="text-xs text-[#CBD5E1]">{workshopLabel || 'Certified recovery specialist'}</p>
                </div>
              </div>
              <a
                href={mechanic?.phone ? `tel:${mechanic.phone}` : undefined}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-500/15 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-emerald-100"
              >
                <PhoneCall size={14} />
                Call {mechanic?.phone || 'mechanic'}
              </a>
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

        <div className="space-y-4 lg:col-span-2">
          <RescueMap
            request={request}
            driverLocation={request.incident_location}
            mechanicLocation={mechanicLocation}
            height="560px"
          />

          <Card className="rounded-[1.75rem] border-[#0F172A]/15 bg-[#F3F4F6] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#0F172A]">Alternative Transit Operator</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#111827]">Need to leave the scene?</p>
                <p className="mt-1 text-xs text-[#475569]">Open ride-hailing and transit maps from your pinned breakdown location.</p>
              </div>
              <div className="rounded-xl bg-[#0F172A] p-2 text-[#F8FAFC]">
                <BusFront size={16} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={transitLinks.primary || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#F8FAFC]"
              >
                Open ride options
                <ExternalLink size={14} />
              </a>
              <a
                href={transitLinks.fallback || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-[#0F172A]/20 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#0F172A]"
              >
                Open transit map
                <ExternalLink size={14} />
              </a>
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  )
}
