'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface Invoice {
  id: string
  amount: number
  status: string
  submittedAt?: string | null
  paidAt?: string | null
  notes?: string | null
  fileUrl?: string | null
  fileName?: string | null
  createdAt: string
  partnership: {
    id: string
    name: string
    brand: {
      id: string
      name: string
    }
  }
  influencer: {
    id: string
    name: string
    email: string
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'PENDING': return 'In Attesa'
    case 'SUBMITTED': return 'Inviata'
    case 'PAID': return 'Pagata'
    default: return status
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800'
    case 'SUBMITTED': return 'bg-blue-100 text-blue-800'
    case 'PAID': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function FatturePage() {
  const { data: session } = useSession()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isManager = session?.user?.role === 'MANAGER'

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch('/api/invoices')
      if (res.ok) {
        const data = await res.json()
        setInvoices(data)
      }
    } catch (err) {
      console.error('Failed to fetch invoices', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  async function handleMarkPaid(invoiceId: string) {
    const confirmed = window.confirm('Segna questa fattura come pagata?')
    if (!confirmed) return

    setMarkingPaid(invoiceId)
    setError(null)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' }),
      })
      if (res.ok) {
        await fetchInvoices()
      } else {
        const data = await res.json()
        setError(data.error || 'Errore durante l\'aggiornamento')
      }
    } catch (err) {
      console.error('Failed to mark as paid', err)
      setError('Errore nella comunicazione con il server')
    } finally {
      setMarkingPaid(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const paidAmount = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.amount, 0)
  const pendingAmount = invoices
    .filter((inv) => inv.status !== 'PAID')
    .reduce((sum, inv) => sum + inv.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fatture</h1>
        <p className="text-gray-500 text-sm mt-1">
          {invoices.length} {invoices.length === 1 ? 'fattura' : 'fatture'} totali
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Totale Fatturato</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            €{totalAmount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Pagato</p>
          <p className="text-xl font-bold text-green-600 mt-1">
            €{paidAmount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">In Attesa</p>
          <p className="text-xl font-bold text-yellow-600 mt-1">
            €{pendingAmount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 font-medium">Nessuna fattura trovata</p>
          <p className="text-sm text-gray-400 mt-1">
            Le fatture vengono create dalla pagina della partnership
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Partnership
                </th>
                {isManager && (
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Influencer
                  </th>
                )}
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Importo
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Stato
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Data Invio
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Allegato
                </th>
                {isManager && (
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Azioni
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {invoice.partnership.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {invoice.partnership.brand.name}
                    </p>
                  </td>
                  {isManager && (
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{invoice.influencer.name}</p>
                      <p className="text-xs text-gray-500">{invoice.influencer.email}</p>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">
                      €{invoice.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {invoice.submittedAt
                        ? format(new Date(invoice.submittedAt), 'dd/MM/yyyy', { locale: it })
                        : '—'}
                    </span>
                    {invoice.paidAt && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Pagata: {format(new Date(invoice.paidAt), 'dd/MM/yyyy', { locale: it })}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {invoice.fileUrl ? (
                      <a
                        href={invoice.fileUrl}
                        download={invoice.fileName || 'fattura'}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {invoice.fileName || 'Scarica'}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  {isManager && (
                    <td className="px-6 py-4">
                      {invoice.status !== 'PAID' && (
                        <button
                          onClick={() => handleMarkPaid(invoice.id)}
                          disabled={markingPaid === invoice.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {markingPaid === invoice.id ? (
                            <>
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Aggiornando...
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Segna Pagata
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
