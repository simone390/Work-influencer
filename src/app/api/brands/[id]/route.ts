import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const brand = await prisma.brand.findUnique({
      where: { id: params.id },
      include: {
        partnerships: {
          where: { status: { in: ['ACTIVE', 'PAUSED'] } },
          select: { id: true },
        },
      },
    })

    if (!brand) {
      return NextResponse.json({ error: 'Brand non trovato' }, { status: 404 })
    }

    if (brand.partnerships.length > 0) {
      return NextResponse.json(
        { error: 'Impossibile eliminare: il brand ha partnership attive' },
        { status: 409 }
      )
    }

    await prisma.brand.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/brands/[id] error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
