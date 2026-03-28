import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  brandId: z.string().optional(),
  influencerId: z.string().optional(),
  totalPrice: z.number().positive().optional(),
  brief: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'PAUSED']).optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const partnership = await prisma.partnership.findUnique({
      where: { id: params.id },
      include: {
        brand: true,
        influencer: {
          select: { id: true, name: true, email: true },
        },
        contents: {
          include: {
            tasks: {
              orderBy: { order: 'asc' },
            },
            metrics: {
              orderBy: { reportedAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        invoice: true,
      },
    })

    if (!partnership) {
      return NextResponse.json(
        { error: 'Partnership non trovata' },
        { status: 404 }
      )
    }

    // Influencer can only see their own partnerships
    if (
      session.user.role === 'INFLUENCER' &&
      partnership.influencerId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    return NextResponse.json(partnership)
  } catch (err) {
    console.error('GET /api/partnerships/[id] error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.totalPrice) {
      updateData.netPrice = parsed.data.totalPrice * 0.8
    }

    const partnership = await prisma.partnership.update({
      where: { id: params.id },
      data: updateData as Record<string, unknown>,
      include: {
        brand: true,
        influencer: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(partnership)
  } catch (err) {
    console.error('PUT /api/partnerships/[id] error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    await prisma.partnership.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/partnerships/[id] error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
