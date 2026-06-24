'use client'

import Link from 'next/link'
import { ArrowRight, Play, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const invoices = [
  {
    client: 'Acme Corp',
    amount: '$4,800',
    due: 'Due in 3 days',
    risk: 'High risk',
    riskColor: 'text-rose-600',
    riskBg: 'bg-rose-50',
    dotColor: 'bg-rose-500',
    icon: TrendingDown,
    iconColor: 'text-rose-500',
  },
  {
    client: 'Bright Studio',
    amount: '$1,250',
    due: 'Due in 7 days',
    risk: 'Low risk',
    riskColor: 'text-emerald-600',
    riskBg: 'bg-emerald-50',
    dotColor: 'bg-emerald-500',
    icon: TrendingUp,
    iconColor: 'text-emerald-500',
  },
  {
    client: 'Nova SaaS',
    amount: '$3,100',
    due: 'Due in 5 days',
    risk: 'Medium risk',
    riskColor: 'text-amber-600',
    riskBg: 'bg-amber-50',
    dotColor: 'bg-amber-500',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
  },
]

export function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Small tick so SSR-rendered HTML matches, then animate in
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideLeft {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .anim-fade-up {
          opacity: 0;
          animation: fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .anim-fade-left {
          opacity: 0;
          animation: fadeSlideLeft 0.6s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .btn-scale {
          transition: transform 200ms ease, background-color 200ms ease, opacity 200ms ease;
        }
        .btn-scale:hover { transform: scale(1.02); }
      `}</style>

      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
        {/* Soft background tint */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#e0e7ff_0%,transparent_70%)]"
        />

        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-10">
            {/* Text column */}
            <div className="flex-1 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
              {/* Badge */}
              <div
                className={`inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-primary mb-6 ${mounted ? 'anim-fade-up' : 'opacity-0'}`}
                style={{ animationDelay: '0ms' }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                AI-powered invoice intelligence — now in beta
              </div>

              {/* Headline — line 1 */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-foreground leading-[1.1] text-balance">
                <span
                  className={`block ${mounted ? 'anim-fade-up' : 'opacity-0'}`}
                  style={{ animationDelay: '80ms' }}
                >
                  Know who&apos;ll pay late —
                </span>
                <span
                  className={`block text-primary ${mounted ? 'anim-fade-up' : 'opacity-0'}`}
                  style={{ animationDelay: '180ms' }}
                >
                  before they do.
                </span>
              </h1>

              <p
                className={`mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 text-pretty ${mounted ? 'anim-fade-up' : 'opacity-0'}`}
                style={{ animationDelay: '280ms' }}
              >
                Clariva uses AI to predict payment risk on every invoice the moment it&apos;s
                created — so you can chase the right clients, not all of them, and keep your
                cash flow healthy.
              </p>

              <div
                className={`mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 ${mounted ? 'anim-fade-up' : 'opacity-0'}`}
                style={{ animationDelay: '360ms' }}
              >
                <Link
                  href="#"
                  className="btn-scale w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-medium px-6 py-3 text-sm hover:bg-indigo-700"
                >
                  Start for free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#"
                  className="btn-scale w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card text-foreground font-medium px-6 py-3 text-sm hover:bg-muted transition-colors"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary">
                    <Play className="w-3 h-3 fill-current" />
                  </span>
                  Watch demo
                </Link>
              </div>

              {/* Social proof */}
              <p
                className={`mt-8 text-xs text-muted-foreground ${mounted ? 'anim-fade-up' : 'opacity-0'}`}
                style={{ animationDelay: '440ms' }}
              >
                Trusted by{' '}
                <span className="font-semibold text-foreground">2,400+</span>{' '}
                freelancers &amp; small businesses.{' '}
                <span className="text-emerald-600 font-medium">No credit card required.</span>
              </p>
            </div>

            {/* Dashboard preview card */}
            <div
              className={`flex-1 w-full max-w-md lg:max-w-none ${mounted ? 'anim-fade-left' : 'opacity-0'}`}
              style={{ animationDelay: '500ms' }}
            >
              <div className="relative bg-card rounded-2xl border border-border shadow-[0_4px_24px_-4px_rgba(79,70,229,0.12)] overflow-hidden">
                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Invoice Risk Dashboard
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">
                      June 2025 · 3 open invoices
                    </p>
                  </div>
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                    AI scoring ✓
                  </span>
                </div>

                {/* Invoice rows */}
                <div className="divide-y divide-border">
                  {invoices.map((inv) => {
                    const Icon = inv.icon
                    return (
                      <div
                        key={inv.client}
                        className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${inv.dotColor}`} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{inv.client}</p>
                            <p className="text-xs text-muted-foreground">{inv.due}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-foreground">{inv.amount}</span>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${inv.riskBg} ${inv.riskColor}`}
                          >
                            <Icon className={`w-3 h-3 ${inv.iconColor}`} />
                            {inv.risk}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Footer stat */}
                <div className="px-5 py-3 bg-muted/40 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Total outstanding</span>
                  <span className="font-semibold text-foreground">$9,150</span>
                </div>
              </div>

              {/* Floating AI badge */}
              <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground pr-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Risk scores updated in real time
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
