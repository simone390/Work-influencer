import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const patchSchema = z.object({
  status: z.enum(['PENDING', 'SUBMITTED', 'PAID']).optional(),
  notes: z.string().optional(),
  amount: z.number().positive().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 })
    }

    // Influencer can only access their own invoices
    if (
      session.user.role === 'INFLUENCER' &&
      invoice.influencerId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = { ...parsed.data }

    // Only managers can mark as PAID
    if (parsed.data.status === 'PAID') {
      if (session.user.role !== 'MANAGER') {
        return NextResponse.json(
          { error: 'Solo i manager possono segnare come pagata' },
          { status: 403 }
        )
      }
      updateData.paidAt = new Date()
    }

    // Influencer submitting invoice
    if (parsed.data.status === 'SUBMITTED') {
      updateData.submittedAt = new Date()
    }

    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData as Record<string, unknown>,
      include: {
        partnership: {
          include: {
            brand: { select: { id: true, name: true } },
          },
        },
        influencer: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/invoices/[id] error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
