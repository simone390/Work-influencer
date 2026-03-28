'use client'

import { useSession } from 'next-auth/react'
import { NotificationBell } from '../notifications/NotificationBell'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 24px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div>
        {title && (
          <h1 style={{ fontSize: '17px', fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.02em' }}>
            {title}
          </h1>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {session?.user && <NotificationBell />}
      </div>
    </header>
  )
}
