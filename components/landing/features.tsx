'use client'

import { FileSearch, ShieldAlert, BellRing } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const features = [
  {
    icon: FileSearch,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    title: 'AI Invoice Extraction',
    description:
      'Upload any PDF or image — Clariva instantly pulls client name, amount, due date, and line items with over 98% accuracy. No templates, no manual entry.',
    highlights: ['PDF & image support', 'Auto-categorisation', '98% accuracy'],
    accent: 'border-l-primary',
  },
  {
    icon: ShieldAlert,
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-400',
    title: 'Payment Risk Scoring',
    description:
      "Each invoice receives a 0–100 risk score the moment it's created, based on the client's payment history, industry benchmarks, and behavioural signals.",
    highlights: ['0–100 risk score', 'Client history', 'Industry data'],
    accent: 'border-l-rose-400',
  },
  {
    icon: BellRing,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    title: 'Smart Reminders',
    description:
      "Clariva's AI picks the optimal send time and tone for each client — polite nudge or firm notice — so you never have an awkward conversation again.",
    highlights: ['AI-timed nudges', 'Tone matching', 'Multi-channel'],
    accent: 'border-l-amber-400',
  },
]

function useScrollVisible(threshold = 0.15) {
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

export function Features() {
  const { ref, visible } = useScrollVisible(0.1)

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .feat-card {
          opacity: 0;
        }
        .feat-card.visible {
          animation: fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .btn-scale {
          transition: transform 200ms ease, box-shadow 200ms ease;
        }
        .btn-scale:hover { transform: scale(1.02); }
      `}</style>

      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          {/* Section header */}
          <div className="max-w-xl mx-auto text-center mb-14">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              Core features
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
              Everything you need to get paid on time
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed text-pretty">
              Three powerful AI modules that turn your invoice workflow from reactive to
              proactive — all in one lightweight dashboard.
            </p>
          </div>

          {/* Feature cards */}
          <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((feat, idx) => {
              const Icon = feat.icon
              return (
                <div
                  key={feat.title}
                  className={`feat-card relative bg-card rounded-xl border border-border border-l-[3px] ${feat.accent} p-6 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] hover:border-white/15 transition-all btn-scale ${visible ? 'visible' : ''}`}
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg ${feat.iconBg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${feat.iconColor}`} />
                  </div>

                  <h3 className="text-base font-semibold text-foreground mb-2">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    {feat.description}
                  </p>

                  {/* Highlight chips */}
                  <div className="flex flex-wrap gap-2">
                    {feat.highlights.map((h) => (
                      <span
                        key={h}
                        className="text-xs font-medium bg-muted text-muted-foreground px-2.5 py-1 rounded-full"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
