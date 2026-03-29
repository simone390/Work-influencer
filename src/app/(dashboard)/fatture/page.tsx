'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

function getStatusStyle(status: string) {
  switch (status) {
    case 'PENDING': return { bg: '#fff3e0', text: '#e65100', border: '#ff950040' }
    case 'SUBMITTED': return { bg: '#e8f0fd', text: '#0071e3', border: '#0071e340' }
    case 'PAID': return { bg: '#e8f5e9', text: '#2e7d32', border: '#34c75940' }
    default: return { bg: '#f5f5f7', text: '#6e6e73', border: '#d2d2d740' }
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function FatturePage() {
  const { data: session } = useSession()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  const [sendingFollowup, setSendingFollowup] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Upload state for influencer
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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
        setSuccessMsg('Fattura segnata come pagata')
        setTimeout(() => setSuccessMsg(null), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Errore durante l\'aggiornamento')
      }
    } catch (err) {
      setError('Errore nella comunicazione con il server')
    } finally {
      setMarkingPaid(null)
    }
  }

  async function handleSendFollowup(invoice: Invoice) {
    setSendingFollowup(invoice.id)
    setError(null)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/followup`, {
        method: 'POST',
      })
      if (res.ok) {
        setSuccessMsg(`Follow-up inviato per "${invoice.partnership.name}"`)
        setTimeout(() => setSuccessMsg(null), 4000)
      } else {
        const data = await res.json()
        setError(data.error || 'Errore nell\'invio del follow-up')
      }
    } catch (err) {
      setError('Errore nella comunicazione con il server')
    } finally {
      setSendingFollowup(null)
    }
  }

  function startUpload(invoiceId: string) {
    setUploadingFor(invoiceId)
    setUploadFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function cancelUpload() {
    setUploadingFor(null)
    setUploadFile(null)
  }

  async function handleUploadFile() {
    if (!uploadFile || !uploadingFor) return
    if (uploadFile.size > 5 * 1024 * 1024) {
      setError('Il file supera i 5MB consentiti')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const base64 = await fileToBase64(uploadFile)
      const res = await fetch(`/api/invoices/${uploadingFor}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: base64,
          fileName: uploadFile.name,
          status: 'SUBMITTED',
        }),
      })

      if (res.ok) {
        await fetchInvoices()
        setUploadingFor(null)
        setUploadFile(null)
        setSuccessMsg('Fattura caricata e inviata al manager')
        setTimeout(() => setSuccessMsg(null), 4000)
      } else {
        const data = await res.json()
        setError(data.error || 'Errore durante il caricamento')
      }
    } catch (err) {
      setError('Errore nella comunicazione con il server')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #f0f0f0', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const paidAmount = invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0)
  const pendingAmount = invoices.filter(inv => inv.status !== 'PAID').reduce((sum, inv) => sum + inv.amount, 0)

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.03em', marginBottom: '4px' }}>
          Fatture
        </h1>
        <p style={{ fontSize: '15px', color: '#6e6e73' }}>
          {invoices.length} {invoices.length === 1 ? 'fattura' : 'fatture'} totali
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#ffeef0', border: '1px solid #ff3b3030', borderRadius: '10px' }}>
          <p style={{ fontSize: '13.5px', color: '#c62828', fontWeight: 500 }}>{error}</p>
        </div>
      )}

      {successMsg && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#e8f5e9', border: '1px solid #34c75930', borderRadius: '10px' }}>
          <p style={{ fontSize: '13.5px', color: '#2e7d32', fontWeight: 500 }}>{successMsg}</p>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Totale Fatturato', value: totalAmount, color: '#1d1d1f' },
          { label: 'Pagato', value: paidAmount, color: '#34c759' },
          { label: 'In Attesa', value: pendingAmount, color: '#ff9500' },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #f0f0f0',
              padding: '18px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <p style={{ fontSize: '12px', color: '#8e8e93', marginBottom: '6px', fontWeight: 500 }}>{stat.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 700, color: stat.color, letterSpacing: '-0.02em' }}>
              €{stat.value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={e => setUploadFile(e.target.files?.[0] || null)}
      />

      {invoices.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #f0f0f0',
            padding: '60px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#d2d2d7" style={{ margin: '0 auto 16px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#3a3a3c' }}>Nessuna fattura trovata</p>
          <p style={{ fontSize: '13px', color: '#8e8e93', marginTop: '4px' }}>
            Le fatture vengono create dalla pagina della partnership
          </p>
        </div>
      ) : (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #f0f0f0',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isManager ? '1fr 150px 110px 100px 120px 110px 110px' : '1fr 110px 100px 120px 130px 120px',
              padding: '10px 20px',
              background: '#f5f5f7',
              borderBottom: '1px solid #f0f0f0',
              gap: '12px',
            }}
          >
            {[
              'Partnership',
              ...(isManager ? ['Influencer'] : []),
              'Importo',
              'Stato',
              'Data Invio',
              'Allegato',
              isManager ? 'Azioni' : 'Azioni',
            ].map(h => (
              <span key={h} style={{ fontSize: '11px', fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {h}
              </span>
            ))}
          </div>

          {/* Table rows */}
          {invoices.map((invoice, idx) => {
            const statusStyle = getStatusStyle(invoice.status)
            const isUploadOpen = uploadingFor === invoice.id
            const daysSinceSubmit = invoice.submittedAt
              ? Math.floor((Date.now() - new Date(invoice.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
              : null

            return (
              <div key={invoice.id}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isManager ? '1fr 150px 110px 100px 120px 110px 110px' : '1fr 110px 100px 120px 130px 120px',
                    padding: '14px 20px',
                    borderBottom: idx < invoices.length - 1 || isUploadOpen ? '1px solid #f5f5f7' : 'none',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                >
                  {/* Partnership */}
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#1d1d1f' }}>{invoice.partnership.name}</p>
                    <p style={{ fontSize: '12px', color: '#8e8e93', marginTop: '2px' }}>{invoice.partnership.brand.name}</p>
                  </div>

                  {/* Influencer (manager only) */}
                  {isManager && (
                    <div>
                      <p style={{ fontSize: '13px', color: '#3a3a3c', fontWeight: 500 }}>{invoice.influencer.name}</p>
                      <p style={{ fontSize: '11px', color: '#8e8e93' }}>{invoice.influencer.email}</p>
                    </div>
                  )}

                  {/* Amount */}
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#1d1d1f' }}>
                    €{invoice.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </span>

                  {/* Status */}
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: statusStyle.bg,
                      color: statusStyle.text,
                      border: `1px solid ${statusStyle.border}`,
                    }}
                  >
                    {getStatusLabel(invoice.status)}
                  </span>

                  {/* Date */}
                  <div>
                    <span style={{ fontSize: '12px', color: '#6e6e73' }}>
                      {invoice.submittedAt
                        ? format(new Date(invoice.submittedAt), 'dd/MM/yyyy', { locale: it })
                        : '—'}
                    </span>
                    {invoice.paidAt && (
                      <p style={{ fontSize: '11px', color: '#34c759', marginTop: '2px', fontWeight: 500 }}>
                        Pagata: {format(new Date(invoice.paidAt), 'dd/MM/yyyy', { locale: it })}
                      </p>
                    )}
                  </div>

                  {/* Attachment */}
                  <div>
                    {invoice.fileUrl ? (
                      <a
                        href={invoice.fileUrl}
                        download={invoice.fileName || 'fattura'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          color: '#0071e3',
                          fontWeight: 500,
                          textDecoration: 'none',
                        }}
                      >
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {invoice.fileName ? invoice.fileName.substring(0, 12) + (invoice.fileName.length > 12 ? '…' : '') : 'Scarica'}
                      </a>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#d2d2d7' }}>Nessun file</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {isManager ? (
                      invoice.status !== 'PAID' && (
                        <button
                          onClick={() => handleMarkPaid(invoice.id)}
                          disabled={markingPaid === invoice.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#2e7d32',
                            background: '#e8f5e9',
                            border: '1px solid #34c75930',
                            borderRadius: '6px',
                            cursor: markingPaid === invoice.id ? 'not-allowed' : 'pointer',
                            opacity: markingPaid === invoice.id ? 0.6 : 1,
                          }}
                        >
                          {markingPaid === invoice.id ? 'Aggiornando...' : (
                            <>
                              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              Segna Pagata
                            </>
                          )}
                        </button>
                      )
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {/* Upload button for influencer */}
                        {invoice.status !== 'PAID' && (
                          <button
                            onClick={() => isUploadOpen ? cancelUpload() : startUpload(invoice.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: isUploadOpen ? '#6e6e73' : '#0071e3',
                              background: isUploadOpen ? '#f5f5f7' : '#e8f0fd',
                              border: `1px solid ${isUploadOpen ? '#d2d2d740' : '#0071e340'}`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            {isUploadOpen ? 'Annulla' : (invoice.fileUrl ? 'Aggiorna file' : 'Carica fattura')}
                          </button>
                        )}

                        {/* Follow-up button: show if submitted for 7+ days */}
                        {invoice.status === 'SUBMITTED' && daysSinceSubmit !== null && daysSinceSubmit >= 7 && (
                          <button
                            onClick={() => handleSendFollowup(invoice)}
                            disabled={sendingFollowup === invoice.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#e65100',
                              background: '#fff3e0',
                              border: '1px solid #ff950030',
                              borderRadius: '6px',
                              cursor: sendingFollowup === invoice.id ? 'not-allowed' : 'pointer',
                              opacity: sendingFollowup === invoice.id ? 0.6 : 1,
                            }}
                          >
                            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {sendingFollowup === invoice.id ? 'Invio...' : 'Invia Follow-up'}
                          </button>
                        )}

                        {/* Show days since submitted */}
                        {invoice.status === 'SUBMITTED' && daysSinceSubmit !== null && daysSinceSubmit < 7 && (
                          <p style={{ fontSize: '10px', color: '#8e8e93' }}>
                            Inviata {daysSinceSubmit}g fa
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload panel for influencer */}
                {!isManager && isUploadOpen && (
                  <div
                    style={{
                      padding: '16px 20px',
                      background: '#f9f9fb',
                      borderBottom: idx < invoices.length - 1 ? '1px solid #f0f0f0' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      style={{
                        padding: '8px 16px',
                        background: '#ffffff',
                        border: '1.5px dashed #d2d2d7',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#3a3a3c',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {uploadFile ? uploadFile.name : 'Seleziona file PDF/immagine'}
                    </button>

                    {uploadFile && (
                      <button
                        onClick={handleUploadFile}
                        disabled={uploading}
                        style={{
                          padding: '8px 18px',
                          background: uploading ? '#8e8e93' : '#0071e3',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: uploading ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {uploading ? (
                          <>
                            <div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            Caricamento...
                          </>
                        ) : (
                          <>
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Carica e Invia
                          </>
                        )}
                      </button>
                    )}

                    <p style={{ fontSize: '12px', color: '#8e8e93' }}>
                      PDF, JPG o PNG · max 5MB
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
