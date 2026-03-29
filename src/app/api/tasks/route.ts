import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const whereClause: any = {}

  if (session.user.role === 'INFLUENCER') {
    whereClause.content = {
      partnership: {
        influencerId: session.user.id,
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
              brand: { select: { id: true, name: true } },
              influencer: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  })

  const result = tasks.map((task) => ({
    id: task.id,
    type: task.type,
    status: task.status,
    dueDate: task.dueDate,
    notes: task.notes,
    revisionNotes: task.revisionNotes,
    completedAt: task.completedAt,
    order: task.order,
    createdAt: task.createdAt,
    partnershipId: task.content.partnershipId,
    partnershipName: task.content.partnership.name,
    brandName: task.content.partnership.brand.name,
    influencerName: task.content.partnership.influencer.name,
    contentType: task.content.type,
    contentId: task.contentId,
  }))

  return NextResponse.json(result)
}
