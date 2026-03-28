'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function NewBrandPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [logo, setLogo] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Il nome è obbligatorio'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), logo: logo.trim() || undefined }),
      })

      if (res.ok) {
        router.push('/brands')
      } else {
        const err = await res.json()
        alert(err.error || 'Errore nella creazione del brand')
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
        <Link href="/brands" className="hover:text-gray-700">Brand</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Nuovo Brand</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuovo Brand</h1>
        <p className="text-gray-500 text-sm mt-1">
          Aggiungi un nuovo brand al sistema
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <div className="space-y-4">
            <Input
              label="Nome del Brand"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors((prev) => { const n = { ...prev }; delete n.name; return n })
              }}
              placeholder="Es. TechBrand Italia"
              error={errors.name}
              required
            />
            <Input
              label="URL Logo (opzionale)"
              type="url"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://esempio.com/logo.png"
              helpText="Un link diretto all'immagine del logo del brand"
            />
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()} disabled={loading}>
            Annulla
          </Button>
          <Button type="submit" loading={loading}>
            Crea Brand
          </Button>
        </div>
      </form>
    </div>
  )
}
