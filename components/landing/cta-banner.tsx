import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CtaBanner() {
  return (
    <section className="py-20 sm:py-24">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="relative rounded-2xl bg-primary overflow-hidden px-8 py-14 sm:px-14 text-center">
          {/* Subtle grid overlay */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative z-10">
            <p className="text-indigo-200 text-sm font-medium mb-3 uppercase tracking-widest">
              Get started today
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight text-balance mb-4">
              Stop chasing. Start predicting.
            </h2>
            <p className="text-indigo-100 text-base leading-relaxed max-w-lg mx-auto mb-8 text-pretty">
              Join thousands of freelancers and small businesses who use Clariva to catch
              late payers before they become a problem.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="#"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-white text-primary font-semibold px-6 py-3 text-sm hover:bg-indigo-50 transition-colors"
              >
                Start for free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-400 text-white font-medium px-6 py-3 text-sm hover:bg-indigo-700 transition-colors"
              >
                Talk to sales
              </Link>
            </div>
            <p className="mt-5 text-indigo-200 text-xs">
              Free 14-day trial · No credit card required · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
