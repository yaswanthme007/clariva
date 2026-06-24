"use client"

import { useState } from "react"
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

// ─── Seed data ────────────────────────────────────────────────────────────────

const INVOICE = {
  id:          "INV-0090",
  client:      "Meridian Co.",
  contact:     "Alex Torres",
  email:       "atorres@meridian.co",
  amount:      8750,
  issueDate:   "Jun 3, 2026",
  dueDate:     "Jun 28, 2026",
  status:      "Overdue" as Status,
  riskScore:   87,
  currency:    "USD",
  description: "Q2 brand strategy & digital campaign consulting",
  lineItems:   [
    { description: "Brand strategy workshop (2 days)", qty: 2,  unitPrice: 1800 },
    { description: "Digital campaign planning",         qty: 1,  unitPrice: 2400 },
    { description: "Creative direction (monthly)",      qty: 1,  unitPrice: 1950 },
    { description: "Presentation deck & deliverables",  qty: 1,  unitPrice: 800  },
  ] as LineItem[],
  aiExplanation:
    "Meridian Co. has a 73% late-payment rate over the last 12 months, with an average delay of 18 days past due. Their last 3 invoices were all paid after a second reminder. Cash flow irregularities detected in Q1 suggest budget pressure. Risk is classified High — proactive outreach is recommended before the due date.",
}

const PAYMENT_HISTORY: PaymentEvent[] = [
  { date: "Jun 3, 2026",  label: "Invoice issued",         type: "issued",   note: "Sent to atorres@meridian.co" },
  { date: "Jun 18, 2026", label: "Reminder sent",          type: "reminder", note: "Automated 10-day reminder" },
  { date: "Jun 28, 2026", label: "Payment due — missed",   type: "overdue",  note: "No payment received" },
  { date: "Jul 2, 2026",  label: "Follow-up email sent",   type: "reminder", note: "Manual follow-up by Jamie Davis" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })

const STATUS_STYLE: Record<Status, string> = {
  Paid:    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  Pending: "bg-amber-50   text-amber-700   ring-1 ring-inset ring-amber-200",
  Overdue: "bg-rose-50    text-rose-700    ring-1 ring-inset ring-rose-200",
}

function riskColor(score: number) {
  if (score >= 70) return { stroke: "#f43f5e", text: "text-rose-600",   label: "High Risk",   bg: "bg-rose-50",   ring: "ring-rose-200"   }
  if (score >= 40) return { stroke: "#f59e0b", text: "text-amber-600",  label: "Medium Risk", bg: "bg-amber-50",  ring: "ring-amber-200"  }
  return              { stroke: "#10b981", text: "text-emerald-600", label: "Low Risk",    bg: "bg-emerald-50",ring: "ring-emerald-200" }
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
  issued:   <div className="w-7 h-7 rounded-full bg-indigo-100  flex items-center justify-center"><CalendarDays className="w-3.5 h-3.5 text-primary" /></div>,
  reminder: <div className="w-7 h-7 rounded-full bg-amber-100   flex items-center justify-center"><Clock         className="w-3.5 h-3.5 text-amber-600" /></div>,
  overdue:  <div className="w-7 h-7 rounded-full bg-rose-100    flex items-center justify-center"><AlertTriangle  className="w-3.5 h-3.5 text-rose-600" /></div>,
  paid:     <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center"><ShieldCheck    className="w-3.5 h-3.5 text-emerald-600" /></div>,
}

