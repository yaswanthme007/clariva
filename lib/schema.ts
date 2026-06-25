import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  numeric,
  date,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  name: text('name'),
  password_hash: text('password_hash'),
  business_name: text('business_name'),
  currency: varchar('currency', { length: 3 }).default('USD'),
  created_at: timestamp('created_at').defaultNow(),
})

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  company: text('company'),
  phone: text('phone'),
  address: text('address'),
  payment_score: integer('payment_score').default(100),
  avg_payment_days: integer('avg_payment_days').default(0),
  total_invoiced: numeric('total_invoiced').default('0'),
  total_paid: numeric('total_paid').default('0'),
  created_at: timestamp('created_at').defaultNow(),
})

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id),
    client_id: uuid('client_id')
      .notNull()
      .references(() => clients.id),
    invoice_number: text('invoice_number').notNull(),
    issue_date: date('issue_date'),
    due_date: date('due_date'),
    amount: numeric('amount').notNull(),
    currency: varchar('currency', { length: 3 }).default('USD'),
    status: text('status').default('pending'),
    description: text('description'),
    line_items: jsonb('line_items'),
    risk_score: integer('risk_score'),
    risk_label: text('risk_label'),
    risk_reason: text('risk_reason'),
    paid_at: timestamp('paid_at'),
    paid_amount: numeric('paid_amount'),
    days_to_pay: integer('days_to_pay'),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (t) => [
    index('idx_invoices_user_id').on(t.user_id),
    index('idx_invoices_client_id').on(t.client_id),
    index('idx_invoices_status').on(t.status),
    index('idx_invoices_due_date').on(t.due_date),
  ]
)

export const reminders = pgTable(
  'reminders',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    invoice_id: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id),
    scheduled_at: timestamp('scheduled_at'),
    sent_at: timestamp('sent_at'),
    status: text('status').default('pending'),
    email_subject: text('email_subject'),
    email_body: text('email_body'),
    reminder_type: text('reminder_type'),
  },
  (t) => [index('idx_reminders_scheduled_at').on(t.scheduled_at)]
)

export const payment_history = pgTable(
  'payment_history',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    client_id: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    invoice_id: uuid('invoice_id').references(() => invoices.id),
    invoice_amount: numeric('invoice_amount'),
    due_date: date('due_date'),
    paid_date: date('paid_date'),
    days_late: integer('days_late'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (t) => [index('idx_payment_history_client_id').on(t.client_id)]
)
