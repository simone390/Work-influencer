import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

export default async function InfluencersPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'MANAGER') {
    redirect('/dashboard')
  }

  const influencers = await prisma.user.findMany({
    where: { role: 'INFLUENCER' },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: { select: { partnerships: true } },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Influencer</h1>
          <p className="text-gray-500 text-sm mt-1">
            {influencers.length} influencer registrati
          </p>
        </div>
        <Link
          href="/influencers/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuovo Influencer
        </Link>
      </div>

      {influencers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="text-gray-500 font-medium">Nessun influencer registrato</p>
          <Link
            href="/influencers/new"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Aggiungi il primo influencer
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Influencer
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Partnership
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Registrato il
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {influencers.map((influencer) => (
                <tr key={influencer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary-700">
                          {influencer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{influencer.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{influencer.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {influencer._count.partnerships} partnership
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {format(new Date(influencer.createdAt), 'dd/MM/yyyy', { locale: it })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/partnerships?influencerId=${influencer.id}`}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Vedi partnership
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
