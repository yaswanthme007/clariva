import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { groq } from '@/lib/groq'
import { pool } from '@/lib/db'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const [totalR, overdueR, outstandingR, clientsR, paidMonthR] = await Promise.allSettled([
      pool.query<{ total: number }>(
        `SELECT COUNT(*)::int AS total FROM invoices WHERE user_id = $1 AND status != 'cancelled'`,
        [userId]
      ),
      pool.query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM invoices WHERE user_id = $1 AND status = 'overdue'`,
        [userId]
      ),
      pool.query<{ total: number }>(
        `SELECT COALESCE(SUM(amount), 0)::float AS total
         FROM invoices WHERE user_id = $1 AND status IN ('pending', 'overdue')`,
        [userId]
      ),
      pool.query<{ name: string; total_outstanding: number; avg_days_late: number }>(
        `SELECT c.name,
                COALESCE(SUM(i.amount) FILTER (WHERE i.status NOT IN ('paid','cancelled')), 0)::float AS total_outstanding,
                COALESCE(AVG(ph.days_late), 0)::float AS avg_days_late
         FROM clients c
         JOIN invoices i ON i.client_id = c.id AND i.user_id = $1
         LEFT JOIN payment_history ph ON ph.client_id = c.id
         WHERE c.user_id = $1
         GROUP BY c.id, c.name
         ORDER BY total_outstanding DESC
         LIMIT 5`,
        [userId]
      ),
      pool.query<{ total: number }>(
        `SELECT COALESCE(SUM(amount), 0)::float AS total
         FROM invoices
         WHERE user_id = $1 AND status = 'paid' AND paid_at >= date_trunc('month', NOW())`,
        [userId]
      ),
    ])

    const total       = totalR.status       === 'fulfilled' ? (totalR.value.rows[0]?.total ?? 0)       : 0
    const overdue     = overdueR.status     === 'fulfilled' ? (overdueR.value.rows[0]?.count ?? 0)      : 0
    const outstanding = outstandingR.status === 'fulfilled' ? (outstandingR.value.rows[0]?.total ?? 0)  : 0
    const topClients  = clientsR.status     === 'fulfilled' ? clientsR.value.rows                       : []
    const paidMonth   = paidMonthR.status   === 'fulfilled' ? (paidMonthR.value.rows[0]?.total ?? 0)    : 0

    if (total === 0) return NextResponse.json({ insights: [] })

    const clientSummary = topClients
      .filter(c => c.total_outstanding > 0)
      .map(c => `${c.name}: $${Number(c.total_outstanding).toFixed(0)} outstanding, avg ${Number(c.avg_days_late).toFixed(0)}d late`)
      .join('; ') || 'all clients current'

    const businessData = {
      totalInvoices:              total,
      overdueCount:               overdue,
      overduePercentage:          total > 0 ? Math.round((overdue / total) * 100) : 0,
      totalOutstanding:           `$${Number(outstanding).toFixed(0)}`,
      collectedThisMonth:         `$${Number(paidMonth).toFixed(0)}`,
      clientsWithOpenBalances:    clientSummary,
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a B2B financial advisor. Given business invoice data, provide exactly 3 concise, actionable insights.
Return ONLY valid JSON: {"insights": [{"title": string, "insight": string, "priority": "high"|"medium"|"low"}]}
Rules: be specific with the numbers provided; focus on cash flow risk, collection actions, client patterns; each insight must be 1-2 sentences max.`,
        },
        {
          role: 'user',
          content: `Business data: ${JSON.stringify(businessData)}`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? '{}'
    const parsed = JSON.parse(raw)
    return NextResponse.json({ insights: Array.isArray(parsed.insights) ? parsed.insights : [] })
  } catch (err) {
    console.error('AI insights error:', err)
    return NextResponse.json({ insights: [] })
  }
}
