import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const isManager = session.user.role === 'MANAGER'

  const metricsWhere: any = isManager
    ? {}
    : {
        content: {
          partnership: { influencerId: session.user.id },
        },
      }

  const metrics = await prisma.contentMetric.findMany({
    where: metricsWhere,
    include: {
      content: {
        include: {
          partnership: {
            include: {
              brand: true,
              influencer: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: { reportedAt: 'asc' },
  })

  const totalViews = metrics.reduce((acc, m) => acc + m.views, 0)
  const totalClicks = metrics.reduce((acc, m) => acc + m.linkClicks, 0)
  const conversionRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0'

  const totalPartnerships = isManager
    ? await prisma.partnership.count()
    : await prisma.partnership.count({ where: { influencerId: session.user.id } })

  // By month
  const byMonthMap: Record<string, { views: number; clicks: number }> = {}
  for (const m of metrics) {
    const key = m.reportedAt.toISOString().slice(0, 7) // YYYY-MM
    if (!byMonthMap[key]) byMonthMap[key] = { views: 0, clicks: 0 }
    byMonthMap[key].views += m.views
    byMonthMap[key].clicks += m.linkClicks
  }
  const byMonth = Object.entries(byMonthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      label: new Date(month + '-01').toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }),
      ...data,
    }))

  // By partnership
  const byPartnershipMap: Record<string, { name: string; views: number; clicks: number }> = {}
  for (const m of metrics) {
    const pid = m.content.partnershipId
    if (!byPartnershipMap[pid]) {
      byPartnershipMap[pid] = {
        name: m.content.partnership.name,
        views: 0,
        clicks: 0,
      }
    }
    byPartnershipMap[pid].views += m.views
    byPartnershipMap[pid].clicks += m.linkClicks
  }
  const byPartnership = Object.entries(byPartnershipMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.views - a.views)

  // By influencer (manager only)
  let byInfluencer: any[] = []
  if (isManager) {
    const byInfluencerMap: Record<string, { name: string; views: number; clicks: number }> = {}
    for (const m of metrics) {
      const uid = m.content.partnership.influencer.id
      if (!byInfluencerMap[uid]) {
        byInfluencerMap[uid] = {
          name: m.content.partnership.influencer.name,
          views: 0,
          clicks: 0,
        }
      }
      byInfluencerMap[uid].views += m.views
      byInfluencerMap[uid].clicks += m.linkClicks
    }
    byInfluencer = Object.entries(byInfluencerMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.views - a.views)
  }

  return NextResponse.json({
    totalViews,
    totalClicks,
    totalPartnerships,
    conversionRate,
    byMonth,
    byPartnership,
    byInfluencer,
  })
}
