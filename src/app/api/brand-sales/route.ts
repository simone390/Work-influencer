import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSaleSchema = z.object({
  brandId: z.string().min(1),
  partnershipId: z.string().optional(),
  amount: z.number().positive(),
  date: z.string(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = createSaleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { brandId, partnershipId, amount, date, notes } = parsed.data

    const brand = await prisma.brand.findUnique({ where: { id: brandId } })
    if (!brand) {
      return NextResponse.json({ error: 'Brand non trovato' }, { status: 404 })
    }

    const sale = await prisma.brandSale.create({
      data: {
        brandId,
        partnershipId: partnershipId || null,
        amount,
        date: new Date(date),
        notes,
      },
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (err) {
    console.error('POST /api/brand-sales error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
