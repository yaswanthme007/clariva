import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
console.log('DB URL starts with:', process.env.DATABASE_URL?.substring(0, 30))

import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
})

async function run(sql: string, params: unknown[] = []) {
  return pool.query(sql, params)
}

async function seed() {
  console.log('Seeding Clariva demo data…')

  // ── 1. Demo user ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('demo123', 10)

  const { rows: [user] } = await run(
    `INSERT INTO users (email, name, password_hash, business_name, currency)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    ['demo@clariva.com', 'Demo User', passwordHash, 'Clariva Demo Co.', 'USD']
  )
  const userId: string = user.id
  console.log('  user:', userId)

  // ── 2. Clients ────────────────────────────────────────────────────────────
  const clientData = [
    {
      name: 'Acme Corporation',
      email: 'billing@acme.com',
      company: 'Acme Corp',
      phone: '+1 555-0101',
      payment_score: 95,
      avg_payment_days: 3,
      total_invoiced: '28500.00',
      total_paid: '28500.00',
    },
    {
      name: 'Beta Dynamics',
      email: 'ap@betadynamics.io',
      company: 'Beta Dynamics Inc.',
      phone: '+1 555-0202',
      payment_score: 72,
      avg_payment_days: 18,
      total_invoiced: '15200.00',
      total_paid: '12000.00',
    },
    {
      name: 'Gamma Solutions',
      email: 'finance@gammasol.com',
      company: 'Gamma Solutions LLC',
      phone: '+1 555-0303',
      payment_score: 45,
      avg_payment_days: 42,
      total_invoiced: '9800.00',
      total_paid: '4900.00',
    },
    {
      name: 'Delta Ventures',
      email: 'payments@deltaventures.com',
      company: 'Delta Ventures',
      phone: '+1 555-0404',
      payment_score: 60,
      avg_payment_days: 28,
      total_invoiced: '22000.00',
      total_paid: '16500.00',
    },
  ]

  const clientIds: string[] = []
  for (const c of clientData) {
    const { rows: [row] } = await run(
      `INSERT INTO clients
         (user_id, name, email, company, phone, payment_score, avg_payment_days, total_invoiced, total_paid)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [userId, c.name, c.email, c.company, c.phone, c.payment_score, c.avg_payment_days, c.total_invoiced, c.total_paid]
    )
    if (row) clientIds.push(row.id)
  }

  // If rows already existed, fetch them
  if (clientIds.length < clientData.length) {
    const { rows } = await run(
      `SELECT id FROM clients WHERE user_id = $1 ORDER BY created_at`,
      [userId]
    )
    clientIds.length = 0
    rows.forEach((r) => clientIds.push(r.id))
  }

  const [acmeId, betaId, gammaId, deltaId] = clientIds
  console.log('  clients:', clientIds.length)

  // ── 3. Invoices ───────────────────────────────────────────────────────────
  // today = seed reference date
  const today = new Date('2025-06-20')
  const d = (offsetDays: number) => {
    const dt = new Date(today)
    dt.setDate(dt.getDate() + offsetDays)
    return dt.toISOString().slice(0, 10)
  }

  const invoiceData = [
    // Acme – paid on time
    {
      client_id: acmeId,
      invoice_number: 'INV-001',
      issue_date: d(-60),
      due_date: d(-30),
      amount: '12500.00',
      status: 'paid',
      description: 'Q1 consulting services',
      risk_score: 8,
      risk_label: 'Low',
      risk_reason: 'Client has excellent payment history.',
      paid_at: new Date(today.getTime() - 32 * 86400000),
      paid_amount: '12500.00',
      days_to_pay: 28,
    },
    {
      client_id: acmeId,
      invoice_number: 'INV-002',
      issue_date: d(-15),
      due_date: d(15),
      amount: '16000.00',
      status: 'pending',
      description: 'Q2 consulting services',
      risk_score: 12,
      risk_label: 'Low',
      risk_reason: 'Acme consistently pays within terms.',
      paid_at: null,
      paid_amount: null,
      days_to_pay: null,
    },
    // Beta – slow payer, one pending
    {
      client_id: betaId,
      invoice_number: 'INV-003',
      issue_date: d(-45),
      due_date: d(-15),
      amount: '7200.00',
      status: 'paid',
      description: 'Website redesign phase 1',
      risk_score: 55,
      risk_label: 'Medium',
      risk_reason: 'Beta has paid late on 2 of last 4 invoices.',
      paid_at: new Date(today.getTime() - 5 * 86400000),
      paid_amount: '7200.00',
      days_to_pay: 40,
    },
    {
      client_id: betaId,
      invoice_number: 'INV-004',
      issue_date: d(-20),
      due_date: d(10),
      amount: '8000.00',
      status: 'pending',
      description: 'Website redesign phase 2',
      risk_score: 58,
      risk_label: 'Medium',
      risk_reason: 'Payment pattern suggests likely 2–3 week delay.',
      paid_at: null,
      paid_amount: null,
      days_to_pay: null,
    },
    // Gamma – high risk, overdue
    {
      client_id: gammaId,
      invoice_number: 'INV-005',
      issue_date: d(-90),
      due_date: d(-60),
      amount: '4900.00',
      status: 'paid',
      description: 'Data migration project',
      risk_score: 78,
      risk_label: 'High',
      risk_reason: 'Gamma has a history of paying 30–60 days late.',
      paid_at: new Date(today.getTime() - 10 * 86400000),
      paid_amount: '4900.00',
      days_to_pay: 80,
    },
    {
      client_id: gammaId,
      invoice_number: 'INV-006',
      issue_date: d(-50),
      due_date: d(-20),
      amount: '4900.00',
      status: 'overdue',
      description: 'Data migration phase 2',
      risk_score: 82,
      risk_label: 'High',
      risk_reason: 'Invoice is 20 days past due; client has poor payment score.',
      paid_at: null,
      paid_amount: null,
      days_to_pay: null,
    },
    // Delta – medium risk, mixed
    {
      client_id: deltaId,
      invoice_number: 'INV-007',
      issue_date: d(-70),
      due_date: d(-40),
      amount: '11000.00',
      status: 'paid',
      description: 'Product strategy workshop',
      risk_score: 42,
      risk_label: 'Medium',
      risk_reason: 'Delta pays within 30 days of due date on average.',
      paid_at: new Date(today.getTime() - 25 * 86400000),
      paid_amount: '11000.00',
      days_to_pay: 45,
    },
    {
      client_id: deltaId,
      invoice_number: 'INV-008',
      issue_date: d(-10),
      due_date: d(20),
      amount: '11000.00',
      status: 'pending',
      description: 'Q3 retainer',
      risk_score: 45,
      risk_label: 'Medium',
      risk_reason: 'Moderate risk based on past 28-day average payment window.',
      paid_at: null,
      paid_amount: null,
      days_to_pay: null,
    },
  ]

  const invoiceIds: string[] = []
  for (const inv of invoiceData) {
    const { rows: [row] } = await run(
      `INSERT INTO invoices
         (user_id, client_id, invoice_number, issue_date, due_date, amount, currency,
          status, description, risk_score, risk_label, risk_reason, paid_at, paid_amount, days_to_pay)
       VALUES ($1,$2,$3,$4,$5,$6,'USD',$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [
        userId, inv.client_id, inv.invoice_number, inv.issue_date, inv.due_date,
        inv.amount, inv.status, inv.description,
        inv.risk_score, inv.risk_label, inv.risk_reason,
        inv.paid_at, inv.paid_amount, inv.days_to_pay,
      ]
    )
    if (row) invoiceIds.push(row.id)
  }

  if (invoiceIds.length < invoiceData.length) {
    const { rows } = await run(
      `SELECT id FROM invoices WHERE user_id = $1 ORDER BY created_at`,
      [userId]
    )
    invoiceIds.length = 0
    rows.forEach((r) => invoiceIds.push(r.id))
  }
  console.log('  invoices:', invoiceIds.length)

  // ── 4. Payment history (for paid invoices) ────────────────────────────────
  const paidHistory = [
    // INV-001: Acme, paid 2 days early
    { client_id: acmeId, invoice_id: invoiceIds[0], amount: '12500.00', due_date: d(-30), paid_date: d(-32), days_late: -2 },
    // INV-003: Beta, paid 10 days late
    { client_id: betaId, invoice_id: invoiceIds[2], amount: '7200.00', due_date: d(-15), paid_date: d(-5), days_late: 10 },
    // INV-005: Gamma, paid 20 days late
    { client_id: gammaId, invoice_id: invoiceIds[4], amount: '4900.00', due_date: d(-60), paid_date: d(-10), days_late: 50 },
    // INV-007: Delta, paid 5 days late
    { client_id: deltaId, invoice_id: invoiceIds[6], amount: '11000.00', due_date: d(-40), paid_date: d(-25), days_late: 15 },
  ]

  for (const ph of paidHistory) {
    await run(
      `INSERT INTO payment_history (client_id, invoice_id, invoice_amount, due_date, paid_date, days_late)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT DO NOTHING`,
      [ph.client_id, ph.invoice_id, ph.amount, ph.due_date, ph.paid_date, ph.days_late]
    )
  }
  console.log('  payment_history rows:', paidHistory.length)

  console.log('Seed complete.')
  await pool.end()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
