import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CtaBanner() {
  return (
    <section className="relative py-24 sm:py-32 bg-[#0a0a0a] overflow-hidden">
      {/* Radial glow behind heading */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          style={{
            width: '600px',
            height: '400px',
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 text-center">
        <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-4">
          Get started today
        </p>
        <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight text-balance mb-5 leading-[1.1]">
          Stop chasing.<br className="hidden sm:block" /> Start predicting.
        </h2>
        <p className="text-base text-zinc-400 leading-relaxed max-w-lg mx-auto mb-10 text-pretty">
          Join thousands of freelancers and small businesses who use Clariva to catch
          late payers before they become a problem.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-white text-zinc-900 font-semibold px-7 py-3.5 text-sm hover:bg-zinc-100 transition-all duration-200 hover:scale-[1.02]"
          >
            Start for free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="mailto:hello@clariva.com"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 text-zinc-200 font-medium px-7 py-3.5 text-sm hover:border-zinc-500 hover:text-white transition-all duration-200 hover:scale-[1.02]"
          >
            Talk to sales
          </a>
        </div>
        <p className="mt-6 text-zinc-600 text-xs">
          Free 14-day trial · No credit card required · Cancel anytime
        </p>
      </div>
    </section>
  )
}
