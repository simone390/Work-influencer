import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'

export async function POST(
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
      include: {
        influencer: { select: { id: true, name: true } },
        partnership: {
          include: {
            brand: { select: { name: true } },
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 })
    }

    // Only the influencer who owns the invoice can send follow-up
    if (session.user.role === 'INFLUENCER' && invoice.influencerId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'La fattura è già stata pagata' }, { status: 400 })
    }

    // Notify all managers
    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
      select: { id: true },
    })

    const amount = `€${invoice.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`
    const influencerName = invoice.influencer.name
    const brandName = invoice.partnership.brand.name
    const partnershipName = invoice.partnership.name

    for (const manager of managers) {
      await sendNotification(
        manager.id,
        `Follow-up Fattura — ${influencerName}`,
        `${influencerName} ricorda che la fattura da ${amount} per "${partnershipName}" (${brandName}) è ancora in attesa di pagamento.`
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/invoices/[id]/followup error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
