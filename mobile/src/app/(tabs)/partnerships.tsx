import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../hooks/useAuth'
import { usePartnerships } from '../../hooks/usePartnerships'
import PartnershipCard from '../../components/PartnershipCard'
import type { Partnership } from '../../types'

type FilterStatus = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'PAUSED'

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: 'Tutte', value: 'ALL' },
  { label: 'Attive', value: 'ACTIVE' },
  { label: 'Completate', value: 'COMPLETED' },
  { label: 'In pausa', value: 'PAUSED' },
]

export default function PartnershipsScreen() {
  const { user } = useAuth()
  const { partnerships, isLoading, error, fetchPartnerships } = usePartnerships()
  const [filter, setFilter] = useState<FilterStatus>('ALL')

  useEffect(() => {
    fetchPartnerships()
  }, [fetchPartnerships])

  const filtered: Partnership[] =
    filter === 'ALL' ? partnerships : partnerships.filter((p) => p.status === filter)

  const isManager = user?.role === 'MANAGER'

  const renderItem = useCallback(
    ({ item }: { item: Partnership }) => (
      <PartnershipCard partnership={item} showInfluencer={isManager} />
    ),
    [isManager]
  )

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Filter bar */}
      <View style={styles.filterBar}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterBtn, filter === f.value && styles.filterBtnActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchPartnerships}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 48 }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="briefcase-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>Nessuna partnership trovata.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterBtnActive: {
    backgroundColor: '#6366f1',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    margin: 16,
    borderRadius: 10,
    padding: 12,
  },
  errorText: { color: '#dc2626', fontSize: 14 },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: { fontSize: 15, color: '#9ca3af' },
})
