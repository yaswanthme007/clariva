import type { ComponentType } from "react"
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, CheckCircle, FileWarning } from "lucide-react"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"

type Trend = "up" | "down" | "neutral"

interface Metric {
  label: string
  value: string
  trend: Trend
  trendLabel: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  iconColor: string
  iconBg: string
  valueColor?: string
}

export async function MetricCards() {
  const session = await auth()
  const userId = session?.user?.id

  let totalOutstanding = 0
  let outstandingCount = 0
  let overdue = 0
  let paidThisMonth = 0
  let atRiskCount = 0

  if (userId) {
    const [outstandingRes, overdueRes, paidRes, atRiskRes] = await Promise.all([
      pool.query<{ total: string; cnt: string }>(
        `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS cnt
         FROM invoices WHERE user_id = $1 AND status IN ('pending', 'overdue')`,
        [userId]
      ),
      pool.query<{ total: string }>(
        `SELECT COALESCE(SUM(amount), 0) AS total
         FROM invoices WHERE user_id = $1 AND status = 'overdue'`,
        [userId]
      ),
      pool.query<{ total: string }>(
        `SELECT COALESCE(SUM(paid_amount), 0) AS total
         FROM invoices
         WHERE user_id = $1 AND status = 'paid'
           AND paid_at >= date_trunc('month', NOW())`,
        [userId]
      ),
      pool.query<{ cnt: string }>(
        `SELECT COUNT(*) AS cnt
         FROM invoices WHERE user_id = $1 AND risk_label = 'High' AND status != 'paid'`,
        [userId]
      ),
    ])

    totalOutstanding = Number(outstandingRes.rows[0].total)
    outstandingCount = Number(outstandingRes.rows[0].cnt)
    overdue = Number(overdueRes.rows[0].total)
    paidThisMonth = Number(paidRes.rows[0].total)
    atRiskCount = Number(atRiskRes.rows[0].cnt)
  }

  const fmtUSD = (n: number) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  const METRICS: Metric[] = [
    {
      label: "Total Outstanding",
      value: fmtUSD(totalOutstanding),
      trend: "neutral",
      trendLabel: `${outstandingCount} open invoice${outstandingCount !== 1 ? "s" : ""}`,
      icon: DollarSign,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
    },
    {
      label: "Overdue",
      value: fmtUSD(overdue),
      trend: "up",
      trendLabel: overdue > 0 ? "Requires attention" : "No overdue invoices",
      icon: AlertTriangle,
      iconColor: "text-rose-400",
      iconBg: "bg-rose-500/10",
      valueColor: "text-rose-400",
    },
    {
      label: "Paid This Month",
      value: fmtUSD(paidThisMonth),
      trend: "up",
      trendLabel: paidThisMonth > 0 ? "Received this month" : "Nothing received yet",
      icon: CheckCircle,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
      valueColor: "text-emerald-400",
    },
    {
      label: "At-Risk Invoices",
      value: String(atRiskCount),
      trend: atRiskCount > 0 ? "down" : "neutral",
      trendLabel: atRiskCount > 0 ? `${atRiskCount} high-risk open` : "None flagged",
      icon: FileWarning,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/10",
      valueColor: "text-amber-400",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {METRICS.map((m) => {
        const Icon = m.icon
        const TrendIcon = m.trend === "up" ? TrendingUp : m.trend === "down" ? TrendingDown : null
        const trendColor =
          m.label === "Overdue"
            ? "text-rose-400"
            : m.trend === "up"
            ? "text-emerald-400"
            : m.trend === "down"
            ? "text-amber-400"
            : "text-muted-foreground"

        return (
          <div
            key={m.label}
            className="bg-card rounded-xl p-5 flex flex-col gap-4"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{m.label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${m.iconBg}`}>
                <Icon className={`w-4.5 h-4.5 ${m.iconColor}`} strokeWidth={1.8} />
              </div>
            </div>
            <div>
              <p className={`text-3xl font-bold tracking-tight ${m.valueColor ?? "text-foreground"}`}>
                {m.value}
              </p>
              <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${trendColor}`}>
                {TrendIcon && <TrendIcon className="w-3.5 h-3.5" strokeWidth={2} />}
                <span>{m.trendLabel}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
