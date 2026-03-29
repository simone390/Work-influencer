'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, isAfter, isBefore, isToday, startOfDay } from 'date-fns'
import { it } from 'date-fns/locale'
import { TASK_LABELS, TASK_STATUS_LABELS } from '@/lib/workflow'

interface Task {
  id: string
  type: string
  status: string
  dueDate: string | null
  notes: string | null
  revisionNotes: string | null
  completedAt: string | null
  order: number
  createdAt: string
  partnershipId: string
  partnershipName: string
  brandName: string
  influencerName: string
  contentType: string
  contentId: string
}

type ViewMode = 'list' | 'gantt'

function getStatusColors(status: string, dueDate: string | null) {
  if (status === 'COMPLETED') return { bg: '#e8f5e9', text: '#2e7d32', border: '#34c759', dot: '#34c759' }
  if (status === 'REVISION_NEEDED') return { bg: '#fff3e0', text: '#e65100', border: '#ff9500', dot: '#ff9500' }
  if (status === 'IN_PROGRESS') {
    if (dueDate && isBefore(new Date(dueDate), startOfDay(new Date()))) {
      return { bg: '#ffeef0', text: '#c62828', border: '#ff3b30', dot: '#ff3b30' }
    }
    return { bg: '#e8f0fd', text: '#0071e3', border: '#0071e3', dot: '#0071e3' }
  }
  return { bg: '#f5f5f7', text: '#6e6e73', border: '#d2d2d7', dot: '#8e8e93' }
}

function getDueDateLabel(dueDate: string | null): { label: string; color: string } | null {
  if (!dueDate) return null
  const due = new Date(dueDate)
  const today = startOfDay(new Date())
  if (isBefore(due, today)) return { label: 'Scaduto', color: '#ff3b30' }
  if (isToday(due)) return { label: 'Oggi', color: '#ff9500' }
  return { label: format(due, 'd MMM', { locale: it }), color: '#6e6e73' }
}

