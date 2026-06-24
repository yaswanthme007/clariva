"use client"

import { useState, useMemo } from "react"
import {
  Plus,
  Search,
  Mail,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Client {
  id: string
  name: string
  company: string
  email: string
  industry: string
  reliabilityScore: number
  totalInvoiced: number
  outstanding: number
  invoiceCount: number
  avgDaysLate: number
  trend: "up" | "down" | "flat"
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const CLIENTS: Client[] = [
  {
    id: "c1",  name: "Alex Torres",    company: "Meridian Co.",      email: "atorres@meridian.co",      industry: "Consulting",
    reliabilityScore: 22,  totalInvoiced: 42500,  outstanding: 8750,  invoiceCount: 7,  avgDaysLate: 18, trend: "down",
  },
  {
    id: "c2",  name: "Priya Nair",     company: "Bright Labs",       email: "p.nair@brightlabs.io",     industry: "Technology",
    reliabilityScore: 91,  totalInvoiced: 61000,  outstanding: 0,     invoiceCount: 12, avgDaysLate: 1,  trend: "up",
  },
  {
    id: "c3",  name: "Jordan Cole",   company: "Foxwood Creative",  email: "jcole@foxwoodcreative.com", industry: "Design",
    reliabilityScore: 58,  totalInvoiced: 23400,  outstanding: 1950,  invoiceCount: 6,  avgDaysLate: 9,  trend: "flat",
  },
  {
    id: "c4",  name: "Sam Whitaker",  company: "Apex Solutions",    email: "s.whitaker@apexsol.com",   industry: "Software",
    reliabilityScore: 84,  totalInvoiced: 88200,  outstanding: 12400, invoiceCount: 15, avgDaysLate: 3,  trend: "up",
  },
  {
    id: "c5",  name: "Dana Reyes",    company: "Harbor Consulting",  email: "dreyes@harborcg.com",      industry: "Finance",
    reliabilityScore: 17,  totalInvoiced: 19800,  outstanding: 3300,  invoiceCount: 5,  avgDaysLate: 24, trend: "down",
  },
  {
    id: "c6",  name: "Morgan Liu",    company: "Orion Media",        email: "morgan@orionmedia.co",     industry: "Media",
    reliabilityScore: 63,  totalInvoiced: 31000,  outstanding: 6600,  invoiceCount: 8,  avgDaysLate: 7,  trend: "up",
  },
  {
    id: "c7",  name: "Casey Park",    company: "Starside Digital",   email: "cpark@starside.io",        industry: "Marketing",
    reliabilityScore: 96,  totalInvoiced: 27500,  outstanding: 0,     invoiceCount: 9,  avgDaysLate: 0,  trend: "up",
  },
  {
    id: "c8",  name: "Riley Novak",   company: "Vantage Partners",   email: "r.novak@vantagep.com",     industry: "Consulting",
    reliabilityScore: 79,  totalInvoiced: 54600,  outstanding: 0,     invoiceCount: 11, avgDaysLate: 4,  trend: "flat",
  },
  {
    id: "c9",  name: "Taylor Brooks", company: "Summit Tech",        email: "tbrooks@summittech.io",    industry: "Technology",
    reliabilityScore: 31,  totalInvoiced: 38900,  outstanding: 5400,  invoiceCount: 10, avgDaysLate: 16, trend: "down",
  },
  {
    id: "c10", name: "Quinn Marsh",   company: "Nexus Group",        email: "qmarsh@nexusgroup.com",    industry: "Operations",
    reliabilityScore: 88,  totalInvoiced: 72000,  outstanding: 0,     invoiceCount: 14, avgDaysLate: 2,  trend: "up",
  },
  {
    id: "c11", name: "Avery West",    company: "Clearview Agency",   email: "awest@clearview.agency",   industry: "Advertising",
    reliabilityScore: 47,  totalInvoiced: 16800,  outstanding: 3150,  invoiceCount: 4,  avgDaysLate: 11, trend: "flat",
  },
  {
    id: "c12", name: "Jamie Stone",   company: "Ironwood Studios",   email: "j.stone@ironwood.studio",  industry: "Design",
    reliabilityScore: 72,  totalInvoiced: 44200,  outstanding: 11200, invoiceCount: 8,  avgDaysLate: 5,  trend: "up",
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 })

function scoreStyle(score: number) {
  if (score >= 70) return {
    stroke: "#10b981", trackStroke: "rgba(255,255,255,0.08)",
    label: "Reliable",  textCls: "text-emerald-400",
    bgCls: "bg-emerald-500/10", ringCls: "ring-emerald-500/20",
  }
  if (score >= 40) return {
    stroke: "#f59e0b", trackStroke: "rgba(255,255,255,0.08)",
    label: "Moderate",  textCls: "text-amber-400",
    bgCls: "bg-amber-500/10", ringCls: "ring-amber-500/20",
  }
  return {
    stroke: "#f43f5e", trackStroke: "rgba(255,255,255,0.08)",
    label: "At-Risk",   textCls: "text-rose-400",
    bgCls: "bg-rose-500/10", ringCls: "ring-rose-500/20",
  }
}

function ScoreCircle({ score }: { score: number }) {
  const { stroke, trackStroke, label, textCls, bgCls, ringCls } = scoreStyle(score)
  const r    = 28
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-[72px] h-[72px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke={trackStroke} strokeWidth="6" />
          <circle
            cx="32" cy="32" r={r}
            fill="none"
            stroke={stroke}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${fill} ${circ}`}
            style={{ transition: "stroke-dasharray 0.7s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold tabular-nums ${textCls}`}>{score}</span>
        </div>
      </div>
      <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ring-1 ring-inset ${textCls} ${bgCls} ${ringCls}`}>
        {label}
      </span>
    </div>
  )
}

const TREND_ICON = {
  up:   <TrendingUp   className="w-3.5 h-3.5 text-emerald-500" />,
  down: <TrendingDown className="w-3.5 h-3.5 text-rose-500" />,
  flat: <Minus        className="w-3.5 h-3.5 text-muted-foreground" />,
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [search, setSearch]   = useState("")
  const [addOpen, setAddOpen] = useState(false)

  const filtered = useMemo(() =>
    CLIENTS.filter(c => {
      const q = search.toLowerCase()
      return !q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)
    }),
    [search]
  )

  // Summary stats
  const totalClients     = CLIENTS.length
  const totalOutstanding = CLIENTS.reduce((s, c) => s + c.outstanding, 0)
  const avgScore         = Math.round(CLIENTS.reduce((s, c) => s + c.reliabilityScore, 0) / CLIENTS.length)

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 pt-20 md:pt-8 min-h-full">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{totalClients} clients · {fmt(totalOutstanding)} outstanding</p>
        </div>
        <button
          onClick={() => setAddOpen(v => !v)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-all hover:bg-gray-100 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Add Client</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Clients",     value: totalClients,            sub: "active"           },
          { label: "Avg Reliability",   value: `${avgScore}/100`,       sub: "across all clients" },
          { label: "Total Outstanding", value: fmt(totalOutstanding),   sub: "unpaid invoices"  },
          { label: "At-Risk Clients",   value: CLIENTS.filter(c => c.reliabilityScore < 40).length, sub: "score below 40" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl px-5 py-4" style={{ border: "1px solid var(--border)" }}>
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search clients…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-3 rounded-lg text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
          style={{ border: "1px solid var(--border)" }}
        />
      </div>

      {/* Add client inline form */}
      {addOpen && (
        <div className="bg-card rounded-xl px-6 py-5" style={{ border: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold text-foreground mb-4">Add New Client</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Full Name",     placeholder: "e.g. Jordan Cole" },
              { label: "Company",       placeholder: "e.g. Foxwood Creative" },
              { label: "Email",         placeholder: "e.g. jcole@company.com" },
              { label: "Industry",      placeholder: "e.g. Design" },
              { label: "Phone",         placeholder: "Optional" },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">{f.label}</label>
                <input
                  type="text"
                  placeholder={f.placeholder}
                  className="w-full h-9 px-3 rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
                  style={{ border: "1px solid var(--border)" }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-5">
            <button className="h-9 px-4 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-gray-100 transition-colors">
              Save Client
            </button>
            <button
              onClick={() => setAddOpen(false)}
              className="h-9 px-4 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Client grid */}
      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl px-6 py-16 text-center" style={{ border: "1px solid var(--border)" }}>
          <p className="text-muted-foreground text-sm">No clients match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(client => {
            const { textCls } = scoreStyle(client.reliabilityScore)
            return (
              <div
                key={client.id}
                className="group bg-card rounded-xl px-6 py-5 flex flex-col gap-4 hover:shadow-sm transition-shadow"
                style={{ border: "1px solid var(--border)" }}
              >
                {/* Top row: avatar + name + score circle */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-primary"
                      style={{ background: "var(--accent)" }}
                    >
                      {client.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{client.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{client.company}</p>
                      <p className="text-xs text-muted-foreground/70 truncate">{client.industry}</p>
                    </div>
                  </div>
                  <ScoreCircle score={client.reliabilityScore} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Total Invoiced</p>
                    <p className="text-sm font-semibold text-foreground tabular-nums">{fmt(client.totalInvoiced)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Outstanding</p>
                    <p className={`text-sm font-semibold tabular-nums ${client.outstanding > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                      {client.outstanding > 0 ? fmt(client.outstanding) : "Cleared"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Invoices</p>
                    <p className="text-sm font-semibold text-foreground tabular-nums">{client.invoiceCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Avg Days Late</p>
                    <div className="flex items-center gap-1">
                      {TREND_ICON[client.trend]}
                      <p className={`text-sm font-semibold tabular-nums ${client.avgDaysLate > 10 ? "text-rose-400" : client.avgDaysLate > 4 ? "text-amber-400" : "text-emerald-400"}`}>
                        {client.avgDaysLate === 0 ? "On time" : `+${client.avgDaysLate}d`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-0" style={{ borderTop: "1px solid var(--border)" }}>
                  <a
                    href={`mailto:${client.email}`}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title={client.email}
                  >
                    <Mail className="w-3 h-3" />
                    Email
                  </a>
                  <button className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <ExternalLink className="w-3 h-3" />
                    View Invoices
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
