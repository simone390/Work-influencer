'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TASK_LABELS } from '@/lib/workflow'

const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]
const DAYS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

interface CalendarTask {
  id: string
  type: string
  status: string
  dueDate: string
  partnershipId: string
  partnershipName: string
  brandName: string
  influencerName: string
  contentType: string
}

interface CalendarData {
  grouped: Record<string, CalendarTask[]>
  influencers: { id: string; name: string }[]
}

function getTaskColor(status: string, dueDate: string): { bg: string; text: string; border: string } {
  const now = new Date()
  const due = new Date(dueDate)
  if (status === 'COMPLETED') return { bg: '#e8f5e9', text: '#2e7d32', border: '#34c759' }
  if (due < now) return { bg: '#ffeef0', text: '#c62828', border: '#ff3b30' }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  if (today.getTime() === dueDay.getTime()) return { bg: '#fff3e0', text: '#e65100', border: '#ff9500' }
  return { bg: '#e8f0fd', text: '#0071e3', border: '#0071e3' }
}

export default function CalendarioPage() {
  const router = useRouter()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [data, setData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedInfluencer, setSelectedInfluencer] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ year: String(year), month: String(month) })
      if (selectedInfluencer) params.set('influencerId', selectedInfluencer)
      const res = await fetch(`/api/calendario?${params}`)
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [year, month, selectedInfluencer])

  useEffect(() => { fetchData() }, [fetchData])

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startDow = (firstDay.getDay() + 6) % 7 // Mon=0
  const totalDays = lastDay.getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const grouped = data?.grouped || {}

  function getDateKey(d: number) {
    return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  const isToday = (d: number) => {
    return d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear()
  }

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.03em', marginBottom: '4px' }}>
            Calendario Contenuti
          </h1>
          <p style={{ fontSize: '15px', color: '#6e6e73' }}>
            Visualizza le scadenze dei contenuti per mese
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {data?.influencers && data.influencers.length > 0 && (
            <select
              value={selectedInfluencer}
              onChange={e => setSelectedInfluencer(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #d2d2d7',
                fontSize: '13.5px',
                color: '#1d1d1f',
                background: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">Tutti gli influencer</option>
              {data.influencers.map(inf => (
                <option key={inf.id} value={inf.id}>{inf.name}</option>
              ))}
            </select>
          )}

          {/* Month navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffffff',
              borderRadius: '10px',
              padding: '6px 12px',
              border: '1px solid #d2d2d7',
            }}
          >
            <button
              onClick={prevMonth}
              style={{
                width: '28px', height: '28px', border: 'none', background: 'transparent',
                cursor: 'pointer', color: '#1d1d1f', borderRadius: '6px', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1d1d1f', minWidth: '130px', textAlign: 'center' }}>
              {MONTHS_IT[month - 1]} {year}
            </span>
            <button
              onClick={nextMonth}
              style={{
                width: '28px', height: '28px', border: 'none', background: 'transparent',
                cursor: 'pointer', color: '#1d1d1f', borderRadius: '6px', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { color: '#ff3b30', bg: '#ffeef0', label: 'Scaduto' },
          { color: '#ff9500', bg: '#fff3e0', label: 'Oggi' },
          { color: '#0071e3', bg: '#e8f0fd', label: 'In scadenza' },
          { color: '#34c759', bg: '#e8f5e9', label: 'Completato' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.bg, border: `1.5px solid ${item.color}` }} />
            <span style={{ fontSize: '12px', color: '#6e6e73' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0',
          overflow: 'hidden',
        }}
      >
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #f0f0f0' }}>
          {DAYS_IT.map(day => (
            <div
              key={day}
              style={{
                padding: '10px 0',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: 600,
                color: '#6e6e73',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#8e8e93' }}>
            <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #f0f0f0', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((d, idx) => {
              const dateKey = d ? getDateKey(d) : null
              const tasks = dateKey ? (grouped[dateKey] || []) : []
              const today_ = d ? isToday(d) : false

              return (
                <div
                  key={idx}
                  style={{
                    minHeight: '110px',
                    padding: '8px',
                    borderRight: (idx + 1) % 7 !== 0 ? '1px solid #f5f5f7' : 'none',
                    borderBottom: idx < cells.length - 7 ? '1px solid #f5f5f7' : 'none',
                    background: today_ ? '#f0f7ff' : 'transparent',
                  }}
                >
                  {d && (
                    <>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: today_ ? '#0071e3' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '4px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: today_ ? 700 : 500,
                            color: today_ ? '#ffffff' : '#1d1d1f',
                          }}
                        >
                          {d}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {tasks.slice(0, 3).map(task => {
                          const colors = getTaskColor(task.status, task.dueDate)
                          return (
                            <button
                              key={task.id}
                              onClick={() => router.push(`/partnerships/${task.partnershipId}`)}
                              style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                padding: '3px 6px',
                                borderRadius: '4px',
                                background: colors.bg,
                                border: `1px solid ${colors.border}22`,
                                cursor: 'pointer',
                                transition: 'opacity 200ms ease',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.opacity = '0.75' }}
                              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                            >
                              <p style={{ fontSize: '10px', fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {task.partnershipName}
                              </p>
                              <p style={{ fontSize: '9px', color: colors.text, opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {TASK_LABELS[task.type] || task.type}
                              </p>
                            </button>
                          )
                        })}
                        {tasks.length > 3 && (
                          <p style={{ fontSize: '10px', color: '#6e6e73', paddingLeft: '4px' }}>
                            +{tasks.length - 3} altri
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
