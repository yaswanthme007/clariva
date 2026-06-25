"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle,
  Mail,
  Copy,
  Check,
  CalendarDays,
  Sparkles,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Pencil,
  X,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

type Status = "Paid" | "Pending" | "Overdue"

interface LineItem {
  description: string
  qty: number
  unitPrice: number
}

interface PaymentEvent {
  date: string
  label: string
  note?: string
  type: "paid" | "overdue" | "reminder" | "issued"
}

interface InvoiceData {
  invoiceNumber: string
  client: string
  email: string
  amount: number
  issueDate: string
  dueDate: string
  status: Status
  riskScore: number
  riskReason: string
  currency: string
  description: string
  lineItems: LineItem[]
  timeline: PaymentEvent[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })

function formatDateDisplay(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseInvoice(r: any): InvoiceData {
  const status = capitalize(r.status) as Status
  const issueDate = formatDateDisplay(r.issue_date)
  const dueDate = formatDateDisplay(r.due_date)

  const timeline: PaymentEvent[] = [
    { date: issueDate, label: "Invoice issued", type: "issued", note: `Sent to ${r.client_email}` },
  ]
  if (status === "Overdue") {
    timeline.push({ date: dueDate, label: "Payment due — missed", type: "overdue", note: "No payment received" })
  } else if (status === "Pending") {
    timeline.push({ date: dueDate, label: "Payment due", type: "reminder", note: "Awaiting payment" })
  }
  if (r.paid_at) {
    timeline.push({
      date: formatDateDisplay(r.paid_at),
      label: "Payment received",
      type: "paid",
      note: `Amount: ${fmt(Number(r.paid_amount ?? r.amount))}`,
    })
  }

  const lineItems: LineItem[] = Array.isArray(r.line_items) && r.line_items.length > 0
    ? r.line_items
    : [{ description: r.description ?? "Services rendered", qty: 1, unitPrice: Number(r.amount) }]

  return {
    invoiceNumber: r.invoice_number,
    client:        r.client_name,
    email:         r.client_email,
    amount:        Number(r.amount),
    issueDate,
    dueDate,
    status,
    riskScore:     Number(r.risk_score ?? 0),
    riskReason:    r.risk_reason ?? "",
    currency:      r.currency ?? "USD",
    description:   r.description ?? "",
    lineItems,
    timeline,
  }
}

const STATUS_STYLE: Record<Status, string> = {
  Paid:    "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20",
  Pending: "bg-amber-500/10   text-amber-400   ring-1 ring-inset ring-amber-500/20",
  Overdue: "bg-rose-500/10    text-rose-400    ring-1 ring-inset ring-rose-500/20",
}

function riskColor(score: number) {
  if (score >= 70) return { stroke: "#f43f5e", text: "text-rose-400",   label: "High Risk",   bg: "bg-rose-500/10",    ring: "ring-rose-500/20"   }
  if (score >= 40) return { stroke: "#f59e0b", text: "text-amber-400",  label: "Medium Risk", bg: "bg-amber-500/10",   ring: "ring-amber-500/20"  }
  return              { stroke: "#10b981", text: "text-emerald-400", label: "Low Risk",    bg: "bg-emerald-500/10", ring: "ring-emerald-500/20" }
}

function RiskRing({ score }: { score: number }) {
  const r      = 44
  const circ   = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const { stroke, text, label } = riskColor(score)
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circ}`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold tabular-nums ${text}`}>{score}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">/ 100</span>
        </div>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${text} ring-1 ring-inset ${riskColor(score).ring} ${riskColor(score).bg}`}>
        {label}
      </span>
    </div>
  )
}

const EVENT_ICON: Record<PaymentEvent["type"], React.ReactNode> = {
  issued:   <div className="w-7 h-7 rounded-full bg-muted      flex items-center justify-center"><CalendarDays className="w-3.5 h-3.5 text-foreground" /></div>,
  reminder: <div className="w-7 h-7 rounded-full bg-amber-500/10   flex items-center justify-center"><Clock         className="w-3.5 h-3.5 text-amber-400" /></div>,
  overdue:  <div className="w-7 h-7 rounded-full bg-rose-500/10    flex items-center justify-center"><AlertTriangle  className="w-3.5 h-3.5 text-rose-400" /></div>,
  paid:     <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center"><ShieldCheck    className="w-3.5 h-3.5 text-emerald-400" /></div>,
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [invoice,      setInvoice]      = useState<InvoiceData | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [status,       setStatus]       = useState<Status>("Pending")
  const [emailOpen,    setEmailOpen]    = useState(false)
  const [emailBody,    setEmailBody]    = useState("")
  const [editingEmail, setEditingEmail] = useState(false)
  const [copied,       setCopied]       = useState(false)
  const [markPaidOpen, setMarkPaidOpen] = useState(false)
  const [paidDate,     setPaidDate]     = useState("")
  const [saving,       setSaving]       = useState(false)

  function buildEmailBody(inv: InvoiceData): string {
    return `Hi ${inv.client},

