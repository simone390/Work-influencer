import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { PartnershipCard } from '@/components/partnerships/PartnershipCard'

export default async function PartnershipsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const isManager = session.user.role === 'MANAGER'

  const where = isManager ? {} : { influencerId: session.user.id }

  const partnerships = await prisma.partnership.findMany({
    where,
    include: {
      brand: true,
      influencer: {
        select: { id: true, name: true, email: true },
      },
      contents: {
        include: {
          tasks: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const active = partnerships.filter((p) => p.status === 'ACTIVE')
  const paused = partnerships.filter((p) => p.status === 'PAUSED')
  const completed = partnerships.filter((p) => p.status === 'COMPLETED')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partnership</h1>
          <p className="text-gray-500 text-sm mt-1">
            {partnerships.length} partnership totali
          </p>
        </div>
        {isManager && (
          <Link
            href="/partnerships/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuova Partnership
          </Link>
        )}
      </div>

      {partnerships.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500 font-medium">Nessuna partnership trovata</p>
          {isManager && (
            <Link
              href="/partnerships/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Crea la prima partnership
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                Attive ({active.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {active.map((p) => (
                  <PartnershipCard
                    key={p.id}
                    partnership={p as unknown as Parameters<typeof PartnershipCard>[0]['partnership']}
                    showInfluencer={isManager}
                  />
                ))}
              </div>
            </div>
          )}

          {paused.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                In Pausa ({paused.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paused.map((p) => (
                  <PartnershipCard
                    key={p.id}
                    partnership={p as unknown as Parameters<typeof PartnershipCard>[0]['partnership']}
                    showInfluencer={isManager}
                  />
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                Completate ({completed.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {completed.map((p) => (
                  <PartnershipCard
                    key={p.id}
                    partnership={p as unknown as Parameters<typeof PartnershipCard>[0]['partnership']}
                    showInfluencer={isManager}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
