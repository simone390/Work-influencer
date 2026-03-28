'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

interface AnalyticsData {
  totalViews: number
  totalClicks: number
  totalPartnerships: number
  conversionRate: string
  byMonth: { month: string; label: string; views: number; clicks: number }[]
  byPartnership: { id: string; name: string; views: number; clicks: number }[]
  byInfluencer: { id: string; name: string; views: number; clicks: number }[]
}

function StatCard({ title, value, subtitle, color }: { title: string; value: string | number; subtitle?: string; color: string }) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        padding: '20px 24px',
      }}
    >
      <p style={{ fontSize: '11px', fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
        {title}
      </p>
      <p style={{ fontSize: '32px', fontWeight: 700, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {typeof value === 'number' ? value.toLocaleString('it-IT') : value}
      </p>
      {subtitle && (
        <p style={{ fontSize: '12px', color: '#8e8e93', marginTop: '6px' }}>{subtitle}</p>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#ffffff', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #f0f0f0', padding: '12px 16px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#1d1d1f', marginBottom: '8px' }}>{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color }} />
            <span style={{ fontSize: '12px', color: '#6e6e73' }}>{entry.name}:</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1d1d1f' }}>{entry.value.toLocaleString('it-IT')}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid #f0f0f0', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#6e6e73' }}>Caricamento dati...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const engagementRate = data.byPartnership.map(p => ({
    name: p.name.length > 16 ? p.name.slice(0, 16) + '…' : p.name,
    engagement: p.views > 0 ? +((p.clicks / p.views) * 100).toFixed(1) : 0,
  }))

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.03em', marginBottom: '4px' }}>
          Analytics & Report
        </h1>
        <p style={{ fontSize: '15px', color: '#6e6e73' }}>
          Panoramica delle performance delle campagne
        </p>
      </div>

      {/* ROI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard
          title="Visualizzazioni Totali"
          value={data.totalViews}
          color="#0071e3"
          subtitle="da tutti i contenuti"
        />
        <StatCard
          title="Click Totali"
          value={data.totalClicks}
          color="#34c759"
          subtitle="link click aggregati"
        />
        <StatCard
          title="Partnership"
          value={data.totalPartnerships}
          color="#ff9500"
          subtitle="campagne totali"
        />
        <StatCard
          title="Conversion Rate"
          value={`${data.conversionRate}%`}
          color="#ff3b30"
          subtitle="click / visualizzazioni"
        />
      </div>

      {/* Line chart – views & clicks over time */}
      {data.byMonth.length > 0 && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0',
            padding: '24px',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1d1d1f', marginBottom: '20px' }}>
            Performance nel Tempo
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.byMonth} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
              <Line type="monotone" dataKey="views" name="Visualizzazioni" stroke="#0071e3" strokeWidth={2.5} dot={{ r: 4, fill: '#0071e3' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="clicks" name="Click" stroke="#34c759" strokeWidth={2.5} dot={{ r: 4, fill: '#34c759' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: data.byInfluencer.length > 0 ? '1fr 1fr' : '1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Bar chart – views per partnership */}
        {data.byPartnership.length > 0 && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #f0f0f0',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1d1d1f', marginBottom: '20px' }}>
              Visualizzazioni per Partnership
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.byPartnership.slice(0, 8).map(p => ({ ...p, name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name }))} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="views" name="Visualizzazioni" fill="#0071e3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Influencers table (manager only) */}
        {data.byInfluencer.length > 0 && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #f0f0f0',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1d1d1f', marginBottom: '20px' }}>
              Top Influencer per Views
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.byInfluencer.slice(0, 8).map((inf, idx) => (
                <div
                  key={inf.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#f5f5f7',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 700, color: idx < 3 ? '#0071e3' : '#8e8e93', minWidth: '20px', textAlign: 'center' }}>
                    {idx + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#1d1d1f' }}>{inf.name}</p>
                    <p style={{ fontSize: '11px', color: '#8e8e93' }}>{inf.clicks.toLocaleString('it-IT')} click</p>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0071e3' }}>
                    {inf.views.toLocaleString('it-IT')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Engagement rate per partnership */}
      {engagementRate.length > 0 && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0',
            padding: '24px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1d1d1f', marginBottom: '20px' }}>
            Engagement Rate per Partnership (%)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={engagementRate.slice(0, 10)} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6e6e73' }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="engagement" name="Engagement %" fill="#ff9500" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.totalViews === 0 && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #f0f0f0',
            padding: '60px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#1d1d1f', marginBottom: '6px' }}>Nessun dato disponibile</p>
          <p style={{ fontSize: '14px', color: '#8e8e93' }}>
            I dati analytics appariranno quando verranno inserite metriche per i contenuti
          </p>
        </div>
      )}
    </div>
  )
}
