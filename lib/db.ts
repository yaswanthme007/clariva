import { Pool, QueryResult, QueryResultRow } from 'pg'

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined
}

function createPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
  })
}

export const pool: Pool = globalThis._pgPool ?? (globalThis._pgPool = createPool())

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params)
}

// ─── Analytics query functions ───────────────────────────────────────────────

export interface RevenuePeriod { period: string; expected: number; actual: number }
export interface StatusCount   { status: string; count: number }
export interface ClientRevenue { name: string; revenue: number }
export interface TimelinessRow { bucket: string; count: number }

export async function getRevenueByPeriod(
  userId: string,
  startDate: Date,
  endDate: Date,
  granularity: 'week' | 'month'
): Promise<RevenuePeriod[]> {
  const g = granularity === 'month' ? 'month' : 'week'
  const { rows } = await pool.query<RevenuePeriod>(
    `SELECT
       to_char(date_trunc('${g}', due_date), 'YYYY-MM-DD') AS period,
       SUM(amount)::float AS expected,
       SUM(CASE WHEN status = 'paid' THEN COALESCE(paid_amount, amount) ELSE 0 END)::float AS actual
     FROM invoices
     WHERE user_id = $1 AND due_date >= $2::date AND due_date <= $3::date
     GROUP BY date_trunc('${g}', due_date)
     ORDER BY 1`,
    [userId, startDate, endDate]
  )
  return rows
}

export async function getInvoiceStatusBreakdown(
  userId: string,
  startDate: Date
): Promise<StatusCount[]> {
  const { rows } = await pool.query<StatusCount>(
    `SELECT status, COUNT(*)::int AS count
     FROM invoices
     WHERE user_id = $1 AND status != 'cancelled' AND created_at >= $2
     GROUP BY status`,
    [userId, startDate]
  )
  return rows
}

export async function getTopClientsByRevenue(
  userId: string,
  startDate: Date,
  limit = 5
): Promise<ClientRevenue[]> {
  const { rows } = await pool.query<ClientRevenue>(
    `SELECT c.name, SUM(i.amount)::float AS revenue
     FROM invoices i
     JOIN clients c ON c.id = i.client_id
     WHERE i.user_id = $1 AND i.created_at >= $2
     GROUP BY c.id, c.name
     ORDER BY revenue DESC
     LIMIT $3`,
    [userId, startDate, limit]
  )
  return rows
}

export async function getPaymentTimelinessDistribution(
  userId: string,
  startDateStr: string
): Promise<TimelinessRow[]> {
  const { rows } = await pool.query<TimelinessRow>(
    `SELECT
       CASE
         WHEN ph.days_late < 0  THEN 'Early'
         WHEN ph.days_late <= 7  THEN '0–7d'
         WHEN ph.days_late <= 14 THEN '8–14d'
         WHEN ph.days_late <= 30 THEN '15–30d'
         ELSE '30d+'
       END AS bucket,
       COUNT(*)::int AS count
     FROM payment_history ph
     JOIN invoices i ON i.id = ph.invoice_id
     WHERE i.user_id = $1 AND ph.paid_date >= $2
     GROUP BY bucket
     ORDER BY
       CASE
         WHEN ph.days_late < 0  THEN 1
         WHEN ph.days_late <= 7  THEN 2
         WHEN ph.days_late <= 14 THEN 3
         WHEN ph.days_late <= 30 THEN 4
         ELSE 5
       END`,
    [userId, startDateStr]
  )
  return rows
}
