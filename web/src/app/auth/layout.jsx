'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import RotatingTips from '@/components/layout/RotatingTips'

const backgroundVideo = '/images/background-rotating-tips.mp4'

function AuthLayoutContent({ children }) {
  return (
    <div className="min-h-screen w-full bg-[#FFF8EA] text-[#1F1B10]">
      
      {/* ==================================================================== */}
      {/* DESKTOP LAYOUT (Widescreen split-view - 100% edge-to-edge, zero margins) */}
      {/* ==================================================================== */}
      <div className="hidden lg:grid min-h-screen w-full grid-cols-2 items-stretch">
        
        {/* Left column: Video Asset, Branding & Left-Aligned Centered Tips */}
        <div className="relative overflow-hidden bg-[#1F1B10] flex flex-col justify-center p-12 xl:p-16 w-full">
          
          {/* STEP 1: Ambient color glow layout filters go FIRST to establish the base coat */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,209,8,0.22),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.14),transparent_25%),linear-gradient(180deg,#1F1B10_0%,#2A2317_40%,#1B160F_100%)]" />
          <div className="absolute inset-x-0 top-0 h-[62%] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.1),rgba(255,255,255,0))] opacity-40" />

          {/* STEP 2: Background Video Layer goes SECOND so it plays on top of the dark base, blended down */}
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-[0.18] mix-blend-screen"
            src={backgroundVideo}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />

          {/* Top floating brand tag */}
          <div className="absolute top-12 left-12 xl:left-16 z-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold backdrop-blur text-white">
                      <Image
                        src="/images/logo.png"
                        alt="RoadRescue"
                        width={32}
                        height={32}
                        className="rounded-full shadow-md h-auto w-auto"
                      />
              Ghana Roadside Emergency Network
            </div>
          </div>

          {/* Centralized Tips Container */}
          <div className="relative z-10 w-full max-w-xl xl:max-w-2xl mx-auto flex flex-col text-left text-white">
            <RotatingTips />
          </div>

          {/* Bottom floating system clearance label */}
          <div className="absolute bottom-12 left-12 xl:left-16 z-10 text-white/40 text-xs font-mono tracking-wider">
            SECURE PORTAL LAYER // OVERWATCH ACTIVE
          </div>
        </div>

        {/* Right column: Registration / Login Child Forms */}
        <div className="bg-[#FFF8EA] px-8 py-12 sm:px-16 lg:px-24 xl:px-32 flex items-center justify-center w-full">
          <div className="w-full">
            {children}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MOBILE LAYOUT (Clean full-bleed app interface) */}
      {/* ==================================================================== */}
      <div className="lg:hidden flex flex-col min-h-screen bg-[#FFF8EA]">
        {/* Top minimal title banner */}
        <div className="flex items-center justify-between border-b border-[#E0D5B7] bg-[#FFF9EF] px-5 py-4 shadow-sm">
          <span className="text-xl font-black tracking-tight text-[#8A6B08]">RoadRescue</span>
          <span className="rounded-full border border-[#DCCDA9] bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6A5A10]">Secure</span>
        </div>

        {/* Interactive Form Frame Container */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full">
            {children}
          </div>
        </div>

        {/* Informative footer tips block with underlying layout video context filter */}
        <div className="relative overflow-hidden border-t border-[#E0D5B7] bg-[#1F1B10] px-5 py-6 text-white">
          {/* Base tint color filter to block bleed-through */}
          <div className="absolute inset-0 bg-linear-to-b from-[#1F1B10] to-[#120F0A]" />
          
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-15 mix-blend-screen"
            src={backgroundVideo}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
          
          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Safety Directive
            </div>
            <RotatingTips compact={true} />
          </div>
        </div>
      </div>

    </div>
  )
}

export default dynamic(() => Promise.resolve(AuthLayoutContent), {
  ssr: false,
  loading: () => <div className="min-h-screen w-full bg-[#FFF8EA]" />
})