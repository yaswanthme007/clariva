"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  Trash2,
  ChevronDown,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

type Status = "Paid" | "Pending" | "Overdue"
type Risk   = "Low"  | "Medium"  | "High"

interface Invoice {
  id: string
  client: string
  amount: number
  issueDate: string
  dueDate: string
  status: Status
  risk: Risk
  riskScore: number
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const ALL_INVOICES: Invoice[] = [
  { id: "INV-0091", client: "Bright Labs",        amount: 4200,  issueDate: "Jun 1, 2026",  dueDate: "Jun 20, 2026", status: "Paid",    risk: "Low",    riskScore: 12 },
  { id: "INV-0090", client: "Meridian Co.",        amount: 8750,  issueDate: "Jun 3, 2026",  dueDate: "Jun 28, 2026", status: "Overdue", risk: "High",   riskScore: 87 },
  { id: "INV-0089", client: "Foxwood Creative",    amount: 1950,  issueDate: "Jun 5, 2026",  dueDate: "Jul 3, 2026",  status: "Pending", risk: "Medium", riskScore: 54 },
  { id: "INV-0088", client: "Apex Solutions",      amount: 12400, issueDate: "Jun 8, 2026",  dueDate: "Jul 10, 2026", status: "Pending", risk: "Low",    riskScore: 18 },
  { id: "INV-0087", client: "Harbor Consulting",   amount: 3300,  issueDate: "May 20, 2026", dueDate: "Jun 15, 2026", status: "Overdue", risk: "High",   riskScore: 92 },
  { id: "INV-0086", client: "Orion Media",         amount: 6600,  issueDate: "Jun 10, 2026", dueDate: "Jul 18, 2026", status: "Pending", risk: "Medium", riskScore: 61 },
  { id: "INV-0085", client: "Starside Digital",    amount: 2100,  issueDate: "May 15, 2026", dueDate: "May 30, 2026", status: "Paid",    risk: "Low",    riskScore: 8  },
  { id: "INV-0084", client: "Vantage Partners",    amount: 9800,  issueDate: "May 18, 2026", dueDate: "Jun 10, 2026", status: "Paid",    risk: "Low",    riskScore: 22 },
  { id: "INV-0083", client: "Summit Tech",         amount: 5400,  issueDate: "May 22, 2026", dueDate: "Jun 5, 2026",  status: "Overdue", risk: "High",   riskScore: 79 },
  { id: "INV-0082", client: "Nexus Group",         amount: 7200,  issueDate: "May 25, 2026", dueDate: "Jun 20, 2026", status: "Paid",    risk: "Low",    riskScore: 15 },
  { id: "INV-0081", client: "Clearview Agency",    amount: 3150,  issueDate: "May 28, 2026", dueDate: "Jul 1, 2026",  status: "Pending", risk: "Medium", riskScore: 47 },
  { id: "INV-0080", client: "Ironwood Studios",    amount: 11200, issueDate: "Jun 2, 2026",  dueDate: "Jul 5, 2026",  status: "Pending", risk: "Low",    riskScore: 29 },
  { id: "INV-0079", client: "BluePath Inc.",       amount: 4850,  issueDate: "Apr 30, 2026", dueDate: "May 25, 2026", status: "Overdue", risk: "High",   riskScore: 94 },
  { id: "INV-0078", client: "Ember Creative",      amount: 2600,  issueDate: "May 5, 2026",  dueDate: "Jun 12, 2026", status: "Paid",    risk: "Low",    riskScore: 11 },
  { id: "INV-0077", client: "Goldstone Retail",    amount: 8100,  issueDate: "May 8, 2026",  dueDate: "Jun 8, 2026",  status: "Overdue", risk: "Medium", riskScore: 68 },
  { id: "INV-0076", client: "Skyline Ventures",    amount: 15000, issueDate: "Apr 15, 2026", dueDate: "May 15, 2026", status: "Paid",    risk: "Low",    riskScore: 7  },
  { id: "INV-0075", client: "Cascade Systems",     amount: 6300,  issueDate: "Apr 20, 2026", dueDate: "May 20, 2026", status: "Paid",    risk: "Low",    riskScore: 19 },
  { id: "INV-0074", client: "Anchor Digital",      amount: 4400,  issueDate: "Apr 22, 2026", dueDate: "May 22, 2026", status: "Paid",    risk: "Low",    riskScore: 33 },
  { id: "INV-0073", client: "Redwood Agency",      amount: 3700,  issueDate: "Apr 25, 2026", dueDate: "May 28, 2026", status: "Overdue", risk: "High",   riskScore: 85 },
  { id: "INV-0072", client: "Prism Analytics",     amount: 9200,  issueDate: "Apr 28, 2026", dueDate: "Jun 2, 2026",  status: "Pending", risk: "Medium", riskScore: 58 },
]

const PAGE_SIZE = 10

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  "$" + n.toLocaleString("en-US")

const STATUS_BADGE: Record<Status, string> = {
  Paid:    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  Pending: "bg-amber-50   text-amber-700   ring-1 ring-inset ring-amber-200",
  Overdue: "bg-rose-50    text-rose-700    ring-1 ring-inset ring-rose-200",
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
  const [search, setSearch]       = useState("")
  const [statusFilter, setStatus] = useState<"All" | Status>("All")
  const [page, setPage]           = useState(1)
  const [statusOpen, setStatusOpen] = useState(false)

  const filtered = useMemo(() => {
    return ALL_INVOICES.filter((inv) => {
      const matchStatus = statusFilter === "All" || inv.status === statusFilter
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        inv.id.toLowerCase().includes(q) ||
        inv.client.toLowerCase().includes(q)
      return matchStatus && matchSearch
    })
  }, [search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleStatusChange(val: "All" | Status) {
    setStatus(val)
    setPage(1)
    setStatusOpen(false)
  }

  function handleSearch(val: string) {
    setSearch(val)
    setPage(1)
  }

  const STATUS_OPTIONS: ("All" | Status)[] = ["All", "Pending", "Paid", "Overdue"]

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 pt-20 md:pt-8 min-h-full">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} invoice{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-all hover:bg-indigo-700 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">New Invoice</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search invoices or clients…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            style={{ border: "1px solid var(--border)" }}
          />
        </div>

        {/* Status dropdown */}
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
            <div
              className="absolute top-full mt-1 left-0 z-20 w-36 bg-card rounded-lg shadow-lg py-1"
              style={{ border: "1px solid var(--border)" }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleStatusChange(opt)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-muted ${
                    statusFilter === opt ? "text-primary font-medium" : "text-foreground"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-card rounded-xl flex-1" style={{ border: "1px solid var(--border)" }}>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Invoice #", "Client", "Amount", "Issue Date", "Due Date", "Status", "Risk Score", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-sm text-muted-foreground">
                    No invoices match your filters.
                  </td>
                </tr>
              ) : paginated.map((inv, i) => (
                <tr
                  key={inv.id}
                  className="hover:bg-muted/40 transition-colors group"
                  style={i < paginated.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}
                >
                  <td className="px-5 py-3.5 font-mono text-xs font-medium text-foreground whitespace-nowrap">
                    {inv.id}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-foreground whitespace-nowrap">
                    {inv.client}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-foreground tabular-nums whitespace-nowrap">
                    {fmt(inv.amount)}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap tabular-nums">
                    {inv.issueDate}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap tabular-nums">
                    {inv.dueDate}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <RiskBar score={inv.riskScore} risk={inv.risk} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        title="View"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Mark Paid"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Delete"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-border">
          {paginated.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">No invoices match your filters.</p>
          ) : paginated.map((inv) => (
            <div key={inv.id} className="px-5 py-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{inv.id}</span>
                <span className="font-semibold text-foreground tabular-nums">{fmt(inv.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{inv.client}</span>
                <span className="text-xs text-muted-foreground">{inv.dueDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={inv.status} />
                <div className="flex-1">
                  <RiskBar score={inv.riskScore} risk={inv.risk} />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground border border-border hover:bg-muted transition-colors">
                  <Eye className="w-3 h-3" /> View
                </button>
                <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                  <CheckCircle className="w-3 h-3" /> Mark Paid
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{filtered.length}</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => Math.abs(n - page) <= 2)
              .map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${
                    n === page
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {n}
                </button>
              ))
            }
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