function GanttChart({ tasks }: { tasks: Task[] }) {
  const tasksWithDates = tasks.filter(t => t.dueDate)
  if (tasksWithDates.length === 0) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#8e8e93' }}>
        <p style={{ fontSize: '15px' }}>Nessun task con scadenza trovato</p>
      </div>
    )
  }

  // Calculate date range
  const dates = tasksWithDates.map(t => new Date(t.dueDate!))
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
  // Add padding
  minDate.setDate(minDate.getDate() - 3)
  maxDate.setDate(maxDate.getDate() + 7)

  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
  const today = new Date()
  const todayOffset = Math.max(0, Math.floor((today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)))

  // Group tasks by partnership
  const grouped: Record<string, Task[]> = {}
  for (const task of tasksWithDates) {
    if (!grouped[task.partnershipId]) grouped[task.partnershipId] = []
    grouped[task.partnershipId].push(task)
  }

  const COL_WIDTH = 28 // pixels per day

  function getBarLeft(dueDate: string) {
    const due = new Date(dueDate)
    const days = Math.floor((due.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, days) * COL_WIDTH
  }

  // Generate month labels
  const monthLabels: { label: string; left: number }[] = []
  const current = new Date(minDate)
  current.setDate(1)
  while (current <= maxDate) {
    const offset = Math.floor((current.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
    monthLabels.push({
      label: format(current, 'MMM yyyy', { locale: it }),
      left: Math.max(0, offset) * COL_WIDTH,
    })
    current.setMonth(current.getMonth() + 1)
  }

  const chartWidth = totalDays * COL_WIDTH

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: `${chartWidth + 240}px` }}>
        {/* Header */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
          <div style={{ width: '240px', minWidth: '240px', padding: '10px 16px', fontSize: '12px', fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Partnership / Task
          </div>
          <div style={{ flex: 1, position: 'relative', height: '36px', overflow: 'hidden' }}>
            {monthLabels.map((m, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  left: `${m.left}px`,
                  top: '10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6e6e73',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.label}
              </span>
            ))}
            {/* Today line in header */}
            <div
              style={{
                position: 'absolute',
                left: `${todayOffset * COL_WIDTH}px`,
                top: 0,
                bottom: 0,
                width: '2px',
                background: '#0071e3',
                opacity: 0.5,
              }}
            />
          </div>
        </div>

        {/* Rows */}
        {Object.entries(grouped).map(([partnershipId, ptasks]) => (
          <div key={partnershipId}>
            {/* Partnership header row */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#f5f5f7', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ width: '240px', minWidth: '240px', padding: '8px 16px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#1d1d1f' }}>{ptasks[0].partnershipName}</p>
                <p style={{ fontSize: '11px', color: '#6e6e73' }}>{ptasks[0].brandName}</p>
              </div>
              <div style={{ flex: 1, height: '32px', position: 'relative' }}>
                {/* Today line */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${todayOffset * COL_WIDTH}px`,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    background: '#0071e380',
                  }}
                />
              </div>
            </div>

            {/* Task rows */}
            {ptasks.map((task) => {
              const colors = getStatusColors(task.status, task.dueDate)
              const barLeft = getBarLeft(task.dueDate!)
              const label = TASK_LABELS[task.type] || task.type

              return (
                <div
                  key={task.id}
                  style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #f5f5f7' }}
                >
                  <div style={{ width: '240px', minWidth: '240px', padding: '8px 16px 8px 28px' }}>
                    <p style={{ fontSize: '12px', color: '#3a3a3c', fontWeight: 500 }}>{label}</p>
                  </div>
                  <div style={{ flex: 1, height: '36px', position: 'relative' }}>
                    {/* Today line */}
                    <div
                      style={{
                        position: 'absolute',
                        left: `${todayOffset * COL_WIDTH}px`,
                        top: 0,
                        bottom: 0,
                        width: '1px',
                        background: '#0071e340',
                      }}
                    />
                    {/* Task bar */}
                    <div
                      style={{
                        position: 'absolute',
                        left: `${barLeft - 8}px`,
                        top: '8px',
                        height: '20px',
                        minWidth: '80px',
                        background: colors.bg,
                        border: `1.5px solid ${colors.border}`,
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 8px',
                        gap: '5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: colors.dot,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: '10px', fontWeight: 600, color: colors.text }}>
                        {task.dueDate ? format(new Date(task.dueDate), 'd MMM', { locale: it }) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('list')
  const [filterStatus, setFilterStatus] = useState('')

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tasks')
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const filtered = filterStatus ? tasks.filter(t => t.status === filterStatus) : tasks

  const pending = tasks.filter(t => t.status === 'PENDING').length
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length
  const completed = tasks.filter(t => t.status === 'COMPLETED').length
  const overdue = tasks.filter(t =>
    t.dueDate && isBefore(new Date(t.dueDate), startOfDay(new Date())) && t.status !== 'COMPLETED'
  ).length

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #f0f0f0', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.03em', marginBottom: '4px' }}>
          I Miei Task
        </h1>
        <p style={{ fontSize: '15px', color: '#6e6e73' }}>
          Tutte le attività delle tue partnership
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'In Corso', value: inProgress, color: '#0071e3', bg: '#e8f0fd' },
          { label: 'Scaduti', value: overdue, color: '#ff3b30', bg: '#ffeef0' },
          { label: 'In Attesa', value: pending, color: '#8e8e93', bg: '#f5f5f7' },
          { label: 'Completati', value: completed, color: '#34c759', bg: '#e8f5e9' },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #f0f0f0',
              padding: '16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <p style={{ fontSize: '12px', color: '#6e6e73', marginBottom: '4px' }}>{stat.label}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: stat.color,
                }}
              />
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em' }}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* View toggle */}
        <div
          style={{
            display: 'flex',
            background: '#f5f5f7',
            borderRadius: '10px',
            padding: '3px',
            gap: '2px',
          }}
        >
          {(['list', 'gantt'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: 'none',
                background: view === v ? '#ffffff' : 'transparent',
                fontSize: '13px',
                fontWeight: view === v ? 600 : 450,
                color: view === v ? '#1d1d1f' : '#6e6e73',
                cursor: 'pointer',
                boxShadow: view === v ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 150ms ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {v === 'list' ? (
                <>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Lista
                </>
              ) : (
                <>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  Gantt
                </>
              )}
            </button>
          ))}
        </div>

        {/* Status filter (list view only) */}
        {view === 'list' && (
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
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
            <option value="">Tutti gli stati</option>
            <option value="IN_PROGRESS">In Corso</option>
            <option value="PENDING">In Attesa</option>
            <option value="REVISION_NEEDED">Revisione Richiesta</option>
            <option value="COMPLETED">Completato</option>
          </select>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0',
          overflow: 'hidden',
        }}
      >
        {tasks.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#d2d2d7" style={{ margin: '0 auto 16px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#3a3a3c' }}>Nessun task trovato</p>
            <p style={{ fontSize: '13px', color: '#8e8e93', marginTop: '4px' }}>I task appariranno quando verranno create delle partnership</p>
          </div>
        ) : view === 'gantt' ? (
          <GanttChart tasks={tasks} />
        ) : (
          <>
            {/* List header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 180px 140px 120px',
                padding: '10px 20px',
                background: '#f5f5f7',
                borderBottom: '1px solid #f0f0f0',
                gap: '16px',
              }}
            >
              {['Task', 'Partnership', 'Scadenza', 'Stato'].map(h => (
                <span key={h} style={{ fontSize: '11px', fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </span>
              ))}
            </div>

            {/* List rows */}
            {filtered.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#8e8e93', fontSize: '14px' }}>
                Nessun task con questo stato
              </div>
            ) : (
              filtered.map((task, idx) => {
                const colors = getStatusColors(task.status, task.dueDate)
                const dueDateInfo = getDueDateLabel(task.dueDate)
                const isOverdue = task.dueDate && isBefore(new Date(task.dueDate), startOfDay(new Date())) && task.status !== 'COMPLETED'

                return (
                  <div
                    key={task.id}
                    onClick={() => router.push(`/partnerships/${task.partnershipId}`)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 180px 140px 120px',
                      padding: '14px 20px',
                      borderBottom: idx < filtered.length - 1 ? '1px solid #f5f5f7' : 'none',
                      gap: '16px',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'background 150ms ease',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#f9f9fb' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                  >
                    {/* Task name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: colors.dot,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#1d1d1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {TASK_LABELS[task.type] || task.type}
                        </p>
                        {task.revisionNotes && (
                          <p style={{ fontSize: '11px', color: '#ff9500', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Revisione: {task.revisionNotes}
                          </p>
                        )}
                        {task.notes && (
                          <p style={{ fontSize: '11px', color: '#8e8e93', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Partnership */}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: '#3a3a3c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.partnershipName}
                      </p>
                      <p style={{ fontSize: '11px', color: '#8e8e93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.brandName}
                      </p>
                    </div>

                    {/* Due date */}
                    <div>
                      {dueDateInfo ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: dueDateInfo.color,
                          }}
                        >
                          {isOverdue && (
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                            </svg>
                          )}
                          {dueDateInfo.label}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#8e8e93' }}>—</span>
                      )}
                    </div>

                    {/* Status badge */}
                    <div>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}40`,
                        }}
                      >
                        {TASK_STATUS_LABELS[task.status] || task.status}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}
      </div>
    </div>
  )
}
