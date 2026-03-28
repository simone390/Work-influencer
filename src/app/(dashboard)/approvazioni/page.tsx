'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface ContentItem {
  id: string
  type: string
  contentStatus: string
  description: string | null
  postScheduledAt: string | null
  partnership: {
    id: string
    name: string
    brand: { name: string }
    influencer: { id: string; name: string }
  }
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  BOZZA: { bg: '#f5f5f7', text: '#6e6e73', label: 'Bozza' },
  IN_REVISIONE: { bg: '#fff3e0', text: '#e65100', label: 'In Revisione' },
  APPROVATO: { bg: '#e8f5e9', text: '#2e7d32', label: 'Approvato' },
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  REEL: 'Reel', STORY: 'Story', POST: 'Post', VIDEO: 'Video', OTHER: 'Altro',
}

export default function ApprovazioniPage() {
  const [contents, setContents] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'BOZZA' | 'IN_REVISIONE' | 'APPROVATO'>('all')
  const [isManager, setIsManager] = useState(false)

  const fetchContents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/contents/approvals')
      if (!res.ok) return
      const data = await res.json()
      setContents(data.contents)
      setIsManager(data.isManager)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchContents() }, [fetchContents])

  async function updateStatus(contentId: string, newStatus: string) {
    setUpdating(contentId)
    try {
      const res = await fetch(`/api/contents/${contentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentStatus: newStatus }),
      })
      if (res.ok) {
        setContents(prev =>
          prev.map(c => c.id === contentId ? { ...c, contentStatus: newStatus } : c)
        )
      }
    } finally {
      setUpdating(null)
    }
  }

  const filtered = filter === 'all'
    ? contents
    : contents.filter(c => c.contentStatus === filter)

  const counts = {
    all: contents.length,
    BOZZA: contents.filter(c => c.contentStatus === 'BOZZA').length,
    IN_REVISIONE: contents.filter(c => c.contentStatus === 'IN_REVISIONE').length,
    APPROVATO: contents.filter(c => c.contentStatus === 'APPROVATO').length,
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.03em', marginBottom: '4px' }}>
          Approvazioni Contenuti
        </h1>
        <p style={{ fontSize: '15px', color: '#6e6e73' }}>
          {isManager ? 'Gestisci lo stato di approvazione dei contenuti' : 'Visualizza lo stato dei tuoi contenuti'}
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {(['all', 'BOZZA', 'IN_REVISIONE', 'APPROVATO'] as const).map(f => {
          const labels: Record<string, string> = { all: 'Tutti', BOZZA: 'Bozza', IN_REVISIONE: 'In Revisione', APPROVATO: 'Approvati' }
          const isActive = filter === f
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '980px',
                fontSize: '13.5px',
                fontWeight: isActive ? 600 : 400,
                border: isActive ? '1px solid #0071e3' : '1px solid #d2d2d7',
                background: isActive ? '#0071e3' : '#ffffff',
                color: isActive ? '#ffffff' : '#1d1d1f',
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              {labels[f]}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  background: isActive ? 'rgba(255,255,255,0.25)' : '#f5f5f7',
                  color: isActive ? '#ffffff' : '#6e6e73',
                  padding: '1px 6px',
                  borderRadius: '10px',
                }}
              >
                {counts[f]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #f0f0f0', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #f0f0f0',
            padding: '60px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#1d1d1f', marginBottom: '6px' }}>
            Nessun contenuto trovato
          </p>
          <p style={{ fontSize: '14px', color: '#8e8e93' }}>
            Non ci sono contenuti con questo stato
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(content => {
            const statusInfo = STATUS_COLORS[content.contentStatus] || STATUS_COLORS.BOZZA
            const isUpdating = updating === content.id

            return (
              <div
                key={content.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid #f0f0f0',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                {/* Status pill */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    background: statusInfo.bg,
                    color: statusInfo.text,
                    flexShrink: 0,
                  }}
                >
                  {statusInfo.label}
                </span>

                {/* Content info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#1d1d1f' }}>
                      {CONTENT_TYPE_LABELS[content.type] || content.type}
                    </p>
                    <span style={{ fontSize: '12px', color: '#8e8e93' }}>·</span>
                    <Link
                      href={`/partnerships/${content.partnership.id}`}
                      style={{ fontSize: '13.5px', color: '#0071e3', textDecoration: 'none', fontWeight: 500 }}
                    >
                      {content.partnership.name}
                    </Link>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#6e6e73' }}>
                    {content.partnership.brand.name}
                    {!isManager && (
                      <> · {content.partnership.influencer.name}</>
                    )}
                    {isManager && (
                      <> · <strong style={{ color: '#1d1d1f' }}>{content.partnership.influencer.name}</strong></>
                    )}
                  </p>
                  {content.description && (
                    <p style={{ fontSize: '12px', color: '#8e8e93', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                      {content.description}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                  {isManager ? (
                    <>
                      {content.contentStatus !== 'APPROVATO' && (
                        <button
                          onClick={() => updateStatus(content.id, 'APPROVATO')}
                          disabled={isUpdating}
                          style={{
                            padding: '7px 16px',
                            borderRadius: '980px',
                            fontSize: '13px',
                            fontWeight: 500,
                            background: '#34c759',
                            color: '#ffffff',
                            border: 'none',
                            cursor: isUpdating ? 'not-allowed' : 'pointer',
                            opacity: isUpdating ? 0.6 : 1,
                            transition: 'all 200ms ease',
                          }}
                        >
                          Approva
                        </button>
                      )}
                      {content.contentStatus !== 'IN_REVISIONE' && (
                        <button
                          onClick={() => updateStatus(content.id, 'IN_REVISIONE')}
                          disabled={isUpdating}
                          style={{
                            padding: '7px 16px',
                            borderRadius: '980px',
                            fontSize: '13px',
                            fontWeight: 500,
                            background: '#ffffff',
                            color: '#ff9500',
                            border: '1px solid #ff9500',
                            cursor: isUpdating ? 'not-allowed' : 'pointer',
                            opacity: isUpdating ? 0.6 : 1,
                            transition: 'all 200ms ease',
                          }}
                        >
                          Richiedi revisione
                        </button>
                      )}
                      {content.contentStatus === 'APPROVATO' && (
                        <button
                          onClick={() => updateStatus(content.id, 'BOZZA')}
                          disabled={isUpdating}
                          style={{
                            padding: '7px 16px',
                            borderRadius: '980px',
                            fontSize: '13px',
                            fontWeight: 500,
                            background: '#ffffff',
                            color: '#6e6e73',
                            border: '1px solid #d2d2d7',
                            cursor: isUpdating ? 'not-allowed' : 'pointer',
                            opacity: isUpdating ? 0.6 : 1,
                          }}
                        >
                          Rimetti in bozza
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {content.contentStatus === 'BOZZA' && (
                        <button
                          onClick={() => updateStatus(content.id, 'IN_REVISIONE')}
                          disabled={isUpdating}
                          style={{
                            padding: '7px 16px',
                            borderRadius: '980px',
                            fontSize: '13px',
                            fontWeight: 500,
                            background: '#0071e3',
                            color: '#ffffff',
                            border: 'none',
                            cursor: isUpdating ? 'not-allowed' : 'pointer',
                            opacity: isUpdating ? 0.6 : 1,
                            transition: 'all 200ms ease',
                          }}
                        >
                          Invia in revisione
                        </button>
                      )}
                      {content.contentStatus === 'IN_REVISIONE' && (
                        <span style={{ fontSize: '12px', color: '#ff9500', fontWeight: 500 }}>
                          In attesa di revisione...
                        </span>
                      )}
                      {content.contentStatus === 'APPROVATO' && (
                        <span style={{ fontSize: '12px', color: '#34c759', fontWeight: 500 }}>
                          Approvato ✓
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
