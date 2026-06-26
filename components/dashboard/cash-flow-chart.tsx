"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface ChartRow {
  week: string
  expected: number
  received: number
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

function formatPeriod(period: string): string {
  // period is "YYYY-MM-DD" (start of week/month from DB)
  return new Date(period + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="bg-card rounded-xl px-4 py-3 text-sm shadow-lg"
      style={{ border: "1px solid var(--border)" }}
    >
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-muted-foreground">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ background: p.color }}
          />
          <span className="capitalize">{p.name}:</span>
          <span className="font-medium text-foreground ml-auto pl-4">
            ${p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

export function CashFlowChart() {
  const [data, setData] = useState<ChartRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/analytics?days=30")
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        if (json?.cashFlow && json.cashFlow.length > 0) {
          setData(
            json.cashFlow.map((r: { period: string; expected: number; actual: number }) => ({
              week:     formatPeriod(r.period),
              expected: Math.round(r.expected),
              received: Math.round(r.actual),
            }))
          )
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div
      className="bg-card rounded-xl p-6"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">Cash Flow — Last 30 Days</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Expected vs received, by week</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "rgba(250,250,250,0.4)" }} />
            Expected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block bg-emerald-500" />
            Received
          </span>
        </div>
      </div>

      {loading ? (
        <div className="h-[220px] flex items-center justify-center">
          <div className="flex gap-2">
            {[60, 90, 50, 80].map((h, i) => (
              <div
                key={i}
                className="w-12 rounded-t-md animate-pulse bg-muted"
                style={{ height: `${h}px`, alignSelf: "flex-end" }}
              />
            ))}
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="h-[220px] flex flex-col items-center justify-center gap-2">
          <p className="text-sm text-muted-foreground">No invoice data for the last 30 days</p>
          <p className="text-xs text-muted-foreground">Create your first invoice to see cash flow here</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barCategoryGap="30%" barGap={4}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", radius: 6 }} />
            <Bar dataKey="expected" name="expected" fill="rgba(250,250,250,0.25)" radius={[5, 5, 0, 0]} />
            <Bar dataKey="received" name="received" fill="#10b981"               radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {!loading && data.length > 0 && (
        <p className="text-xs text-muted-foreground mt-4">
          Projections based on invoice due dates · Last 30 days
        </p>
      )}
    </div>
  )
}
