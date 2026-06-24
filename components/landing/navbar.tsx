'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Zap } from 'lucide-react'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Blog', href: '#blog' },
]

function smoothScroll(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (!href.startsWith('#')) return
  const el = document.querySelector(href)
  if (!el) return
  e.preventDefault()
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <style>{`
        .nav-link {
          position: relative;
          color: rgba(255,255,255,0.85);
          transition: color 200ms ease, opacity 200ms ease;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: #4f46e5;
          transition: width 200ms ease;
        }
        .nav-link:hover {
          color: rgba(255,255,255,1);
        }
        .nav-link:hover::after {
          width: 100%;
        }
        .nav-link-scrolled {
          color: #6b7280;
          transition: color 200ms ease;
        }
        .nav-link-scrolled::after {
          background: #4f46e5;
        }
        .nav-link-scrolled:hover {
          color: #0f0f23;
        }
        .btn-scale {
          transition: transform 200ms ease, background-color 200ms ease, color 200ms ease;
        }
        .btn-scale:hover {
          transform: scale(1.02);
        }
      `}</style>

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-card/95 backdrop-blur-sm border-b border-border shadow-[0_1px_0_0_var(--border)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group btn-scale">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <Zap className="w-4 h-4 text-primary-foreground fill-current" />
              </div>
              <span
                className={`text-[17px] font-semibold tracking-tight transition-colors duration-200 ${
                  scrolled ? 'text-foreground' : 'text-white'
                }`}
              >
                Clariva
              </span>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-7">
              {navLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => smoothScroll(e, item.href)}
                  className={`text-sm nav-link ${scrolled ? 'nav-link-scrolled' : ''}`}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTA buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="#"
                className={`text-sm font-medium transition-colors duration-200 px-1 btn-scale ${
                  scrolled ? 'text-foreground hover:text-primary' : 'text-white/85 hover:text-white'
                }`}
              >
                Login
              </Link>
              <Link
                href="#"
                className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 py-2 hover:bg-indigo-700 btn-scale"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu toggle */}
            <button
              className={`md:hidden p-2 rounded-md transition-colors duration-200 ${
                scrolled
                  ? 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-card border-t border-border px-5 pb-5 pt-3 flex flex-col gap-4">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => { smoothScroll(e, item.href); setMenuOpen(false) }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {item.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-2 border-t border-border">
              <Link
                href="#"
                className="text-sm font-medium text-foreground text-center py-2 border border-border rounded-lg hover:bg-muted transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                href="#"
                className="text-sm font-medium text-center py-2 rounded-lg bg-primary text-primary-foreground hover:bg-indigo-700 transition-colors duration-200"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
