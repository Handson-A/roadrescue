'use client'

import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'

export default function AdminReportsPage() {
  return (
    <PageWrapper title="Incident Analytics" description="Accra Metropolitan District incident trends and response metrics.">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl border-[#D7CCAD] bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6E634B]">Total incidents (24h)</p>
            <p className="mt-2 text-4xl font-black text-[#2D271C]">1,284</p>
            <p className="mt-1 text-xs font-semibold text-[#111827]">+12%</p>
          </Card>
          <Card className="rounded-xl border-[#D7CCAD] bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6E634B]">Avg response time</p>
            <p className="mt-2 text-4xl font-black text-[#2D271C]">18.4m</p>
            <p className="mt-1 text-xs font-semibold text-[#7C7767]">-4m vs last week</p>
          </Card>
          <Card className="rounded-xl border-[#D7CCAD] bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6E634B]">Active mechanics</p>
            <p className="mt-2 text-4xl font-black text-[#2D271C]">452</p>
            <p className="mt-1 text-xs font-semibold text-[#6E634B]">Live tracking</p>
          </Card>
          <Card className="rounded-xl border-[#D7CCAD] bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6E634B]">CSAT score</p>
            <p className="mt-2 text-4xl font-black text-[#2D271C]">4.8/5</p>
            <p className="mt-1 text-xs font-semibold text-[#6A5A10]">★★★★★</p>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.9fr_0.9fr]">
          <Card className="rounded-xl border-[#D7CCAD] bg-white p-0 overflow-hidden">
            <div className="border-b border-[#E1D7BD] bg-[#F8F4EA] px-4 py-3">
              <h2 className="text-2xl font-semibold text-[#2D271C]">Accra Breakdown Hotspots</h2>
            </div>
            <div className="p-4">
              <div className="h-96 rounded-lg border border-[#7C7767]/25 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.22),transparent_22%),radial-gradient(circle_at_30%_40%,rgba(17,24,39,0.16),transparent_30%),radial-gradient(circle_at_70%_55%,rgba(255,215,0,0.16),transparent_35%),linear-gradient(160deg,#111827_0%,#1f2937_32%,#111827_100%)]" />
            </div>
          </Card>

          <Card className="rounded-xl border-[#D7CCAD] bg-white p-5">
            <h3 className="text-2xl font-semibold text-[#2D271C]">Fault Categories</h3>
            <div className="mt-6 rounded-2xl border border-[#E1D7BD] bg-[#F8F4EA] p-4 text-center">
              <p className="text-5xl font-black text-[#2D271C]">62%</p>
              <p className="text-sm text-[#6E634B]">Mechanical</p>
            </div>
            <div className="mt-6 space-y-2 text-sm text-[#2D271C]">
              <div className="flex justify-between"><span>Engine Issues</span><span>42%</span></div>
              <div className="flex justify-between"><span>Tire Punctures</span><span>28%</span></div>
              <div className="flex justify-between"><span>Electrical</span><span>18%</span></div>
              <div className="flex justify-between"><span>Other</span><span>12%</span></div>
            </div>
          </Card>
        </div>

        <Card className="rounded-xl border-[#D7CCAD] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-[#2D271C]">Average Response Times</h3>
            <div className="flex gap-2 text-xs">
              <button className="rounded-lg bg-[#F5D108] px-3 py-1 font-semibold text-[#2D271C]">Last 7 days</button>
              <button className="rounded-lg border border-[#D7CCAD] px-3 py-1 font-semibold text-[#5F563F]">Last 30 days</button>
            </div>
          </div>
          <div className="h-56 rounded-lg border border-[#E1D7BD] bg-[#FAF7EF] p-4">
            <div className="mt-6 h-full w-full bg-[linear-gradient(to_bottom,transparent_24%,rgba(120,110,80,0.15)_25%,transparent_26%),linear-gradient(to_right,transparent_24%,rgba(120,110,80,0.08)_25%,transparent_26%)] bg-size-[100%_3.2rem,4rem_100%]" />
          </div>
        </Card>
      </div>
    </PageWrapper>
  )
}
