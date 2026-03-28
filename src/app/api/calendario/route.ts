import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const influencerIdFilter = searchParams.get('influencerId')

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const isManager = session.user.role === 'MANAGER'

  const whereClause: any = {
    dueDate: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (!isManager) {
    whereClause.content = {
      partnership: {
        influencerId: session.user.id,
      },
    }
  } else if (influencerIdFilter) {
    whereClause.content = {
      partnership: {
        influencerId: influencerIdFilter,
      },
    }
  }

  const tasks = await prisma.contentTask.findMany({
    where: whereClause,
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
    orderBy: { dueDate: 'asc' },
  })

  // Group by date
  const grouped: Record<string, any[]> = {}
  for (const task of tasks) {
    if (!task.dueDate) continue
    const dateKey = task.dueDate.toISOString().split('T')[0]
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push({
      id: task.id,
      type: task.type,
      status: task.status,
      dueDate: task.dueDate,
      partnershipId: task.content.partnershipId,
      partnershipName: task.content.partnership.name,
      brandName: task.content.partnership.brand.name,
      influencerName: task.content.partnership.influencer.name,
      contentType: task.content.type,
    })
  }

  // Get influencers list for manager filter
  let influencers: any[] = []
  if (isManager) {
    influencers = await prisma.user.findMany({
      where: { role: 'INFLUENCER' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
  }

  return NextResponse.json({ grouped, influencers })
}
