'use client'

import Link from 'next/link'
import RequestForm from '@/components/request/RequestForm'

export default function NewRequestPage() {
  return (
    <div className="w-full min-h-fit bg-transparent text-[#1F1B10] flex justify-center items-start pt-20 pb-24 md:pt-6 md:pb-8">
      <div className="w-full max-w-2xl flex flex-col gap-5">
        
        <div className="flex items-center gap-3 rounded-2xl border border-[#DCCDA9] bg-[#FFF9EF] p-4 shadow-sm">
          <div>
            <h1 className="text-lg font-black tracking-tight text-[#1F1B10]">New Request</h1>
            <p className="text-xs text-[#7C6B44] font-medium">Create a live roadside dispatch ticket</p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#1F1B10] px-5 py-5 text-white shadow-md relative overflow-hidden">
          <p className="text-[10px] font-mono font-black uppercase tracking-[0.22em] text-amber-400">Emergency request</p>
          <h2 className="mt-1 text-xl font-black tracking-tight">Start a rescue request</h2>
          <p className="mt-1.5 text-xs text-white/70 leading-relaxed">
            Submit your location coordinates, vehicle snapshots, and problem symptoms for immediate matching.
          </p>
        </div>

        <RequestForm />
        
      </div>
    </div>
  )
}