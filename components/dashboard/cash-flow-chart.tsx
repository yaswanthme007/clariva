"use client"

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

const DATA = [
  { week: "Jun 23", expected: 4200, received: 4200 },
  { week: "Jun 30", expected: 7800, received: 5100 },
  { week: "Jul 7",  expected: 5500, received: 0 },
  { week: "Jul 14", expected: 9200, received: 0 },
]

const CURRENT_WEEK = "Jun 30"

interface TooltipPayload {
  name: string
  value: number
  color: string
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
  return (
    <div
      className="bg-card rounded-xl p-6"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">Cash Flow — Next 30 Days</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Expected income by week</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block bg-primary" />
            Expected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block bg-emerald-500" />
            Received
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={DATA} barCategoryGap="30%" barGap={4}>
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
          <Bar dataKey="expected" name="expected" radius={[5, 5, 0, 0]}>
            {DATA.map((entry) => (
              <Cell
                key={entry.week}
                fill={entry.week === CURRENT_WEEK ? "#fafafa" : "rgba(250,250,250,0.25)"}
              />
            ))}
          </Bar>
          <Bar dataKey="received" name="received" fill="#10b981" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground mt-4">
        Week of <span className="font-medium text-foreground">Jun 30</span> is in progress · Projections based on invoice due dates
      </p>
    </div>
  )
}
