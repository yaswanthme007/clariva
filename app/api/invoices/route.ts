import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'
import { computeRisk } from '@/lib/risk'

const createSchema = z.object({
  client_id: z.string().uuid(),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  description: z.string().optional(),
  line_items: z
    .array(z.object({ description: z.string(), qty: z.number(), unitPrice: z.number() }))
    .optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows } = await pool.query(
    `SELECT i.*, c.name AS client_name
     FROM invoices i
     JOIN clients c ON c.id = i.client_id
     WHERE i.user_id = $1
     ORDER BY i.created_at DESC`,
    [session.user.id]
  )

  return NextResponse.json({ invoices: rows })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { client_id, issue_date, due_date, amount, currency, description, line_items } = parsed.data

  const { rows: clientRows } = await pool.query(
    'SELECT id, payment_score, avg_payment_days FROM clients WHERE id = $1 AND user_id = $2',
    [client_id, userId]
  )
  if (!clientRows[0]) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  const client = clientRows[0]

  const year = new Date().getFullYear()
  const { rows: [{ cnt }] } = await pool.query<{ cnt: number }>(
    'SELECT COUNT(*)::int AS cnt FROM invoices WHERE user_id = $1',
    [userId]
  )
  const invoiceNumber = `INV-${year}-${String(cnt + 1).padStart(4, '0')}`

  const risk = computeRisk(
    Number(client.payment_score),
    Number(client.avg_payment_days),
    new Date(due_date)
  )

  const { rows: [invoice] } = await pool.query(
    `INSERT INTO invoices
       (user_id, client_id, invoice_number, issue_date, due_date, amount, currency,
        status, description, line_items, risk_score, risk_label, risk_reason)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      userId, client_id, invoiceNumber, issue_date, due_date, amount, currency,
      description ?? null,
      line_items ? JSON.stringify(line_items) : null,
      risk.risk_score, risk.risk_label, risk.risk_reason,
    ]
  )

  await pool.query(
    'UPDATE clients SET total_invoiced = total_invoiced + $1 WHERE id = $2',
    [amount, client_id]
  )

  return NextResponse.json({ invoice }, { status: 201 })
}
