"use client"

import { useState, useEffect } from "react"
import { Sparkles, AlertTriangle, TrendingUp, Info } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Insight {
  title:    string
  insight:  string
  priority: "high" | "medium" | "low"
}

const PRIORITY = {
  high:   { dot: "bg-rose-500",    icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,    badge: "text-rose-400 bg-rose-500/10 ring-rose-500/20",    label: "High"   },
  medium: { dot: "bg-amber-500",   icon: <TrendingUp    className="w-3.5 h-3.5 text-amber-400" />,   badge: "text-amber-400 bg-amber-500/10 ring-amber-500/20",   label: "Medium" },
  low:    { dot: "bg-emerald-500", icon: <Info          className="w-3.5 h-3.5 text-emerald-400" />, badge: "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20", label: "Low" },
}

export function AiInsights() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading,  setLoading]  = useState(true)
  const [empty,    setEmpty]    = useState(false)

  useEffect(() => {
    fetch("/api/ai/insights", { method: "POST" })
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        if (!json?.insights?.length) {
          setEmpty(true)
        } else {
          setInsights(json.insights)
        }
      })
      .catch(() => setEmpty(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-card rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">AI Insights</h2>
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
          <Sparkles className="w-3 h-3" />
          Powered by Clariva AI
        </span>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        {loading ? (
          <div className="flex flex-col gap-5">
            <p className="text-xs text-muted-foreground animate-pulse">Analyzing your invoices…</p>
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="w-2 h-2 rounded-full mt-2 shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : empty ? (
          <div className="py-10 flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No insights yet</p>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Create your first invoice to unlock AI-powered business insights and cash flow recommendations.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {insights.map((ins, i) => {
              const p = PRIORITY[ins.priority] ?? PRIORITY.low
              return (
                <div
                  key={i}
                  className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                  style={i < insights.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${p.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {p.icon}
                      <p className="text-sm font-semibold text-foreground">{ins.title}</p>
                      <span className={`ml-auto text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ring-1 ring-inset ${p.badge}`}>
                        {p.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{ins.insight}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
