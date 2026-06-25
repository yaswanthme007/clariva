import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"

type Status = "Paid" | "Pending" | "Overdue"
type Risk   = "Low"  | "Medium"  | "High"

interface Invoice {
  id: string
  dbId: string
  client: string
  amount: string
  due: string
  status: Status
  risk: Risk
}

const STATUS_STYLES: Record<Status, string> = {
  Paid:    "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  Pending: "bg-amber-500/10   text-amber-400   ring-amber-500/20",
  Overdue: "bg-rose-500/10    text-rose-400    ring-rose-500/20",
}

const RISK_STYLES: Record<Risk, string> = {
  Low:    "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  Medium: "bg-amber-500/10   text-amber-400   ring-amber-500/20",
  High:   "bg-rose-500/10    text-rose-400    ring-rose-500/20",
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

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export async function RecentInvoices() {
  const session = await auth()
  const userId = session?.user?.id

  let invoices: Invoice[] = []

  if (userId) {
    const { rows } = await pool.query(
      `SELECT i.id, i.invoice_number, i.amount, i.due_date, i.status, i.risk_label, c.name AS client_name
       FROM invoices i
       JOIN clients c ON c.id = i.client_id
       WHERE i.user_id = $1
       ORDER BY i.created_at DESC
       LIMIT 7`,
      [userId]
    )

    invoices = rows.map(r => ({
      id:     r.invoice_number,
      dbId:   r.id,
      client: r.client_name,
      amount: "$" + Number(r.amount).toLocaleString("en-US"),
      due:    formatDate(r.due_date),
      status: capitalize(r.status) as Status,
      risk:   (r.risk_label ?? "Low") as Risk,
    }))
  }

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
        <Link
          href="/dashboard/invoices"
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-foreground transition-colors"
        >
          View all
          <ArrowUpRight className="w-4 h-4" />
        </Link>
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
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No invoices yet.
                </td>
              </tr>
            ) : invoices.map((inv, i) => (
              <tr
                key={inv.dbId}
                className="hover:bg-muted/40 transition-colors cursor-pointer"
                style={i < invoices.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}
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
        {invoices.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">No invoices yet.</p>
        ) : invoices.map((inv) => (
          <div key={inv.dbId} className="px-5 py-4 flex flex-col gap-2.5">
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
