'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_TOPICS = [
  'Il femminismo moderno in Italia',
  'Immigrazione e integrazione',
  'Il cambiamento climatico e le politiche green',
  'I diritti LGBT e il ddl Zan',
  'La libertà di parola e la censura sui social',
  'Il politicamente corretto nelle università',
  'La legge sulla prostituzione',
  'Reddito di cittadinanza e assistenzialismo',
  'Le quote rosa nelle aziende',
  'La cancel culture e il revisionismo storico',
]

export default function CrucianiPage() {
  const [topic, setTopic] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startInterview = async (selectedTopic: string) => {
    const finalTopic = selectedTopic || customTopic.trim()
    if (!finalTopic) return
    setTopic(finalTopic)
    setStarted(true)
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/cruciani', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: finalTopic,
          messages: [{ role: 'user', content: 'Inizia la trasmissione.' }],
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setStarted(false)
        return
      }
      setMessages([
        { role: 'user', content: 'Inizia la trasmissione.' },
        { role: 'assistant', content: data.message },
      ])
    } catch {
      setError('Errore di connessione. Riprova.')
      setStarted(false)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/cruciani', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        return
      }
      setMessages([...newMessages, { role: 'assistant', content: data.message }])
    } catch {
      setError('Errore di connessione. Riprova.')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const reset = () => {
    setStarted(false)
    setMessages([])
    setTopic('')
    setCustomTopic('')
    setError('')
    setInput('')
  }

  const formatMessage = (text: string) => {
    return text.split(/(\[.*?\])/g).map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span
            key={i}
            style={{
              fontSize: '11px',
              color: '#8e8e93',
              fontStyle: 'italic',
              fontWeight: 400,
            }}
          >
            {part}
          </span>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f5f7' }}>
      {/* Header */}
      <div
        style={{
          padding: '20px 28px',
          background: '#ffffff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #c0392b 0%, #8e1c12 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg style={{ width: '20px', height: '20px', color: '#fff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em', margin: 0 }}>
              Simulatore La Zanzara
            </h1>
            <p style={{ fontSize: '12px', color: '#8e8e93', margin: 0 }}>
              {started ? `Argomento: ${topic}` : 'Scegli un argomento e inizia la trasmissione'}
            </p>
          </div>
        </div>
        {started && (
          <button
            onClick={reset}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #e0e0e5',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#3a3a3c',
              cursor: 'pointer',
            }}
          >
            Nuova puntata
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!started ? (
          /* Topic selection */
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              maxWidth: '720px',
              margin: '0 auto',
              width: '100%',
            }}
          >
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1d1d1f', marginBottom: '12px' }}>
                Argomenti suggeriti
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                {SUGGESTED_TOPICS.map((t) => (
                  <button
                    key={t}
                    onClick={() => startInterview(t)}
                    disabled={loading}
                    style={{
                      padding: '12px 16px',
                      background: '#ffffff',
                      border: '1px solid #e0e0e5',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: 450,
                      color: '#1d1d1f',
                      textAlign: 'left',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 180ms ease',
                      lineHeight: 1.4,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#c0392b'
                      e.currentTarget.style.background = '#fdf5f5'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e5'
                      e.currentTarget.style.background = '#ffffff'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1d1d1f', marginBottom: '12px' }}>
                Oppure scrivi il tuo argomento
              </h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && startInterview('')}
                  placeholder="Es: Il voto alle elezioni europee..."
                  style={{
                    flex: 1,
                    padding: '11px 14px',
                    background: '#ffffff',
                    border: '1px solid #e0e0e5',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#1d1d1f',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => startInterview('')}
                  disabled={!customTopic.trim() || loading}
                  style={{
                    padding: '11px 22px',
                    background: customTopic.trim() ? '#c0392b' : '#e0e0e5',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: customTopic.trim() ? '#ffffff' : '#8e8e93',
                    cursor: customTopic.trim() && !loading ? 'pointer' : 'not-allowed',
                    transition: 'all 180ms ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {loading ? 'Carico...' : 'Vai in onda'}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  background: '#fdf5f5',
                  border: '1px solid #f5c6c6',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  color: '#c0392b',
                }}
              >
                {error}
              </div>
            )}
          </div>
        ) : (
          /* Chat */
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {messages
                .filter((m) => m.role === 'assistant' || (m.role === 'user' && m.content !== 'Inizia la trasmissione.'))
                .map((m, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      flexDirection: m.role === 'assistant' ? 'row' : 'row-reverse',
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        background:
                          m.role === 'assistant'
                            ? 'linear-gradient(135deg, #c0392b 0%, #8e1c12 100%)'
                            : 'linear-gradient(135deg, #0071e3 0%, #005bb5 100%)',
                        color: '#ffffff',
                      }}
                    >
                      {m.role === 'assistant' ? 'GC' : 'Tu'}
                    </div>

                    {/* Bubble */}
                    <div
                      style={{
                        maxWidth: '72%',
                        padding: '12px 16px',
                        borderRadius: m.role === 'assistant' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                        background: m.role === 'assistant' ? '#ffffff' : '#0071e3',
                        color: m.role === 'assistant' ? '#1d1d1f' : '#ffffff',
                        fontSize: '14px',
                        lineHeight: 1.6,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        border: m.role === 'assistant' ? '1px solid #f0f0f0' : 'none',
                      }}
                    >
                      {m.role === 'assistant' ? (
                        <span>{formatMessage(m.content)}</span>
                      ) : (
                        m.content
                      )}
                      {m.role === 'assistant' && (
                        <div style={{ fontSize: '11px', color: '#8e8e93', marginTop: '6px', fontWeight: 500 }}>
                          Giuseppe Cruciani — La Zanzara, Radio 24
                        </div>
                      )}
                    </div>
                  </div>
                ))}

              {loading && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #c0392b 0%, #8e1c12 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#ffffff',
                      flexShrink: 0,
                    }}
                  >
                    GC
                  </div>
                  <div
                    style={{
                      padding: '14px 18px',
                      background: '#ffffff',
                      borderRadius: '4px 16px 16px 16px',
                      border: '1px solid #f0f0f0',
                      display: 'flex',
                      gap: '4px',
                      alignItems: 'center',
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#c0392b',
                          animation: 'bounce 1.2s ease-in-out infinite',
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#fdf5f5',
                    border: '1px solid #f5c6c6',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#c0392b',
                    textAlign: 'center',
                  }}
                >
                  {error}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div
              style={{
                padding: '16px 28px',
                background: '#ffffff',
                borderTop: '1px solid #f0f0f0',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-end',
                  background: '#f5f5f7',
                  borderRadius: '12px',
                  border: '1px solid #e0e0e5',
                  padding: '8px 8px 8px 16px',
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Rispondi a Cruciani... (Invio per inviare)"
                  rows={1}
                  style={{
                    flex: 1,
                    resize: 'none',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '14px',
                    color: '#1d1d1f',
                    outline: 'none',
                    lineHeight: 1.5,
                    maxHeight: '120px',
                    overflowY: 'auto',
                    padding: '4px 0',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: input.trim() && !loading ? '#c0392b' : '#e0e0e5',
                    border: 'none',
                    cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 180ms ease',
                  }}
                >
                  <svg style={{ width: '16px', height: '16px', color: input.trim() && !loading ? '#fff' : '#8e8e93' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p style={{ fontSize: '11px', color: '#8e8e93', marginTop: '6px', textAlign: 'center' }}>
                Simulatore a scopo educativo/satirico — basato sullo stile pubblico di Cruciani
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
