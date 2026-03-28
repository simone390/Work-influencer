import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { markNotificationRead, markAllNotificationsRead } from '@/lib/notifications'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const page = parseInt(searchParams.get('page') || '1')
  const skip = (page - 1) * limit

  try {
    const [notifications, unreadCount, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.notification.count({
        where: { userId: session.user.id, read: false },
      }),
      prisma.notification.count({
        where: { userId: session.user.id },
      }),
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('GET /api/notifications error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const body = await req.json()

    if (body.markAll) {
      await markAllNotificationsRead(session.user.id)
      return NextResponse.json({ success: true })
    }

    if (body.id) {
      await markNotificationRead(body.id, session.user.id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Parametri non validi' }, { status: 400 })
  } catch (err) {
    console.error('PATCH /api/notifications error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
