"use client"

import { useState, useEffect, useRef } from "react"
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
  Loader2,
  AlertCircle,
  Download,
  RefreshCw,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

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

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#f43f5e", "#ec4899"]
const CONFETTI_PIECES = Array.from({ length: 54 }, (_, i) => ({
  id: i,
  left: `${(i * 1.85 + (i % 7) * 5.1) % 100}%`,
  delay: `${(i * 0.043) % 0.7}s`,
  duration: `${1.9 + (i % 5) * 0.18}s`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  w: 5 + (i % 6),
  h: 3 + (i % 4),
  radius: i % 3 === 0 ? "50%" : "2px",
  rot: (i * 47) % 360,
}))

function ConfettiExplosion() {
  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          80%  { opacity: 0.9; }
          100% { transform: translateY(96vh) rotate(600deg); opacity: 0; }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
        {CONFETTI_PIECES.map(p => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: p.left,
              top: "-8px",
              width: p.w,
              height: p.h,
              background: p.color,
              borderRadius: p.radius,
              transform: `rotate(${p.rot}deg)`,
              animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
            }}
          />
        ))}
      </div>
    </>
  )
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
  const [displayScore, setDisplayScore] = useState(0)
  const r    = 44
  const circ = 2 * Math.PI * r
  const filled = (displayScore / 100) * circ
  const { stroke, text, label } = riskColor(score)

  useEffect(() => {
    const id = setTimeout(() => setDisplayScore(score), 60)
    return () => clearTimeout(id)
  }, [score])

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
            style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.22,1,0.36,1)" }}
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

  const [invoice,         setInvoice]         = useState<InvoiceData | null>(null)
  const [loading,         setLoading]         = useState(true)
  const [fetchError,      setFetchError]      = useState("")
  const [status,          setStatus]          = useState<Status>("Pending")
  const [reminderData,    setReminderData]    = useState<{ subject: string; body: string } | null>(null)
  const [reminderError,   setReminderError]   = useState("")
  const [generatingEmail, setGeneratingEmail] = useState(false)
  const [copied,          setCopied]          = useState(false)
  const [markPaidPhase,   setMarkPaidPhase]   = useState<"idle" | "confirming" | "saving">("idle")
  const [showConfetti,    setShowConfetti]    = useState(false)
  const [downloading,     setDownloading]     = useState(false)

  const riskCalledRef = useRef(false)
  const reminderRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      setFetchError("")
      try {
        const res = await fetch(`/api/invoices/${id}`)
        if (!res.ok) {
          setFetchError(res.status === 404 ? "Invoice not found." : "Failed to load invoice. Please try again.")
          return
        }
        const { invoice: raw } = await res.json()
        const parsed = parseInvoice(raw)
        setInvoice(parsed)
        setStatus(parsed.status)
      } catch {
        setFetchError("Something went wrong loading this invoice. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!id || !invoice || riskCalledRef.current) return
    riskCalledRef.current = true
    fetch(`/api/invoices/${id}/risk`, { method: "POST" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.risk_reason) {
          setInvoice(prev => prev
            ? { ...prev, riskScore: data.risk_score, riskReason: data.risk_reason }
            : prev
          )
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, invoice])

  function copyReminder() {
    if (!reminderData) return
    navigator.clipboard.writeText(`Subject: ${reminderData.subject}\n\n${reminderData.body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDownloadPdf() {
    if (!id || !invoice) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/invoices/${id}/pdf`)
      if (!res.ok) return
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      a.download = `invoice-${invoice.invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  async function handleGenerateReminder() {
    if (!id) return
    setGeneratingEmail(true)
    setReminderError("")
    try {
      const res = await fetch("/api/ai/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: id }),
      })

      let data: { subject?: string; body?: string; error?: string } = {}
      try { data = await res.json() } catch { /* non-JSON body */ }

      console.log("[reminder] status:", res.status, "response:", data)

      if (!res.ok) {
        setReminderError(data.error ?? `Error ${res.status} — please try again`)
        return
      }

      const subject = data.subject ?? ""
      const body    = data.body    ?? ""
      console.log("[reminder] setReminderData →", { subject: subject.slice(0, 80), bodyLen: body.length })

      setReminderData({ subject, body })
      // Give React one tick to mount the card, then scroll into view
      setTimeout(() => {
        reminderRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }, 80)
    } catch (err) {
      console.error("[reminder] network error:", err)
      setReminderError("Network error — please check your connection and try again")
    } finally {
      setGeneratingEmail(false)
    }
  }

  async function confirmPaid() {
    if (!id) return
    setMarkPaidPhase("saving")
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid", paid_date: new Date().toISOString().slice(0, 10) }),
      })
      if (!res.ok) { setMarkPaidPhase("idle"); return }
      setStatus("Paid")
      setMarkPaidPhase("idle")
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
      const getRes = await fetch(`/api/invoices/${id}`)
      if (getRes.ok) {
        const { invoice: raw } = await getRes.json()
        const parsed = parseInvoice(raw)
        setInvoice(parsed)
        setStatus(parsed.status)
      }
    } catch {
      setMarkPaidPhase("idle")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6 md:p-8 pt-20 md:pt-8 min-h-full max-w-5xl mx-auto w-full">
        <Skeleton className="h-4 w-28" />
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <div className="bg-card rounded-xl px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ border: "1px solid var(--border)" }}>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-12 w-44" />
          </div>
          <div className="flex gap-8">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (fetchError || !invoice) {
    return (
      <div className="flex flex-col gap-4 p-8 pt-20 md:pt-8">
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </Link>
        <div className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-rose-400 bg-rose-500/10" style={{ border: "1px solid rgba(244,63,94,0.2)" }}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          {fetchError || "Invoice not found."}
        </div>
      </div>
    )
  }

  const grandTotal   = invoice.lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0)
  const { stroke: _s, ...rc } = riskColor(invoice.riskScore)

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 pt-20 md:pt-8 min-h-full max-w-5xl mx-auto w-full">

      <style>{`
        @keyframes reminderFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reminder-card-enter {
          animation: reminderFadeUp 0.38s cubic-bezier(0.22,1,0.36,1) forwards;
        }
      `}</style>

      {showConfetti && <ConfettiExplosion />}

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
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {downloading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                : <><Download className="w-4 h-4" /> Download PDF</>
              }
            </button>

            <button
              onClick={handleGenerateReminder}
              disabled={generatingEmail}
              className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {generatingEmail ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
              ) : (
                <><Mail className="w-4 h-4" /> Generate Reminder</>
              )}
            </button>

            {status !== "Paid" && (
              <button
                onClick={() => {
                  if (markPaidPhase === "idle") {
                    setMarkPaidPhase("confirming")
                    setTimeout(() => setMarkPaidPhase(p => p === "confirming" ? "idle" : p), 5000)
                  } else if (markPaidPhase === "confirming") {
                    confirmPaid()
                  }
                }}
                disabled={markPaidPhase === "saving"}
                className={`flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
                  markPaidPhase === "confirming"
                    ? "bg-amber-500 text-amber-950 animate-pulse hover:bg-amber-400"
                    : "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                }`}
              >
                {markPaidPhase === "saving"
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : markPaidPhase === "confirming"
                  ? <><Check className="w-4 h-4" /> Confirm Payment?</>
                  : <><CheckCircle className="w-4 h-4" /> Mark as Paid</>
                }
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
            <p className="text-muted-foreground leading-relaxed">
              {invoice.riskReason || "Analyzing payment risk…"}
            </p>
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

      {/* ── Reminder error ────────────────────────────────────────────────────── */}
      {reminderError && (
        <div
          className="flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm text-rose-400 bg-rose-500/10"
          style={{ border: "1px solid rgba(244,63,94,0.25)" }}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{reminderError}</span>
          <button
            onClick={() => setReminderError("")}
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── AI-Generated Reminder ──────────────────────────────────────────────── */}
      {reminderData && (
        <div
          ref={reminderRef}
          className="bg-card rounded-xl overflow-hidden reminder-card-enter"
          style={{ border: "1px solid var(--border)" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 flex-wrap gap-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="w-3.5 h-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">AI-Generated Reminder</h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <Sparkles className="w-3 h-3" />
                AI Generated
              </span>
              <div className="w-px h-4 bg-border" />
              <button
                onClick={handleGenerateReminder}
                disabled={generatingEmail}
                className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generatingEmail
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <RefreshCw className="w-3 h-3" />
                }
                Regenerate
              </button>
              <button
                onClick={copyReminder}
                className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                {copied
                  ? <Check className="w-3 h-3 text-emerald-400" />
                  : <Copy className="w-3 h-3" />
                }
                {copied ? "Copied!" : "Copy to Clipboard"}
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 flex flex-col gap-5">
            {/* Subject */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Subject</p>
              <p className="text-sm font-semibold text-foreground">{reminderData.subject}</p>
            </div>

            {/* Email body */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Body</p>
              <pre
                className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed rounded-lg px-5 py-4 bg-muted/30"
                style={{ borderLeft: "3px solid var(--primary)" }}
              >
                {reminderData.body}
              </pre>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
