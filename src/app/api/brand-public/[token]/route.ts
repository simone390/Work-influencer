import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const brand = await prisma.brand.findUnique({
      where: { publicToken: params.token },
      include: {
        partnerships: {
          where: { status: { not: 'COMPLETED' } },
          include: {
            influencer: {
              select: { id: true, name: true },
            },
            contents: {
              include: {
                tasks: {
                  orderBy: { order: 'asc' },
                },
                metrics: {
                  orderBy: { reportedAt: 'desc' },
                  take: 1,
                },
              },
              orderBy: { createdAt: 'asc' },
            },
            invoice: {
              select: { id: true, amount: true, status: true, submittedAt: true, paidAt: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        sales: {
          orderBy: { date: 'asc' },
        },
      },
    })

    if (!brand) {
      return NextResponse.json(
        { error: 'Brand non trovato' },
        { status: 404 }
      )
    }

    // Compute aggregated stats
    const allPartnershipsForStats = await prisma.partnership.findMany({
      where: { brandId: brand.id },
      include: {
        contents: {
          include: {
            metrics: true,
          },
        },
        invoice: { select: { amount: true } },
      },
    })

    const totalSpent = allPartnershipsForStats.reduce((sum, p) => sum + p.totalPrice, 0)
    const totalReach = allPartnershipsForStats.reduce((sum, p) =>
      sum + p.contents.reduce((cs, c) =>
        cs + c.metrics.reduce((ms, m) => ms + m.views, 0), 0), 0)
    const totalClicks = allPartnershipsForStats.reduce((sum, p) =>
      sum + p.contents.reduce((cs, c) =>
        cs + c.metrics.reduce((ms, m) => ms + m.linkClicks, 0), 0), 0)

    const totalSales = brand.sales.reduce((sum, s) => sum + s.amount, 0)

    // Build monthly data for chart (last 12 months)
    const monthlyMap: Record<string, { reach: number; clicks: number; vendite: number }> = {}

    for (const p of allPartnershipsForStats) {
      for (const c of p.contents) {
        for (const m of c.metrics) {
          const key = m.reportedAt.toISOString().slice(0, 7) // YYYY-MM
          if (!monthlyMap[key]) monthlyMap[key] = { reach: 0, clicks: 0, vendite: 0 }
          monthlyMap[key].reach += m.views
          monthlyMap[key].clicks += m.linkClicks
        }
      }
    }

    for (const s of brand.sales) {
      const key = s.date.toISOString().slice(0, 7)
      if (!monthlyMap[key]) monthlyMap[key] = { reach: 0, clicks: 0, vendite: 0 }
      monthlyMap[key].vendite += s.amount
    }

    const monthlyData = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        ...data,
      }))

    // Invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        partnership: { brandId: brand.id },
      },
      include: {
        influencer: { select: { name: true } },
        partnership: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Remove sensitive data
    const { publicToken: _token, ...brandData } = brand

    return NextResponse.json({
      ...brandData,
      stats: {
        totalSpent,
        totalReach,
        totalClicks,
        totalSales,
      },
      monthlyData,
      invoices,
    })
  } catch (err) {
    console.error('GET /api/brand-public/[token] error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
