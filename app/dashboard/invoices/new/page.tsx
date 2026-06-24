"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  ChevronDown,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  id: number
  description: string
  quantity: string
  unitPrice: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CLIENTS = [
  "Bright Labs",
  "Meridian Co.",
  "Foxwood Creative",
  "Apex Solutions",
  "Harbor Consulting",
  "Orion Media",
  "Starside Digital",
  "Vantage Partners",
  "Summit Tech",
  "Nexus Group",
]

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
  // AI extract
  const [extractText, setExtractText]   = useState("")
  const [extracting, setExtracting]     = useState(false)

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

  function handleExtract() {
    if (!extractText.trim()) return
    setExtracting(true)
    setTimeout(() => {
      // Simulate AI filling the form with parsed values
      setClient("Meridian Co.")
      setInvoiceNum("INV-0092")
      setIssueDate("2026-06-24")
      setDueDate("2026-07-24")
      setCurrency("USD")
      setDescription("Web development services — Q2 2026 retainer")
      setLineItems([
        { id: nextId++, description: "Frontend development",   quantity: "40", unitPrice: "150" },
        { id: nextId++, description: "UI/UX design review",    quantity: "8",  unitPrice: "175" },
        { id: nextId++, description: "QA & bug fixes",         quantity: "12", unitPrice: "120" },
      ])
      setExtracting(false)
    }, 1800)
  }

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
            <Select
              id="client"
              value={client}
              onChange={setClient}
              options={CLIENTS}
              placeholder="Select a client…"
            />
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
            className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-all hover:bg-gray-100 active:scale-[0.98]"
          >
            Create Invoice
          </button>
        </div>
      </div>
    </div>
  )
}
