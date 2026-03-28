'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function NewInfluencerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const n = { ...prev }
        delete n[field]
        return n
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Il nome è obbligatorio'
    if (!formData.email.trim()) newErrors.email = 'L\'email è obbligatoria'
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'La password deve essere di almeno 6 caratteri'
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/influencers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push('/influencers')
      } else {
        const err = await res.json()
        if (err.error === 'Email già registrata') {
          setErrors({ email: 'Questa email è già registrata' })
        } else {
          alert(err.error || 'Errore nella creazione')
        }
      }
    } catch (err) {
      console.error(err)
      alert('Errore nella comunicazione con il server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/influencers" className="hover:text-gray-700">Influencer</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Nuovo Influencer</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuovo Influencer</h1>
        <p className="text-gray-500 text-sm mt-1">
          Aggiungi un nuovo influencer al sistema
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <div className="space-y-4">
            <Input
              label="Nome Completo"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Es. Sofia Rossi"
              error={errors.name}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="sofia@esempio.com"
              error={errors.email}
              required
              autoComplete="off"
            />
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Minimo 6 caratteri"
              error={errors.password}
              required
              autoComplete="new-password"
              helpText="L'influencer potrà modificare la password dopo il primo accesso"
            />
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()} disabled={loading}>
            Annulla
          </Button>
          <Button type="submit" loading={loading}>
            Crea Influencer
          </Button>
        </div>
      </form>
    </div>
  )
}
