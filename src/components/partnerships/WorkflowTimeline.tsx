'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Badge, getTaskStatusVariant, getTaskStatusLabel } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Textarea } from '../ui/Input'
import { TASK_LABELS, TaskType, TaskStatus } from '@/lib/workflow'

interface Task {
  id: string
  type: string
  status: string
  dueDate?: string | null
  notes?: string | null
  revisionNotes?: string | null
  completedAt?: string | null
  order: number
}

interface WorkflowTimelineProps {
  contentId: string
  tasks: Task[]
  userRole: string
  onTaskUpdate: () => void
}

export function WorkflowTimeline({
  contentId,
  tasks,
  userRole,
  onTaskUpdate,
}: WorkflowTimelineProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [revisionModal, setRevisionModal] = useState<{
    isOpen: boolean
    taskId: string
    taskType: string
  }>({ isOpen: false, taskId: '', taskType: '' })
  const [revisionNotes, setRevisionNotes] = useState('')
  const [postLinkModal, setPostLinkModal] = useState<{
    isOpen: boolean
    taskId: string
  }>({ isOpen: false, taskId: '' })
  const [postLink, setPostLink] = useState('')
  const [metricsModal, setMetricsModal] = useState<{
    isOpen: boolean
    taskId: string
    contentId: string
  }>({ isOpen: false, taskId: '', contentId: '' })
  const [metrics, setMetrics] = useState({ views: 0, linkClicks: 0 })

  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order)

  async function updateTask(taskId: string, data: Record<string, unknown>) {
    setLoading(taskId)
    try {
      // Get the partnershipId from the URL
      const pathParts = window.location.pathname.split('/')
      const partnershipId = pathParts[pathParts.indexOf('partnerships') + 1]

      const res = await fetch(
        `/api/partnerships/${partnershipId}/tasks/${taskId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Errore nell\'aggiornamento del task')
        return
      }

      onTaskUpdate()
    } catch (err) {
      console.error('Failed to update task', err)
      alert('Errore nella comunicazione con il server')
    } finally {
      setLoading(null)
    }
  }

  async function handleRevisionSubmit() {
    if (!revisionNotes.trim()) {
      alert('Inserisci le note di revisione')
      return
    }
    await updateTask(revisionModal.taskId, {
      action: 'reject',
      revisionNotes: revisionNotes.trim(),
    })
    setRevisionModal({ isOpen: false, taskId: '', taskType: '' })
    setRevisionNotes('')
  }

  async function handlePostLinkSubmit() {
    await updateTask(postLinkModal.taskId, {
      action: 'complete',
      postLink: postLink.trim(),
    })
    setPostLinkModal({ isOpen: false, taskId: '' })
    setPostLink('')
  }

  async function handleMetricsSubmit() {
    await updateTask(metricsModal.taskId, {
      action: 'complete',
      metrics: { views: Number(metrics.views), linkClicks: Number(metrics.linkClicks) },
    })
    setMetricsModal({ isOpen: false, taskId: '', contentId: '' })
    setMetrics({ views: 0, linkClicks: 0 })
  }

  function renderTaskAction(task: Task) {
    const isLoading = loading === task.id
    const taskType = task.type as TaskType
    const taskStatus = task.status as TaskStatus

    if (taskStatus === TaskStatus.COMPLETED) return null
    if (taskStatus === TaskStatus.PENDING) return null

    // WRITE_SCRIPT - Influencer action
    if (taskType === TaskType.WRITE_SCRIPT && taskStatus === TaskStatus.IN_PROGRESS) {
      if (userRole !== 'INFLUENCER' && userRole !== 'MANAGER') return null
      return (
        <Button
          size="sm"
          onClick={() => updateTask(task.id, { action: 'complete' })}
          loading={isLoading}
        >
          Script Completato
        </Button>
      )
    }

    // WRITE_SCRIPT - Revision needed
    if (taskType === TaskType.WRITE_SCRIPT && taskStatus === TaskStatus.REVISION_NEEDED) {
      if (userRole !== 'INFLUENCER' && userRole !== 'MANAGER') return null
      return (
        <div>
          {task.revisionNotes && (
            <p className="text-xs text-red-600 mb-2">
              Note: {task.revisionNotes}
            </p>
          )}
          <Button
            size="sm"
            onClick={() => updateTask(task.id, { action: 'complete' })}
            loading={isLoading}
          >
            Script Revisionato
          </Button>
        </div>
      )
    }

    // BRAND_APPROVAL - Manager action
    if (taskType === TaskType.BRAND_APPROVAL && taskStatus === TaskStatus.IN_PROGRESS) {
      if (userRole !== 'MANAGER') return null
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => updateTask(task.id, { action: 'complete' })}
            loading={isLoading}
          >
            Approva
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setRevisionModal({ isOpen: true, taskId: task.id, taskType: task.type })}
            disabled={isLoading}
          >
            Rifiuta
          </Button>
        </div>
      )
    }

    // RECORD_CONTENT - Influencer action
    if (taskType === TaskType.RECORD_CONTENT && taskStatus === TaskStatus.IN_PROGRESS) {
      if (userRole !== 'INFLUENCER' && userRole !== 'MANAGER') return null
      return (
        <Button
          size="sm"
          onClick={() => updateTask(task.id, { action: 'complete' })}
          loading={isLoading}
        >
          Contenuto Registrato
        </Button>
      )
    }

    // RECORD_CONTENT - Revision needed
    if (taskType === TaskType.RECORD_CONTENT && taskStatus === TaskStatus.REVISION_NEEDED) {
      if (userRole !== 'INFLUENCER' && userRole !== 'MANAGER') return null
      return (
        <div>
          {task.revisionNotes && (
            <p className="text-xs text-red-600 mb-2">
              Note: {task.revisionNotes}
            </p>
          )}
          <Button
            size="sm"
            onClick={() => updateTask(task.id, { action: 'complete' })}
            loading={isLoading}
          >
            Contenuto Ri-registrato
          </Button>
        </div>
      )
    }

    // BRAND_REVIEW - Manager action
    if (taskType === TaskType.BRAND_REVIEW && taskStatus === TaskStatus.IN_PROGRESS) {
      if (userRole !== 'MANAGER') return null
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => updateTask(task.id, { action: 'complete' })}
            loading={isLoading}
          >
            Approva
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setRevisionModal({ isOpen: true, taskId: task.id, taskType: task.type })}
            disabled={isLoading}
          >
            Rifiuta
          </Button>
        </div>
      )
    }

    // POST_CONTENT - Influencer action
    if (taskType === TaskType.POST_CONTENT && taskStatus === TaskStatus.IN_PROGRESS) {
      if (userRole !== 'INFLUENCER' && userRole !== 'MANAGER') return null
      return (
        <Button
          size="sm"
          onClick={() => setPostLinkModal({ isOpen: true, taskId: task.id })}
          loading={isLoading}
        >
          Segna come Pubblicato
        </Button>
      )
    }

    // REPORTING - Influencer action
    if (taskType === TaskType.REPORTING && taskStatus === TaskStatus.IN_PROGRESS) {
      if (userRole !== 'INFLUENCER' && userRole !== 'MANAGER') return null
      return (
        <Button
          size="sm"
          onClick={() => setMetricsModal({ isOpen: true, taskId: task.id, contentId })}
          loading={isLoading}
        >
          Inserisci Report
        </Button>
      )
    }

    // SUBMIT_INVOICE - Influencer action
    if (taskType === TaskType.SUBMIT_INVOICE && taskStatus === TaskStatus.IN_PROGRESS) {
      if (userRole !== 'INFLUENCER' && userRole !== 'MANAGER') return null
      return (
        <Button
          size="sm"
          onClick={() => updateTask(task.id, { action: 'complete' })}
          loading={isLoading}
        >
          Fattura Inviata
        </Button>
      )
    }

    return null
  }

  function getStepIcon(task: Task) {
    const status = task.status as TaskStatus

    if (status === TaskStatus.COMPLETED) {
      return (
        <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )
    }

    if (status === TaskStatus.IN_PROGRESS) {
      return (
        <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
        </div>
      )
    }

    if (status === TaskStatus.REVISION_NEEDED) {
      return (
        <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      )
    }

    return (
      <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
        <span className="text-xs font-medium text-gray-400">{task.order}</span>
      </div>
    )
  }

  return (
    <>
      <div className="flow-root">
        <ul className="-mb-8">
          {sortedTasks.map((task, index) => (
            <li key={task.id}>
              <div className="relative pb-8">
                {/* Connector line */}
                {index < sortedTasks.length - 1 && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  {/* Step icon */}
                  <div className="flex-shrink-0">{getStepIcon(task)}</div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 py-0.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {TASK_LABELS[task.type as TaskType] || task.type}
                        </span>
                        <Badge variant={getTaskStatusVariant(task.status)}>
                          {getTaskStatusLabel(task.status)}
                        </Badge>
                      </div>
                      {task.dueDate && (
                        <span className="text-xs text-gray-500">
                          Scadenza: {format(new Date(task.dueDate), 'dd/MM/yyyy HH:mm', { locale: it })}
                        </span>
                      )}
                    </div>

                    {task.notes && (
                      <p className="text-xs text-gray-500 mt-1">{task.notes}</p>
                    )}

                    {task.completedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        Completato: {format(new Date(task.completedAt), 'dd/MM/yyyy HH:mm', { locale: it })}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="mt-2">{renderTaskAction(task)}</div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Revision Modal */}
      <Modal
        isOpen={revisionModal.isOpen}
        onClose={() => {
          setRevisionModal({ isOpen: false, taskId: '', taskType: '' })
          setRevisionNotes('')
        }}
        title="Note di Revisione"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setRevisionModal({ isOpen: false, taskId: '', taskType: '' })
                setRevisionNotes('')
              }}
            >
              Annulla
            </Button>
            <Button variant="danger" onClick={handleRevisionSubmit} loading={loading === revisionModal.taskId}>
              Rifiuta e richiedi revisione
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Descrivi le modifiche necessarie per l&apos;influencer.
          </p>
          <Textarea
            label="Note di revisione"
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            placeholder="Inserisci le note di revisione..."
            rows={4}
          />
        </div>
      </Modal>

      {/* Post Link Modal */}
      <Modal
        isOpen={postLinkModal.isOpen}
        onClose={() => {
          setPostLinkModal({ isOpen: false, taskId: '' })
          setPostLink('')
        }}
        title="Link del Post Pubblicato"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setPostLinkModal({ isOpen: false, taskId: '' })
                setPostLink('')
              }}
            >
              Annulla
            </Button>
            <Button onClick={handlePostLinkSubmit} loading={loading === postLinkModal.taskId}>
              Conferma Pubblicazione
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Inserisci il link del contenuto pubblicato (opzionale).
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link del post
            </label>
            <input
              type="url"
              value={postLink}
              onChange={(e) => setPostLink(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
      </Modal>

      {/* Metrics Modal */}
      <Modal
        isOpen={metricsModal.isOpen}
        onClose={() => {
          setMetricsModal({ isOpen: false, taskId: '', contentId: '' })
          setMetrics({ views: 0, linkClicks: 0 })
        }}
        title="Inserisci Dati di Reporting"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setMetricsModal({ isOpen: false, taskId: '', contentId: '' })
                setMetrics({ views: 0, linkClicks: 0 })
              }}
            >
              Annulla
            </Button>
            <Button onClick={handleMetricsSubmit} loading={loading === metricsModal.taskId}>
              Salva Report
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Inserisci i dati di performance del contenuto pubblicato.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visualizzazioni
            </label>
            <input
              type="number"
              value={metrics.views}
              onChange={(e) => setMetrics((prev) => ({ ...prev, views: Number(e.target.value) }))}
              min={0}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Click sul Link
            </label>
            <input
              type="number"
              value={metrics.linkClicks}
              onChange={(e) => setMetrics((prev) => ({ ...prev, linkClicks: Number(e.target.value) }))}
              min={0}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
      </Modal>
    </>
  )
}
