import Link from 'next/link'
import { ArrowRight, ShieldCheck, Sparkles, Truck, Wrench } from 'lucide-react'

const roleCards = [
  {
    href: '/auth/register?role=driver',
    title: 'For Drivers',
    description: 'Request roadside assistance instantly.',
    icon: Truck,
    accent: 'bg-[#F5D108] text-[#1F1B10]',
  },
  {
    href: '/auth/register?role=mechanic',
    title: 'For Mechanics',
    description: 'Manage recovery jobs and help drivers.',
    icon: Wrench,
    accent: 'bg-[#D9DDF3] text-[#4C5A7A]',
  },
]

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#FFF8EA] text-[#1F1B10] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#1F1B10] lg:flex lg:min-h-screen lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,209,8,0.18),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.14),transparent_22%),linear-gradient(180deg,#1F1B10_0%,#2A2317_40%,#1B160F_100%)]" />
        <div className="absolute inset-x-0 top-0 h-[62%] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.14),rgba(255,255,255,0))] opacity-70" />

        <div className="relative z-10 p-10 text-white">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold backdrop-blur">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F5D108] text-[#1F1B10]">
                <Sparkles size={16} />
              </span>
              RoadRescue
            </div>
            <h1 className="text-5xl font-black leading-[0.95] tracking-tight xl:text-6xl">
              The reliable way to get back on the road
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-white/80">
              Connecting stranded drivers with professional mechanics and recovery specialists in minutes.
            </p>
          </div>
        </div>

        <div className="relative z-10 px-10 pb-10">
          <div className="relative h-112 overflow-hidden rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,197,34,0.18),rgba(31,27,16,0.16)),linear-gradient(135deg,#5a3a12_0%,#1e1a12_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,214,90,0.4),transparent_22%),radial-gradient(circle_at_50%_45%,rgba(255,175,33,0.18),transparent_28%)]" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_top,rgba(255,248,234,0.18),transparent)]" />

            <div className="absolute inset-x-8 top-8 flex items-center justify-between text-white/80">
              <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]">Welcome</span>
              <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]">24/7 Dispatch</span>
            </div>

            <div className="absolute inset-x-10 bottom-10">
              <div className="rounded-4xl border border-white/10 bg-black/25 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5D108] text-[#1F1B10] shadow-[0_12px_30px_rgba(245,209,8,0.28)]">
                    <Truck size={30} />
                  </span>
                  <div>
                    <p className="text-2xl font-black tracking-tight">RoadRescue</p>
                    <p className="mt-1 max-w-md text-sm leading-6 text-white/80">
                      Fast support for stranded drivers, verified mechanics, and rescue coordination.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center px-4 py-5 sm:px-6 lg:px-10">
        <div className="mx-auto w-full max-w-xl">
          <div className="overflow-hidden rounded-4xl border border-[#DCCDA9] bg-[#FFF9EF] shadow-[0_30px_80px_rgba(31,27,16,0.08)] lg:border-0 lg:bg-transparent lg:shadow-none">
            <div className="flex items-center justify-between border-b border-[#E0D5B7] px-4 py-4 sm:px-5 lg:hidden">
              <span className="text-2xl font-black tracking-tight text-[#8A6B08]">RoadRescue</span>
              <span className="rounded-full border border-[#DCCDA9] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6A5A10]">Ghana</span>
            </div>

            <div className="space-y-6 px-4 py-5 sm:px-5 sm:py-6 lg:max-w-4xl lg:px-0 lg:py-0 lg:pl-10 lg:pr-0">
              <div className="lg:hidden">
                <div className="relative h-76 overflow-hidden rounded-3xl border border-[#D8CBA8] bg-[#1F1B10] shadow-[0_20px_40px_rgba(31,27,16,0.2)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,209,8,0.22),transparent_30%),linear-gradient(180deg,rgba(255,214,90,0.2),rgba(31,27,16,0.04)_40%,rgba(31,27,16,0.88))]" />
                  <div className="absolute inset-x-4 top-4 flex items-center justify-between text-white">
                    <span className="text-2xl font-black tracking-tight drop-shadow">RoadRescue</span>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur" />
                  </div>
                  <div className="absolute inset-x-4 bottom-4 rounded-3xl border border-white/10 bg-black/25 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-3 text-white">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5D108] text-[#1F1B10]">
                        <Truck size={28} />
                      </span>
                      <div>
                        <p className="text-xl font-black">RoadRescue</p>
                        <p className="text-sm text-white/80">Fast help for stranded drivers.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-xl">
                <h1 className="text-3xl font-black leading-tight tracking-tight text-[#1F1B10] sm:text-4xl">
                  The reliable way to get back on the road
                </h1>
                <p className="mt-4 max-w-lg text-base leading-7 text-[#5E5440] sm:text-lg">
                  Rapid assistance for every mechanical failure or accident.
                </p>
              </div>

              <div className="space-y-3">
                {roleCards.map((card) => {
                  const Icon = card.icon

                  return (
                    <Link
                      key={card.title}
                      href={card.href}
                      className="group flex items-center gap-4 rounded-2xl border border-[#D8CBA8] bg-white px-4 py-3.5 shadow-[0_8px_20px_rgba(31,27,16,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(31,27,16,0.08)]"
                    >
                      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.accent}`}>
                        <Icon size={22} strokeWidth={2.2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-black text-[#1F1B10]">{card.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[#5D543F]">{card.description}</p>
                      </div>
                      <ArrowRight size={18} className="shrink-0 text-[#7C6B44] transition group-hover:translate-x-0.5" />
                    </Link>
                  )
                })}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/auth/login"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#F5D108] px-5 text-sm font-black text-[#1F1B10] shadow-[0_14px_26px_rgba(245,209,8,0.28)] transition hover:bg-[#e5c300]"
                >
                  Get Started
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#C8B98E] bg-transparent px-5 text-sm font-semibold text-[#1F1B10] transition hover:bg-white"
                >
                  Sign In To Your Account
                </Link>
              </div>

              <div className="border-t border-[#E0D5B7] pt-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-[#5E5440] shadow-[0_8px_18px_rgba(31,27,16,0.04)]">
                    <ShieldCheck size={16} className="text-[#8A6B08]" />
                    Verified Rescue Partners
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-[#5E5440] shadow-[0_8px_18px_rgba(31,27,16,0.04)]">
                    <span className="text-[#8A6B08]">24/7</span>
                    Priority Support
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}