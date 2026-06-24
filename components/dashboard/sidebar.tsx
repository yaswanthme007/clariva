"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Zap,
  LogOut,
  Menu,
  X,
} from "lucide-react"

const NAV_ITEMS = [
  { label: "Dashboard",  href: "/dashboard",            icon: LayoutDashboard },
  { label: "Invoices",   href: "/dashboard/invoices",   icon: FileText },
  { label: "Clients",    href: "/dashboard/clients",    icon: Users },
  { label: "Analytics",  href: "/dashboard/analytics",  icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary shrink-0">
          <Zap className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <span className="text-base font-bold tracking-tight text-foreground">Clariva</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5" aria-label="Main navigation">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border-l-2",
                active
                  ? "bg-muted text-foreground border-foreground"
                  : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Jamie Davis</p>
            <p className="text-xs text-muted-foreground truncate">jamie@acmestudio.co</p>
          </div>
        </div>
        <button
          className="mt-1 flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
          onClick={() => {}}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
          Log out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-60 shrink-0 bg-card h-screen sticky top-0"
        style={{ borderRight: "1px solid var(--border)" }}
      >
        {content}
      </aside>

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-card"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary">
            <Zap className="w-3 h-3 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">Clariva</span>
        </div>
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/20"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="md:hidden fixed top-0 left-0 z-50 w-64 h-screen bg-card"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            {content}
          </aside>
        </>
      )}
    </>
  )
}
