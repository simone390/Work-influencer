import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PartnershipForm } from '@/components/partnerships/PartnershipForm'
import Link from 'next/link'

export default async function NewPartnershipPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'MANAGER') {
    redirect('/dashboard')
  }

  const [brands, influencers] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findMany({
      where: { role: 'INFLUENCER' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/partnerships" className="hover:text-gray-700">
          Partnership
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Nuova Partnership</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuova Partnership</h1>
        <p className="text-gray-500 text-sm mt-1">
          Crea una nuova collaborazione con brand e influencer
        </p>
      </div>

      <PartnershipForm
        brands={brands}
        influencers={influencers}
      />
    </div>
  )
}
