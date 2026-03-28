import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const brand = await prisma.brand.findUnique({
      where: { publicToken: params.token },
      include: {
        partnerships: {
          where: { status: { not: 'COMPLETED' } },
          include: {
            influencer: {
              select: { id: true, name: true },
            },
            contents: {
              include: {
                tasks: {
                  orderBy: { order: 'asc' },
                },
                metrics: {
                  orderBy: { reportedAt: 'desc' },
                  take: 1,
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!brand) {
      return NextResponse.json(
        { error: 'Brand non trovato' },
        { status: 404 }
      )
    }

    // Remove sensitive data
    const { publicToken: _token, ...brandData } = brand

    return NextResponse.json(brandData)
  } catch (err) {
    console.error('GET /api/brand-public/[token] error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
