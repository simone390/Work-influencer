'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  speaker?: string
}

const TOPICS = [
  {
    id: 'lgbt',
    label: 'LGBT',
    color: '#9b59b6',
    icon: '🏳️‍🌈',
    intro: 'Oggi a La Zanzara parliamo di LGBT, diritti, ideologia gender e della cosiddetta "dittatura arcobaleno". Ospiti in studio i ragazzi di Cronache.',
  },
  {
    id: 'liberta',
    label: 'Libertà di espressione',
    color: '#e67e22',
    icon: '🗣️',
    intro: 'Libertà di parola, censura sui social, cancel culture. Quanto siamo ancora liberi di dire quello che pensiamo? Ne parliamo con i ragazzi di Cronache.',
  },
  {
    id: 'palestina',
    label: 'Palestina',
    color: '#27ae60',
    icon: '🌍',
    intro: 'Gaza, Israele, Hamas, il conflitto in Medio Oriente. Cosa pensano davvero i giovani italiani? Ospiti i ragazzi di Cronache.',
  },
  {
    id: 'vannacci',
    label: 'Vannacci',
    color: '#2980b9',
    icon: '⭐',
    intro: 'Il generale Roberto Vannacci, europarlamentare, autore de "Il mondo al contrario". Eroe o pericolo? Ne discutiamo con i ragazzi di Cronache.',
  },
]

