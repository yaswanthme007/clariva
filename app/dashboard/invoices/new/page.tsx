"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  ChevronDown,
  AlertCircle,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  id: number
  description: string
  quantity: string
  unitPrice: string
}

interface ApiClient {
  id: string
  name: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"]

let nextId = 4

// ─── Field helpers ────────────────────────────────────────────────────────────

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
      {children}
    </label>
  )
}

function Input({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  className = "",
}: {
  id?: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full h-9 px-3 rounded-lg text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow ${className}`}
      style={{ border: "1px solid var(--border)" }}
    />
  )
}

function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 pl-3 pr-8 rounded-lg text-sm bg-card text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
        style={{ border: "1px solid var(--border)" }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewInvoicePage() {
  const router = useRouter()

  // Real clients from API
  const [apiClients, setApiClients]       = useState<ApiClient[]>([])
  const [clientsLoaded, setClientsLoaded] = useState(false)

  useEffect(() => {
    fetch("/api/clients")
      .then(r => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(data => setApiClients((data.clients ?? []).map((c: any) => ({ id: c.id, name: c.name }))))
      .catch(() => {})
      .finally(() => setClientsLoaded(true))
  }, [])

  // Custom client dropdown state
  const [clientOpen, setClientOpen]       = useState(false)
  const clientDropdownRef                 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setClientOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setClientOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  // AI extract
  const [extractText, setExtractText] = useState("")
  const [extracting, setExtracting]   = useState(false)
  const [extractError, setExtractError] = useState("")
  const [submitError, setSubmitError]   = useState("")

  // Form fields
  const [client, setClient]             = useState("")
  const [invoiceNum, setInvoiceNum]     = useState("INV-0092")
  const [issueDate, setIssueDate]       = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate]           = useState("")
  const [currency, setCurrency]         = useState("USD")
  const [description, setDescription]  = useState("")

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: 1, description: "", quantity: "1", unitPrice: "" },
    { id: 2, description: "", quantity: "1", unitPrice: "" },
    { id: 3, description: "", quantity: "1", unitPrice: "" },
  ])

  // Submit
  const [submitting, setSubmitting] = useState(false)

  // Derived totals
  const lineTotal = (item: LineItem) => {
    const qty   = parseFloat(item.quantity)  || 0
    const price = parseFloat(item.unitPrice) || 0
    return qty * price
  }

  const grandTotal = lineItems.reduce((sum, item) => sum + lineTotal(item), 0)

  function addLineItem() {
    setLineItems(prev => [...prev, { id: nextId++, description: "", quantity: "1", unitPrice: "" }])
  }

  function removeLineItem(id: number) {
    setLineItems(prev => prev.filter(item => item.id !== id))
  }

  function updateLineItem(id: number, field: keyof Omit<LineItem, "id">, val: string) {
    setLineItems(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item))
  }

  async function handleExtract() {
    if (!extractText.trim()) return
    setExtracting(true)
    setExtractError("")
    try {
      const res = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractText }),
      })
      if (!res.ok) {
        setExtractError("AI extraction failed. Please fill in the form manually.")
        return
      }
      const { extracted } = await res.json()
      if (!extracted) return

      if (extracted.client_name) {
        const match = apiClients.find(
          c => c.name.toLowerCase() === extracted.client_name.toLowerCase()
        )
        if (match) setClient(match.name)
      }
      if (extracted.invoice_number) setInvoiceNum(extracted.invoice_number)
      if (extracted.issue_date)     setIssueDate(extracted.issue_date)
      if (extracted.due_date)       setDueDate(extracted.due_date)
      if (extracted.currency)       setCurrency(extracted.currency)
      if (extracted.description)    setDescription(extracted.description)

      if (Array.isArray(extracted.line_items) && extracted.line_items.length > 0) {
        setLineItems(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          extracted.line_items.map((li: any) => ({
            id: nextId++,
            description: li.description ?? "",
            quantity:    String(li.qty ?? 1),
            unitPrice:   String(li.unitPrice ?? ""),
          }))
        )
      } else if (extracted.amount) {
        setLineItems([{
          id: nextId++,
          description: extracted.description ?? "Services rendered",
          quantity:    "1",
          unitPrice:   String(extracted.amount),
        }])
      }
    } catch {
      setExtractError("Something went wrong with AI extraction. Please try again.")
    } finally {
      setExtracting(false)
    }
  }

  async function handleSubmit() {
    const selectedClient = apiClients.find(c => c.name === client)
    if (!selectedClient || !dueDate) return

    const validItems = lineItems.filter(li => li.description && parseFloat(li.unitPrice) > 0)
    const amount = grandTotal > 0 ? grandTotal : undefined
    if (!amount) return

    setSubmitting(true)
    setSubmitError("")
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id:   selectedClient.id,
          issue_date:  issueDate,
          due_date:    dueDate,
          amount,
          currency,
          description: description || undefined,
          line_items:  validItems.length > 0
            ? validItems.map(li => ({
                description: li.description,
                qty:         parseFloat(li.quantity) || 1,
                unitPrice:   parseFloat(li.unitPrice) || 0,
              }))
            : undefined,
        }),
      })
      if (res.ok) {
        const { invoice } = await res.json()
        fetch(`/api/invoices/${invoice.id}/risk`, { method: "POST" }).catch(() => {})
        router.push("/dashboard/invoices")
      } else {
        setSubmitError("Failed to create invoice. Please try again.")
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const clientNames = apiClients.map(c => c.name) // kept for AI extract matching
  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(n)

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 pt-20 md:pt-8 min-h-full max-w-4xl mx-auto w-full">

      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/invoices"
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">New Invoice</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Fill in the details or use AI Extract</p>
        </div>
      </div>

      {/* ── AI Extract panel ─────────────────────────────────────── */}
      <div
        className="rounded-xl p-5 bg-secondary"
        style={{
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary">
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2} />
          </div>
          <h2 className="text-sm font-semibold text-foreground">AI Extract</h2>
          <span className="ml-auto text-xs text-muted-foreground font-medium">Powered by Clariva AI</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          Paste raw invoice text, an email, or a PDF extract below — Clariva will auto-fill the form fields and line items for you.
        </p>
        <textarea
          value={extractText}
          onChange={(e) => setExtractText(e.target.value)}
          placeholder="Paste invoice text here… e.g. 'Invoice from Meridian Co. dated June 24 for web development — 40hrs at $150/hr, 8hrs design at $175/hr…'"
          rows={4}
          className="w-full px-3 py-2.5 rounded-lg text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow resize-none"
          style={{ border: "1px solid var(--border)" }}
        />
        {extractError && (
          <div className="flex items-center gap-2 mt-3 rounded-lg px-3 py-2 text-sm text-rose-400 bg-rose-500/10" style={{ border: "1px solid rgba(244,63,94,0.2)" }}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            {extractError}
          </div>
        )}
        <div className="flex justify-end mt-3">
          <button
            onClick={handleExtract}
            disabled={extracting || !extractText.trim()}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-all hover:bg-gray-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {extracting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting…</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5" /> Extract with AI</>
            )}
          </button>
        </div>
      </div>

      {/* ── Invoice details ──────────────────────────────────────── */}
      <div className="bg-card rounded-xl" style={{ border: "1px solid var(--border)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold text-foreground">Invoice Details</h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <Label htmlFor="client">Client</Label>
            {!clientsLoaded ? (
              <div
                className="w-full h-9 rounded-lg animate-pulse bg-muted"
                style={{ border: "1px solid var(--border)" }}
              />
            ) : apiClients.length === 0 ? (
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 h-9 rounded-lg flex items-center px-3 text-sm text-muted-foreground select-none"
                  style={{ border: "1px solid var(--border)" }}
                >
                  No clients yet
                </div>
                <Link
                  href="/dashboard/clients"
                  className="h-9 px-3 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-gray-100 flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Add Client
                </Link>
              </div>
            ) : (
              <div className="relative" ref={clientDropdownRef}>
                <button
                  id="client"
                  type="button"
                  onClick={() => setClientOpen(o => !o)}
                  className="w-full h-9 pl-3 pr-8 rounded-lg text-sm bg-card text-left flex items-center focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <span className={client ? "text-foreground" : "text-muted-foreground"}>
                    {client || "Select a client…"}
                  </span>
                  <ChevronDown
                    className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground transition-transform duration-150 ${clientOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {clientOpen && (
                  <div
                    className="absolute z-50 mt-1 w-full rounded-lg py-1 shadow-xl overflow-hidden"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  >
                    <button
                      type="button"
                      onClick={() => { setClient(""); setClientOpen(false) }}
                      className="w-full h-8 px-3 text-left text-sm text-muted-foreground hover:bg-white/5 transition-colors"
                    >
                      Select a client…
                    </button>
                    {apiClients.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setClient(c.name); setClientOpen(false) }}
                        className={`w-full h-8 px-3 text-left text-sm transition-colors hover:bg-white/5 ${
                          client === c.name
                            ? "text-foreground font-medium bg-white/5"
                            : "text-foreground"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                    <div className="my-1 border-t" style={{ borderColor: "var(--border)" }} />
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/clients")}
                      className="w-full h-8 px-3 text-left text-sm text-primary hover:bg-white/5 transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3 h-3" strokeWidth={2.5} />
                      Add new client
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="invoiceNum">Invoice Number</Label>
            <Input
              id="invoiceNum"
              value={invoiceNum}
              onChange={setInvoiceNum}
              placeholder="INV-0001"
            />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select
              id="currency"
              value={currency}
              onChange={setCurrency}
              options={CURRENCIES}
            />
          </div>
          <div>
            <Label htmlFor="issueDate">Issue Date</Label>
            <Input
              id="issueDate"
              type="date"
              value={issueDate}
              onChange={setIssueDate}
            />
          </div>
          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={setDueDate}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Label htmlFor="description">Description / Notes</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of work or services rendered…"
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow resize-none"
              style={{ border: "1px solid var(--border)" }}
            />
          </div>
        </div>
      </div>

      {/* ── Line Items ───────────────────────────────────────────── */}
      <div className="bg-card rounded-xl" style={{ border: "1px solid var(--border)" }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold text-foreground">Line Items</h2>
          <span className="text-xs text-muted-foreground">{lineItems.length} item{lineItems.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Header row — desktop only */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_80px_100px_100px_36px] gap-3 px-6 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          {["Description", "Qty", "Unit Price", "Total", ""].map((h) => (
            <span key={h} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-border">
          {lineItems.map((item, i) => {
            const total = lineTotal(item)
            return (
              <div
                key={item.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_100px_36px] gap-3 px-6 py-3.5 items-center"
              >
                {/* Mobile label */}
                <span className="sm:hidden text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Item {i + 1}
                </span>
                <Input
                  value={item.description}
                  onChange={(v) => updateLineItem(item.id, "description", v)}
                  placeholder="Describe the service or product…"
                />
                <div>
                  <span className="sm:hidden block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Qty</span>
                  <Input
                    value={item.quantity}
                    onChange={(v) => updateLineItem(item.id, "quantity", v)}
                    placeholder="1"
                  />
                </div>
                <div>
                  <span className="sm:hidden block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Unit Price</span>
                  <Input
                    value={item.unitPrice}
                    onChange={(v) => updateLineItem(item.id, "unitPrice", v)}
                    placeholder="0.00"
                  />
                </div>
                {/* Row total */}
                <div className="flex items-center">
                  <span className="sm:hidden text-xs font-semibold text-muted-foreground uppercase tracking-wide mr-2">Total:</span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {total > 0 ? fmtCurrency(total) : <span className="text-muted-foreground font-normal">—</span>}
                  </span>
                </div>
                {/* Remove */}
                <button
                  onClick={() => removeLineItem(item.id)}
                  disabled={lineItems.length === 1}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors justify-self-end"
                  title="Remove line item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer: add row + grand total */}
        <div
          className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={addLineItem}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add line item
          </button>

          <div className="flex flex-col items-end gap-1 sm:min-w-[200px]">
            <div className="flex items-center justify-between w-full gap-8">
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Subtotal</span>
              <span className="text-sm tabular-nums text-foreground">{fmtCurrency(grandTotal)}</span>
            </div>
            <div className="flex items-center justify-between w-full gap-8">
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Tax (0%)</span>
              <span className="text-sm tabular-nums text-muted-foreground">{fmtCurrency(0)}</span>
            </div>
            <div className="w-full h-px bg-border my-1" />
            <div className="flex items-center justify-between w-full gap-8">
              <span className="text-sm font-bold text-foreground">Grand Total</span>
              <span className="text-lg font-bold text-primary tabular-nums">{fmtCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-rose-400 bg-rose-500/10" style={{ border: "1px solid rgba(244,63,94,0.2)" }}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          {submitError}
        </div>
      )}

      {/* ── Submit ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 pb-8">
        <Link
          href="/dashboard/invoices"
          className="h-9 px-4 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          style={{ border: "1px solid var(--border)" }}
        >
          Cancel
        </Link>
        <div className="flex items-center gap-3">
          <button
            className="h-9 px-4 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            style={{ border: "1px solid var(--border)" }}
          >
            Save as Draft
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !client || !dueDate || grandTotal <= 0}
            className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-all hover:bg-gray-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating…" : "Create Invoice"}
          </button>
        </div>
      </div>
    </div>
  )
}
