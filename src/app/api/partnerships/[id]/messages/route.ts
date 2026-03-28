import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createMessageSchema = z.object({
  content: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
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
    })

    if (!partnership) {
      return NextResponse.json({ error: 'Partnership non trovata' }, { status: 404 })
    }

    if (
      session.user.role === 'INFLUENCER' &&
      partnership.influencerId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const messages = await prisma.message.findMany({
      where: { partnershipId: params.id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(messages)
  } catch (err) {
    console.error('GET /api/partnerships/[id]/messages error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}

export async function POST(
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
    })

    if (!partnership) {
      return NextResponse.json({ error: 'Partnership non trovata' }, { status: 404 })
    }

    if (
      session.user.role === 'INFLUENCER' &&
      partnership.influencerId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = createMessageSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { content, fileUrl, fileName } = parsed.data

    if (!content?.trim() && !fileUrl) {
      return NextResponse.json(
        { error: 'Il messaggio non può essere vuoto' },
        { status: 400 }
      )
    }

    const message = await prisma.message.create({
      data: {
        partnershipId: params.id,
        senderId: session.user.id,
        senderName: session.user.name || 'Utente',
        senderRole: session.user.role || 'INFLUENCER',
        content: content?.trim() || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (err) {
    console.error('POST /api/partnerships/[id]/messages error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
