"use client"

import { use, useMemo, useState } from "react"
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
  industry: string
  reliabilityScore: number
  avgDaysToPay: number
  daysTrend: "up" | "down" | "flat"
  trendDelta: string
  totalInvoiced: number
  outstanding: number
  invoiceCount: number
  monthly: { month: string; days: number }[]
  invoices: ClientInvoice[]
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const DEFAULT_CLIENT: ClientRecord = {
  id: "c4",
  name: "Sam Whitaker",
  company: "Apex Solutions",
  email: "s.whitaker@apexsol.com",
  phone: "+1 (415) 555-0182",
  industry: "Software",
  reliabilityScore: 84,
  avgDaysToPay: 6,
  daysTrend: "down",
  trendDelta: "2 days faster vs last quarter",
  totalInvoiced: 88200,
  outstanding: 12400,
  invoiceCount: 15,
  monthly: [
    { month: "Jan", days: 11 },
    { month: "Feb", days: 9 },
    { month: "Mar", days: 8 },
    { month: "Apr", days: 10 },
    { month: "May", days: 6 },
    { month: "Jun", days: 5 },
    { month: "Jul", days: 4 },
  ],
  invoices: [
    { id: "INV-0182", amount: 6400, issueDate: "Jul 2, 2026",  dueDate: "Aug 1, 2026",  status: "Pending", risk: "Low" },
    { id: "INV-0175", amount: 6000, issueDate: "Jun 18, 2026", dueDate: "Jul 18, 2026", status: "Pending", risk: "Medium" },
    { id: "INV-0168", amount: 8200, issueDate: "Jun 1, 2026",  dueDate: "Jul 1, 2026",  status: "Paid",    risk: "Low" },
    { id: "INV-0160", amount: 4500, issueDate: "May 15, 2026", dueDate: "Jun 14, 2026", status: "Paid",    risk: "Low" },
    { id: "INV-0151", amount: 9100, issueDate: "Apr 28, 2026", dueDate: "May 28, 2026", status: "Paid",    risk: "Low" },
    { id: "INV-0143", amount: 5300, issueDate: "Apr 10, 2026", dueDate: "May 10, 2026", status: "Overdue", risk: "High" },
    { id: "INV-0137", amount: 7200, issueDate: "Mar 22, 2026", dueDate: "Apr 21, 2026", status: "Paid",    risk: "Medium" },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 })

function scoreStyle(score: number) {
  if (score >= 70) return { stroke: "#10b981", track: "#d1fae5", label: "Reliable", textCls: "text-emerald-600", bgCls: "bg-emerald-50", ringCls: "ring-emerald-200" }
  if (score >= 40) return { stroke: "#f59e0b", track: "#fef3c7", label: "Moderate", textCls: "text-amber-600",   bgCls: "bg-amber-50",   ringCls: "ring-amber-200" }
  return                  { stroke: "#f43f5e", track: "#ffe4e6", label: "At-Risk",  textCls: "text-rose-600",    bgCls: "bg-rose-50",    ringCls: "ring-rose-200" }
}

const STATUS_STYLE: Record<ClientInvoice["status"], string> = {
  Paid:    "text-emerald-600 bg-emerald-50 ring-emerald-200",
  Pending: "text-amber-600 bg-amber-50 ring-amber-200",
  Overdue: "text-rose-600 bg-rose-50 ring-rose-200",
}

const RISK_STYLE: Record<ClientInvoice["risk"], string> = {
  Low:    "text-emerald-600 bg-emerald-50 ring-emerald-200",
  Medium: "text-amber-600 bg-amber-50 ring-amber-200",
  High:   "text-rose-600 bg-rose-50 ring-rose-200",
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
  const client = useMemo<ClientRecord>(() => ({ ...DEFAULT_CLIENT, id }), [id])
  const [search, setSearch] = useState("")

  const filteredInvoices = useMemo(
    () => client.invoices.filter(inv => !search || inv.id.toLowerCase().includes(search.toLowerCase())),
    [client.invoices, search]
  )

  const initials = client.name.split(" ").map(n => n[0]).join("").slice(0, 2)

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
              <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" />{client.company} · {client.industry}</span>
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{client.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{client.phone}</span>
            </div>
          </div>
          <a
            href={`mailto:${client.email}`}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-white text-sm font-semibold transition-all hover:bg-indigo-700 active:scale-[0.98] w-fit"
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
            <p className="text-3xl font-bold text-foreground tabular-nums">{client.avgDaysToPay}<span className="text-lg text-muted-foreground"> days</span></p>
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
            <p className={`text-3xl font-bold tabular-nums ${client.outstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {client.outstanding > 0 ? fmt(client.outstanding) : "Cleared"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">across open invoices</p>
          </div>
          <div className="bg-card rounded-xl px-6 py-5 flex flex-col justify-center" style={{ border: "1px solid var(--border)" }}>
            <p className="text-xs text-muted-foreground mb-1">On-Time Rate</p>
            <p className="text-3xl font-bold text-emerald-600 tabular-nums">87%</p>
            <p className="text-xs text-muted-foreground mt-2">13 of 15 paid on time</p>
          </div>
        </div>
      </div>

      {/* Days-to-pay bar chart */}
      <div className="bg-card rounded-xl p-6" style={{ border: "1px solid var(--border)" }}>
        <div className="mb-6">
          <h2 className="text-base font-semibold text-foreground">Average Days to Pay</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Monthly trend over the last 7 months</p>
        </div>
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
        <p className="text-xs text-muted-foreground mt-4">
          Color reflects speed: <span className="text-emerald-600 font-medium">green ≤7d</span> · <span className="text-amber-600 font-medium">amber 8–10d</span> · <span className="text-rose-600 font-medium">red &gt;10d</span>
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
            className="h-9 px-3 rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow w-full sm:w-56"
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
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-muted/40 transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
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
                    <Link href={`/dashboard/invoices/${inv.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
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
            <div key={inv.id} className="px-6 py-4 flex flex-col gap-2">
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

        {filteredInvoices.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">No invoices match your search.</div>
        )}
      </div>
    </div>
  )
}
