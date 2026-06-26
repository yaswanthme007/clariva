import { pool } from '@/lib/db'

export interface RiskCalculation {
  score: number  // 0 = no risk, 100 = maximum risk (matches UI's riskColor convention)
  label: 'Low' | 'Medium' | 'High'
  reason: string
  factors: {
    avgDaysLate: number
    latePct: number
    maxDaysLate: number
    outstanding: number
    invoiceCount: number
  }
}

export async function calculateRiskScore(
  clientId: string,
  invoiceAmount: number,
  _dueDate: Date
): Promise<RiskCalculation> {
  const [historyRes, outstandingRes] = await Promise.all([
    pool.query<{
      invoice_count: number
      avg_days_late: number
      max_days_late: number
      late_count: number
    }>(
      `SELECT
         COUNT(*)::int AS invoice_count,
         COALESCE(AVG(days_late), 0)::float AS avg_days_late,
         COALESCE(MAX(days_late), 0)::int AS max_days_late,
         COUNT(*) FILTER (WHERE days_late > 0)::int AS late_count
       FROM payment_history
       WHERE client_id = $1`,
      [clientId]
    ),
    pool.query<{ outstanding: number }>(
      `SELECT COALESCE(SUM(amount), 0)::float AS outstanding
       FROM invoices
       WHERE client_id = $1 AND status IN ('pending', 'overdue')`,
      [clientId]
    ),
  ])

  const h = historyRes.rows[0]
  const outstanding = Number(outstandingRes.rows[0].outstanding)
  const invoiceCount = Number(h.invoice_count)

  // New client — neutral low risk
  if (invoiceCount === 0) {
    return {
      score: 30,
      label: 'Low',
      reason: 'New client with no payment history. Risk scored conservatively at 30/100.',
      factors: { avgDaysLate: 0, latePct: 0, maxDaysLate: 0, outstanding, invoiceCount: 0 },
    }
  }

  const avgDaysLate = Number(h.avg_days_late)
  const maxDaysLate = Number(h.max_days_late)
  const lateCount   = Number(h.late_count)
  const latePct     = Math.round((lateCount / invoiceCount) * 100)

  // Start at 0 (no risk), add penalties — score = risk percentage
  let score = 0

  if (avgDaysLate > 30)      score += 30
  else if (avgDaysLate > 14) score += 15
  else if (avgDaysLate > 7)  score += 10

  if (latePct > 50)      score += 20
  else if (latePct > 25) score += 10

  if (outstanding > invoiceAmount * 2) score += 15

  score = Math.min(100, score)

  const label: RiskCalculation['label'] = score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low'

  const parts: string[] = []
  if (avgDaysLate > 0)  parts.push(`avg ${Math.round(avgDaysLate)} days late`)
  if (latePct > 0)      parts.push(`${latePct}% of payments late`)
  if (outstanding > invoiceAmount * 2)
    parts.push(`$${Math.round(outstanding).toLocaleString()} existing outstanding`)

  const reason = parts.length
    ? `${label} risk (${score}/100): ${parts.join(', ')}.`
    : `${label} risk (${score}/100) — client has a strong on-time payment record.`

  return {
    score,
    label,
    reason,
    factors: {
      avgDaysLate: Math.round(avgDaysLate),
      latePct,
      maxDaysLate,
      outstanding,
      invoiceCount,
    },
  }
}
