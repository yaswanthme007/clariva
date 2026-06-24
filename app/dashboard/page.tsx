import { Plus } from "lucide-react"
import { MetricCards }    from "@/components/dashboard/metric-cards"
import { CashFlowChart }  from "@/components/dashboard/cash-flow-chart"
import { RecentInvoices } from "@/components/dashboard/recent-invoices"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 pt-20 md:pt-8 min-h-full">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tuesday, June 24, 2026
          </p>
        </div>
        <button
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-all hover:bg-indigo-700 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">New Invoice</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Metric cards */}
      <MetricCards />

      {/* Chart */}
      <CashFlowChart />

      {/* Invoices table */}
      <RecentInvoices />

    </div>
  )
}
