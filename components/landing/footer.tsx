'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'

function smoothScroll(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (!href.startsWith('#')) return
  const el = document.querySelector(href)
  if (!el) return
  e.preventDefault()
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-primary-foreground fill-current" />
              </div>
              <span className="text-base font-semibold text-foreground">Clariva</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI invoice intelligence for freelancers and small businesses.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              © {new Date().getFullYear()} Clariva, Inc.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-4">
              Product
            </h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a
                  href="#features"
                  onClick={(e) => smoothScroll(e, '#features')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => smoothScroll(e, '#how-it-works')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  How it works
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-4">
              Company
            </h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a
                  href="https://github.com/yaswanthme007/clariva"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@clariva.com"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>Built for the people who build things.</p>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
