import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { TaskStatus, PartnershipStatus } from '../types'

type Status = TaskStatus | PartnershipStatus | string

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'In Attesa',
  IN_PROGRESS: 'In Corso',
  COMPLETED: 'Completato',
  REVISION_NEEDED: 'Revisione',
  ACTIVE: 'Attiva',
  PAUSED: 'In Pausa',
  CANCELLED: 'Annullata',
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef3c7', text: '#92400e' },
  IN_PROGRESS: { bg: '#e0e7ff', text: '#3730a3' },
  COMPLETED: { bg: '#d1fae5', text: '#065f46' },
  REVISION_NEEDED: { bg: '#fee2e2', text: '#991b1b' },
  ACTIVE: { bg: '#d1fae5', text: '#065f46' },
  PAUSED: { bg: '#fef3c7', text: '#92400e' },
  CANCELLED: { bg: '#f3f4f6', text: '#6b7280' },
}

interface StatusBadgeProps {
  status: Status
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] ?? { bg: '#f3f4f6', text: '#6b7280' }
  const label = STATUS_LABELS[status] ?? status

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg },
        size === 'sm' && styles.badgeSm,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: colors.text },
          size === 'sm' && styles.textSm,
        ]}
      >
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 11,
  },
})
