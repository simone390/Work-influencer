'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface Brand {
  id: string
  name: string
  logo?: string | null
  publicToken: string
  createdAt: string
  _count: { partnerships: number }
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch('/api/brands')
      if (res.ok) {
        const data = await res.json()
        setBrands(data)
      }
    } catch (err) {
      console.error('Failed to fetch brands', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  async function handleDelete(brand: Brand) {
    const confirmed = window.confirm(
      `Sei sicuro di voler eliminare il brand "${brand.name}"? Questa azione non può essere annullata.`
    )
    if (!confirmed) return

    setDeletingId(brand.id)
    setError(null)
    try {
      const res = await fetch(`/api/brands/${brand.id}`, { method: 'DELETE' })
      if (res.ok) {
        setBrands((prev) => prev.filter((b) => b.id !== brand.id))
      } else {
        const data = await res.json()
        setError(data.error || 'Errore durante l\'eliminazione')
      }
    } catch (err) {
      console.error('Failed to delete brand', err)
      setError('Errore nella comunicazione con il server')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brand</h1>
          <p className="text-gray-500 text-sm mt-1">
            {brands.length} brand registrati
          </p>
        </div>
        <Link
          href="/brands/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuovo Brand
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {brands.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-gray-500 font-medium">Nessun brand registrato</p>
          <Link
            href="/brands/new"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Aggiungi il primo brand
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Brand
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Partnership
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Creato il
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Link Pubblico
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary-700">
                          {brand.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{brand.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {brand._count.partnerships} partnership
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {format(new Date(brand.createdAt), 'dd/MM/yyyy', { locale: it })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/brand/${brand.publicToken}`}
                      target="_blank"
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Apri vista brand →
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(brand)}
                      disabled={deletingId === brand.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === brand.id ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Eliminando...
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Elimina
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
