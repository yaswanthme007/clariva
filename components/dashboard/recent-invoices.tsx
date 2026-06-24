"use client"

import { ArrowUpRight } from "lucide-react"

type Status = "Paid" | "Pending" | "Overdue"
type Risk   = "Low"  | "Medium"  | "High"

interface Invoice {
  id: string
  client: string
  amount: string
  due: string
  status: Status
  risk: Risk
}

const INVOICES: Invoice[] = [
  { id: "INV-0091", client: "Bright Labs",       amount: "$4,200",  due: "Jun 20, 2026", status: "Paid",    risk: "Low"    },
  { id: "INV-0090", client: "Meridian Co.",       amount: "$8,750",  due: "Jun 28, 2026", status: "Overdue", risk: "High"   },
  { id: "INV-0089", client: "Foxwood Creative",   amount: "$1,950",  due: "Jul 3, 2026",  status: "Pending", risk: "Medium" },
  { id: "INV-0088", client: "Apex Solutions",     amount: "$12,400", due: "Jul 10, 2026", status: "Pending", risk: "Low"    },
  { id: "INV-0087", client: "Harbor Consulting",  amount: "$3,300",  due: "Jun 15, 2026", status: "Overdue", risk: "High"   },
  { id: "INV-0086", client: "Orion Media",        amount: "$6,600",  due: "Jul 18, 2026", status: "Pending", risk: "Medium" },
  { id: "INV-0085", client: "Starside Digital",   amount: "$2,100",  due: "May 30, 2026", status: "Paid",    risk: "Low"    },
]

const STATUS_STYLES: Record<Status, string> = {
  Paid:    "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Pending: "bg-amber-50   text-amber-700   ring-amber-200",
  Overdue: "bg-rose-50    text-rose-700    ring-rose-200",
}

const RISK_STYLES: Record<Risk, string> = {
  Low:    "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Medium: "bg-amber-50   text-amber-700   ring-amber-200",
  High:   "bg-rose-50    text-rose-700    ring-rose-200",
}

const RISK_DOT: Record<Risk, string> = {
  Low:    "bg-emerald-500",
  Medium: "bg-amber-500",
  High:   "bg-rose-500",
}

function Badge({ label, styles }: { label: string; styles: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${styles}`}
    >
      {label}
    </span>
  )
}

function RiskBadge({ risk }: { risk: Risk }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${RISK_STYLES[risk]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${RISK_DOT[risk]}`} />
      {risk}
    </span>
  )
}

export function RecentInvoices() {
  return (
    <div
      className="bg-card rounded-xl"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div>
          <h2 className="text-base font-semibold text-foreground">Recent Invoices</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Your latest 7 invoices</p>
        </div>
        <button className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-indigo-700 transition-colors">
          View all
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Table — desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Invoice #", "Client", "Amount", "Due Date", "Status", "Risk"].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((inv, i) => (
              <tr
                key={inv.id}
                className="hover:bg-muted/40 transition-colors cursor-pointer"
                style={i < INVOICES.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}
              >
                <td className="px-6 py-4 font-mono text-xs font-medium text-foreground">
                  {inv.id}
                </td>
                <td className="px-6 py-4 font-medium text-foreground">{inv.client}</td>
                <td className="px-6 py-4 font-semibold text-foreground tabular-nums">{inv.amount}</td>
                <td className="px-6 py-4 text-muted-foreground tabular-nums">{inv.due}</td>
                <td className="px-6 py-4">
                  <Badge label={inv.status} styles={STATUS_STYLES[inv.status]} />
                </td>
                <td className="px-6 py-4">
                  <RiskBadge risk={inv.risk} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-border">
        {INVOICES.map((inv) => (
          <div key={inv.id} className="px-5 py-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">{inv.id}</span>
              <span className="font-semibold text-foreground tabular-nums">{inv.amount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{inv.client}</span>
              <span className="text-xs text-muted-foreground">{inv.due}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge label={inv.status} styles={STATUS_STYLES[inv.status]} />
              <RiskBadge risk={inv.risk} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
