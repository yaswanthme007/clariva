"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  Trash2,
  ChevronDown,
  AlertCircle,
  Send,
  Loader2,
  X,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// ─── Types ───────────────────────────────────────────────────────────────────

type Status = "Paid" | "Pending" | "Overdue"
type Risk   = "Low"  | "Medium"  | "High"

interface Invoice {
  id: string
  dbId: string
  client: string
  amount: number
  issueDate: string
  dueDate: string
  status: Status
  risk: Risk
  riskScore: number
}

const PAGE_SIZE = 10

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const STATUS_BADGE: Record<Status, string> = {
  Paid:    "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20",
  Pending: "bg-amber-500/10   text-amber-400   ring-1 ring-inset ring-amber-500/20",
  Overdue: "bg-rose-500/10    text-rose-400    ring-1 ring-inset ring-rose-500/20",
}

const RISK_BAR: Record<Risk, string> = {
  Low:    "bg-emerald-500",
  Medium: "bg-amber-500",
  High:   "bg-rose-500",
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[status]}`}>
      {status}
    </span>
  )
}


function RiskBar({ score, risk }: { score: number; risk: Risk }) {
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${RISK_BAR[risk]}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-6 text-right">{score}</span>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const router = useRouter()

  const [invoices, setInvoices]       = useState<Invoice[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState("")
  const [search, setSearch]           = useState("")
  const [statusFilter, setStatus]     = useState<"All" | Status>("All")
  const [page, setPage]               = useState(1)
  const [statusOpen, setStatusOpen]   = useState(false)

  // Bulk AI reminders
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [bulkPhase, setBulkPhase]     = useState<"idle" | "generating" | "done">("idle")
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 })
  const [toast, setToast]             = useState("")

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/invoices")
      if (!res.ok) { setError("Failed to load invoices. Please refresh the page."); return }
      const data = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setInvoices((data.invoices ?? []).map((r: any) => ({
        id:        r.invoice_number,
        dbId:      r.id,
        client:    r.client_name,
        amount:    Number(r.amount),
        issueDate: formatDate(r.issue_date),
        dueDate:   formatDate(r.due_date),
        status:    capitalize(r.status) as Status,
        risk:      (r.risk_label ?? "Low") as Risk,
        riskScore: Number(r.risk_score ?? 0),
      })))
    } catch {
      setError("Something went wrong loading invoices. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadInvoices() }, [loadInvoices])

  const filtered = useMemo(() => invoices.filter(inv => {
    const matchStatus = statusFilter === "All" || inv.status === statusFilter
    const q = search.toLowerCase()
    return matchStatus && (!q || inv.id.toLowerCase().includes(q) || inv.client.toLowerCase().includes(q))
  }), [invoices, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleStatusChange(val: "All" | Status) { setStatus(val); setPage(1); setStatusOpen(false) }
  function handleSearch(val: string)               { setSearch(val); setPage(1) }

  function toggleSelect(dbId: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(dbId) ? next.delete(dbId) : next.add(dbId)
      return next
    })
  }

  // Selectable = pending or overdue invoices on the current page
  const selectableOnPage = paginated.filter(inv => inv.status === "Pending" || inv.status === "Overdue")
  const allPageSelected  = selectableOnPage.length > 0 && selectableOnPage.every(inv => selected.has(inv.dbId))

  function toggleSelectAll() {
    setSelected(prev => {
      const next = new Set(prev)
      if (allPageSelected) {
        selectableOnPage.forEach(inv => next.delete(inv.dbId))
      } else {
        selectableOnPage.forEach(inv => next.add(inv.dbId))
      }
      return next
    })
  }

  async function handleBulkReminders() {
    const ids = Array.from(selected)
    if (!ids.length) return
    setBulkPhase("generating")
    setBulkProgress({ done: 0, total: ids.length })

    let completedCount = 0
    const promises = ids.map(dbId =>
      fetch("/api/ai/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: dbId }),
      })
        .then(r => r.ok ? r.json() : null)
        .then(result => { completedCount++; setBulkProgress({ done: completedCount, total: ids.length }); return result })
        .catch(()   => { completedCount++; setBulkProgress({ done: completedCount, total: ids.length }); return null })
    )

    const results = await Promise.all(promises)
    const ok = results.filter(Boolean).length
    setSelected(new Set())
    setBulkPhase("done")
    setToast(`${ok} AI reminder${ok !== 1 ? "s" : ""} generated. Open each invoice to view and copy.`)
    setTimeout(() => { setBulkPhase("idle"); setToast("") }, 5000)
  }

  async function markPaid(dbId: string) {
    await fetch(`/api/invoices/${dbId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid", paid_date: new Date().toISOString().slice(0, 10) }),
    })
    await loadInvoices()
  }

  async function deleteInvoice(dbId: string) {
    await fetch(`/api/invoices/${dbId}`, { method: "DELETE" })
    setSelected(prev => { const n = new Set(prev); n.delete(dbId); return n })
    await loadInvoices()
  }

  const STATUS_OPTIONS: ("All" | Status)[] = ["All", "Pending", "Paid", "Overdue"]
  const showBar = selected.size > 0 || bulkPhase === "generating"

  return (
    <div className={`flex flex-col gap-6 p-6 md:p-8 pt-20 md:pt-8 min-h-full ${showBar ? "pb-24" : ""}`}>

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading…" : `${filtered.length} invoice${filtered.length !== 1 ? "s" : ""} found`}
          </p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-all hover:bg-gray-100 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">New Invoice</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search invoices or clients…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
            style={{ border: "1px solid var(--border)" }}
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setStatusOpen(v => !v)}
            className="flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium bg-card text-foreground hover:bg-muted transition-colors"
            style={{ border: "1px solid var(--border)" }}
          >
            <span className="text-muted-foreground text-xs">Status:</span>
            <span>{statusFilter}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {statusOpen && (
            <div className="absolute top-full mt-1 left-0 z-20 w-36 bg-card rounded-lg shadow-lg py-1" style={{ border: "1px solid var(--border)" }}>
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleStatusChange(opt)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-muted ${statusFilter === opt ? "text-primary font-medium" : "text-foreground"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-rose-400 bg-rose-500/10" style={{ border: "1px solid rgba(244,63,94,0.2)" }}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table card */}
      <div className="bg-card rounded-xl flex-1" style={{ border: "1px solid var(--border)" }}>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {/* Select-all checkbox */}
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                    disabled={selectableOnPage.length === 0}
                    className="rounded border-border accent-primary cursor-pointer disabled:opacity-30"
                    title="Select all pending/overdue"
                  />
                </th>
                {["Invoice #", "Client", "Amount", "Issue Date", "Due Date", "Status", "Risk Score", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={i < 4 ? { borderBottom: "1px solid var(--border)" } : {}}>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-4 rounded" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-3 w-24" /></td>
                    <td className="px-4 py-3.5" />
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    No invoices match your filters.
                  </td>
                </tr>
              ) : paginated.map((inv, i) => {
                const isSelectable = inv.status === "Pending" || inv.status === "Overdue"
                const isChecked    = selected.has(inv.dbId)
                return (
                  <tr
                    key={inv.dbId}
                    className={`transition-colors group ${isChecked ? "bg-primary/5" : "hover:bg-muted/40"}`}
                    style={i < paginated.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}
                  >
                    <td className="px-4 py-3.5">
                      {isSelectable ? (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(inv.dbId)}
                          className="rounded border-border accent-primary cursor-pointer"
                        />
                      ) : (
                        <span className="block w-4 h-4" />
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs font-medium text-foreground whitespace-nowrap">{inv.id}</td>
                    <td className="px-4 py-3.5 font-medium text-foreground whitespace-nowrap">{inv.client}</td>
                    <td className="px-4 py-3.5 font-semibold text-foreground tabular-nums whitespace-nowrap">{fmt(inv.amount)}</td>
                    <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap tabular-nums">{inv.issueDate}</td>
                    <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap tabular-nums">{inv.dueDate}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3.5"><RiskBar score={inv.riskScore} risk={inv.risk} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button title="View"    onClick={() => router.push(`/dashboard/invoices/${inv.dbId}`)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                        {inv.status !== "Paid" && (
                          <button title="Mark Paid" onClick={() => markPaid(inv.dbId)} className="p-1.5 rounded-md text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"><CheckCircle className="w-3.5 h-3.5" /></button>
                        )}
                        <button title="Delete"  onClick={() => deleteInvoice(inv.dbId)} className="p-1.5 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-border">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between"><Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-20" /></div>
                <div className="flex items-center justify-between"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div>
                <div className="flex items-center gap-2"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-3 flex-1" /></div>
              </div>
            ))
          ) : paginated.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">No invoices match your filters.</p>
          ) : paginated.map(inv => {
            const isSelectable = inv.status === "Pending" || inv.status === "Overdue"
            const isChecked    = selected.has(inv.dbId)
            return (
              <div key={inv.dbId} className={`px-5 py-4 flex flex-col gap-2.5 ${isChecked ? "bg-primary/5" : ""}`}>
                <div className="flex items-center gap-3">
                  {isSelectable && (
                    <input type="checkbox" checked={isChecked} onChange={() => toggleSelect(inv.dbId)} className="rounded border-border accent-primary cursor-pointer shrink-0" />
                  )}
                  <span className="font-mono text-xs text-muted-foreground flex-1">{inv.id}</span>
                  <span className="font-semibold text-foreground tabular-nums">{fmt(inv.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{inv.client}</span>
                  <span className="text-xs text-muted-foreground">{inv.dueDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={inv.status} />
                  <div className="flex-1"><RiskBar score={inv.riskScore} risk={inv.risk} /></div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button onClick={() => router.push(`/dashboard/invoices/${inv.dbId}`)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground border border-border hover:bg-muted transition-colors">
                    <Eye className="w-3 h-3" /> View
                  </button>
                  {inv.status !== "Paid" && (
                    <button onClick={() => markPaid(inv.dbId)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
                      <CheckCircle className="w-3 h-3" /> Mark Paid
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}
            </span>{" "}
            of <span className="font-medium text-foreground">{filtered.length}</span>
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => Math.abs(n - page) <= 2).map(n => (
              <button key={n} onClick={() => setPage(n)} className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${n === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating bulk action bar ─────────────────────────────────────────────── */}
      {showBar && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div
            className="pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {bulkPhase === "generating" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  Generating reminders… ({bulkProgress.done}/{bulkProgress.total})
                </span>
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {selected.size} invoice{selected.size !== 1 ? "s" : ""} selected
                </span>
                <div className="w-px h-5 bg-border" />
                <button
                  onClick={handleBulkReminders}
                  className="flex items-center gap-2 h-8 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  Generate AI Reminders
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                  title="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Success toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl bg-emerald-500/10 text-emerald-400 text-sm font-medium whitespace-nowrap" style={{ border: "1px solid rgba(16,185,129,0.25)" }}>
            <CheckCircle className="w-4 h-4 shrink-0" />
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}