I hope this message finds you well. I'm reaching out regarding invoice ${inv.invoiceNumber} for ${fmt(inv.amount)}, which was due on ${inv.dueDate}.

As of today, we haven't received payment. Could you please let us know the status or expected payment date?

If there's anything on your end we can help clarify, don't hesitate to reach out.

Invoice details:
  • Invoice #: ${inv.invoiceNumber}
  • Amount due: ${fmt(inv.amount)}
  • Due date: ${inv.dueDate}
  • Description: ${inv.description}

Thank you for your prompt attention.

Best regards,
Jamie Davis
Acme Studio`
  }

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/invoices/${id}`)
        if (!res.ok) return
        const { invoice: raw } = await res.json()
        const parsed = parseInvoice(raw)
        setInvoice(parsed)
        setStatus(parsed.status)
        setEmailBody(buildEmailBody(parsed))
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function copyEmail() {
    if (!invoice) return
    const subject = `Payment Reminder: ${invoice.invoiceNumber} — ${fmt(invoice.amount)} overdue`
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${emailBody}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function confirmPaid() {
    if (!paidDate || !id) return
    setSaving(true)
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid", paid_date: paidDate }),
      })
      if (!res.ok) return
      setStatus("Paid")
      setMarkPaidOpen(false)
      // Reload full invoice (GET includes client_name/client_email from JOIN)
      const getRes = await fetch(`/api/invoices/${id}`)
      if (getRes.ok) {
        const { invoice: raw } = await getRes.json()
        const parsed = parseInvoice(raw)
        setInvoice(parsed)
        setStatus(parsed.status)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full p-8 pt-20 md:pt-8">
        <p className="text-muted-foreground text-sm">Loading invoice…</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex flex-col gap-4 p-8 pt-20 md:pt-8">
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </Link>
        <p className="text-muted-foreground">Invoice not found.</p>
      </div>
    )
  }

  const grandTotal   = invoice.lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0)
  const { stroke: _s, ...rc } = riskColor(invoice.riskScore)
  const emailSubject = `Payment Reminder: ${invoice.invoiceNumber} — ${fmt(invoice.amount)} overdue`

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 pt-20 md:pt-8 min-h-full max-w-5xl mx-auto w-full">

      {/* Back link + header */}
      <div>
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">{invoice.invoiceNumber}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[status]}`}>
                {status}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">
              <span className="font-medium text-foreground">{invoice.client}</span>
              {" · "}
              <a href={`mailto:${invoice.email}`} className="hover:text-primary transition-colors">{invoice.email}</a>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setEmailOpen(v => !v)}
              className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold border border-border bg-card text-foreground hover:bg-muted transition-colors"
            >
              <Mail className="w-4 h-4" />
              Generate Reminder
            </button>
            {status !== "Paid" && (
              <button
                onClick={() => setMarkPaidOpen(v => !v)}
                className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold bg-emerald-500 text-emerald-950 hover:bg-emerald-400 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Paid
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Amount hero */}
      <div className="bg-card rounded-xl px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ border: "1px solid var(--border)" }}>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Amount Due</p>
          <p className="text-4xl font-bold tracking-tight text-foreground tabular-nums">{fmt(invoice.amount)}</p>
        </div>
        <div className="flex gap-8 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Issue Date</p>
            <p className="font-semibold text-foreground">{invoice.issueDate}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Due Date</p>
            <p className={`font-semibold ${status === "Overdue" ? "text-rose-400" : "text-foreground"}`}>{invoice.dueDate}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Currency</p>
            <p className="font-semibold text-foreground">{invoice.currency}</p>
          </div>
        </div>
      </div>

      {/* Mark as Paid panel */}
      {markPaidOpen && (
        <div className="bg-emerald-500/10 rounded-xl px-6 py-5 flex flex-col sm:flex-row sm:items-end gap-4" style={{ border: "1px solid rgba(16,185,129,0.2)" }}>
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-400 mb-2">Confirm payment received</p>
            <label className="block text-xs text-emerald-400/80 mb-1">Date payment received</label>
            <input
              type="date"
              value={paidDate}
              onChange={e => setPaidDate(e.target.value)}
              className="h-9 px-3 rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-400/40 transition-shadow"
              style={{ border: "1px solid rgba(16,185,129,0.25)" }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMarkPaidOpen(false)}
              className="h-9 px-4 rounded-lg text-sm font-medium border border-border text-muted-foreground bg-card hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmPaid}
              disabled={!paidDate || saving}
              className="h-9 px-4 rounded-lg text-sm font-semibold bg-emerald-500 text-emerald-950 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving…" : "Confirm"}
            </button>
          </div>
        </div>
      )}

      {/* Reminder email panel */}
      {emailOpen && (
        <div className="bg-card rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Draft Reminder Email</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingEmail(v => !v)}
                className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition-colors ${
                  editingEmail ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Pencil className="w-3 h-3" />
                {editingEmail ? "Done" : "Edit"}
              </button>
              <button
                onClick={copyEmail}
                className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => setEmailOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="px-6 py-4 flex flex-col gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Subject</p>
              <p className="text-sm text-foreground font-medium">{emailSubject}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Body</p>
              {editingEmail ? (
                <textarea
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  rows={12}
                  className="w-full text-sm text-foreground bg-muted/40 rounded-lg px-4 py-3 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
                  style={{ border: "1px solid var(--border)" }}
                />
              ) : (
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed bg-muted/30 rounded-lg px-4 py-3">
                  {emailBody}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Risk score card */}
        <div className="bg-card rounded-xl px-6 py-6 flex flex-col items-center gap-4" style={{ border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 self-start">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">AI Risk Score</p>
          </div>
          <RiskRing score={invoice.riskScore} />
          <div className={`w-full rounded-lg px-4 py-3 text-xs leading-relaxed text-left ${rc.bg}`} style={{ border: `1px solid var(--border)` }}>
            <p className={`font-semibold text-xs mb-1.5 uppercase tracking-wide ${rc.text}`}>AI Analysis</p>
            <p className="text-muted-foreground leading-relaxed">{invoice.riskReason}</p>
          </div>
        </div>

        {/* Line items + payment history */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Invoice details */}
          <div className="bg-card rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-sm font-semibold text-foreground">Invoice Details</p>
              <p className="text-xs text-muted-foreground mt-0.5">{invoice.description}</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Description", "Qty", "Unit Price", "Total"].map(h => (
                    <th key={h} className={`px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide ${h === "Description" ? "text-left" : "text-right"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((li, i) => (
                  <tr
                    key={i}
                    className="hover:bg-muted/30 transition-colors"
                    style={i < invoice.lineItems.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}
                  >
                    <td className="px-6 py-3.5 text-foreground">{li.description}</td>
                    <td className="px-6 py-3.5 text-right text-muted-foreground tabular-nums">{li.qty}</td>
                    <td className="px-6 py-3.5 text-right text-muted-foreground tabular-nums">{fmt(li.unitPrice)}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-foreground tabular-nums">{fmt(li.qty * li.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid var(--border)" }}>
                  <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-muted-foreground text-right uppercase tracking-wide">Grand Total</td>
                  <td className="px-6 py-4 text-right text-xl font-bold text-foreground tabular-nums">{fmt(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment history */}
          <div className="bg-card rounded-xl px-6 py-5" style={{ border: "1px solid var(--border)" }}>
            <p className="text-sm font-semibold text-foreground mb-5">Payment History — {invoice.client}</p>
            <ol className="relative flex flex-col gap-0">
              {invoice.timeline.map((ev, i) => (
                <li key={i} className="flex gap-4 pb-5 last:pb-0 relative">
                  {i < invoice.timeline.length - 1 && (
                    <div className="absolute left-3.5 top-7 bottom-0 w-px bg-border" aria-hidden />
                  )}
                  <div className="shrink-0 z-10">{EVENT_ICON[ev.type]}</div>
                  <div className="flex flex-col gap-0.5 pt-0.5">
                    <p className="text-sm font-semibold text-foreground">{ev.label}</p>
                    {ev.note && <p className="text-xs text-muted-foreground">{ev.note}</p>}
                    <p className="text-xs text-muted-foreground tabular-nums">{ev.date}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

        </div>
      </div>
    </div>
  )
}
