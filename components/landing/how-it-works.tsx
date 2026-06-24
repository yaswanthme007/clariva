'use client'

import { Upload, Brain, BarChart2, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Connect & import',
    description:
      'Link your accounting tool or drag-and-drop invoices directly. Clariva supports QuickBooks, Xero, FreshBooks, and plain PDF uploads.',
  },
  {
    number: '02',
    icon: Brain,
    title: 'AI reads every invoice',
    description:
      'Our extraction model pulls client, amount, due date, and line items with near-perfect accuracy — even from messy, hand-formatted PDFs.',
  },
  {
    number: '03',
    icon: BarChart2,
    title: 'Get a risk score instantly',
    description:
      "A 0–100 risk score lands on each invoice the moment it's processed, factoring in the client's history, payment patterns, and industry signals.",
  },
  {
    number: '04',
    icon: Send,
    title: 'Send smart reminders',
    description:
      'Clariva crafts the right message at the right time for each client — chasing high-risk invoices early while leaving good payers alone.',
  },
]

function useScrollVisible(threshold = 0.1) {
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

export function HowItWorks() {
  const { ref, visible } = useScrollVisible(0.1)

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .step-item {
          opacity: 0;
        }
        .step-item.visible {
          animation: fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
        }
      `}</style>

      <section id="how-it-works" className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          {/* Section header */}
          <div className="max-w-xl mx-auto text-center mb-16">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
              From invoice to insight in minutes
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed text-pretty">
              Set up in under 5 minutes. No code, no complex onboarding — just connect
              and let the AI do the heavy lifting.
            </p>
          </div>

          {/* Steps */}
          <div ref={ref} className="relative">
            {/* Connector line (desktop only) */}
            <div
              aria-hidden
              className="hidden md:block absolute top-[2.35rem] left-[calc(12.5%-1px)] right-[calc(12.5%-1px)] h-px bg-border"
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
              {steps.map((step, idx) => {
                const Icon = step.icon
                const isLast = idx === steps.length - 1
                return (
                  <div
                    key={step.number}
                    className={`step-item relative flex flex-col items-center text-center ${visible ? 'visible' : ''}`}
                    style={{ animationDelay: `${idx * 150}ms` }}
                  >
                    {/* Step bubble */}
                    <div className="relative z-10 flex items-center justify-center w-[4.5rem] h-[4.5rem] rounded-full bg-card border-2 border-border shadow-sm mb-5">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                    </div>

                    {/* Mobile connector */}
                    {!isLast && (
                      <div
                        aria-hidden
                        className="md:hidden absolute left-1/2 -translate-x-1/2 top-[4.5rem] w-px h-10 bg-border"
                      />
                    )}

                    <h3 className="text-sm font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
