"use client"

import { useMemo, useState, useEffect } from "react"
import { Download, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// ─── Types ──────────────────────────────────────────────────────────────────

type RangeKey = "30" | "60" | "90"

interface AnalyticsData {
  cashFlow:          { period: string; expected: number; actual: number }[]
  statusBreakdown:   { status: string; count: number }[]
  topClients:        { name: string; revenue: number }[]
  timeliness:        { bucket: string; count: number }[]
  riskDistribution?: { low: number; medium: number; high: number }
  granularity:       string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  paid:    "#10b981",
  pending: "#f59e0b",
  overdue: "#f43f5e",
}

const ALL_TIMELINESS_BUCKETS = ["Early", "0–7d", "8–14d", "15–30d", "30d+"]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 })

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "30", label: "Last 30 days" },
  { key: "60", label: "Last 60 days" },
  { key: "90", label: "Last 90 days" },
]

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl p-6" style={{ border: "1px solid var(--border)" }}>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function TooltipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl px-4 py-2.5 text-sm shadow-lg" style={{ border: "1px solid var(--border)" }}>
      {children}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range, setRange]     = useState<RangeKey>("30")
  const [data, setData]       = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState("")

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError("")
      try {
        const res = await fetch(`/api/analytics?days=${range}`)
        if (!res.ok) {
          setError("Failed to load analytics. Please try again.")
          return
        }
        const json: AnalyticsData = await res.json()
        setData(json)
      } catch {
        setError("Something went wrong loading analytics. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [range])

  // Transform cash flow: period ISO string → week/month label
  const cashFlow = useMemo(() => {
    if (!data?.cashFlow) return []
    return data.cashFlow.map((row, i) => ({
      week: data.granularity === "month"
        ? new Date(row.period + "T12:00:00Z").toLocaleDateString("en-US", { month: "short" })
        : `Wk ${i + 1}`,
      expected: row.expected,
      actual:   row.actual,
    }))
  }, [data])

  // Transform status breakdown → pie chart format
  const statusData = useMemo(() => {
    if (!data?.statusBreakdown) return []
    return data.statusBreakdown.map(r => ({
      name:  capitalize(r.status),
      value: r.count,
      color: STATUS_COLORS[r.status] ?? "#6b7280",
    }))
  }, [data])

  // Top clients already in the right format
  const topClients = data?.topClients ?? []

  // Timeliness: ensure all buckets appear (fill missing with 0)
  const timeliness = useMemo(() => {
    if (!data?.timeliness) return ALL_TIMELINESS_BUCKETS.map(b => ({ bucket: b, count: 0 }))
    const map = new Map(data.timeliness.map(r => [r.bucket, r.count]))
    return ALL_TIMELINESS_BUCKETS.map(bucket => ({ bucket, count: map.get(bucket) ?? 0 }))
  }, [data])

  const totalInvoices = useMemo(() => statusData.reduce((s, d) => s + d.value, 0), [statusData])

  function exportCsv() {
    const rows: string[] = ["Section,Label,Value"]
    cashFlow.forEach(d => {
      rows.push(`Cash Flow,${d.week} expected,${d.expected}`)
      rows.push(`Cash Flow,${d.week} actual,${d.actual}`)
    })
    statusData.forEach(d => rows.push(`Invoice Status,${d.name},${d.value}`))
    topClients.forEach(d => rows.push(`Top Clients,${d.name},${d.revenue}`))
    timeliness.forEach(d => rows.push(`Payment Timeliness,${d.bucket},${d.count}`))
    const blob = new Blob([rows.join("\n")], { type: "text/csv" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url
    a.download = `clariva-analytics-${range}d.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 pt-20 md:pt-8 min-h-full">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Revenue, payment behavior &amp; risk insights</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Range selector */}
          <div className="flex items-center p-0.5 rounded-lg bg-muted" role="tablist">
            {RANGES.map(r => (
              <button
                key={r.key}
                role="tab"
                aria-selected={range === r.key}
                onClick={() => setRange(r.key)}
                className={[
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                  range === r.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={exportCsv}
            disabled={loading || !data}
            className="flex items-center gap-2 h-9 px-4 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-rose-400 bg-rose-500/10" style={{ border: "1px solid rgba(244,63,94,0.2)" }}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Charts grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-6" style={{ border: "1px solid var(--border)" }}>
              <div className="mb-5">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-3 w-52" />
              </div>
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 1. Cash Flow line chart */}
        <ChartCard title="Cash Flow" subtitle="Expected vs actual income">
          {cashFlow.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-1.5">
              <p className="text-sm font-medium text-muted-foreground">No invoice data in this period</p>
              <p className="text-xs text-muted-foreground">Create invoices to see cash flow trends here</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={cashFlow} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={v => `$${(Number(v) / 1000).toFixed(0)}k`} width={48} />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <TooltipBox>
                        <p className="font-semibold text-foreground mb-1.5">{label}</p>
                        {payload.map(p => (
                          <div key={p.name} className="flex items-center gap-2 text-muted-foreground">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
                            <span className="capitalize">{p.name}:</span>
                            <span className="font-medium text-foreground ml-auto pl-4">{fmt(Number(p.value))}</span>
                          </div>
                        ))}
                      </TooltipBox>
                    ) : null
                  }
                />
                <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, paddingTop: 8, color: "#9ca3af" }} />
                <Line type="monotone" dataKey="expected" name="Expected" stroke="#fafafa" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="actual"   name="Actual"   stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* 2. Invoice Status donut */}
        <ChartCard title="Invoice Status" subtitle={`${totalInvoices} invoices in range`}>
          {statusData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-24 text-center">No invoice data yet.</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={260}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={90}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {statusData.map(d => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <TooltipBox>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ background: payload[0].payload.color }} />
                            <span className="text-muted-foreground">{payload[0].name}:</span>
                            <span className="font-medium text-foreground">
                              {payload[0].value} ({totalInvoices > 0 ? Math.round(Number(payload[0].value) / totalInvoices * 100) : 0}%)
                            </span>
                          </div>
                        </TooltipBox>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3 flex-1">
                {statusData.map(d => (
                  <div key={d.name} className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ background: d.color }} />
                    <span className="text-sm text-muted-foreground flex-1">{d.name}</span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{d.value}</span>
                    <span className="text-xs text-muted-foreground tabular-nums w-9 text-right">
                      {totalInvoices > 0 ? Math.round(d.value / totalInvoices * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* 3. Top Clients horizontal bar */}
        <ChartCard title="Top Clients by Revenue" subtitle="Top 5 clients in range">
          {topClients.length === 0 ? (
            <p className="text-sm text-muted-foreground py-24 text-center">No revenue data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topClients} layout="vertical" margin={{ top: 5, right: 16, left: 10, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="4 4" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={v => `$${(Number(v) / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} width={110} />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <TooltipBox>
                        <p className="font-semibold text-foreground mb-1">{label}</p>
                        <p className="text-muted-foreground">Revenue: <span className="font-medium text-foreground">{fmt(Number(payload[0].value))}</span></p>
                      </TooltipBox>
                    ) : null
                  }
                />
                <Bar dataKey="revenue" fill="#fafafa" radius={[0, 5, 5, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* 4. Payment Timeliness histogram */}
        <ChartCard title="Payment Timeliness" subtitle="Distribution of days-to-pay">
          {timeliness.every(d => d.count === 0) ? (
            <div className="h-64 flex flex-col items-center justify-center gap-1.5">
              <p className="text-sm font-medium text-muted-foreground">No payment history yet</p>
              <p className="text-xs text-muted-foreground">Mark invoices as paid to see timeliness here</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={timeliness} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
                  <XAxis dataKey="bucket" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} width={36} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <TooltipBox>
                          <p className="font-semibold text-foreground mb-1">{label}</p>
                          <p className="text-muted-foreground">Invoices: <span className="font-medium text-foreground">{payload[0].value}</span></p>
                        </TooltipBox>
                      ) : null
                    }
                  />
                  <Bar dataKey="count" radius={[5, 5, 0, 0]} barSize={44}>
                    {timeliness.map(d => (
                      <Cell
                        key={d.bucket}
                        fill={d.bucket === "Early" || d.bucket === "0–7d" ? "#10b981" : d.bucket === "8–14d" ? "#f59e0b" : "#f43f5e"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-4">
                <span className="text-emerald-400 font-medium">Green</span> = on time · <span className="text-amber-400 font-medium">amber</span> = mild delay · <span className="text-rose-400 font-medium">red</span> = significant delay
              </p>
            </>
          )}
        </ChartCard>
      </div>
      )}
    </div>
  )
}
