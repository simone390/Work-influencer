import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createInvoiceSchema = z.object({
  partnershipId: z.string().min(1),
  amount: z.number().positive(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const where: Record<string, unknown> = {}

    if (session.user.role === 'INFLUENCER') {
      where.influencerId = session.user.id
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        partnership: {
          include: {
            brand: { select: { id: true, name: true } },
          },
        },
        influencer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(invoices)
  } catch (err) {
    console.error('GET /api/invoices error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = createInvoiceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { partnershipId, amount, fileUrl, fileName, notes } = parsed.data

    // Verify the partnership exists and the user has access
    const partnership = await prisma.partnership.findUnique({
      where: { id: partnershipId },
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

    // Check if invoice already exists
    const existing = await prisma.invoice.findUnique({
      where: { partnershipId },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Esiste già una fattura per questa partnership' },
        { status: 409 }
      )
    }

    const influencerId =
      session.user.role === 'INFLUENCER' ? session.user.id : partnership.influencerId

    const invoice = await prisma.invoice.create({
      data: {
        partnershipId,
        influencerId,
        amount,
        fileUrl,
        fileName,
        notes,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: {
        partnership: {
          include: {
            brand: { select: { id: true, name: true } },
          },
        },
        influencer: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (err) {
    console.error('POST /api/invoices error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
