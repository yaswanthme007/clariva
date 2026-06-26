import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { MetricCards }    from "@/components/dashboard/metric-cards"
import { CashFlowChart }  from "@/components/dashboard/cash-flow-chart"
import { RecentInvoices } from "@/components/dashboard/recent-invoices"
import { AiInsights }     from "@/components/dashboard/ai-insights"
import { Skeleton }        from "@/components/ui/skeleton"

function MetricCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl p-5 flex flex-col gap-4" style={{ border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="w-9 h-9 rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-9 w-28 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

function RecentInvoicesSkeleton() {
  return (
    <div className="bg-card rounded-xl" style={{ border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-4 w-14" />
      </div>
      <div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-4" style={i < 4 ? { borderBottom: "1px solid var(--border)" } : {}}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20 hidden sm:block" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 pt-20 md:pt-8 min-h-full">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-all hover:bg-gray-100 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">New Invoice</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {/* Metric cards */}
      <Suspense fallback={<MetricCardsSkeleton />}>
        <MetricCards />
      </Suspense>

      {/* Chart */}
      <CashFlowChart />

      {/* Invoices table */}
      <Suspense fallback={<RecentInvoicesSkeleton />}>
        <RecentInvoices />
      </Suspense>

      {/* AI Insights */}
      <AiInsights />

    </div>
  )
}
