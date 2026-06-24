"use client"

import { useMemo, useState } from "react"
import { Download } from "lucide-react"
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

// ─── Seed data per range ──────────────────────────────────────────────────────

const CASH_FLOW: Record<RangeKey, { week: string; expected: number; actual: number }[]> = {
  "30": [
    { week: "Wk 1", expected: 12400, actual: 11800 },
    { week: "Wk 2", expected: 9800,  actual: 10200 },
    { week: "Wk 3", expected: 14200, actual: 12600 },
    { week: "Wk 4", expected: 11000, actual: 9400 },
  ],
  "60": [
    { week: "Wk 1", expected: 10200, actual: 9800 },
    { week: "Wk 2", expected: 12400, actual: 11800 },
    { week: "Wk 3", expected: 9800,  actual: 10200 },
    { week: "Wk 4", expected: 14200, actual: 12600 },
    { week: "Wk 5", expected: 11000, actual: 11400 },
    { week: "Wk 6", expected: 13600, actual: 12200 },
    { week: "Wk 7", expected: 10800, actual: 9600 },
    { week: "Wk 8", expected: 15200, actual: 14100 },
  ],
  "90": [
    { week: "Jan", expected: 38000, actual: 35200 },
    { week: "Feb", expected: 42000, actual: 41100 },
    { week: "Mar", expected: 39500, actual: 36800 },
    { week: "Apr", expected: 47000, actual: 44900 },
    { week: "May", expected: 44200, actual: 45100 },
    { week: "Jun", expected: 49800, actual: 46300 },
  ],
}

const STATUS_DATA: Record<RangeKey, { name: string; value: number; color: string }[]> = {
  "30": [
    { name: "Paid",    value: 28, color: "#10b981" },
    { name: "Pending", value: 11, color: "#f59e0b" },
    { name: "Overdue", value: 5,  color: "#f43f5e" },
  ],
  "60": [
    { name: "Paid",    value: 54, color: "#10b981" },
    { name: "Pending", value: 18, color: "#f59e0b" },
    { name: "Overdue", value: 9,  color: "#f43f5e" },
  ],
  "90": [
    { name: "Paid",    value: 86, color: "#10b981" },
    { name: "Pending", value: 24, color: "#f59e0b" },
    { name: "Overdue", value: 14, color: "#f43f5e" },
  ],
}

const TOP_CLIENTS: Record<RangeKey, { name: string; revenue: number }[]> = {
  "30": [
    { name: "Apex Solutions",   revenue: 18400 },
    { name: "Nexus Group",      revenue: 14200 },
    { name: "Bright Labs",      revenue: 11800 },
    { name: "Vantage Partners", revenue: 9600 },
    { name: "Orion Media",      revenue: 7400 },
  ],
  "60": [
    { name: "Apex Solutions",   revenue: 36200 },
    { name: "Nexus Group",      revenue: 28900 },
    { name: "Bright Labs",      revenue: 24100 },
    { name: "Vantage Partners", revenue: 19400 },
    { name: "Summit Tech",      revenue: 15800 },
  ],
  "90": [
    { name: "Apex Solutions",   revenue: 58200 },
    { name: "Nexus Group",      revenue: 47000 },
    { name: "Bright Labs",      revenue: 41000 },
    { name: "Vantage Partners", revenue: 33600 },
    { name: "Summit Tech",      revenue: 26900 },
  ],
}

const TIMELINESS: Record<RangeKey, { bucket: string; count: number }[]> = {
  "30": [
    { bucket: "Early",   count: 6 },
    { bucket: "0–7d",    count: 14 },
    { bucket: "8–14d",   count: 8 },
    { bucket: "15–30d",  count: 4 },
    { bucket: "30d+",    count: 2 },
  ],
  "60": [
    { bucket: "Early",   count: 11 },
    { bucket: "0–7d",    count: 27 },
    { bucket: "8–14d",   count: 15 },
    { bucket: "15–30d",  count: 7 },
    { bucket: "30d+",    count: 4 },
  ],
  "90": [
    { bucket: "Early",   count: 18 },
    { bucket: "0–7d",    count: 44 },
    { bucket: "8–14d",   count: 23 },
    { bucket: "15–30d",  count: 12 },
    { bucket: "30d+",    count: 7 },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 })

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
  const [range, setRange] = useState<RangeKey>("30")

  const cashFlow   = CASH_FLOW[range]
  const statusData = STATUS_DATA[range]
  const topClients = TOP_CLIENTS[range]
  const timeliness = TIMELINESS[range]

  const totalInvoices = useMemo(() => statusData.reduce((s, d) => s + d.value, 0), [statusData])

  function exportCsv() {
    const rows: string[] = []
    rows.push("Section,Label,Value")
    cashFlow.forEach(d => rows.push(`Cash Flow,${d.week} expected,${d.expected}`))
    cashFlow.forEach(d => rows.push(`Cash Flow,${d.week} actual,${d.actual}`))
    statusData.forEach(d => rows.push(`Invoice Status,${d.name},${d.value}`))
    topClients.forEach(d => rows.push(`Top Clients,${d.name},${d.revenue}`))
    timeliness.forEach(d => rows.push(`Payment Timeliness,${d.bucket},${d.count}`))
    const blob = new Blob([rows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
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
            className="flex items-center gap-2 h-9 px-4 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 1. Cash Flow line chart */}
        <ChartCard title="Cash Flow" subtitle="Expected vs actual income">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={cashFlow} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={48} />
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
              <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Line type="monotone" dataKey="expected" name="Expected" stroke="#fafafa" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="actual" name="Actual" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2. Invoice Status donut */}
        <ChartCard title="Invoice Status" subtitle={`${totalInvoices} invoices in range`}>
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
                          <span className="font-medium text-foreground">{payload[0].value} ({Math.round(Number(payload[0].value) / totalInvoices * 100)}%)</span>
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
                  <span className="text-xs text-muted-foreground tabular-nums w-9 text-right">{Math.round(d.value / totalInvoices * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* 3. Top Clients horizontal bar */}
        <ChartCard title="Top Clients by Revenue" subtitle="Top 5 clients in range">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topClients} layout="vertical" margin={{ top: 5, right: 16, left: 10, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
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
        </ChartCard>

        {/* 4. Payment Timeliness histogram */}
        <ChartCard title="Payment Timeliness" subtitle="Distribution of days-to-pay">
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
            <span className="text-emerald-600 font-medium">Green</span> = on time · <span className="text-amber-600 font-medium">amber</span> = mild delay · <span className="text-rose-600 font-medium">red</span> = significant delay
          </p>
        </ChartCard>
      </div>
    </div>
  )
}
