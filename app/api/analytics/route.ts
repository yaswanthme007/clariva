import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getRevenueByPeriod,
  getInvoiceStatusBreakdown,
  getTopClientsByRevenue,
  getPaymentTimelinessDistribution,
  getRiskDistribution,
} from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const days      = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get('days') ?? '30')))
    const direction = req.nextUrl.searchParams.get('direction') ?? 'past'
    const now       = new Date()
    const startDate = direction === 'future' ? now : new Date(now.getTime() - days * 86_400_000)
    const endDate   = direction === 'future' ? new Date(now.getTime() + days * 86_400_000) : now
    const granularity  = days > 60 ? 'month' : 'week'

    // Non-cashflow queries always look back 365 days so Status / Top Clients /
    // Timeliness charts are populated regardless of whether direction=future.
    const historyStart    = new Date(now.getTime() - 365 * 86_400_000)
    const historyStartStr = historyStart.toISOString().slice(0, 10)

    // Use allSettled so one failing query never crashes the whole endpoint.
    const [cashFlowR, statusR, clientsR, timelinessR, riskR] = await Promise.allSettled([
      getRevenueByPeriod(userId, startDate, endDate, granularity as 'week' | 'month'),
      getInvoiceStatusBreakdown(userId, historyStart),
      getTopClientsByRevenue(userId, historyStart, 5),
      getPaymentTimelinessDistribution(userId, historyStartStr),
      getRiskDistribution(userId),
    ])

    const cashFlow      = cashFlowR.status   === 'fulfilled' ? cashFlowR.value   : []
    const statusBreakdown = statusR.status   === 'fulfilled' ? statusR.value     : []
    const topClients    = clientsR.status    === 'fulfilled' ? clientsR.value    : []
    const timeliness    = timelinessR.status === 'fulfilled' ? timelinessR.value : []
    const riskDistribution = riskR.status   === 'fulfilled'
      ? riskR.value
      : { low: 0, medium: 0, high: 0 }

    return NextResponse.json({
      cashFlow,
      statusBreakdown,
      topClients,
      timeliness,
      riskDistribution,
      granularity,
      days,
    })
  } catch (err) {
    console.error('Analytics route error:', err)
    return NextResponse.json({
      cashFlow:          [],
      statusBreakdown:   [],
      topClients:        [],
      timeliness:        [],
      riskDistribution:  { low: 0, medium: 0, high: 0 },
      granularity:       'week',
      days:              30,
    })
  }
}
