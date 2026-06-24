'use client'

import { useEffect, useRef, useState } from 'react'

const stats = [
  { raw: 2.4, suffix: 'M+', prefix: '$', label: 'Invoices processed', decimals: 1 },
  { raw: 94, suffix: '%', prefix: '', label: 'Risk score accuracy', decimals: 0 },
  { raw: 11, suffix: ' days', prefix: '', label: 'Avg. faster payment', decimals: 0 },
  { raw: 2400, suffix: '+', prefix: '', label: 'Active users', decimals: 0 },
]

const testimonials = [
  {
    quote:
      "Clariva flagged a client I'd worked with for years as high-risk three weeks before they ghosted a $6,000 invoice. I followed up early and got paid. Absolutely worth it.",
    name: 'Sara Kim',
    role: 'Brand designer, freelance',
    initials: 'SK',
    color: 'bg-primary/10 text-primary',
  },
  {
    quote:
      "We used to chase every overdue invoice the same way. Now Clariva tells us which ones actually need a call versus an email nudge. Our collection time dropped by two weeks.",
    name: 'Marcus Osei',
    role: 'Co-founder, Volta Studio',
    initials: 'MO',
    color: 'bg-emerald-500/10 text-emerald-400',
  },
  {
    quote:
      "The onboarding took literally 4 minutes. Connected my QuickBooks, and within the hour every open invoice had a risk score. It just works.",
    name: 'Priya Iyer',
    role: 'Freelance developer',
    initials: 'PI',
    color: 'bg-amber-500/10 text-amber-400',
  },
]

function useCountUp(target: number, decimals: number, started: boolean, duration = 1600) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!started) return
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(parseFloat((eased * target).toFixed(decimals)))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [started, target, decimals, duration])

  return value
}

function StatCard({ raw, suffix, prefix, label, decimals, started }: typeof stats[0] & { started: boolean }) {
  const val = useCountUp(raw, decimals, started)
  const display = decimals > 0 ? val.toFixed(decimals) : Math.floor(val).toLocaleString()
  return (
    <div className="text-center">
      <p className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight tabular-nums">
        {prefix}{display}{suffix}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function useScrollVisible(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, visible }
}

export function SocialProof() {
  const { ref: statsRef, visible: statsVisible } = useScrollVisible(0.2)
  const { ref: cardsRef, visible: cardsVisible } = useScrollVisible(0.1)

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .testimony-card {
          opacity: 0;
        }
        .testimony-card.visible {
          animation: fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
        }
      `}</style>

      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          {/* Stats row */}
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} started={statsVisible} />
            ))}
          </div>

          {/* Testimonials */}
          <div className="max-w-xl mx-auto text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
              Loved by freelancers &amp; small teams
            </h2>
          </div>
          <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, idx) => (
              <figure
                key={t.name}
                className={`testimony-card bg-card rounded-xl border border-border p-6 flex flex-col gap-4 ${cardsVisible ? 'visible' : ''}`}
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <blockquote className="text-sm text-foreground leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="flex items-center gap-3 pt-3 border-t border-border">
                  <div
                    className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-xs font-semibold flex-shrink-0`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
