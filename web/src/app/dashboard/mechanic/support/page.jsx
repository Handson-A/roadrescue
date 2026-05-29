'use client'

import Link from 'next/link'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'

export default function MechanicSupportPage() {
  return (
    <PageWrapper title="Support" description="Quick access to dispatch help, account settings, and your active rescue workstream.">
      <div className="space-y-4">
        <Card className="rounded-[1.75rem] bg-[#111827] p-5 text-[#F3F4F6]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FFD700]">Help desk</p>
          <h1 className="mt-1 text-2xl font-black">Need support while on a job?</h1>
          <p className="mt-2 text-sm text-[#F3F4F6]/80">Use the links below to jump to the most relevant part of the responder workflow.</p>
        </Card>

        <div className="grid gap-3">
          <Link href="/dashboard/mechanic/history" className="rounded-3xl border border-[#7C7767]/25 bg-[#F3F4F6] p-4 shadow-sm">
            <p className="text-sm font-semibold text-[#111827]">View activity</p>
            <p className="text-xs text-[#7C7767]">Review completed and active jobs.</p>
          </Link>
          <Link href="/dashboard/mechanic/account" className="rounded-3xl border border-[#7C7767]/25 bg-[#F3F4F6] p-4 shadow-sm">
            <p className="text-sm font-semibold text-[#111827]">Update profile</p>
            <p className="text-xs text-[#7C7767]">Manage credentials, availability, and service info.</p>
          </Link>
          <Link href="/dashboard/mechanic" className="rounded-3xl border border-[#7C7767]/25 bg-[#F3F4F6] p-4 shadow-sm">
            <p className="text-sm font-semibold text-[#111827]">Return to dashboard</p>
            <p className="text-xs text-[#7C7767]">Go back to active dispatch cards.</p>
          </Link>
        </div>
      </div>
    </PageWrapper>
  )
}