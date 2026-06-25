import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const { id } = await params

  const [clientRes, statsRes, paymentStatsRes, monthlyRes, invoicesRes] = await Promise.all([
    pool.query(
      'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
      [id, userId]
    ),
    pool.query<{ invoice_count: number; outstanding: number }>(
      `SELECT
         COUNT(DISTINCT i.id)::int AS invoice_count,
         COALESCE(SUM(i.amount) FILTER (WHERE i.status IN ('pending', 'overdue')), 0)::float AS outstanding
       FROM invoices i
       WHERE i.client_id = $1 AND i.user_id = $2`,
      [id, userId]
    ),
    pool.query<{ total_paid: number; on_time_count: number }>(
      `SELECT
         COUNT(*)::int AS total_paid,
         COUNT(*) FILTER (WHERE days_late <= 0)::int AS on_time_count
       FROM payment_history
       WHERE client_id = $1`,
      [id]
    ),
    pool.query<{ month: string; days: number }>(
      `SELECT
         to_char(date_trunc('month', paid_at), 'Mon') AS month,
         ROUND(AVG(days_to_pay))::int AS days
       FROM invoices
       WHERE client_id = $1 AND status = 'paid'
         AND paid_at IS NOT NULL AND days_to_pay IS NOT NULL
       GROUP BY date_trunc('month', paid_at)
       ORDER BY date_trunc('month', paid_at) ASC
       LIMIT 7`,
      [id]
    ),
    pool.query(
      `SELECT * FROM invoices
       WHERE client_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [id, userId]
    ),
  ])

  const client = clientRes.rows[0]
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const stats = statsRes.rows[0]
  const payStats = paymentStatsRes.rows[0]

  return NextResponse.json({
    client: {
      ...client,
      invoice_count:  stats.invoice_count,
      outstanding:    stats.outstanding,
      total_paid_count: payStats.total_paid,
      on_time_count:  payStats.on_time_count,
      monthly:        monthlyRes.rows,
      invoices:       invoicesRes.rows,
    },
  })
}
