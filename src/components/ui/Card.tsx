'use client'

import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      className={`bg-white rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#f0f0f0] ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  colorClass?: string
  trend?: { value: string; positive: boolean }
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  colorClass = 'text-[#0071e3]',
  trend,
}: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide mb-2">{title}</p>
          <p className={`text-3xl font-semibold tracking-tight ${colorClass}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-[#6e6e73] mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-xs mt-1 font-medium ${trend.positive ? 'text-[#34c759]' : 'text-[#ff3b30]'}`}>
              {trend.positive ? '▲' : '▼'} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="ml-4 flex-shrink-0 w-10 h-10 rounded-[10px] bg-[#e8f0fd] flex items-center justify-center text-[#0071e3]">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