function parseMessage(text: string) {
  return text.split(/(\[.*?\])/g).map((part, i) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return (
        <span key={i} className="stage-direction">
          {part}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function ZanzaraLive() {
  const [phase, setPhase] = useState<'select' | 'live'>('select')
  const [activeTopic, setActiveTopic] = useState<(typeof TOPICS)[0] | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [speakerName, setSpeakerName] = useState('Ospite')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [onAir, setOnAir] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (onAir) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [onAir])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const ss = s % 60
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }

  const startBroadcast = useCallback(
    async (topic: (typeof TOPICS)[0]) => {
      setActiveTopic(topic)
      setPhase('live')
      setOnAir(true)
      setElapsed(0)
      setError('')
      setLoading(true)

      try {
        const res = await fetch('/api/cruciani', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topic.intro,
            messages: [{ role: 'user', content: 'Inizia la trasmissione.' }],
          }),
        })
        const data = await res.json()
        if (data.error) { setError(data.error); return }
        setMessages([
          { role: 'user', content: 'Inizia la trasmissione.' },
          { role: 'assistant', content: data.message },
        ])
      } catch {
        setError('Errore di connessione.')
      } finally {
        setLoading(false)
      }
    },
    []
  )

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
      if (data.error) { setError(data.error); return }
      setMessages([...newMessages, { role: 'assistant', content: data.message }])
    } catch {
      setError('Errore di connessione.')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const reset = () => {
    setPhase('select')
    setMessages([])
    setActiveTopic(null)
    setOnAir(false)
    setElapsed(0)
    setInput('')
    setError('')
  }

  const visibleMessages = messages.filter(
    (m) => !(m.role === 'user' && m.content === 'Inizia la trasmissione.')
  )

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        .page {
          min-height: 100vh;
          background: #0a0a0a;
          color: #f0f0f0;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
        }
        /* TOP BAR */
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 28px;
          background: #111;
          border-bottom: 1px solid #222;
          flex-shrink: 0;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .brand-logo {
          width: 44px; height: 44px;
          background: linear-gradient(135deg, #c0392b, #7b241c);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
        }
        .brand-text h1 {
          font-size: 20px; font-weight: 800;
          letter-spacing: -0.03em; color: #fff;
        }
        .brand-text p { font-size: 11px; color: #666; letter-spacing: 0.05em; text-transform: uppercase; }
        .topbar-right { display: flex; align-items: center; gap: 16px; }
        .onair-badge {
          display: flex; align-items: center; gap: 7px;
          padding: 6px 14px;
          background: #1a0000;
          border: 1px solid #c0392b;
          border-radius: 6px;
          font-size: 12px; font-weight: 700;
          color: #c0392b; letter-spacing: 0.1em;
        }
        .onair-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #c0392b;
          animation: blink 1s ease-in-out infinite;
        }
        .timer { font-size: 22px; font-weight: 700; color: #fff; font-variant-numeric: tabular-nums; letter-spacing: 0.05em; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }

        /* SELECT PHASE */
        .select-wrap {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 40px 24px; gap: 40px;
        }
        .select-title {
          text-align: center;
        }
        .select-title h2 { font-size: 32px; font-weight: 800; letter-spacing: -0.04em; color: #fff; }
        .select-title p { font-size: 15px; color: #666; margin-top: 8px; }
        .speaker-row {
          display: flex; align-items: center; gap: 12px;
        }
        .speaker-row label { font-size: 13px; color: #888; white-space: nowrap; }
        .speaker-input {
          padding: 9px 14px;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          font-size: 14px; color: #fff; outline: none;
          width: 220px;
        }
        .topic-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          width: 100%; max-width: 640px;
        }
        .topic-btn {
          padding: 28px 20px;
          background: #141414;
          border: 1px solid #2a2a2a;
          border-radius: 16px;
          cursor: pointer;
          text-align: center;
          transition: all 200ms ease;
          display: flex; flex-direction: column;
          align-items: center; gap: 12px;
        }
        .topic-btn:hover { border-color: var(--tc); background: #1c1c1c; transform: translateY(-2px); }
        .topic-icon { font-size: 36px; line-height: 1; }
        .topic-label { font-size: 16px; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
        .topic-sub { font-size: 11px; color: #555; margin-top: 2px; }

        /* LIVE PHASE */
        .live-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .topic-banner {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 28px;
          background: #141414;
          border-bottom: 1px solid #222;
          flex-shrink: 0;
        }
        .topic-pill {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.05em; text-transform: uppercase;
          color: #fff;
        }
        .topic-banner-text { font-size: 13px; color: #888; flex: 1; }
        .reset-btn {
          padding: 6px 14px;
          background: transparent; border: 1px solid #333;
          border-radius: 6px; font-size: 12px; color: #666;
          cursor: pointer; transition: all 150ms ease;
        }
        .reset-btn:hover { border-color: #555; color: #aaa; }

        /* MESSAGES */
        .messages {
          flex: 1; overflow-y: auto;
          padding: 24px 28px;
          display: flex; flex-direction: column; gap: 20px;
        }
        .msg-row { display: flex; gap: 14px; align-items: flex-start; }
        .msg-row.user { flex-direction: row-reverse; }
        .avatar {
          width: 40px; height: 40px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; flex-shrink: 0;
          letter-spacing: -0.02em;
        }
        .avatar.cruciani { background: linear-gradient(135deg, #c0392b, #7b241c); color: #fff; }
        .avatar.user { background: linear-gradient(135deg, #2c3e50, #1a252f); color: #7fb3d3; }
        .bubble {
          max-width: 68%; padding: 14px 18px;
          border-radius: 4px 16px 16px 16px;
          font-size: 14.5px; line-height: 1.65;
        }
        .bubble.cruciani {
          background: #161616;
          border: 1px solid #2a2a2a;
          color: #e8e8e8;
          border-radius: 4px 16px 16px 16px;
        }
        .bubble.user {
          background: #1a2a3a;
          border: 1px solid #243447;
          color: #cde4f5;
          border-radius: 16px 4px 16px 16px;
        }
        .bubble-meta { font-size: 10px; color: #444; margin-top: 8px; font-weight: 500; }
        .stage-direction { font-size: 11px; color: #555; font-style: italic; }

        /* TYPING */
        .typing-bubble {
          background: #161616; border: 1px solid #2a2a2a;
          border-radius: 4px 16px 16px 16px;
          padding: 14px 18px;
          display: flex; gap: 5px; align-items: center;
        }
        .dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #c0392b;
          animation: bounce 1.3s ease-in-out infinite;
        }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-8px)} }

        /* INPUT BAR */
        .input-bar {
          padding: 16px 28px 20px;
          background: #111;
          border-top: 1px solid #1f1f1f;
          flex-shrink: 0;
        }
        .input-inner {
          display: flex; gap: 10px; align-items: flex-end;
          background: #161616;
          border: 1px solid #2a2a2a;
          border-radius: 14px;
          padding: 10px 10px 10px 18px;
        }
        .input-inner:focus-within { border-color: #3a3a3a; }
        .input-speaker {
          font-size: 11px; font-weight: 700;
          color: #7fb3d3; white-space: nowrap;
          padding: 4px 0 4px;
          align-self: center;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .msg-input {
          flex: 1; resize: none;
          background: transparent; border: none;
          font-size: 14px; color: #e8e8e8;
          outline: none; line-height: 1.5;
          max-height: 120px; overflow-y: auto;
          padding: 4px 0;
          font-family: inherit;
        }
        .msg-input::placeholder { color: #444; }
        .send-btn {
          width: 38px; height: 38px;
          border-radius: 10px; border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
          transition: all 160ms ease;
        }
        .send-btn.active { background: #c0392b; }
        .send-btn.inactive { background: #222; cursor: not-allowed; }
        .input-hint { font-size: 10px; color: #333; text-align: center; margin-top: 8px; }

        .error-msg {
          margin: 0 28px;
          padding: 10px 14px;
          background: #1a0000; border: 1px solid #5c1a1a;
          border-radius: 8px; font-size: 13px; color: #e74c3c;
        }
      `}</style>

      <div className="page">
        {/* TOP BAR */}
        <div className="topbar">
          <div className="brand">
            <div className="brand-logo">🦟</div>
            <div className="brand-text">
              <h1>LA ZANZARA</h1>
              <p>Radio 24 — Simulatore Live</p>
            </div>
          </div>
          <div className="topbar-right">
            {onAir && (
              <>
                <div className="timer">{formatTime(elapsed)}</div>
                <div className="onair-badge">
                  <div className="onair-dot" />
                  ON AIR
                </div>
              </>
            )}
          </div>
        </div>

        {phase === 'select' ? (
          <div className="select-wrap">
            <div className="select-title">
              <h2>Scegli l&apos;argomento</h2>
              <p>Cruciani vi aspetta in studio — cosa volete discutere oggi?</p>
            </div>

            <div className="speaker-row">
              <label>Nome ospite:</label>
              <input
                className="speaker-input"
                value={speakerName}
                onChange={(e) => setSpeakerName(e.target.value)}
                placeholder="Es: Cronache, Marco..."
              />
            </div>

            <div className="topic-grid">
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  className="topic-btn"
                  style={{ '--tc': t.color } as React.CSSProperties}
                  onClick={() => startBroadcast(t)}
                >
                  <div className="topic-icon">{t.icon}</div>
                  <div>
                    <div className="topic-label">{t.label}</div>
                    <div className="topic-sub">Clicca per andare in onda</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="live-wrap">
            {/* TOPIC BANNER */}
            <div className="topic-banner">
              {activeTopic && (
                <div
                  className="topic-pill"
                  style={{ background: activeTopic.color }}
                >
                  {activeTopic.icon} {activeTopic.label}
                </div>
              )}
              <div className="topic-banner-text">
                Ospite: <strong style={{ color: '#aaa' }}>{speakerName}</strong>
              </div>
              <button className="reset-btn" onClick={reset}>
                ✕ Chiudi puntata
              </button>
            </div>

            {/* MESSAGES */}
            <div className="messages">
              {visibleMessages.map((m, i) => (
                <div key={i} className={`msg-row ${m.role === 'user' ? 'user' : ''}`}>
                  <div className={`avatar ${m.role === 'user' ? 'user' : 'cruciani'}`}>
                    {m.role === 'assistant' ? 'GC' : speakerName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className={`bubble ${m.role === 'user' ? 'user' : 'cruciani'}`}>
                    {m.role === 'assistant' ? parseMessage(m.content) : m.content}
                    <div className="bubble-meta">
                      {m.role === 'assistant'
                        ? 'Giuseppe Cruciani — La Zanzara, Radio 24'
                        : speakerName}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="msg-row">
                  <div className="avatar cruciani">GC</div>
                  <div className="typing-bubble">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="dot"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {error && <div className="error-msg">{error}</div>}

            {/* INPUT */}
            <div className="input-bar">
              <div className="input-inner">
                <div className="input-speaker">{speakerName}</div>
                <textarea
                  ref={inputRef}
                  className="msg-input"
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Rispondi a Cruciani..."
                />
                <button
                  className={`send-btn ${input.trim() && !loading ? 'active' : 'inactive'}`}
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                >
                  <svg
                    style={{ width: 16, height: 16, color: input.trim() && !loading ? '#fff' : '#444' }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <div className="input-hint">Invio per rispondere · Shift+Invio per andare a capo</div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
