import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import StatusBadge from './StatusBadge'
import type { Partnership } from '../types'

interface PartnershipCardProps {
  partnership: Partnership
  showInfluencer?: boolean
}

function countCompletedTasks(partnership: Partnership): { completed: number; total: number } {
  let completed = 0
  let total = 0
  for (const content of partnership.contents) {
    for (const task of content.tasks) {
      total++
      if (task.status === 'COMPLETED') completed++
    }
  }
  return { completed, total }
}

function formatEur(value: number): string {
  return value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
}

export default function PartnershipCard({ partnership, showInfluencer = false }: PartnershipCardProps) {
  const router = useRouter()
  const { completed, total } = countCompletedTasks(partnership)
  const progress = total > 0 ? completed / total : 0

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/partnership/${partnership.id}`)}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.brandName}>{partnership.brand.name}</Text>
          <Text style={styles.partnershipName} numberOfLines={1}>
            {partnership.name}
          </Text>
        </View>
        <StatusBadge status={partnership.status} size="sm" />
      </View>

      {showInfluencer && (
        <View style={styles.influencerRow}>
          <Ionicons name="person-outline" size={13} color="#6b7280" />
          <Text style={styles.influencerName}>{partnership.influencer.name}</Text>
        </View>
      )}

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          {completed}/{total} task
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.priceRow}>
          <Ionicons name="cash-outline" size={14} color="#10b981" />
          <Text style={styles.price}>{formatEur(partnership.netPrice)}</Text>
          <Text style={styles.priceSub}> netto</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  partnershipName: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  influencerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  influencerName: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: '#9ca3af',
    minWidth: 48,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
    marginLeft: 4,
  },
  priceSub: {
    fontSize: 13,
    color: '#9ca3af',
  },
})
