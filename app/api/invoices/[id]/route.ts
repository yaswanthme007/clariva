import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'
import { computeRisk } from '@/lib/risk'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { rows: [invoice] } = await pool.query(
    `SELECT i.*, c.name AS client_name, c.email AS client_email,
            c.payment_score, c.avg_payment_days
     FROM invoices i
     JOIN clients c ON c.id = i.client_id
     WHERE i.id = $1 AND i.user_id = $2`,
    [id, session.user.id]
  )
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { rows: history } = await pool.query(
    'SELECT * FROM payment_history WHERE invoice_id = $1 ORDER BY created_at',
    [id]
  )

  return NextResponse.json({ invoice: { ...invoice, payment_history: history } })
}

const updateSchema = z.object({
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']),
  paid_date: z.string().optional(),
  paid_amount: z.number().optional(),
})

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const { id } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { status, paid_date, paid_amount } = parsed.data

  const { rows: [inv] } = await pool.query(
    'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
    [id, userId]
  )
  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (status === 'paid') {
    const paidAt = paid_date ? new Date(`${paid_date}T12:00:00Z`) : new Date()
    const dueDate = new Date(inv.due_date)
    const issueDate = new Date(inv.issue_date)
    const daysToPayFromIssue = Math.floor((paidAt.getTime() - issueDate.getTime()) / 86_400_000)
    const daysLate = Math.floor((paidAt.getTime() - dueDate.getTime()) / 86_400_000)

    await pool.query(
      `UPDATE invoices
       SET status = 'paid', paid_at = $1, paid_amount = $2, days_to_pay = $3, updated_at = NOW()
       WHERE id = $4`,
      [paidAt, paid_amount ?? inv.amount, daysToPayFromIssue, id]
    )

    await pool.query(
      `INSERT INTO payment_history (client_id, invoice_id, invoice_amount, due_date, paid_date, days_late)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [inv.client_id, id, inv.amount, inv.due_date, paidAt.toISOString().slice(0, 10), daysLate]
    )

    const { rows: histRows } = await pool.query<{ days_late: number }>(
      'SELECT days_late FROM payment_history WHERE client_id = $1',
      [inv.client_id]
    )
    const avgDaysLate =
      histRows.reduce((s, r) => s + (r.days_late ?? 0), 0) / histRows.length
    const newScore = Math.max(0, Math.min(100, Math.round(100 - avgDaysLate * 2)))

    await pool.query(
      'UPDATE clients SET payment_score = $1, avg_payment_days = $2, total_paid = total_paid + $3 WHERE id = $4',
      [newScore, Math.round(avgDaysLate), inv.amount, inv.client_id]
    )

    const { rows: [client] } = await pool.query(
      'SELECT payment_score, avg_payment_days FROM clients WHERE id = $1',
      [inv.client_id]
    )
    const risk = computeRisk(
      Number(client.payment_score),
      Number(client.avg_payment_days),
      dueDate
    )
    await pool.query(
      'UPDATE invoices SET risk_score = $1, risk_label = $2, risk_reason = $3 WHERE id = $4',
      [risk.risk_score, risk.risk_label, risk.risk_reason, id]
    )
  } else {
    await pool.query(
      'UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    )
  }

  const { rows: [updated] } = await pool.query('SELECT * FROM invoices WHERE id = $1', [id])
  return NextResponse.json({ invoice: updated })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { rows: [inv] } = await pool.query(
    'SELECT id FROM invoices WHERE id = $1 AND user_id = $2',
    [id, session.user.id]
  )
  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await pool.query(
    "UPDATE invoices SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
    [id]
  )

  return NextResponse.json({ success: true })
}
