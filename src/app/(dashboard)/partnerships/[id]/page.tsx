'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  PRODUCT_REVIEW: 'Recensione Prodotto',
  UNBOXING: 'Unboxing',
  TUTORIAL: 'Tutorial',
  LIFESTYLE: 'Lifestyle',
  OTHER: 'Altro',
}

interface Invoice {
  id: string
  amount: number
  status: string
  submittedAt?: string | null
  paidAt?: string | null
  notes?: string | null
  fileUrl?: string | null
  fileName?: string | null
}

interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  content?: string | null
  fileUrl?: string | null
  fileName?: string | null
  createdAt: string
}

interface Partnership {
  id: string
  name: string
  status: string
  totalPrice: number
  netPrice: number
  brief?: string | null
  campaignType?: string | null
  campaignObjective?: string | null
  campaignScript?: string | null
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
  invoice?: Invoice | null
}

function getInvoiceStatusLabel(status: string) {
  switch (status) {
    case 'PENDING': return 'In Attesa'
    case 'SUBMITTED': return 'Inviata'
    case 'PAID': return 'Pagata'
    default: return status
  }
}

function getInvoiceStatusColor(status: string) {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800'
    case 'SUBMITTED': return 'bg-blue-100 text-blue-800'
    case 'PAID': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function PartnershipDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [partnership, setPartnership] = useState<Partnership | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'contenuti' | 'fattura' | 'messaggi'>('contenuti')

  // Invoice state
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceFile, setInvoiceFile] = useState<{ url: string; name: string } | null>(null)
  const [invoiceNotes, setInvoiceNotes] = useState('')
  const [submittingInvoice, setSubmittingInvoice] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)

  // Messages state
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [messageFile, setMessageFile] = useState<{ url: string; name: string } | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageFileInputRef = useRef<HTMLInputElement>(null)
  const invoiceFileInputRef = useRef<HTMLInputElement>(null)

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

  const fetchMessages = useCallback(async () => {
    if (!params.id) return
    setMessagesLoading(true)
    try {
      const res = await fetch(`/api/partnerships/${params.id}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (err) {
      console.error('Failed to fetch messages', err)
    } finally {
      setMessagesLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchPartnership()
  }, [fetchPartnership])

  useEffect(() => {
    if (activeTab === 'messaggi') {
      fetchMessages()
    }
  }, [activeTab, fetchMessages])

  // Auto-refresh messages every 10 seconds
  useEffect(() => {
    if (activeTab !== 'messaggi') return
    const interval = setInterval(() => {
      fetchMessages()
    }, 10000)
    return () => clearInterval(interval)
  }, [activeTab, fetchMessages])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (activeTab === 'messaggi') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeTab])

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

  function handleFileToBase64(
    file: File,
    onDone: (result: { url: string; name: string }) => void
  ) {
    const reader = new FileReader()
    reader.onload = () => {
      onDone({ url: reader.result as string, name: file.name })
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmitInvoice(e: React.FormEvent) {
    e.preventDefault()
    if (!invoiceAmount || isNaN(parseFloat(invoiceAmount))) {
      setInvoiceError('Inserisci un importo valido')
      return
    }
    setSubmittingInvoice(true)
    setInvoiceError(null)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnershipId: params.id,
          amount: parseFloat(invoiceAmount),
          fileUrl: invoiceFile?.url || undefined,
          fileName: invoiceFile?.name || undefined,
          notes: invoiceNotes.trim() || undefined,
        }),
      })
      if (res.ok) {
        await fetchPartnership()
        setInvoiceAmount('')
        setInvoiceFile(null)
        setInvoiceNotes('')
      } else {
        const data = await res.json()
        setInvoiceError(data.error || 'Errore durante l\'invio della fattura')
      }
    } catch (err) {
      console.error('Failed to submit invoice', err)
      setInvoiceError('Errore nella comunicazione con il server')
    } finally {
      setSubmittingInvoice(false)
    }
  }

  async function handleMarkInvoicePaid() {
    if (!partnership?.invoice) return
    const confirmed = window.confirm('Segna questa fattura come pagata?')
    if (!confirmed) return
    setMarkingPaid(true)
    try {
      const res = await fetch(`/api/invoices/${partnership.invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' }),
      })
      if (res.ok) {
        await fetchPartnership()
      }
    } catch (err) {
      console.error('Failed to mark invoice as paid', err)
    } finally {
      setMarkingPaid(false)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() && !messageFile) return
    setSendingMessage(true)
    try {
      const res = await fetch(`/api/partnerships/${params.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim() || undefined,
          fileUrl: messageFile?.url || undefined,
          fileName: messageFile?.name || undefined,
        }),
      })
      if (res.ok) {
        setNewMessage('')
        setMessageFile(null)
        if (messageFileInputRef.current) messageFileInputRef.current.value = ''
        await fetchMessages()
      }
    } catch (err) {
      console.error('Failed to send message', err)
    } finally {
      setSendingMessage(false)
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
  const currentUserId = session?.user?.id || ''

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

        {/* Campaign Type info */}
        {(partnership.campaignType || partnership.campaignObjective || partnership.campaignScript) && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            {partnership.campaignType && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Tipo di Campagna</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                  {CAMPAIGN_TYPE_LABELS[partnership.campaignType] || partnership.campaignType}
                </span>
              </div>
            )}
            {partnership.campaignObjective && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Obiettivo Campagna</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{partnership.campaignObjective}</p>
              </div>
            )}
            {partnership.campaignScript && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Script / Brief Dettagliato</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{partnership.campaignScript}</p>
                </div>
              </div>
            )}
          </div>
        )}

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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {[
            { key: 'contenuti', label: 'Contenuti' },
            { key: 'fattura', label: 'Fattura' },
            { key: 'messaggi', label: 'Messaggi' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'contenuti' | 'fattura' | 'messaggi')}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Contenuti */}
      {activeTab === 'contenuti' && (
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
      )}

      {/* Tab: Fattura */}
      {activeTab === 'fattura' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Fattura</h2>

          {partnership.invoice ? (
            /* Existing invoice */
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm text-gray-500">Importo Fattura</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    €{partnership.invoice.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getInvoiceStatusColor(partnership.invoice.status)}`}>
                  {getInvoiceStatusLabel(partnership.invoice.status)}
                </span>
              </div>

              {partnership.invoice.submittedAt && (
                <p className="text-xs text-gray-500">
                  Inviata il: {format(new Date(partnership.invoice.submittedAt), 'dd/MM/yyyy HH:mm', { locale: it })}
                </p>
              )}

              {partnership.invoice.paidAt && (
                <p className="text-xs text-green-600">
                  Pagata il: {format(new Date(partnership.invoice.paidAt), 'dd/MM/yyyy HH:mm', { locale: it })}
                </p>
              )}

              {partnership.invoice.notes && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Note</p>
                  <p className="text-sm text-gray-700">{partnership.invoice.notes}</p>
                </div>
              )}

              {partnership.invoice.fileUrl && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Allegato</p>
                  <a
                    href={partnership.invoice.fileUrl}
                    download={partnership.invoice.fileName || 'fattura'}
                    className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {partnership.invoice.fileName || 'Scarica Fattura'}
                  </a>
                </div>
              )}

              {isManager && partnership.invoice.status !== 'PAID' && (
                <Button
                  onClick={handleMarkInvoicePaid}
                  loading={markingPaid}
                  size="sm"
                >
                  Segna come Pagata
                </Button>
              )}
            </div>
          ) : (
            /* No invoice yet */
            <>
              {!isManager ? (
                /* Influencer: submit invoice form */
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Invia Fattura</h3>
                  {invoiceError && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                      {invoiceError}
                    </div>
                  )}
                  <form onSubmit={handleSubmitInvoice} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Importo (€) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={invoiceAmount}
                        onChange={(e) => setInvoiceAmount(e.target.value)}
                        placeholder="0.00"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Allega Fattura (PDF, immagine, doc)
                      </label>
                      <input
                        ref={invoiceFileInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleFileToBase64(file, setInvoiceFile)
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                      {invoiceFile && (
                        <p className="text-xs text-green-600 mt-1">
                          File selezionato: {invoiceFile.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Note
                      </label>
                      <textarea
                        value={invoiceNotes}
                        onChange={(e) => setInvoiceNotes(e.target.value)}
                        placeholder="Note aggiuntive..."
                        rows={3}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>

                    <Button type="submit" loading={submittingInvoice}>
                      Invia Fattura
                    </Button>
                  </form>
                </div>
              ) : (
                /* Manager: no invoice yet */
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 font-medium">Nessuna fattura inviata</p>
                  <p className="text-sm text-gray-400 mt-1">L&apos;influencer deve ancora inviare la fattura</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Messaggi */}
      {activeTab === 'messaggi' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Messaggi</h2>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Messages list */}
            <div className="h-96 overflow-y-auto p-4 space-y-3">
              {messagesLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-400">Nessun messaggio ancora. Inizia la conversazione!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId === currentUserId
                  const isInfluencer = msg.senderRole === 'INFLUENCER'
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs text-gray-500 ${isOwn ? 'order-2' : 'order-1'}`}>
                            {msg.senderName}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded text-white font-medium ${isInfluencer ? 'bg-purple-500' : 'bg-blue-500'} ${isOwn ? 'order-1' : 'order-2'}`}>
                            {isInfluencer ? 'Influencer' : 'Manager'}
                          </span>
                        </div>
                        <div className={`rounded-2xl px-4 py-2.5 ${
                          isOwn
                            ? 'bg-primary-600 text-white rounded-tr-sm'
                            : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                        }`}>
                          {msg.content && (
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          )}
                          {msg.fileUrl && (
                            <a
                              href={msg.fileUrl}
                              download={msg.fileName || 'allegato'}
                              className={`flex items-center gap-2 text-xs mt-1 ${isOwn ? 'text-primary-100 hover:text-white' : 'text-primary-600 hover:text-primary-700'} font-medium`}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              {msg.fileName || 'Allegato'}
                            </a>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {format(new Date(msg.createdAt), 'dd/MM HH:mm', { locale: it })}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="border-t border-gray-200 p-4">
              {messageFile && (
                <div className="mb-2 flex items-center gap-2 text-xs text-green-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {messageFile.name}
                  <button
                    type="button"
                    onClick={() => {
                      setMessageFile(null)
                      if (messageFileInputRef.current) messageFileInputRef.current.value = ''
                    }}
                    className="text-red-500 hover:text-red-700 ml-1"
                  >
                    ✕
                  </button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(e)
                      }
                    }}
                    placeholder="Scrivi un messaggio... (Invio per inviare, Shift+Invio per nuova riga)"
                    rows={2}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => messageFileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Allega file"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  <input
                    ref={messageFileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleFileToBase64(file, setMessageFile)
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    loading={sendingMessage}
                    disabled={!newMessage.trim() && !messageFile}
                  >
                    Invia
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
