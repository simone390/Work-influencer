'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email o password non corretti')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('Errore durante il login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f5f7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #0071e3 0%, #005bb5 100%)',
              borderRadius: '16px',
              marginBottom: '16px',
              boxShadow: '0 4px 16px rgba(0, 113, 227, 0.3)',
            }}
          >
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 700,
              color: '#1d1d1f',
              letterSpacing: '-0.03em',
              marginBottom: '6px',
            }}
          >
            Influencer Manager
          </h1>
          <p style={{ fontSize: '15px', color: '#6e6e73' }}>
            Accedi per gestire le tue collaborazioni
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
            padding: '36px',
            border: '1px solid #f0f0f0',
          }}
        >
          {error && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 16px',
                background: '#fff2f1',
                border: '1px solid rgba(255, 59, 48, 0.2)',
                borderRadius: '10px',
              }}
            >
              <p style={{ fontSize: '13.5px', color: '#ff3b30', fontWeight: 500 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@esempio.com"
                required
                autoComplete="email"
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Accedi
            </Button>
          </form>

          {/* Demo credentials */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid #f0f0f0',
            }}
          >
            <p style={{ fontSize: '12px', color: '#8e8e93', textAlign: 'center', marginBottom: '12px' }}>
              Credenziali di demo
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setEmail('manager@test.com')
                  setPassword('password123')
                }}
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  background: '#f5f5f7',
                  borderRadius: '10px',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0071e3'
                  e.currentTarget.style.background = '#e8f0fd'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent'
                  e.currentTarget.style.background = '#f5f5f7'
                }}
              >
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#1d1d1f', marginBottom: '2px' }}>Manager</p>
                <p style={{ fontSize: '11px', color: '#6e6e73' }}>manager@test.com</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('influencer@test.com')
                  setPassword('password123')
                }}
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  background: '#f5f5f7',
                  borderRadius: '10px',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0071e3'
                  e.currentTarget.style.background = '#e8f0fd'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent'
                  e.currentTarget.style.background = '#f5f5f7'
                }}
              >
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#1d1d1f', marginBottom: '2px' }}>Influencer</p>
                <p style={{ fontSize: '11px', color: '#6e6e73' }}>influencer@test.com</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
