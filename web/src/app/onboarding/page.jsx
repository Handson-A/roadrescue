import Link from 'next/link'
import { ArrowRight, ShieldCheck, BadgeInfo, CarFront, Wrench } from 'lucide-react'

const roleCards = [
  {
    href: '/auth/register?role=driver',
    title: 'Need Assistance?',
    description: 'Request urgent mechanical help and track a responder to your location.',
    icon: CarFront,
    accent: 'bg-[#F5D108] text-[#1F1B10]',
  },
  {
    href: '/auth/register?role=mechanic',
    title: 'Provide Assistance?',
    description: 'Find stranded motorists, provide aid, and earn on your schedule.',
    icon: Wrench,
    accent: 'bg-[#D9DDF3] text-[#4C5A7A]',
  },
]

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#FFF8EA] text-[#1F1B10] lg:grid lg:grid-cols-2">
      
      {/* ================= LEFT HALF: HERO BRANDING ================= */}
{/* Left Column: Branding Hero */}
<section className="relative hidden overflow-hidden bg-[#1F1B10] lg:flex lg:min-h-screen lg:flex-col lg:justify-center p-12 xl:p-16 w-full">
  {/* Background Gradients */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,209,8,0.18),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.14),transparent_22%),linear-gradient(180deg,#1F1B10_0%,#2A2317_40%,#1B160F_100%)]" />
  <div className="absolute inset-x-0 top-0 h-[62%] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.14),rgba(255,255,255,0))] opacity-70" />

  {/* Content Container: The vertical space utility gap-10 pushes the widget down naturally */}
  <div className="relative z-10 w-full max-w-xl xl:max-w-2xl mx-auto text-white flex flex-col gap-10">
    
    {/* Header Text Group */}
    <div>
      <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold backdrop-blur">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F5D108] text-[#1F1B10]">
          <BadgeInfo size={16} />
        </span>
        Roadside Emergency Network
      </div>
      <h1 className="text-5xl font-black leading-[0.95] tracking-tight xl:text-6xl">
        The reliable way to get back on the road
      </h1>
      <p className="mt-5 text-lg leading-8 text-white/80">
        Connecting stranded drivers with certified mechanics and recovery specialists across Ghana instantly
      </p>
    </div>

    {/* Centered Widget Box */}
    <div className="w-full">
      <div className="relative h-96 overflow-hidden rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,197,34,0.18),rgba(31,27,16,0.16)),linear-gradient(135deg,#5a3a12_0%,#1e1a12_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,214,90,0.4),transparent_22%),radial-gradient(circle_at_50%_45%,rgba(255,175,33,0.18),transparent_28%)]" />
        
        <div className="absolute inset-x-8 top-8 flex justify-center text-white/80">
          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]">
            24/7 - On-Demand Dispatch
          </span>
        </div>

        <div className="absolute inset-x-6 bottom-6 xl:inset-x-8 xl:bottom-8">
          <div className="rounded-3xl border border-white/10 bg-black/25 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-4 text-white">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F5D108] text-[#1F1B10] shadow-[0_12px_30px_rgba(245,209,8,0.28)]">
                <CarFront size={26} />
              </span>
              <div>
                <p className="text-xl font-black tracking-tight">Emergency Dispatch</p>
                <p className="mt-1 text-sm leading-relaxed text-white/80">
                  Real-time assistance tracking for vehicle breakdowns, punctures, and towing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</section>

      {/* ================= RIGHT HALF: ONBOARDING INTERACTION ================= */}
  
      <section className="flex min-h-screen items-center justify-center bg-[#FFF8EA] px-6 py-10 sm:px-12 md:px-16 lg:h-full lg:px-12 xl:px-24">
        
        {/* The content wrapper scales wide but targets maximum readable limits for widescreen monitors */}
        <div className="w-full max-w-xl lg:max-w-2xl space-y-8 sm:space-y-10">
          
          {/* Mobile Only Header View */}
          <div className="flex items-center justify-between border-b border-[#E0D5B7] pb-4 lg:hidden">
            <span className="text-2xl font-black tracking-tight text-[#8A6B08]">RoadRescue</span>
            <span className="rounded-full border border-[#DCCDA9] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6A5A10]">Ghana</span>
          </div>

          {/* Mobile Only Graphic Widget */}
          <div className="lg:hidden">
            {/* center this */}
            <div className="relative h-72 overflow-hidden rounded-3xl  border border-[#D8CBA8] bg-[#1F1B10] shadow-[0_20px_40px_rgba(31,27,16,0.2)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,209,8,0.22),transparent_30%),linear-gradient(180deg,rgba(255,214,90,0.2),rgba(31,27,16,0.04)_40%,rgba(31,27,16,0.88))]" />
              <div className="absolute inset-x-4 top-4 flex justify-center text-white">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]">
                  24/7 - Roadside Rescue
                </span>
              </div>
              <div className="absolute inset-x-4 bottom-4 rounded-3xl border border-white/10 bg-black/25 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3 text-white">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F5D108] text-[#1F1B10]">
                    <CarFront size={28} />
                  </span>
                  <div>
                    <p className="text-xl font-black">Emergency Dispatch</p>
                    <p className="text-sm text-white/80">Connecting you to the nearest roadside help</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Core App Headers */}
          <div className="space-y-3">
            <h1 className="text-3xl font-black leading-tight tracking-tight text-[#1F1B10] sm:text-4xl xl:text-5xl">
              Get Started with RoadRescue
            </h1>
            <p className="text-base leading-relaxed text-[#5E5440] sm:text-lg">
              Select how you would like to use the platform to continue.
            </p>
          </div>

          {/* Option Action Blocks */}
          <div className="space-y-4">
            {roleCards.map((card) => {
              const Icon = card.icon

              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group flex items-center gap-5 rounded-2xl border border-[#D8CBA8] bg-white px-5 py-4 shadow-[0_8px_20px_rgba(31,27,16,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(31,27,16,0.08)]"
                >
                  <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${card.accent}`}>
                    <Icon size={24} strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-black text-[#1F1B10]">{card.title}</p>
                    <p className="mt-1 text-sm sm:text-base leading-relaxed text-[#5D543F]">{card.description}</p>
                  </div>
                  <ArrowRight size={20} className="shrink-0 text-[#7C6B44] transition group-hover:translate-x-1" />
                </Link>
              )
            })}
          </div>

          {/* CTAs Button Alignment */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/auth/login"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#F5D108] px-6 text-base font-black text-[#1F1B10] shadow-[0_14px_26px_rgba(245,209,8,0.28)] transition hover:bg-[#e5c300]"
            >
              Get Started
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#C8B98E] bg-white lg:bg-transparent px-6 text-base font-bold text-[#1F1B10] transition hover:bg-white"
            >
              Sign In
            </Link>
          </div>

          {/* Trust Validation Section */}
          <div className="border-t border-[#E0D5B7] pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm sm:text-base text-[#5E5440] shadow-[0_8px_18px_rgba(31,27,16,0.04)]">
                <ShieldCheck size={18} className="text-[#8A6B08]" />
                Verified Rescue Partners
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm sm:text-base text-[#5E5440] shadow-[0_8px_18px_rgba(31,27,16,0.04)]">
                <span className="font-black text-[#8A6B08]">24/7</span>
                Priority Support
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}