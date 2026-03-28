import React from 'react'

type BadgeVariant =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'revision'
  | 'active'
  | 'paused'
  | 'gray'
  | 'blue'
  | 'green'
  | 'red'
  | 'yellow'
  | 'orange'

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  pending: 'bg-[#fff3e0] text-[#e65100]',
  in_progress: 'bg-[#e8f0fd] text-[#0071e3]',
  completed: 'bg-[#e8f5e9] text-[#2e7d32]',
  revision: 'bg-[#ffeef0] text-[#c62828]',
  active: 'bg-[#e8f5e9] text-[#2e7d32]',
  paused: 'bg-[#f5f5f7] text-[#6e6e73]',
  gray: 'bg-[#f5f5f7] text-[#6e6e73]',
  blue: 'bg-[#e8f0fd] text-[#0071e3]',
  green: 'bg-[#e8f5e9] text-[#2e7d32]',
  red: 'bg-[#ffeef0] text-[#c62828]',
  yellow: 'bg-[#fff3e0] text-[#e65100]',
  orange: 'bg-[#fff3e0] text-[#e65100]',
}

export function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-[20px] text-[11px] font-semibold tracking-wide uppercase ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

export function getTaskStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'PENDING':
      return 'pending'
    case 'IN_PROGRESS':
      return 'in_progress'
    case 'COMPLETED':
      return 'completed'
    case 'REVISION_NEEDED':
      return 'revision'
    default:
      return 'gray'
  }
}

export function getPartnershipStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'ACTIVE':
      return 'active'
    case 'COMPLETED':
      return 'completed'
    case 'PAUSED':
      return 'paused'
    default:
      return 'gray'
  }
}

export function getTaskStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'In Attesa'
    case 'IN_PROGRESS':
      return 'In Corso'
    case 'COMPLETED':
      return 'Completato'
    case 'REVISION_NEEDED':
      return 'Revisione Richiesta'
    default:
      return status
  }
}

export function getPartnershipStatusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Attiva'
    case 'COMPLETED':
      return 'Completata'
    case 'PAUSED':
      return 'In Pausa'
    default:
      return status
  }
}
