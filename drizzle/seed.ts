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

  // ── 3b. Future invoices for cash flow demo ────────────────────────────────
  const futureInvoices = [
    // INV-009: Acme — paid early
    {
      client_id: acmeId,
      invoice_number: 'INV-009',
      issue_date: '2026-06-03',
      due_date: '2026-07-03',
      amount: '12500.00',
      status: 'paid',
      paid_at: '2026-06-28',
      paid_amount: '12500.00',
      description: 'Q3 consulting services',
      line_items: JSON.stringify([
        { description: 'Q3 strategy consulting', qty: 5, unitPrice: 1500 },
        { description: 'Executive advisory', qty: 5, unitPrice: 1000 },
      ]),
    },
    // INV-010: Beta — pending
    {
      client_id: betaId,
      invoice_number: 'INV-010',
      issue_date: '2026-06-08',
      due_date: '2026-07-08',
      amount: '6800.00',
      status: 'pending',
      paid_at: null,
      paid_amount: null,
      description: 'Website maintenance retainer',
      line_items: JSON.stringify([
        { description: 'Monthly maintenance retainer', qty: 1, unitPrice: 4000 },
        { description: 'Bug fixes & updates', qty: 8, unitPrice: 350 },
      ]),
    },
    // INV-011: Gamma — pending
    {
      client_id: gammaId,
      invoice_number: 'INV-011',
      issue_date: '2026-06-15',
      due_date: '2026-07-15',
      amount: '9200.00',
      status: 'pending',
      paid_at: null,
      paid_amount: null,
      description: 'Cloud infrastructure setup',
      line_items: JSON.stringify([
        { description: 'Architecture design', qty: 10, unitPrice: 600 },
        { description: 'Implementation & configuration', qty: 8, unitPrice: 400 },
      ]),
    },
    // INV-012: Delta — overdue (due date moved to past)
    {
      client_id: deltaId,
      invoice_number: 'INV-012',
      issue_date: '2026-05-21',
      due_date: '2026-06-20',
      amount: '15000.00',
      status: 'overdue',
      paid_at: null,
      paid_amount: null,
      description: 'Marketing campaign management',
      line_items: JSON.stringify([
        { description: 'Campaign strategy & planning', qty: 1, unitPrice: 5000 },
        { description: 'Digital advertising management', qty: 1, unitPrice: 7500 },
        { description: 'Performance reporting', qty: 5, unitPrice: 500 },
      ]),
    },
    // INV-013: Acme — paid early
    {
      client_id: acmeId,
      invoice_number: 'INV-013',
      issue_date: '2026-06-28',
      due_date: '2026-07-28',
      amount: '7400.00',
      status: 'paid',
      paid_at: '2026-07-25',
      paid_amount: '7400.00',
      description: 'Software integration services',
      line_items: JSON.stringify([
        { description: 'API integration development', qty: 8, unitPrice: 600 },
        { description: 'Testing & QA', qty: 8, unitPrice: 325 },
      ]),
    },
    // INV-014: Beta — pending
    {
      client_id: betaId,
      invoice_number: 'INV-014',
      issue_date: '2026-07-06',
      due_date: '2026-08-05',
      amount: '4500.00',
      status: 'pending',
      paid_at: null,
      paid_amount: null,
      description: 'SEO & content audit',
      line_items: JSON.stringify([
        { description: 'Technical SEO audit', qty: 1, unitPrice: 2500 },
        { description: 'Content optimization', qty: 10, unitPrice: 200 },
      ]),
    },
    // INV-015: Gamma — overdue (due date moved to past)
    {
      client_id: gammaId,
      invoice_number: 'INV-015',
      issue_date: '2026-05-16',
      due_date: '2026-06-15',
      amount: '18000.00',
      status: 'overdue',
      paid_at: null,
      paid_amount: null,
      description: 'ERP system migration',
      line_items: JSON.stringify([
        { description: 'Data migration planning', qty: 1, unitPrice: 6000 },
        { description: 'System configuration', qty: 20, unitPrice: 500 },
        { description: 'Staff training sessions', qty: 4, unitPrice: 500 },
      ]),
    },
    // INV-016: Delta — pending
    {
      client_id: deltaId,
      invoice_number: 'INV-016',
      issue_date: '2026-07-19',
      due_date: '2026-08-18',
      amount: '5200.00',
      status: 'pending',
      paid_at: null,
      paid_amount: null,
      description: 'Brand identity refresh',
      line_items: JSON.stringify([
        { description: 'Brand audit & research', qty: 1, unitPrice: 1800 },
        { description: 'Logo & visual identity', qty: 1, unitPrice: 2400 },
        { description: 'Brand guidelines document', qty: 1, unitPrice: 1000 },
      ]),
    },
  ]

  // Delete existing future invoices so we can re-insert with correct statuses
  await run(
    `DELETE FROM invoices
     WHERE user_id = $1
       AND invoice_number IN ('INV-009','INV-010','INV-011','INV-012','INV-013','INV-014','INV-015','INV-016')`,
    [userId]
  )

  const futureInvoiceIds: Record<string, string> = {}
  for (const inv of futureInvoices) {
    const { rows: [row] } = await run(
      `INSERT INTO invoices
         (user_id, client_id, invoice_number, issue_date, due_date, amount, currency,
          status, description, line_items, paid_at, paid_amount)
       VALUES ($1,$2,$3,$4,$5,$6,'USD',$7,$8,$9::jsonb,$10,$11)
       RETURNING id`,
      [
        userId, inv.client_id, inv.invoice_number, inv.issue_date, inv.due_date,
        inv.amount, inv.status, inv.description, inv.line_items,
        inv.paid_at, inv.paid_amount,
      ]
    )
    if (row) futureInvoiceIds[inv.invoice_number] = row.id
  }
  console.log('  future invoices inserted:', Object.keys(futureInvoiceIds).length)

  // Payment history for newly paid future invoices
  const futurePaidHistory = [
    // INV-009: Acme, paid 5 days early
    {
      client_id:  acmeId,
      invoice_id: futureInvoiceIds['INV-009'],
      amount:     '12500.00',
      due_date:   '2026-07-03',
      paid_date:  '2026-06-28',
      days_late:  -5,
    },
    // INV-013: Acme, paid 3 days early
    {
      client_id:  acmeId,
      invoice_id: futureInvoiceIds['INV-013'],
      amount:     '7400.00',
      due_date:   '2026-07-28',
      paid_date:  '2026-07-25',
      days_late:  -3,
    },
  ]

  for (const ph of futurePaidHistory) {
    if (!ph.invoice_id) continue
    await run(
      `INSERT INTO payment_history (client_id, invoice_id, invoice_amount, due_date, paid_date, days_late)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT DO NOTHING`,
      [ph.client_id, ph.invoice_id, ph.amount, ph.due_date, ph.paid_date, ph.days_late]
    )
  }
  console.log('  future payment_history rows:', futurePaidHistory.filter(p => p.invoice_id).length)

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
