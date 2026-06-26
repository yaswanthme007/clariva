import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'
import { groq } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const { invoiceId } = await req.json()
  if (!invoiceId) return NextResponse.json({ error: 'invoiceId required' }, { status: 400 })

  const { rows: [invoice] } = await pool.query(
    `SELECT i.*, c.name AS client_name, c.email AS client_email
     FROM invoices i
     JOIN clients c ON c.id = i.client_id
     WHERE i.id = $1 AND i.user_id = $2`,
    [invoiceId, userId]
  )
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const daysOverdue = Math.max(
    0,
    Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / 86_400_000)
  )
  const dueDateFormatted = new Date(invoice.due_date).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
  const amount = Number(invoice.amount).toLocaleString('en-US', {
    style: 'currency', currency: invoice.currency ?? 'USD',
  })

  let subject = `Payment Reminder: ${invoice.invoice_number}`
  let body = ''

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 400,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a professional business communication assistant. Write firm but polite payment reminder emails under 150 words. Return ONLY valid JSON with "subject" and "body" string keys.',
        },
        {
          role: 'user',
          content: `Write a payment reminder email:
Client name: ${invoice.client_name}
Invoice number: ${invoice.invoice_number}
Amount due: ${amount}
Due date: ${dueDateFormatted}
Days overdue: ${daysOverdue}
Description: ${invoice.description ?? 'Professional services'}

Return JSON: {"subject": "...", "body": "..."}`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? '{}'
    try {
      const parsed = JSON.parse(raw)
      subject = parsed.subject ?? subject
      body    = parsed.body    ?? ''
    } catch {
      body = raw
    }
  } catch (err) {
    console.error('[reminder] Groq error:', err)
    return NextResponse.json({ error: 'AI service unavailable — please try again shortly' }, { status: 502 })
  }

  try {
    await pool.query(
      `INSERT INTO reminders
         (invoice_id, user_id, email_subject, email_body, status, reminder_type, scheduled_at)
       VALUES ($1, $2, $3, $4, 'draft', 'ai_generated', NOW())`,
      [invoiceId, userId, subject, body]
    )
  } catch {
    // reminders table may not exist — still return the generated email
  }

  return NextResponse.json({ subject, body })
}
