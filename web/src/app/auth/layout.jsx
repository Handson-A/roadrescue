'use client'
import Image from 'next/image'
import RotatingTips from '@/components/layout/RotatingTips'

const backgroundVideo = '/images/background-rotating-tips.mp4'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#FAFBFD] px-4 py-5 sm:px-6 lg:px-8 lg:py-8 flex flex-col">
      {/* Desktop layout - Two columns */}
      <div className="hidden lg:grid mx-auto grid min-h-[calc(100vh-2.5rem)] w-full max-w-7xl items-stretch gap-8 lg:grid-cols-2">
        {/* Left side - Rotating tips and branding */}
        <div className="relative overflow-hidden rounded-4xl border border-slate-200 px-8 py-12 shadow-soft">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={backgroundVideo}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
      

          {/* Animated background gradient */}
          <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-amber-200/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-orange-200/20 blur-3xl" />

          <div className="relative flex flex-col items-center justify-center min-h-full space-y-8">
            {/* Brand section */}
            <div className="text-center space-y-3">
              <Image
                src="/images/logo.png"
                alt="RoadRescue"
                width={80}
                height={80}
                className="mx-auto rounded-full"
              />
              <div>
                <p className="font-bold text-2xl uppercase  text-[#F59E0B]">Ghana Roadside Emergency Network</p>
              </div>
            </div>

            {/* Rotating tips */}
            <div className="flex-1 flex items-center justify-center w-full">
              <RotatingTips />
            </div>
          </div>
        </div>

        {/* Right side - Auth form */}
        <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-soft flex items-center justify-center">
          <div className="w-full">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile layout - Form only with tips at bottom */}
      <div className="lg:hidden flex flex-col min-h-screen">
        {/* Form - takes up most of space */}
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full rounded-4xl border border-slate-200 bg-white p-6 shadow-soft">
            {children}
          </div>
        </div>

        {/* Tips at bottom - compact */}
        <div className="relative overflow-hidden rounded-t-4xl border-t border-slate-200 px-4 py-6 shadow-soft">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={backgroundVideo}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-amber-50/65 to-orange-50/65" />
          <div className="absolute inset-0 opacity-30 noise-overlay" />

          {/* Animated background gradient */}
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-amber-200/30 blur-2xl" />
          <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-orange-200/20 blur-2xl" />

          <div className="relative">
            {/* Brand section - compact */}
            <div className="text-center space-y-1 mb-4 pb-4 border-b border-amber-200/30">
              <Image
                src="/images/logo.png"
                alt="RoadRescue"
                width={60}
                height={60}
                className="mx-auto rounded-full"
              />
              <p className="text-xs text-slate-600">Ghana Emergency Network</p>
            </div>

            {/* Rotating tips - compact */}
            <RotatingTips compact={true} />
          </div>
        </div>
      </div>
    </div>
  )
}
