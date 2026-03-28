import React, { useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../hooks/useAuth'
import { usePartnerships } from '../../hooks/usePartnerships'
import type { Partnership, ContentTask } from '../../types'

function formatEur(value: number): string {
  return value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
}

function isThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setDate(now.getDate() + 7)
  return d >= now && d <= weekEnd
}

function getActiveTasks(partnerships: Partnership[]): ContentTask[] {
  const tasks: ContentTask[] = []
  for (const p of partnerships) {
    for (const c of p.contents) {
      for (const t of c.tasks) {
        if (t.status === 'IN_PROGRESS' || t.status === 'REVISION_NEEDED') {
          tasks.push(t)
        }
      }
    }
  }
  return tasks
}

function getPendingApprovals(partnerships: Partnership[]): number {
  let count = 0
  for (const p of partnerships) {
    for (const c of p.contents) {
      for (const t of c.tasks) {
        if (
          (t.type === 'BRAND_APPROVAL' || t.type === 'BRAND_REVIEW') &&
          t.status === 'IN_PROGRESS'
        ) {
          count++
        }
      }
    }
  }
  return count
}

interface StatCardProps {
  icon: string
  label: string
  value: string | number
  color: string
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export default function DashboardScreen() {
  const { user } = useAuth()
  const { partnerships, isLoading, fetchPartnerships } = usePartnerships()
  const router = useRouter()

  useEffect(() => {
    fetchPartnerships()
  }, [fetchPartnerships])

  const stats = useMemo(() => {
    const active = partnerships.filter((p) => p.status === 'ACTIVE')
    const completed = partnerships.filter((p) => p.status === 'COMPLETED')
    const totalRevenue = partnerships.reduce((sum, p) => sum + p.netPrice, 0)
    const pendingApprovals = getPendingApprovals(partnerships)
    const activeTasks = getActiveTasks(partnerships)
    const dueTodayCount = activeTasks.filter((t) => isToday(t.dueDate)).length
    const dueWeekCount = activeTasks.filter((t) => isThisWeek(t.dueDate)).length

    return {
      active: active.length,
      completed: completed.length,
      totalRevenue,
      pendingApprovals,
      activeTasks: activeTasks.length,
      dueTodayCount,
      dueWeekCount,
    }
  }, [partnerships])

  const isManager = user?.role === 'MANAGER'

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buongiorno'
    if (hour < 18) return 'Buon pomeriggio'
    return 'Buonasera'
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchPartnerships} tintColor="#6366f1" />
        }
      >
        {/* Header greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </Text>
          <Text style={styles.greetingSub}>
            {isManager ? 'Pannello manager' : 'Il tuo spazio influencer'}
          </Text>
        </View>

        {isLoading && partnerships.length === 0 ? (
          <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Stats grid */}
            <Text style={styles.sectionTitle}>Riepilogo</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="📁"
                label="Partnership attive"
                value={stats.active}
                color="#6366f1"
              />
              <StatCard
                icon="✅"
                label="Completate"
                value={stats.completed}
                color="#10b981"
              />
              {isManager ? (
                <>
                  <StatCard
                    icon="⏳"
                    label="Approvazioni"
                    value={stats.pendingApprovals}
                    color="#f59e0b"
                  />
                  <StatCard
                    icon="💶"
                    label="Ricavi netti"
                    value={formatEur(stats.totalRevenue)}
                    color="#10b981"
                  />
                </>
              ) : (
                <>
                  <StatCard
                    icon="📋"
                    label="Task attivi"
                    value={stats.activeTasks}
                    color="#f59e0b"
                  />
                  <StatCard
                    icon="📅"
                    label="In scadenza oggi"
                    value={stats.dueTodayCount}
                    color="#ef4444"
                  />
                </>
              )}
            </View>

            {/* Quick actions */}
            <Text style={styles.sectionTitle}>Azioni rapide</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/partnerships')}
              >
                <Ionicons name="briefcase" size={24} color="#6366f1" />
                <Text style={styles.actionLabel}>Partnership</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/notifications')}
              >
                <Ionicons name="notifications" size={24} color="#f59e0b" />
                <Text style={styles.actionLabel}>Notifiche</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Ionicons name="person" size={24} color="#10b981" />
                <Text style={styles.actionLabel}>Profilo</Text>
              </TouchableOpacity>
            </View>

            {/* Recent partnerships */}
            {partnerships.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Recenti</Text>
                {partnerships.slice(0, 3).map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.recentCard}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/partnership/${p.id}`)}
                  >
                    <View style={styles.recentLeft}>
                      <Text style={styles.recentBrand}>{p.brand.name}</Text>
                      <Text style={styles.recentName} numberOfLines={1}>{p.name}</Text>
                    </View>
                    <View style={styles.recentRight}>
                      <Text style={styles.recentPrice}>{formatEur(p.netPrice)}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                    </View>
                  </TouchableOpacity>
                ))}
                {partnerships.length > 3 && (
                  <TouchableOpacity
                    style={styles.viewAllBtn}
                    onPress={() => router.push('/(tabs)/partnerships')}
                  >
                    <Text style={styles.viewAllText}>Vedi tutte ({partnerships.length})</Text>
                    <Ionicons name="arrow-forward" size={14} color="#6366f1" />
                  </TouchableOpacity>
                )}
              </>
            )}

            {partnerships.length === 0 && !isLoading && (
              <View style={styles.emptyState}>
                <Ionicons name="briefcase-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>Nessuna partnership trovata.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  greetingSection: { marginBottom: 24 },
  greeting: { fontSize: 24, fontWeight: '800', color: '#111827' },
  greetingSub: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6b7280', textAlign: 'center' },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#374151' },
  recentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  recentLeft: { flex: 1 },
  recentBrand: { fontSize: 15, fontWeight: '700', color: '#111827' },
  recentName: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  recentRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recentPrice: { fontSize: 14, fontWeight: '700', color: '#10b981' },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  viewAllText: { fontSize: 14, color: '#6366f1', fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: { fontSize: 15, color: '#9ca3af' },
})
