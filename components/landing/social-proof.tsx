const stats = [
  { value: '$2.4M+', label: 'Invoices processed' },
  { value: '94%', label: 'Risk score accuracy' },
  { value: '11 days', label: 'Avg. faster payment' },
  { value: '2,400+', label: 'Active users' },
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
    color: 'bg-emerald-50 text-emerald-700',
  },
  {
    quote:
      "The onboarding took literally 4 minutes. Connected my QuickBooks, and within the hour every open invoice had a risk score. It just works.",
    name: 'Priya Iyer',
    role: 'Freelance developer',
    initials: 'PI',
    color: 'bg-amber-50 text-amber-700',
  },
]

export function SocialProof() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="max-w-xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
            Loved by freelancers &amp; small teams
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4"
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
  )
}
