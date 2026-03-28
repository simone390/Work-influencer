'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Badge, getPartnershipStatusVariant, getPartnershipStatusLabel } from '@/components/ui/Badge'
import { WorkflowTimeline } from '@/components/partnerships/WorkflowTimeline'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import { CONTENT_TYPE_LABELS, PARTNERSHIP_STATUS_LABELS } from '@/lib/workflow'

interface Partnership {
  id: string
  name: string
  status: string
  totalPrice: number
  netPrice: number
  brief?: string | null
  createdAt: string
  brand: {
    id: string
    name: string
    logo?: string | null
    publicToken: string
  }
  influencer: {
    id: string
    name: string
    email: string
  }
  contents: {
    id: string
    type: string
    description?: string | null
    postLink?: string | null
    postInstructions?: string | null
    postScheduledAt?: string | null
    tasks: {
      id: string
      type: string
      status: string
      dueDate?: string | null
      notes?: string | null
      revisionNotes?: string | null
      completedAt?: string | null
      order: number
    }[]
    metrics: {
      id: string
      views: number
      linkClicks: number
      reportedAt: string
    }[]
  }[]
}

export default function PartnershipDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [partnership, setPartnership] = useState<Partnership | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchPartnership = useCallback(async () => {
    try {
      const res = await fetch(`/api/partnerships/${params.id}`)
      if (!res.ok) {
        router.push('/partnerships')
        return
      }
      const data = await res.json()
      setPartnership(data)
    } catch (err) {
      console.error('Failed to fetch partnership', err)
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    fetchPartnership()
  }, [fetchPartnership])

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/partnerships/${params.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.push('/partnerships')
      }
    } catch (err) {
      console.error('Failed to delete partnership', err)
    } finally {
      setDeleting(false)
      setDeleteModal(false)
    }
  }

  async function handleStatusChange(newStatus: string) {
    try {
      const res = await fetch(`/api/partnerships/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchPartnership()
      }
    } catch (err) {
      console.error('Failed to update status', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!partnership) return null

  const isManager = session?.user?.role === 'MANAGER'
  const userRole = session?.user?.role || ''

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/brand/${partnership.brand.publicToken}`

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/partnerships" className="hover:text-gray-700">
          Partnership
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{partnership.name}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{partnership.name}</h1>
              <Badge variant={getPartnershipStatusVariant(partnership.status)}>
                {getPartnershipStatusLabel(partnership.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {partnership.brand.name}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {partnership.influencer.name}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {format(new Date(partnership.createdAt), 'dd/MM/yyyy', { locale: it })}
              </span>
            </div>
          </div>

          {isManager && (
            <div className="flex items-center gap-2 flex-wrap">
              {partnership.status === 'ACTIVE' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleStatusChange('PAUSED')}
                >
                  Metti in Pausa
                </Button>
              )}
              {partnership.status === 'PAUSED' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange('ACTIVE')}
                >
                  Riattiva
                </Button>
              )}
              {partnership.status !== 'COMPLETED' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleStatusChange('COMPLETED')}
                >
                  Segna Completata
                </Button>
              )}
              <Link href={`/partnerships/${partnership.id}/edit`}>
                <Button variant="secondary" size="sm">
                  Modifica
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteModal(true)}
              >
                Elimina
              </Button>
            </div>
          )}
        </div>

        {/* Prices */}
        <div className="mt-4 flex items-center gap-6 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Prezzo Totale</p>
            <p className="text-lg font-bold text-gray-900">
              €{partnership.totalPrice.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Prezzo Netto (80%)</p>
            <p className="text-lg font-bold text-green-700">
              €{partnership.netPrice.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Brief */}
        {partnership.brief && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-1">Brief</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{partnership.brief}</p>
          </div>
        )}

        {/* Brand public URL */}
        {isManager && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-1">Link pubblico per il brand</p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 flex-1 truncate">
                {publicUrl}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(publicUrl)}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
              >
                Copia
              </button>
              <Link
                href={`/brand/${partnership.brand.publicToken}`}
                target="_blank"
                className="text-xs text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
              >
                Apri →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Contents with workflow */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Contenuti ({partnership.contents.length})
        </h2>

        {partnership.contents.map((content, index) => (
          <div
            key={content.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            {/* Content header */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                      {CONTENT_TYPE_LABELS[content.type] || content.type}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Contenuto #{index + 1}
                    </h3>
                  </div>
                  {content.description && (
                    <p className="text-sm text-gray-500 mt-1">{content.description}</p>
                  )}
                </div>
                {content.postScheduledAt && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Pubblicazione prevista</p>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(content.postScheduledAt), 'dd/MM/yyyy HH:mm', { locale: it })}
                    </p>
                  </div>
                )}
              </div>

              {content.postInstructions && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-600">Istruzioni pubblicazione:</p>
                  <p className="text-xs text-gray-700 mt-1">{content.postInstructions}</p>
                </div>
              )}

              {content.postLink && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Link pubblicato:</span>
                  <a
                    href={content.postLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:underline truncate"
                  >
                    {content.postLink}
                  </a>
                </div>
              )}

              {/* Metrics */}
              {content.metrics.length > 0 && (
                <div className="mt-3 flex items-center gap-6">
                  <div>
                    <p className="text-xs text-gray-500">Visualizzazioni</p>
                    <p className="text-sm font-bold text-gray-900">
                      {content.metrics[0].views.toLocaleString('it-IT')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Click sul Link</p>
                    <p className="text-sm font-bold text-gray-900">
                      {content.metrics[0].linkClicks.toLocaleString('it-IT')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Workflow */}
            <div className="p-5">
              <WorkflowTimeline
                contentId={content.id}
                tasks={content.tasks}
                userRole={userRole}
                onTaskUpdate={fetchPartnership}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Delete modal */}
      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Elimina Partnership"
        message={`Sei sicuro di voler eliminare la partnership "${partnership.name}"? Questa azione non può essere annullata.`}
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
