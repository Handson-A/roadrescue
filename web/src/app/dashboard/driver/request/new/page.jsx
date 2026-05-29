'use client'

import Link from 'next/link'
import PageWrapper from '@/components/layout/PageWrapper'
import RequestForm from '@/components/request/RequestForm'

export default function NewRequestPage() {
  return (
    <PageWrapper title="Need help now?" description="Describe the issue, share your location, and we will start dispatching a rescue.">
      <div className="space-y-4">
        <div className="rounded-4xl bg-[#111827] px-4 py-5 text-[#F3F4F6] shadow-[0_20px_50px_rgba(17,24,39,0.16)]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FFD700]">Emergency request</p>
          <h1 className="mt-1 text-2xl font-black">Start a rescue request</h1>
          <p className="mt-2 text-sm text-[#F3F4F6]/80">Use the form below to submit your location, vehicle details, and symptoms.</p>
        </div>

        <Link href="/dashboard/driver" className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#7C7767]/25 bg-[#F3F4F6] px-4 text-sm font-semibold text-[#111827] shadow-sm">
          Back to dashboard
        </Link>

        <RequestForm />
      </div>
    </PageWrapper>
  )
}