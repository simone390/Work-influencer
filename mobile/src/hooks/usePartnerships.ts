import { useState, useCallback } from 'react'
import api from '../lib/api'
import type { Partnership, TaskActionPayload } from '../types'

export function usePartnerships() {
  const [partnerships, setPartnerships] = useState<Partnership[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPartnerships = useCallback(async (status?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const params = status ? { status } : {}
      const res = await api.get<Partnership[]>('/api/partnerships', {
        params,
      })
      setPartnerships(Array.isArray(res.data) ? res.data : [])
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Errore nel caricamento delle partnership.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { partnerships, isLoading, error, fetchPartnerships }
}

export function usePartnership(id: string) {
  const [partnership, setPartnership] = useState<Partnership | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPartnership = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.get<Partnership>(`/api/partnerships/${id}`)
      setPartnership(res.data)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Errore nel caricamento della partnership.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  const updateTask = useCallback(
    async (taskId: string, payload: TaskActionPayload) => {
      try {
        await api.put(`/api/partnerships/${id}/tasks/${taskId}`, payload)
        // Refresh partnership data
        await fetchPartnership()
        return true
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Errore nell\'aggiornamento del task.'
        throw new Error(message)
      }
    },
    [id, fetchPartnership]
  )

  return { partnership, isLoading, error, fetchPartnership, updateTask }
}
