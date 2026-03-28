import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createContentTasks, TaskType, TaskStatus } from '@/lib/workflow'
import { sendTaskNotification } from '@/lib/notifications'
import { z } from 'zod'

const contentSchema = z.object({
  type: z.enum(['REEL', 'STORY', 'POST', 'VIDEO', 'OTHER']),
  description: z.string().optional(),
  postInstructions: z.string().optional(),
  scriptDeadline: z.string(),
  recordingDeadline: z.string(),
  postDate: z.string(),
  postTime: z.string().default('18:00'),
})

const createPartnershipSchema = z.object({
  name: z.string().min(1),
  brandId: z.string().min(1),
  influencerId: z.string().min(1),
  totalPrice: z.number().positive(),
  brief: z.string().optional(),
  campaignType: z.string().optional(),
  campaignObjective: z.string().optional(),
  campaignScript: z.string().optional(),
  contents: z.array(contentSchema).min(1),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  try {
    const where: Record<string, unknown> = {}

    if (session.user.role === 'INFLUENCER') {
      where.influencerId = session.user.id
    }

    if (status) {
      where.status = status
    }

    const partnerships = await prisma.partnership.findMany({
      where,
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
            metrics: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(partnerships)
  } catch (err) {
    console.error('GET /api/partnerships error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = createPartnershipSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, brandId, influencerId, totalPrice, brief, campaignType, campaignObjective, campaignScript, contents } =
      parsed.data
    const netPrice = totalPrice * 0.8

    // Verify brand and influencer exist
    const [brand, influencer] = await Promise.all([
      prisma.brand.findUnique({ where: { id: brandId } }),
      prisma.user.findUnique({ where: { id: influencerId } }),
    ])

    if (!brand) {
      return NextResponse.json({ error: 'Brand non trovato' }, { status: 404 })
    }
    if (!influencer) {
      return NextResponse.json(
        { error: 'Influencer non trovato' },
        { status: 404 }
      )
    }

    // Create partnership
    const partnership = await prisma.partnership.create({
      data: {
        name,
        brandId,
        influencerId,
        totalPrice,
        netPrice,
        brief,
        campaignType: campaignType || null,
        campaignObjective: campaignObjective || null,
        campaignScript: campaignScript || null,
        status: 'ACTIVE',
      },
    })

    // Create contents and tasks
    for (const contentData of contents) {
      const [postDatePart, postTimePart] = [contentData.postDate, contentData.postTime]
      const postDateTime = new Date(`${postDatePart}T${postTimePart}:00`)
      const scriptDeadline = new Date(contentData.scriptDeadline)
      const recordingDeadline = new Date(contentData.recordingDeadline)

      const content = await prisma.content.create({
        data: {
          partnershipId: partnership.id,
          type: contentData.type,
          description: contentData.description,
          postInstructions: contentData.postInstructions,
          postScheduledAt: postDateTime,
        },
      })

      await createContentTasks({
        contentId: content.id,
        scriptDeadline,
        recordingDeadline,
        postDate: postDateTime,
      })

      // Send notification to influencer for the first task
      await sendTaskNotification(
        influencerId,
        TaskType.WRITE_SCRIPT,
        TaskStatus.IN_PROGRESS,
        brand.name,
        scriptDeadline
      )
    }

    return NextResponse.json(partnership, { status: 201 })
  } catch (err) {
    console.error('POST /api/partnerships error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
