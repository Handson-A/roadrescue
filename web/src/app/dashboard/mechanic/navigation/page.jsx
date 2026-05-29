'use client'

import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import RescueMap from '@/components/map/RescueMap'

export default function MechanicNavigationPage() {
  return (
    <PageWrapper title="Navigation" description="Turn-by-turn navigation and live tracking for assigned jobs.">
      <div className="mx-auto max-w-4xl space-y-4">
        <Card className="p-0 overflow-hidden">
          <RescueMap height="60vh" />
        </Card>

        <Card>
          <h3 className="text-sm font-black text-[#111827]">Active Route</h3>
          <p className="mt-2 text-sm text-[#7C7767]">Tap a job to start turn-by-turn navigation.</p>
        </Card>
      </div>
    </PageWrapper>
  )
}
