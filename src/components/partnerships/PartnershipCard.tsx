'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Badge, getPartnershipStatusVariant, getPartnershipStatusLabel } from '../ui/Badge'

interface PartnershipCardProps {
  partnership: {
    id: string
    name: string
    status: string
    totalPrice: number
    netPrice: number
    createdAt: string | Date
    brand: {
      id: string
      name: string
      logo?: string | null
    }
    influencer: {
      id: string
      name: string
      email: string
    }
    contents: {
      id: string
      type: string
      tasks: {
        id: string
        type: string
        status: string
        dueDate?: string | null
      }[]
    }[]
  }
  showInfluencer?: boolean
}

export function PartnershipCard({ partnership, showInfluencer = true }: PartnershipCardProps) {
  const totalTasks = partnership.contents.reduce(
    (acc, c) => acc + c.tasks.length,
    0
  )
  const completedTasks = partnership.contents.reduce(
    (acc, c) => acc + c.tasks.filter((t) => t.status === 'COMPLETED').length,
    0
  )

  const pendingTasks = partnership.contents.reduce((acc, c) => {
    return acc + c.tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'REVISION_NEEDED').length
  }, 0)

  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const formattedDate = format(new Date(partnership.createdAt), 'dd/MM/yyyy', { locale: it })

  return (
    <Link href={`/partnerships/${partnership.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-primary-200 transition-all duration-200 cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {partnership.name}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {partnership.brand.name}
            </p>
          </div>
          <Badge variant={getPartnershipStatusVariant(partnership.status)}>
            {getPartnershipStatusLabel(partnership.status)}
          </Badge>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          {showInfluencer && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {partnership.influencer.name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            {partnership.contents.length} contenuti
          </span>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Avanzamento task</span>
            <span>{completedTasks}/{totalTasks}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            <span className="text-sm font-semibold text-gray-900">
              €{partnership.totalPrice.toLocaleString('it-IT')}
            </span>
            <span className="text-xs text-gray-400 ml-1.5">
              (netto: €{partnership.netPrice.toLocaleString('it-IT')})
            </span>
          </div>
          {pendingTasks > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {pendingTasks} attivi
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
