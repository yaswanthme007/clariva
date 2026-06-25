import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const { rows } = await pool.query(
    `SELECT
       c.*,
       COUNT(DISTINCT i.id)::int AS invoice_count,
       COALESCE(SUM(i.amount) FILTER (WHERE i.status IN ('pending', 'overdue')), 0)::float AS outstanding
     FROM clients c
     LEFT JOIN invoices i ON i.client_id = c.id
     WHERE c.user_id = $1
     GROUP BY c.id
     ORDER BY c.created_at DESC`,
    [userId]
  )

  return NextResponse.json({ clients: rows })
}

const createSchema = z.object({
  name:  z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { name, email, phone } = parsed.data

  const { rows: [client] } = await pool.query(
    `INSERT INTO clients (user_id, name, email, phone, payment_score, avg_payment_days, total_invoiced, total_paid)
     VALUES ($1, $2, $3, $4, 100, 0, 0, 0)
     RETURNING *`,
    [userId, name, email, phone ?? null]
  )

  return NextResponse.json({ client }, { status: 201 })
}
