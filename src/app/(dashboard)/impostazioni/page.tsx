'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  createdAt: string
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export default function ImpostazioniPage() {
  const { data: session, update: updateSession } = useSession()
  const isManager = session?.user?.role === 'MANAGER'

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Profile form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Avatar
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Admin users
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)

  // New user form
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<'MANAGER' | 'INFLUENCER'>('MANAGER')
  const [creatingUser, setCreatingUser] = useState(false)
  const [userMsg, setUserMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showNewUserForm, setShowNewUserForm] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true)
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
          setName(data.name)
          setEmail(data.email)
          setAvatarPreview(data.avatar || null)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    if (isManager) {
      setLoadingAdmins(true)
      fetch('/api/users')
        .then(r => r.json())
        .then(data => setAdmins(Array.isArray(data) ? data : []))
        .finally(() => setLoadingAdmins(false))
    }
  }, [isManager])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileMsg(null)

    if (newPassword && newPassword !== confirmPassword) {
      setProfileMsg({ type: 'error', text: 'Le password non coincidono' })
      return
    }

    setSavingProfile(true)
    try {
      const body: Record<string, unknown> = {}
      if (name !== profile?.name) body.name = name
      if (email !== profile?.email) body.email = email
      if (avatarPreview !== profile?.avatar) body.avatar = avatarPreview
      if (newPassword) {
        body.newPassword = newPassword
        body.currentPassword = currentPassword
      }

      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const updated = await res.json()
        setProfile(prev => prev ? { ...prev, ...updated } : null)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setProfileMsg({ type: 'success', text: 'Profilo aggiornato con successo' })
        await updateSession()
      } else {
        const data = await res.json()
        setProfileMsg({ type: 'error', text: data.error || 'Errore durante il salvataggio' })
      }
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setUserMsg(null)
    setCreatingUser(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      })

      if (res.ok) {
        const user = await res.json()
        setAdmins(prev => [...prev, user])
        setNewUserName('')
        setNewUserEmail('')
        setNewUserPassword('')
        setNewUserRole('MANAGER')
        setShowNewUserForm(false)
        setUserMsg({ type: 'success', text: `Account "${user.name}" creato con successo` })
      } else {
        const data = await res.json()
        setUserMsg({ type: 'error', text: data.error || 'Errore durante la creazione' })
      }
    } finally {
      setCreatingUser(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #f0f0f0', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.03em', marginBottom: '4px' }}>
          Impostazioni
        </h1>
        <p style={{ fontSize: '15px', color: '#6e6e73' }}>
          Gestisci il tuo profilo e le preferenze dell&apos;account
        </p>
      </div>

      {/* Profile Section */}
      <section
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #f0f0f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '24px',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f5f5f7' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em' }}>
            Profilo
          </h2>
          <p style={{ fontSize: '13px', color: '#6e6e73', marginTop: '2px' }}>
            Aggiorna le tue informazioni personali
          </p>
        </div>

        <form onSubmit={handleSaveProfile} style={{ padding: '24px' }}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
            <div style={{ position: 'relative' }}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #f0f0f0',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0071e3 0%, #005bb5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#ffffff',
                  }}
                >
                  {profile?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  padding: '8px 16px',
                  background: '#f5f5f7',
                  border: '1px solid #d2d2d7',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1d1d1f',
                  cursor: 'pointer',
                  marginBottom: '6px',
                  display: 'block',
                }}
              >
                Cambia foto
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => setAvatarPreview(null)}
                  style={{
                    padding: '4px 12px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '12px',
                    color: '#ff3b30',
                    cursor: 'pointer',
                  }}
                >
                  Rimuovi foto
                </button>
              )}
              <p style={{ fontSize: '11px', color: '#8e8e93', marginTop: '4px' }}>
                JPG, PNG o GIF · max 2MB
              </p>
            </div>
          </div>

          {/* Fields */}
          <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1d1d1f', marginBottom: '6px' }}>
                Nome completo
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1.5px solid #d2d2d7',
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: '#1d1d1f',
                  outline: 'none',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                  transition: 'border-color 150ms ease',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#0071e3' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#d2d2d7' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1d1d1f', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1.5px solid #d2d2d7',
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: '#1d1d1f',
                  outline: 'none',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                  transition: 'border-color 150ms ease',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#0071e3' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#d2d2d7' }}
              />
            </div>
          </div>

          {/* Password change */}
          <div style={{ borderTop: '1px solid #f5f5f7', paddingTop: '20px', marginBottom: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1d1d1f', marginBottom: '16px' }}>
              Cambia password
            </p>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#3a3a3c', marginBottom: '6px' }}>
                  Password attuale
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Lascia vuoto per non cambiare"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1.5px solid #d2d2d7',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#1d1d1f',
                    outline: 'none',
                    background: '#ffffff',
                    boxSizing: 'border-box',
                    transition: 'border-color 150ms ease',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#0071e3' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#d2d2d7' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#3a3a3c', marginBottom: '6px' }}>
                    Nuova password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 6 caratteri"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1.5px solid #d2d2d7',
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: '#1d1d1f',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                      transition: 'border-color 150ms ease',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#0071e3' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#d2d2d7' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#3a3a3c', marginBottom: '6px' }}>
                    Conferma password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Ripeti la password"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1.5px solid #d2d2d7',
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: '#1d1d1f',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                      transition: 'border-color 150ms ease',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#0071e3' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#d2d2d7' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {profileMsg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                marginBottom: '16px',
                background: profileMsg.type === 'success' ? '#e8f5e9' : '#ffeef0',
                border: `1px solid ${profileMsg.type === 'success' ? '#34c75940' : '#ff3b3040'}`,
              }}
            >
              <p style={{ fontSize: '13.5px', color: profileMsg.type === 'success' ? '#2e7d32' : '#c62828', fontWeight: 500 }}>
                {profileMsg.text}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={savingProfile}
            style={{
              padding: '11px 24px',
              background: savingProfile ? '#8e8e93' : '#0071e3',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: savingProfile ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {savingProfile ? (
              <>
                <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Salvataggio...
              </>
            ) : 'Salva modifiche'}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </form>
      </section>

      {/* Account info */}
      <section
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #f0f0f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '24px',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f5f5f7' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em' }}>
            Informazioni Account
          </h2>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {[
              { label: 'Ruolo', value: profile?.role === 'MANAGER' ? 'Manager' : 'Influencer' },
              { label: 'Membro dal', value: profile?.createdAt ? format(new Date(profile.createdAt), 'MMMM yyyy', { locale: it }) : '—' },
            ].map(item => (
              <div key={item.label}>
                <p style={{ fontSize: '12px', color: '#8e8e93', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  {item.label}
                </p>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#1d1d1f' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admin-only: Manage Users */}
      {isManager && (
        <section
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #f0f0f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em' }}>
                Gestione Accessi
              </h2>
              <p style={{ fontSize: '13px', color: '#6e6e73', marginTop: '2px' }}>
                Crea nuovi account manager o influencer
              </p>
            </div>
            <button
              onClick={() => setShowNewUserForm(!showNewUserForm)}
              style={{
                padding: '8px 16px',
                background: showNewUserForm ? '#f5f5f7' : '#0071e3',
                color: showNewUserForm ? '#1d1d1f' : '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {showNewUserForm ? (
                'Annulla'
              ) : (
                <>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuovo Account
                </>
              )}
            </button>
          </div>

          {showNewUserForm && (
            <form onSubmit={handleCreateUser} style={{ padding: '24px', borderBottom: '1px solid #f5f5f7', background: '#f9f9fb' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#1d1d1f', marginBottom: '16px' }}>
                Crea nuovo account
              </p>

              {userMsg && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    background: userMsg.type === 'success' ? '#e8f5e9' : '#ffeef0',
                    border: `1px solid ${userMsg.type === 'success' ? '#34c75940' : '#ff3b3040'}`,
                  }}
                >
                  <p style={{ fontSize: '13px', color: userMsg.type === 'success' ? '#2e7d32' : '#c62828', fontWeight: 500 }}>
                    {userMsg.text}
                  </p>
                </div>
              )}

              <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3a3a3c', marginBottom: '5px' }}>
                      Nome completo *
                    </label>
                    <input
                      type="text"
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                      required
                      placeholder="Mario Rossi"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        border: '1.5px solid #d2d2d7',
                        borderRadius: '8px',
                        fontSize: '13.5px',
                        color: '#1d1d1f',
                        outline: 'none',
                        background: '#ffffff',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3a3a3c', marginBottom: '5px' }}>
                      Ruolo *
                    </label>
                    <select
                      value={newUserRole}
                      onChange={e => setNewUserRole(e.target.value as 'MANAGER' | 'INFLUENCER')}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        border: '1.5px solid #d2d2d7',
                        borderRadius: '8px',
                        fontSize: '13.5px',
                        color: '#1d1d1f',
                        outline: 'none',
                        background: '#ffffff',
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="MANAGER">Manager (Admin)</option>
                      <option value="INFLUENCER">Influencer</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3a3a3c', marginBottom: '5px' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    required
                    placeholder="email@esempio.com"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1.5px solid #d2d2d7',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      color: '#1d1d1f',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3a3a3c', marginBottom: '5px' }}>
                    Password *
                  </label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    required
                    placeholder="Min. 6 caratteri"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1.5px solid #d2d2d7',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      color: '#1d1d1f',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingUser}
                style={{
                  padding: '9px 20px',
                  background: creatingUser ? '#8e8e93' : '#0071e3',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: creatingUser ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {creatingUser ? 'Creazione...' : 'Crea Account'}
              </button>
            </form>
          )}

          {/* Existing managers list */}
          <div style={{ padding: '16px 24px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Account Manager
            </p>
            {loadingAdmins ? (
              <p style={{ fontSize: '13px', color: '#8e8e93' }}>Caricamento...</p>
            ) : admins.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#8e8e93' }}>Nessun manager trovato</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {admins.map(admin => (
                  <div
                    key={admin.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      background: '#f5f5f7',
                      borderRadius: '10px',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0071e3 0%, #005bb5 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#ffffff',
                        flexShrink: 0,
                      }}
                    >
                      {admin.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#1d1d1f' }}>
                        {admin.name}
                        {admin.id === session?.user?.id && (
                          <span style={{ marginLeft: '8px', fontSize: '11px', color: '#0071e3', fontWeight: 500 }}>Tu</span>
                        )}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6e6e73' }}>{admin.email}</p>
                    </div>
                    <span style={{ fontSize: '11px', color: '#6e6e73' }}>
                      {format(new Date(admin.createdAt), 'dd/MM/yyyy', { locale: it })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
