import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getRevenueByPeriod,
  getInvoiceStatusBreakdown,
  getTopClientsByRevenue,
  getPaymentTimelinessDistribution,
} from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const days = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get('days') ?? '30')))
  const endDate   = new Date()
  const startDate = new Date(Date.now() - days * 86_400_000)
  const granularity = days > 60 ? 'month' : 'week'
  const startDateStr = startDate.toISOString().slice(0, 10)

  const [cashFlow, statusBreakdown, topClients, timeliness] = await Promise.all([
    getRevenueByPeriod(userId, startDate, endDate, granularity as 'week' | 'month'),
    getInvoiceStatusBreakdown(userId, startDate),
    getTopClientsByRevenue(userId, startDate, 5),
    getPaymentTimelinessDistribution(userId, startDateStr),
  ])

  return NextResponse.json({ cashFlow, statusBreakdown, topClients, timeliness, granularity, days })
}
