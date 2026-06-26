import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'
import { calculateRiskScore } from '@/lib/risk-calculator'
import { groq } from '@/lib/groq'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const { id } = await params

  const { rows: [invoice] } = await pool.query(
    'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
    [id, userId]
  )
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const dueDate = new Date(invoice.due_date)
  const risk = await calculateRiskScore(invoice.client_id, Number(invoice.amount), dueDate)

  const daysUntilDue = Math.floor((dueDate.getTime() - Date.now()) / 86_400_000)
  const dueStatus = daysUntilDue < 0
    ? `${Math.abs(daysUntilDue)} days overdue`
    : daysUntilDue === 0
    ? 'due today'
    : `due in ${daysUntilDue} days`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    max_tokens: 200,
    messages: [
      {
        role: 'system',
        content:
          'You are a financial risk analyst for an invoice management platform. Write a single concise paragraph (2–4 sentences) explaining the payment risk for a business owner. Be specific about the numbers. Use plain English — no jargon.',
      },
      {
        role: 'user',
        content: `Risk score: ${risk.score}/100 (${risk.label} risk)
Invoice amount: $${Math.round(Number(invoice.amount)).toLocaleString()} — ${dueStatus}
Client history (${risk.factors.invoiceCount} paid invoices):
- Average days late: ${risk.factors.avgDaysLate}
- Late payment rate: ${risk.factors.latePct}%
- Worst delay: ${risk.factors.maxDaysLate} days
- Current outstanding balance: $${Math.round(risk.factors.outstanding).toLocaleString()}

Explain this risk profile to the invoice owner in 2–4 sentences.`,
      },
    ],
  })

  const aiReason =
    completion.choices[0]?.message?.content?.trim() || risk.reason

  await pool.query(
    `UPDATE invoices
     SET risk_score = $1, risk_label = $2, risk_reason = $3, updated_at = NOW()
     WHERE id = $4`,
    [risk.score, risk.label, aiReason, id]
  )

  return NextResponse.json({
    risk_score:  risk.score,
    risk_label:  risk.label,
    risk_reason: aiReason,
  })
}
