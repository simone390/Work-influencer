'use client'

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

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  revision: 'bg-red-100 text-red-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-gray-100 text-gray-700',
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
}

export function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
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
