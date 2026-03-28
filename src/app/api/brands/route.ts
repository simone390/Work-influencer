import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const createBrandSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio'),
  logo: z.string().url().optional().or(z.literal('')),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { partnerships: true },
        },
      },
    })

    return NextResponse.json(brands)
  } catch (err) {
    console.error('GET /api/brands error:', err)
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
    const parsed = createBrandSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const brand = await prisma.brand.create({
      data: {
        name: parsed.data.name,
        logo: parsed.data.logo || null,
        publicToken: uuidv4(),
      },
    })

    return NextResponse.json(brand, { status: 201 })
  } catch (err) {
    console.error('POST /api/brands error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
