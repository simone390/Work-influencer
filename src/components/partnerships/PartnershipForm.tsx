'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'
import { Select } from '../ui/Select'
import { Card } from '../ui/Card'

interface Brand {
  id: string
  name: string
}

interface Influencer {
  id: string
  name: string
  email: string
}

interface ContentFormData {
  type: string
  description: string
  scriptDeadline: string
  recordingDeadline: string
  postDate: string
  postTime: string
  postInstructions: string
}

interface PartnershipFormProps {
  brands: Brand[]
  influencers: Influencer[]
}

const contentTypeOptions = [
  { value: 'REEL', label: 'Reel' },
  { value: 'STORY', label: 'Story' },
  { value: 'POST', label: 'Post' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'OTHER', label: 'Altro' },
]

const defaultContent: ContentFormData = {
  type: 'REEL',
  description: '',
  scriptDeadline: '',
  recordingDeadline: '',
  postDate: '',
  postTime: '18:00',
  postInstructions: '',
}

export function PartnershipForm({ brands, influencers }: PartnershipFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    name: '',
    brandId: '',
    influencerId: '',
    totalPrice: '',
    brief: '',
  })

  const [contents, setContents] = useState<ContentFormData[]>([{ ...defaultContent }])

  const netPrice = formData.totalPrice
    ? (parseFloat(formData.totalPrice) * 0.8).toFixed(2)
    : ''

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

  function handleContentChange(index: number, field: string, value: string) {
    setContents((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function addContent() {
    setContents((prev) => [...prev, { ...defaultContent }])
  }

  function removeContent(index: number) {
    if (contents.length === 1) return
    setContents((prev) => prev.filter((_, i) => i !== index))
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Il nome è obbligatorio'
    if (!formData.brandId) newErrors.brandId = 'Seleziona un brand'
    if (!formData.influencerId) newErrors.influencerId = 'Seleziona un influencer'
    if (!formData.totalPrice || isNaN(parseFloat(formData.totalPrice))) {
      newErrors.totalPrice = 'Inserisci un prezzo valido'
    }

    contents.forEach((content, index) => {
      if (!content.scriptDeadline) {
        newErrors[`content_${index}_scriptDeadline`] = 'Obbligatorio'
      }
      if (!content.recordingDeadline) {
        newErrors[`content_${index}_recordingDeadline`] = 'Obbligatorio'
      }
      if (!content.postDate) {
        newErrors[`content_${index}_postDate`] = 'Obbligatorio'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const payload = {
        name: formData.name.trim(),
        brandId: formData.brandId,
        influencerId: formData.influencerId,
        totalPrice: parseFloat(formData.totalPrice),
        brief: formData.brief.trim(),
        contents: contents.map((c) => ({
          type: c.type,
          description: c.description.trim(),
          postInstructions: c.postInstructions.trim(),
          scriptDeadline: c.scriptDeadline,
          recordingDeadline: c.recordingDeadline,
          postDate: c.postDate,
          postTime: c.postTime,
        })),
      }

      const res = await fetch('/api/partnerships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Errore nella creazione della partnership')
        return
      }

      const data = await res.json()
      router.push(`/partnerships/${data.id}`)
    } catch (err) {
      console.error('Failed to create partnership', err)
      alert('Errore nella comunicazione con il server')
    } finally {
      setLoading(false)
    }
  }

  const brandOptions = brands.map((b) => ({ value: b.id, label: b.name }))
  const influencerOptions = influencers.map((i) => ({
    value: i.id,
    label: `${i.name} (${i.email})`,
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Main info */}
      <Card>
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Informazioni Generali
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Nome della Partnership"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Es. Campagna Primavera 2024"
              error={errors.name}
            />
          </div>

          <Select
            label="Brand"
            value={formData.brandId}
            onChange={(e) => handleChange('brandId', e.target.value)}
            options={brandOptions}
            placeholder="Seleziona un brand"
            error={errors.brandId}
          />

          <Select
            label="Influencer"
            value={formData.influencerId}
            onChange={(e) => handleChange('influencerId', e.target.value)}
            options={influencerOptions}
            placeholder="Seleziona un influencer"
            error={errors.influencerId}
          />

          <div>
            <Input
              label="Prezzo Totale (€)"
              type="number"
              min="0"
              step="0.01"
              value={formData.totalPrice}
              onChange={(e) => handleChange('totalPrice', e.target.value)}
              placeholder="0.00"
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
              <span className="ml-2 text-xs text-gray-400">(80% del totale)</span>
            </div>
          </div>

          <div className="sm:col-span-2">
            <Textarea
              label="Brief"
              value={formData.brief}
              onChange={(e) => handleChange('brief', e.target.value)}
              placeholder="Descrivi gli obiettivi e le aspettative della campagna..."
              rows={4}
            />
          </div>
        </div>
      </Card>

      {/* Contents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Contenuti ({contents.length})
          </h2>
          <Button type="button" variant="secondary" size="sm" onClick={addContent}>
            + Aggiungi Contenuto
          </Button>
        </div>

        {contents.map((content, index) => (
          <Card key={index}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">
                Contenuto #{index + 1}
              </h3>
              {contents.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeContent(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Rimuovi
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Tipo di Contenuto"
                value={content.type}
                onChange={(e) => handleContentChange(index, 'type', e.target.value)}
                options={contentTypeOptions}
              />

              <div className="sm:col-span-2">
                <Textarea
                  label="Descrizione"
                  value={content.description}
                  onChange={(e) => handleContentChange(index, 'description', e.target.value)}
                  placeholder="Descrivi il contenuto da creare..."
                  rows={2}
                />
              </div>

              <div className="sm:col-span-2">
                <Textarea
                  label="Istruzioni per la Pubblicazione"
                  value={content.postInstructions}
                  onChange={(e) => handleContentChange(index, 'postInstructions', e.target.value)}
                  placeholder="Hashtag da usare, account da taggare, CTA..."
                  rows={2}
                />
              </div>

              <div>
                <Input
                  label="Scadenza Script"
                  type="date"
                  value={content.scriptDeadline}
                  onChange={(e) => handleContentChange(index, 'scriptDeadline', e.target.value)}
                  error={errors[`content_${index}_scriptDeadline`]}
                />
              </div>

              <div>
                <Input
                  label="Scadenza Registrazione"
                  type="date"
                  value={content.recordingDeadline}
                  onChange={(e) => handleContentChange(index, 'recordingDeadline', e.target.value)}
                  error={errors[`content_${index}_recordingDeadline`]}
                />
              </div>

              <div>
                <Input
                  label="Data di Pubblicazione"
                  type="date"
                  value={content.postDate}
                  onChange={(e) => handleContentChange(index, 'postDate', e.target.value)}
                  error={errors[`content_${index}_postDate`]}
                />
              </div>

              <div>
                <Input
                  label="Orario di Pubblicazione"
                  type="time"
                  value={content.postTime}
                  onChange={(e) => handleContentChange(index, 'postTime', e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={loading}
        >
          Annulla
        </Button>
        <Button type="submit" loading={loading}>
          Crea Partnership
        </Button>
      </div>
    </form>
  )
}
