import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { groq } from '@/lib/groq'
import { pool } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const { clientId } = await req.json()
    if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 })

    const { rows: [client] } = await pool.query(
      'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
      [clientId, userId]
    )
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [invoiceR, historyR] = await Promise.allSettled([
      pool.query(
        `SELECT status, amount::float, issue_date, due_date, paid_at, days_to_pay
         FROM invoices WHERE client_id = $1 AND status != 'cancelled'
         ORDER BY created_at DESC LIMIT 20`,
        [clientId]
      ),
      pool.query(
        `SELECT days_late, paid_date FROM payment_history
         WHERE client_id = $1 ORDER BY paid_date DESC LIMIT 20`,
        [clientId]
      ),
    ])

    const invoices = invoiceR.status === 'fulfilled' ? invoiceR.value.rows : []
    const history  = historyR.status === 'fulfilled' ? historyR.value.rows : []

    const totalInvoiced = invoices.reduce((s: number, i: { amount: number }) => s + Number(i.amount), 0)
    const paidCount     = invoices.filter((i: { status: string }) => i.status === 'paid').length
    const overdueCount  = invoices.filter((i: { status: string }) => i.status === 'overdue').length
    const avgDaysLate   = history.length
      ? (history.reduce((s: number, h: { days_late: number }) => s + Number(h.days_late ?? 0), 0) / history.length).toFixed(1)
      : null

    const clientData = {
      name:              client.name,
      reliabilityScore:  client.payment_score ?? 100,
      avgDaysToPay:      client.avg_payment_days ?? 0,
      totalInvoices:     invoices.length,
      totalInvoiced:     `$${totalInvoiced.toFixed(0)}`,
      paidCount,
      overdueCount,
      avgDaysLate:       avgDaysLate ?? 'no payment history yet',
      recentPayments:    history.slice(0, 5).map((h: { days_late: number; paid_date: string }) => ({
        daysLate: h.days_late,
        paidDate: h.paid_date,
      })),
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 350,
      messages: [
        {
          role: 'system',
          content: `You are a B2B financial advisor. Write a 3-sentence client payment assessment covering:
1. Overall reliability and payment behavior (use specific numbers)
2. Key risk factors or positive signals
3. Concrete recommended payment terms or collection action
Write in second person as if advising the invoice sender. Be direct and specific.`,
        },
        {
          role: 'user',
          content: `Client payment data: ${JSON.stringify(clientData)}`,
        },
      ],
    })

    const assessment = completion.choices[0]?.message?.content?.trim() ?? ''
    return NextResponse.json({ assessment })
  } catch (err) {
    console.error('Client assessment error:', err)
    return NextResponse.json({ assessment: '' })
  }
}
