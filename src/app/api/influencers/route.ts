import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createInfluencerSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio'),
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'La password deve essere di almeno 6 caratteri'),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const influencers = await prisma.user.findMany({
      where: { role: 'INFLUENCER' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { partnerships: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(influencers)
  } catch (err) {
    console.error('GET /api/influencers error:', err)
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
    const parsed = createInfluencerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 10)

    const influencer = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashedPassword,
        role: 'INFLUENCER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(influencer, { status: 201 })
  } catch (err) {
    console.error('POST /api/influencers error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
