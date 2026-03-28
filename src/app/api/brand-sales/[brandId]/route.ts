import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { brandId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const sales = await prisma.brandSale.findMany({
      where: { brandId: params.brandId },
      include: {
        partnership: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(sales)
  } catch (err) {
    console.error('GET /api/brand-sales/[brandId] error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
