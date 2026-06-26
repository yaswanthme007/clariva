import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit')

type Params = { params: Promise<{ id: string }> }

interface LineItem { description: string; qty: number; unitPrice: number }

const cfmt = (n: number, cur = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, minimumFractionDigits: 2 }).format(n)

const dfmt = (d: string | Date) =>
  new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

function bufferPdf(doc: ReturnType<typeof PDFDocument>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on('data',  (c: Buffer) => chunks.push(c))
    doc.on('end',   () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

    const { id } = await params

    const { rows: [inv] } = await pool.query(
      `SELECT i.*, c.name AS client_name, c.email AS client_email
       FROM invoices i
       JOIN clients c ON c.id = i.client_id
       WHERE i.id = $1 AND i.user_id = $2`,
      [id, session.user.id]
    )
    if (!inv) return new Response('Not found', { status: 404 })

    const cur   = inv.currency ?? 'USD'
    const items: LineItem[] = Array.isArray(inv.line_items) && inv.line_items.length > 0
      ? inv.line_items
      : [{ description: inv.description ?? 'Professional services', qty: 1, unitPrice: Number(inv.amount) }]
    const total       = items.reduce((s, li) => s + li.qty * li.unitPrice, 0)
    const statusLabel = String(inv.status).replace(/^\w/, c => c.toUpperCase())
    const riskScore   = Number(inv.risk_score ?? 0)
    const riskLabel   = riskScore >= 70 ? 'HIGH RISK' : riskScore >= 40 ? 'MEDIUM RISK' : 'LOW RISK'
    const riskClr     = riskScore >= 70 ? '#f43f5e' : riskScore >= 40 ? '#f59e0b' : '#10b981'

    // ── Build PDF ────────────────────────────────────────────────────────────────
    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    const bufP = bufferPdf(doc)

    const W = doc.page.width  // 595.28
    const M = 50

    // ── Dark header ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 80).fill('#0f0f13')
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20).text('CLARIVA', M, 20)
    doc.fillColor('#9ca3af').font('Helvetica').fontSize(7.5).text('AI-POWERED INVOICE INTELLIGENCE', M, 44)
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22).text('INVOICE', W - M - 150, 18, { width: 150, align: 'right' })
    doc.fillColor('#9ca3af').font('Helvetica').fontSize(10).text(inv.invoice_number, W - M - 150, 46, { width: 150, align: 'right' })

    let y = 98

    // ── Bill To + Invoice meta ───────────────────────────────────────────────────
    doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(7.5).text('BILL TO', M, y)
    y += 13
    doc.fillColor('#111111').font('Helvetica-Bold').fontSize(13).text(inv.client_name, M, y)
    y += 17
    doc.fillColor('#6b7280').font('Helvetica').fontSize(9.5).text(inv.client_email, M, y)

    // Right column meta
    const rCol = Math.floor(W / 2) + 10
    const metaStartY = 98
    const meta: [string, string][] = [
      ['Invoice Date', dfmt(inv.issue_date)],
      ['Due Date',     dfmt(inv.due_date)],
      ['Status',       statusLabel],
      ['Currency',     cur],
    ]
    meta.forEach(([label, value], i) => {
      const ry = metaStartY + i * 18
      doc.fillColor('#6b7280').font('Helvetica').fontSize(8).text(label, rCol, ry, { width: 90 })
      doc.fillColor('#111111').font('Helvetica-Bold').fontSize(9).text(value, rCol + 90, ry, { width: W - M - rCol - 90, align: 'right' })
    })

    y = 182
    doc.moveTo(M, y).lineTo(W - M, y).strokeColor('#e5e7eb').lineWidth(0.8).stroke()
    y += 14

    // ── Line items table ─────────────────────────────────────────────────────────
    const C  = [M, 240, 340, 430]
    const CW = [C[1] - C[0] - 6, C[2] - C[1] - 6, C[3] - C[2] - 6, W - M - C[3] - 4]

    doc.rect(M, y, W - M * 2, 22).fill('#0f0f13')
    const hdrs = ['DESCRIPTION', 'QTY', 'UNIT PRICE', 'TOTAL']
    hdrs.forEach((h, i) => {
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5)
        .text(h, C[i] + 4, y + 7, { width: CW[i], align: i === 0 ? 'left' : 'right' })
    })
    y += 22

    items.forEach((li, i) => {
      if (i % 2 === 1) doc.rect(M, y, W - M * 2, 26).fill('#f9fafb')
      doc.fillColor('#111111').font('Helvetica').fontSize(9.5)
      doc.text(li.description,                       C[0] + 4, y + 7, { width: CW[0] })
      doc.text(String(li.qty),                       C[1] + 4, y + 7, { width: CW[1], align: 'right' })
      doc.text(cfmt(li.unitPrice, cur),              C[2] + 4, y + 7, { width: CW[2], align: 'right' })
      doc.text(cfmt(li.qty * li.unitPrice, cur),     C[3] + 4, y + 7, { width: CW[3], align: 'right' })
      y += 26
    })
    y += 10

    // ── Totals ────────────────────────────────────────────────────────────────────
    doc.moveTo(M, y).lineTo(W - M, y).strokeColor('#e5e7eb').lineWidth(0.5).stroke()
    y += 12

    const tX = W - M - 230
    const tW = 230

    doc.fillColor('#6b7280').font('Helvetica').fontSize(9.5)
    doc.text('Subtotal', tX, y, { width: 110 })
    doc.text(cfmt(total, cur), tX + 110, y, { width: tW - 110, align: 'right' })
    y += 15
    doc.text('Tax (0%)', tX, y, { width: 110 })
    doc.text(cfmt(0, cur), tX + 110, y, { width: tW - 110, align: 'right' })
    y += 15

    doc.moveTo(tX, y).lineTo(W - M, y).strokeColor('#e5e7eb').lineWidth(0.5).stroke()
    y += 8

    doc.rect(tX, y, tW, 30).fill('#0f0f13')
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9.5)
    doc.text('TOTAL DUE', tX + 8, y + 10, { width: 90 })
    doc.text(cfmt(total, cur), tX + 98, y + 10, { width: tW - 106, align: 'right' })
    y += 42

    // ── AI Risk section ───────────────────────────────────────────────────────────
    if (riskScore > 0) {
      y += 6
      doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(7.5).text('AI RISK ANALYSIS', M, y)
      y += 13
      const riskBoxH = inv.risk_reason ? 50 : 30
      doc.rect(M, y, W - M * 2, riskBoxH).fill('#f9fafb')
      doc.fillColor(riskClr).font('Helvetica-Bold').fontSize(9)
        .text(`${riskLabel}  ·  Score: ${riskScore}/100`, M + 10, y + 8)
      if (inv.risk_reason) {
        doc.fillColor('#6b7280').font('Helvetica').fontSize(8.5)
          .text(inv.risk_reason, M + 10, y + 24, { width: W - M * 2 - 20 })
      }
      y += riskBoxH + 8
    }

    // ── Footer ────────────────────────────────────────────────────────────────────
    const fY = doc.page.height - 48
    doc.moveTo(M, fY - 12).lineTo(W - M, fY - 12).strokeColor('#e5e7eb').lineWidth(0.5).stroke()
    doc.fillColor('#9ca3af').font('Helvetica').fontSize(8)
      .text('Generated by Clariva — AI-powered invoice intelligence', M, fY - 4, { width: W - M * 2, align: 'center' })
    doc.fillColor('#d1d5db').fontSize(7.5)
      .text(`Generated on ${dfmt(new Date())}`, M, fY + 10, { width: W - M * 2, align: 'center' })

    doc.end()
    const buffer = await bufP

    return new Response(buffer, {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${inv.invoice_number}.pdf"`,
        'Cache-Control':       'no-store',
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return new NextResponse('Failed to generate PDF', { status: 500 })
  }
}
