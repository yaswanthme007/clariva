"use client"

import { use, useMemo, useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

// ─── Types ──────────────────────────────────────────────────────────────────

interface ClientInvoice {
  id: string
  dbId: string
  amount: number
  issueDate: string
  dueDate: string
  status: "Paid" | "Pending" | "Overdue"
  risk: "Low" | "Medium" | "High"
}

interface ClientRecord {
  id: string
  name: string
  company: string
  email: string
  phone: string
  reliabilityScore: number
  avgDaysToPay: number
  daysTrend: "up" | "down" | "flat"
  trendDelta: string
  totalInvoiced: number
  outstanding: number
  invoiceCount: number
  onTimeCount: number
  paidCount: number
  monthly: { month: string; days: number }[]
  invoices: ClientInvoice[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 })

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseClientRecord(r: any): ClientRecord {
  const avgDays = Number(r.avg_payment_days ?? 0)
  const daysTrend: ClientRecord["daysTrend"] = avgDays <= 7 ? "down" : avgDays > 15 ? "up" : "flat"
  const trendDelta =
    avgDays === 0 ? "No payment history yet"
    : avgDays <= 7 ? "Pays consistently on time"
    : `Averages ${avgDays} days to pay`

  return {
    id:               r.id,
    name:             r.name,
    company:          r.name,
    email:            r.email ?? "",
    phone:            r.phone ?? "—",
    reliabilityScore: Number(r.payment_score ?? 100),
    avgDaysToPay:     avgDays,
    daysTrend,
    trendDelta,
    totalInvoiced:    Number(r.total_invoiced ?? 0),
    outstanding:      Number(r.outstanding ?? 0),
    invoiceCount:     Number(r.invoice_count ?? 0),
    onTimeCount:      Number(r.on_time_count ?? 0),
    paidCount:        Number(r.total_paid_count ?? 0),
    monthly:          (r.monthly ?? []).map((m: { month: string; days: number }) => ({
      month: m.month,
      days: Number(m.days),
    })),
    invoices: (r.invoices ?? []).map((inv: Record<string, unknown>) => ({
      id:        inv.invoice_number as string,
      dbId:      inv.id as string,
      amount:    Number(inv.amount),
      issueDate: formatDate(inv.issue_date as string),
      dueDate:   formatDate(inv.due_date as string),
      status:    capitalize(inv.status as string) as ClientInvoice["status"],
      risk:      ((inv.risk_label as string) ?? "Low") as ClientInvoice["risk"],
    })),
  }
}

function scoreStyle(score: number) {
  if (score >= 70) return { stroke: "#10b981", track: "rgba(255,255,255,0.08)", label: "Reliable", textCls: "text-emerald-400", bgCls: "bg-emerald-500/10", ringCls: "ring-emerald-500/20" }
  if (score >= 40) return { stroke: "#f59e0b", track: "rgba(255,255,255,0.08)", label: "Moderate", textCls: "text-amber-400",   bgCls: "bg-amber-500/10",   ringCls: "ring-amber-500/20" }
  return                  { stroke: "#f43f5e", track: "rgba(255,255,255,0.08)", label: "At-Risk",  textCls: "text-rose-400",    bgCls: "bg-rose-500/10",    ringCls: "ring-rose-500/20" }
}

const STATUS_STYLE: Record<ClientInvoice["status"], string> = {
  Paid:    "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20",
  Pending: "text-amber-400 bg-amber-500/10 ring-amber-500/20",
  Overdue: "text-rose-400 bg-rose-500/10 ring-rose-500/20",
}

const RISK_STYLE: Record<ClientInvoice["risk"], string> = {
  Low:    "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20",
  Medium: "text-amber-400 bg-amber-500/10 ring-amber-500/20",
  High:   "text-rose-400 bg-rose-500/10 ring-rose-500/20",
}

const TREND_ICON = {
  up:   <TrendingUp   className="w-4 h-4 text-rose-500" />,
  down: <TrendingDown className="w-4 h-4 text-emerald-500" />,
  flat: <Minus        className="w-4 h-4 text-muted-foreground" />,
}

// ─── Reliability gauge ──────────────────────────────────────────────────────────

function ReliabilityGauge({ score }: { score: number }) {
  const { stroke, track, label, textCls, bgCls, ringCls } = scoreStyle(score)
  const r = 52
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-[140px] h-[140px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke={track} strokeWidth="10" />
          <circle
            cx="60" cy="60" r={r}
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${fill} ${circ}`}
            style={{ transition: "stroke-dasharray 0.9s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold tabular-nums ${textCls}`}>{score}</span>
          <span className="text-xs text-muted-foreground">out of 100</span>
        </div>
      </div>
      <span className={`text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full ring-1 ring-inset ${textCls} ${bgCls} ${ringCls}`}>
        {label}
      </span>
    </div>
  )
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────

function DaysTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card rounded-xl px-4 py-2.5 text-sm shadow-lg" style={{ border: "1px solid var(--border)" }}>
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">
        Avg days to pay: <span className="font-medium text-foreground">{payload[0].value}d</span>
      </p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [client, setClient]   = useState<ClientRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState("")

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/clients/${id}`)
        if (!res.ok) return
        const { client: raw } = await res.json()
        setClient(parseClientRecord(raw))
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id])

  const filteredInvoices = useMemo(
    () => (client?.invoices ?? []).filter(inv => !search || inv.id.toLowerCase().includes(search.toLowerCase())),
    [client, search]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full p-8 pt-20 md:pt-8">
        <p className="text-muted-foreground text-sm">Loading client…</p>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex flex-col gap-4 p-8 pt-20 md:pt-8">
        <Link href="/dashboard/clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Clients
        </Link>
        <p className="text-muted-foreground">Client not found.</p>
      </div>
    )
  }

  const initials = client.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  const onTimeRate = client.paidCount > 0 ? Math.round(client.onTimeCount / client.paidCount * 100) : null

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 pt-20 md:pt-8 min-h-full">

      {/* Back link */}
      <Link href="/dashboard/clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </Link>

      {/* Client header */}
      <div className="bg-card rounded-xl px-6 py-6" style={{ border: "1px solid var(--border)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 text-xl font-bold text-primary" style={{ background: "var(--accent)" }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{client.name}</h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" />{client.company}</span>
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{client.email}</span>
              {client.phone !== "—" && (
                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{client.phone}</span>
              )}
            </div>
          </div>
          <a
            href={`mailto:${client.email}`}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-all hover:bg-gray-100 active:scale-[0.98] w-fit"
          >
            <Mail className="w-4 h-4" />
            Email Client
          </a>
        </div>
      </div>

      {/* Stat row: gauge + key stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Reliability gauge card */}
        <div className="bg-card rounded-xl px-6 py-6 flex flex-col items-center justify-center" style={{ border: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold text-foreground mb-4 self-start">Payment Reliability</p>
          <ReliabilityGauge score={client.reliabilityScore} />
        </div>

        {/* Key stats */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-card rounded-xl px-6 py-5 flex flex-col justify-center" style={{ border: "1px solid var(--border)" }}>
            <p className="text-xs text-muted-foreground mb-1">Average Days to Pay</p>
            <p className="text-3xl font-bold text-foreground tabular-nums">
              {client.avgDaysToPay}<span className="text-lg text-muted-foreground"> days</span>
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              {TREND_ICON[client.daysTrend]}
              <span className="text-xs text-muted-foreground">{client.trendDelta}</span>
            </div>
          </div>
          <div className="bg-card rounded-xl px-6 py-5 flex flex-col justify-center" style={{ border: "1px solid var(--border)" }}>
            <p className="text-xs text-muted-foreground mb-1">Total Invoiced</p>
            <p className="text-3xl font-bold text-foreground tabular-nums">{fmt(client.totalInvoiced)}</p>
            <p className="text-xs text-muted-foreground mt-2">{client.invoiceCount} invoices all-time</p>
          </div>
          <div className="bg-card rounded-xl px-6 py-5 flex flex-col justify-center" style={{ border: "1px solid var(--border)" }}>
            <p className="text-xs text-muted-foreground mb-1">Outstanding</p>
            <p className={`text-3xl font-bold tabular-nums ${client.outstanding > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {client.outstanding > 0 ? fmt(client.outstanding) : "Cleared"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">across open invoices</p>
          </div>
          <div className="bg-card rounded-xl px-6 py-5 flex flex-col justify-center" style={{ border: "1px solid var(--border)" }}>
            <p className="text-xs text-muted-foreground mb-1">On-Time Rate</p>
            <p className="text-3xl font-bold text-emerald-400 tabular-nums">
              {onTimeRate !== null ? `${onTimeRate}%` : "N/A"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {client.paidCount > 0
                ? `${client.onTimeCount} of ${client.paidCount} paid on time`
                : "No paid invoices yet"}
            </p>
          </div>
        </div>
      </div>

      {/* Days-to-pay bar chart */}
      <div className="bg-card rounded-xl p-6" style={{ border: "1px solid var(--border)" }}>
        <div className="mb-6">
          <h2 className="text-base font-semibold text-foreground">Average Days to Pay</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Monthly trend over the last 7 months</p>
        </div>
        {client.monthly.length === 0 ? (
          <p className="text-sm text-muted-foreground py-16 text-center">No payment data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={client.monthly} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={v => `${v}d`} width={36} />
              <Tooltip content={<DaysTooltip />} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="days" radius={[5, 5, 0, 0]}>
                {client.monthly.map(entry => (
                  <Cell key={entry.month} fill={entry.days > 10 ? "#f43f5e" : entry.days > 7 ? "#f59e0b" : "#10b981"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        <p className="text-xs text-muted-foreground mt-4">
          Color reflects speed: <span className="text-emerald-400 font-medium">green ≤7d</span> · <span className="text-amber-400 font-medium">amber 8–10d</span> · <span className="text-rose-400 font-medium">red &gt;10d</span>
        </p>
      </div>

      {/* Invoices table */}
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-base font-semibold text-foreground">Invoices · {client.company}</h2>
          <input
            type="text"
            placeholder="Search invoice #…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 px-3 rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow w-full sm:w-56"
            style={{ border: "1px solid var(--border)" }}
          />
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground" style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="font-medium px-6 py-3">Invoice #</th>
                <th className="font-medium px-6 py-3">Amount</th>
                <th className="font-medium px-6 py-3">Issue Date</th>
                <th className="font-medium px-6 py-3">Due Date</th>
                <th className="font-medium px-6 py-3">Status</th>
                <th className="font-medium px-6 py-3">Risk</th>
                <th className="font-medium px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">No invoices found.</td></tr>
              ) : filteredInvoices.map(inv => (
                <tr key={inv.dbId} className="hover:bg-muted/40 transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-6 py-3.5 font-medium text-foreground">{inv.id}</td>
                  <td className="px-6 py-3.5 text-foreground tabular-nums">{fmt(inv.amount)}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">{inv.issueDate}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">{inv.dueDate}</td>
                  <td className="px-6 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ${STATUS_STYLE[inv.status]}`}>{inv.status}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ${RISK_STYLE[inv.risk]}`}>{inv.risk}</span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Link href={`/dashboard/invoices/${inv.dbId}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y" style={{ borderColor: "var(--border)" }}>
          {filteredInvoices.map(inv => (
            <div key={inv.dbId} className="px-6 py-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{inv.id}</span>
                <span className="text-foreground tabular-nums font-semibold">{fmt(inv.amount)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Due {inv.dueDate}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset ${STATUS_STYLE[inv.status]}`}>{inv.status}</span>
                  <span className={`font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset ${RISK_STYLE[inv.risk]}`}>{inv.risk}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredInvoices.length === 0 && client.invoices.length > 0 && (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">No invoices match your search.</div>
        )}
      </div>
    </div>
  )
}
