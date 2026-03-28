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

  const where: any = isManager
    ? {}
    : { partnership: { influencerId: session.user.id } }

  const contents = await prisma.content.findMany({
    where,
    include: {
      partnership: {
        include: {
          brand: true,
          influencer: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [
      { contentStatus: 'asc' },
      { createdAt: 'desc' },
    ],
  })

  return NextResponse.json({ contents, isManager })
}
