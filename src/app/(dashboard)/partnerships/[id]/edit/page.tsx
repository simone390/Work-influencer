'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'

interface Partnership {
  id: string
  name: string
  status: string
  totalPrice: number
  netPrice: number
  brief?: string | null
  brandId: string
  influencerId: string
  brand: { id: string; name: string }
  influencer: { id: string; name: string; email: string }
}

export default function EditPartnershipPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()

  const [partnership, setPartnership] = useState<Partnership | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    name: '',
    totalPrice: '',
    brief: '',
    status: '',
  })

  useEffect(() => {
    if (session && session.user.role !== 'MANAGER') {
      router.push('/dashboard')
      return
    }

    async function load() {
      try {
        const res = await fetch(`/api/partnerships/${params.id}`)
        if (!res.ok) {
          router.push('/partnerships')
          return
        }
        const data = await res.json()
        setPartnership(data)
        setFormData({
          name: data.name,
          totalPrice: data.totalPrice.toString(),
          brief: data.brief || '',
          status: data.status,
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id, session, router])

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const netPrice = formData.totalPrice
    ? (parseFloat(formData.totalPrice) * 0.8).toFixed(2)
    : ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Il nome è obbligatorio'
    if (!formData.totalPrice || isNaN(parseFloat(formData.totalPrice))) {
      newErrors.totalPrice = 'Inserisci un prezzo valido'
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/partnerships/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          totalPrice: parseFloat(formData.totalPrice),
          brief: formData.brief.trim(),
          status: formData.status,
        }),
      })

      if (res.ok) {
        router.push(`/partnerships/${params.id}`)
      } else {
        const err = await res.json()
        alert(err.error || 'Errore nel salvataggio')
      }
    } catch (err) {
      console.error(err)
      alert('Errore nella comunicazione con il server')
    } finally {
      setSaving(false)
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/partnerships" className="hover:text-gray-700">Partnership</Link>
        <span>/</span>
        <Link href={`/partnerships/${partnership.id}`} className="hover:text-gray-700 truncate max-w-xs">
          {partnership.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Modifica</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Modifica Partnership</h1>
        <p className="text-gray-500 text-sm mt-1">
          Aggiorna le informazioni della partnership
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Brand:</span> {partnership.brand.name}
              </div>
              <div>
                <span className="font-medium">Influencer:</span> {partnership.influencer.name}
              </div>
            </div>

            <Input
              label="Nome della Partnership"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="Prezzo Totale (€)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalPrice}
                  onChange={(e) => handleChange('totalPrice', e.target.value)}
                  error={errors.totalPrice}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prezzo Netto (€)
                </label>
                <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 h-[38px]">
                  <span className="text-sm text-gray-500">
                    {netPrice ? `€ ${parseFloat(netPrice).toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '—'}
                  </span>
                </div>
              </div>
            </div>

            <Select
              label="Stato"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={[
                { value: 'ACTIVE', label: 'Attiva' },
                { value: 'PAUSED', label: 'In Pausa' },
                { value: 'COMPLETED', label: 'Completata' },
              ]}
            />

            <Textarea
              label="Brief"
              value={formData.brief}
              onChange={(e) => handleChange('brief', e.target.value)}
              rows={4}
              placeholder="Descrivi gli obiettivi della campagna..."
            />
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={saving}
          >
            Annulla
          </Button>
          <Button type="submit" loading={saving}>
            Salva Modifiche
          </Button>
        </div>
      </form>
    </div>
  )
}
