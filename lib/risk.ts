export interface RiskResult {
  risk_score: number
  risk_label: 'Low' | 'Medium' | 'High'
  risk_reason: string
}

export function computeRisk(
  clientPaymentScore: number,
  avgPaymentDays: number,
  dueDate: Date
): RiskResult {
  const daysUntilDue = Math.floor((dueDate.getTime() - Date.now()) / 86_400_000)

  let score = 100 - clientPaymentScore

  if (daysUntilDue < 0) score = Math.min(100, score + 20)
  else if (daysUntilDue < 7) score = Math.min(100, score + 10)

  if (avgPaymentDays > 30) score = Math.min(100, score + 10)
  else if (avgPaymentDays > 14) score = Math.min(100, score + 5)

  score = Math.max(0, Math.min(100, Math.round(score)))

  const risk_label: RiskResult['risk_label'] =
    score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low'

  const parts: string[] = [`Client payment score: ${clientPaymentScore}/100.`]
  if (avgPaymentDays > 0) parts.push(`Average payment delay: ${avgPaymentDays} day(s).`)
  if (daysUntilDue < 0) parts.push(`Invoice is ${Math.abs(daysUntilDue)} day(s) overdue.`)
  else if (daysUntilDue < 7) parts.push(`Due in ${daysUntilDue} day(s) — payment window is closing.`)

  return { risk_score: score, risk_label, risk_reason: parts.join(' ') }
}