const DRAFT_EMAIL = {
  subject: `Payment Reminder: ${INVOICE.id} — ${fmt(INVOICE.amount)} overdue`,
  body: `Hi ${INVOICE.contact},

I hope this message finds you well. I'm reaching out regarding invoice ${INVOICE.id} for ${fmt(INVOICE.amount)}, which was due on ${INVOICE.dueDate}.

As of today, we haven't received payment. Could you please let us know the status or expected payment date?

If there's anything on your end we can help clarify, don't hesitate to reach out.

Invoice details:
  • Invoice #: ${INVOICE.id}
  • Amount due: ${fmt(INVOICE.amount)}
  • Due date: ${INVOICE.dueDate}
  • Description: ${INVOICE.description}

Thank you for your prompt attention.

Best regards,
Jamie Davis
Acme Studio`,
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function InvoiceDetailPage() {
  const [emailOpen,    setEmailOpen]    = useState(false)
  const [emailBody,    setEmailBody]    = useState(DRAFT_EMAIL.body)
  const [editingEmail, setEditingEmail] = useState(false)
  const [copied,       setCopied]       = useState(false)
  const [markPaidOpen, setMarkPaidOpen] = useState(false)
  const [paidDate,     setPaidDate]     = useState("")
  const [status,       setStatus]       = useState<Status>(INVOICE.status)

  function copyEmail() {
    navigator.clipboard.writeText(`Subject: ${DRAFT_EMAIL.subject}\n\n${emailBody}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function confirmPaid() {
    setStatus("Paid")
    setMarkPaidOpen(false)
  }

  const grandTotal = INVOICE.lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0)
  const { stroke: _s, ...rc } = riskColor(INVOICE.riskScore)

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
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">{INVOICE.id}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[status]}`}>
                {status}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">
              <span className="font-medium text-foreground">{INVOICE.client}</span>
              {" · "}
              {INVOICE.contact}
              {" · "}
              <a href={`mailto:${INVOICE.email}`} className="hover:text-primary transition-colors">{INVOICE.email}</a>
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
                className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
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
          <p className="text-4xl font-bold tracking-tight text-foreground tabular-nums">{fmt(INVOICE.amount)}</p>
        </div>
        <div className="flex gap-8 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Issue Date</p>
            <p className="font-semibold text-foreground">{INVOICE.issueDate}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Due Date</p>
            <p className="font-semibold text-rose-600">{INVOICE.dueDate}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Currency</p>
            <p className="font-semibold text-foreground">{INVOICE.currency}</p>
          </div>
        </div>
      </div>

      {/* Mark as Paid panel */}
      {markPaidOpen && (
        <div className="bg-emerald-50 rounded-xl px-6 py-5 flex flex-col sm:flex-row sm:items-end gap-4" style={{ border: "1px solid #bbf7d0" }}>
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800 mb-2">Confirm payment received</p>
            <label className="block text-xs text-emerald-700 mb-1">Date payment received</label>
            <input
              type="date"
              value={paidDate}
              onChange={e => setPaidDate(e.target.value)}
              className="h-9 px-3 rounded-lg text-sm bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-shadow"
              style={{ border: "1px solid #86efac" }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMarkPaidOpen(false)}
              className="h-9 px-4 rounded-lg text-sm font-medium border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmPaid}
              disabled={!paidDate}
              className="h-9 px-4 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Confirm
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
                  editingEmail ? "bg-primary text-white" : "border border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Pencil className="w-3 h-3" />
                {editingEmail ? "Done" : "Edit"}
              </button>
              <button
                onClick={copyEmail}
                className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
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
              <p className="text-sm text-foreground font-medium">{DRAFT_EMAIL.subject}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Body</p>
              {editingEmail ? (
                <textarea
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  rows={12}
                  className="w-full text-sm text-foreground bg-muted/40 rounded-lg px-4 py-3 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
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
          <RiskRing score={INVOICE.riskScore} />
          <div className={`w-full rounded-lg px-4 py-3 text-xs leading-relaxed text-left ${rc.bg}`} style={{ border: `1px solid var(--border)` }}>
            <p className={`font-semibold text-xs mb-1.5 uppercase tracking-wide ${rc.text}`}>AI Analysis</p>
            <p className="text-muted-foreground leading-relaxed">{INVOICE.aiExplanation}</p>
          </div>
        </div>

        {/* Line items + payment history */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Invoice details */}
          <div className="bg-card rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-sm font-semibold text-foreground">Invoice Details</p>
              <p className="text-xs text-muted-foreground mt-0.5">{INVOICE.description}</p>
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
                {INVOICE.lineItems.map((li, i) => (
                  <tr
                    key={i}
                    className="hover:bg-muted/30 transition-colors"
                    style={i < INVOICE.lineItems.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}
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
            <p className="text-sm font-semibold text-foreground mb-5">Payment History — {INVOICE.client}</p>
            <ol className="relative flex flex-col gap-0">
              {PAYMENT_HISTORY.map((ev, i) => (
                <li key={i} className="flex gap-4 pb-5 last:pb-0 relative">
                  {/* Connector line */}
                  {i < PAYMENT_HISTORY.length - 1 && (
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
