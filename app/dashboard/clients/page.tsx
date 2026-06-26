"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  Mail,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Client {
  dbId: string
  name: string
  company: string
  email: string
  reliabilityScore: number
  totalInvoiced: number
  outstanding: number
  invoiceCount: number
  avgDaysLate: number
  trend: "up" | "down" | "flat"
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseClient(r: any): Client {
  const avgDays = Number(r.avg_payment_days ?? 0)
  const trend: Client["trend"] = avgDays <= 7 ? "up" : avgDays > 15 ? "down" : "flat"
  return {
    dbId:             r.id,
    name:             r.name,
    company:          r.name,
    email:            r.email,
    reliabilityScore: Number(r.payment_score ?? 100),
    totalInvoiced:    Number(r.total_invoiced ?? 0),
    outstanding:      Number(r.outstanding ?? 0),
    invoiceCount:     Number(r.invoice_count ?? 0),
    avgDaysLate:      avgDays,
    trend,
  }
}

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
  const router = useRouter()

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState("")
  const [search, setSearch]   = useState("")
  const [addOpen, setAddOpen] = useState(false)

  const [newName,  setNewName]  = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [saving,   setSaving]   = useState(false)
  const [saveError, setSaveError] = useState("")

  const loadClients = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/clients")
      if (!res.ok) {
        setError("Failed to load clients. Please refresh the page.")
        return
      }
      const data = await res.json()
      setClients((data.clients ?? []).map(parseClient))
    } catch {
      setError("Something went wrong loading clients. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadClients() }, [loadClients])

  const filtered = useMemo(() =>
    clients.filter(c => {
      const q = search.toLowerCase()
      return !q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)
    }),
    [clients, search]
  )

  const totalOutstanding = clients.reduce((s, c) => s + c.outstanding, 0)
  const avgScore         = clients.length ? Math.round(clients.reduce((s, c) => s + c.reliabilityScore, 0) / clients.length) : 0
  const atRiskCount      = clients.filter(c => c.reliabilityScore < 40).length

  async function addClient() {
    if (!newName || !newEmail) return
    setSaving(true)
    setSaveError("")
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, email: newEmail, phone: newPhone || undefined }),
      })
      if (res.ok) {
        setNewName(""); setNewEmail(""); setNewPhone("")
        setAddOpen(false)
        await loadClients()
      } else {
        setSaveError("Failed to save client. Please try again.")
      }
    } catch {
      setSaveError("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full h-9 px-3 rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow"

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 pt-20 md:pt-8 min-h-full">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading…" : `${clients.length} clients · ${fmt(totalOutstanding)} outstanding`}
          </p>
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

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-rose-400 bg-rose-500/10" style={{ border: "1px solid rgba(244,63,94,0.2)" }}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Clients",     value: clients.length,      sub: "active"             },
          { label: "Avg Reliability",   value: `${avgScore}/100`,   sub: "across all clients" },
          { label: "Total Outstanding", value: fmt(totalOutstanding), sub: "unpaid invoices"  },
          { label: "At-Risk Clients",   value: atRiskCount,          sub: "score below 40"   },
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
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Company Name *</label>
              <input type="text" placeholder="e.g. Foxwood Creative" value={newName} onChange={e => setNewName(e.target.value)}
                className={inputCls} style={{ border: "1px solid var(--border)" }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email *</label>
              <input type="email" placeholder="e.g. billing@company.com" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                className={inputCls} style={{ border: "1px solid var(--border)" }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone</label>
              <input type="text" placeholder="Optional" value={newPhone} onChange={e => setNewPhone(e.target.value)}
                className={inputCls} style={{ border: "1px solid var(--border)" }} />
            </div>
          </div>
          {saveError && (
            <div className="flex items-center gap-2 mt-3 rounded-lg px-3 py-2 text-sm text-rose-400 bg-rose-500/10" style={{ border: "1px solid rgba(244,63,94,0.2)" }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              {saveError}
            </div>
          )}
          <div className="flex items-center gap-2 mt-5">
            <button
              onClick={addClient}
              disabled={!newName || !newEmail || saving}
              className="h-9 px-4 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving…" : "Save Client"}
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
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl px-6 py-5 flex flex-col gap-4" style={{ border: "1px solid var(--border)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
                <Skeleton className="w-[72px] h-[72px] rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                {[0, 1, 2, 3].map(j => (
                  <div key={j}>
                    <Skeleton className="h-3 w-20 mb-1.5" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-0" style={{ borderTop: "1px solid var(--border)" }}>
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-7 w-24 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl px-6 py-16 text-center" style={{ border: "1px solid var(--border)" }}>
          <p className="text-muted-foreground text-sm">
            {clients.length === 0 ? "No clients yet. Add your first client above." : "No clients match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(client => {
            const { textCls } = scoreStyle(client.reliabilityScore)
            return (
              <div
                key={client.dbId}
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
                      {client.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{client.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{client.email}</p>
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
                  <button
                    onClick={() => router.push(`/dashboard/clients/${client.dbId}`)}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
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
