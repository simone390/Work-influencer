import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const { contentStatus } = await request.json()

  if (!['BOZZA', 'IN_REVISIONE', 'APPROVATO'].includes(contentStatus)) {
    return NextResponse.json({ error: 'Stato non valido' }, { status: 400 })
  }

  const isManager = session.user.role === 'MANAGER'

  // Only managers can set APPROVATO
  if (contentStatus === 'APPROVATO' && !isManager) {
    return NextResponse.json({ error: 'Solo i manager possono approvare i contenuti' }, { status: 403 })
  }

  const content = await prisma.content.findUnique({
    where: { id: params.id },
    include: {
      partnership: {
        include: {
          brand: true,
          influencer: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!content) {
    return NextResponse.json({ error: 'Contenuto non trovato' }, { status: 404 })
  }

  // Influencer can only update their own content
  if (!isManager && content.partnership.influencerId !== session.user.id) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  const updated = await prisma.content.update({
    where: { id: params.id },
    data: { contentStatus },
  })

  // Send notifications on status change
  const brandName = content.partnership.brand.name
  const influencerId = content.partnership.influencerId

  if (contentStatus === 'IN_REVISIONE') {
    // Notify manager that influencer submitted for review
    const managers = await prisma.user.findMany({ where: { role: 'MANAGER' } })
    for (const manager of managers) {
      await sendNotification(
        manager.id,
        'Contenuto in revisione',
        `${content.partnership.influencer.name} ha inviato un contenuto in revisione per ${brandName} (${content.partnership.name})`
      )
    }
  } else if (contentStatus === 'APPROVATO') {
    // Notify influencer that content is approved
    await sendNotification(
      influencerId,
      'Contenuto approvato!',
      `Il tuo contenuto per ${brandName} (${content.partnership.name}) è stato approvato`
    )
  } else if (contentStatus === 'BOZZA' && isManager) {
    // Notify influencer that revision is needed
    await sendNotification(
      influencerId,
      'Revisione richiesta',
      `Il tuo contenuto per ${brandName} (${content.partnership.name}) necessita di revisioni`
    )
  }

  return NextResponse.json(updated)
}
