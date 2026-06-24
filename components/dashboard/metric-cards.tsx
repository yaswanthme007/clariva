import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, CheckCircle, FileWarning } from "lucide-react"

type Trend = "up" | "down" | "neutral"

interface Metric {
  label: string
  value: string
  trend: Trend
  trendLabel: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  valueColor?: string
}

const METRICS: Metric[] = [
  {
    label: "Total Outstanding",
    value: "$24,500",
    trend: "neutral",
    trendLabel: "12 open invoices",
    icon: DollarSign,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    label: "Overdue",
    value: "$6,200",
    trend: "up",
    trendLabel: "+$1,400 vs last month",
    icon: AlertTriangle,
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/10",
    valueColor: "text-rose-400",
  },
  {
    label: "Paid This Month",
    value: "$18,900",
    trend: "up",
    trendLabel: "+22% vs last month",
    icon: CheckCircle,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    valueColor: "text-emerald-400",
  },
  {
    label: "At-Risk Invoices",
    value: "3",
    trend: "down",
    trendLabel: "Down from 5 last month",
    icon: FileWarning,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10",
    valueColor: "text-amber-400",
  },
]

export function MetricCards() {
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
