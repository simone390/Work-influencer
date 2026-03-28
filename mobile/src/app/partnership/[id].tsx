import React, { useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../hooks/useAuth'
import { usePartnership } from '../../hooks/usePartnerships'
import WorkflowStep from '../../components/WorkflowStep'
import StatusBadge from '../../components/StatusBadge'
import PriceBreakdown from '../../components/PriceBreakdown'
import type { Content, ContentTask, TaskActionPayload } from '../../types'

const CONTENT_TYPE_LABELS: Record<string, string> = {
  REEL: 'Reel',
  STORY: 'Story',
  POST: 'Post',
  VIDEO: 'Video',
  OTHER: 'Altro',
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getCurrentTask(tasks: ContentTask[]): ContentTask | null {
  const sorted = [...tasks].sort((a, b) => a.order - b.order)
  const inProgress = sorted.find((t) => t.status === 'IN_PROGRESS' || t.status === 'REVISION_NEEDED')
  return inProgress ?? null
}

interface ContentSectionProps {
  content: Content
  role: 'MANAGER' | 'INFLUENCER'
  index: number
  onAction: (taskId: string, payload: TaskActionPayload) => Promise<void>
}

function ContentSection({ content, role, index, onAction }: ContentSectionProps) {
  const sortedTasks = [...content.tasks].sort((a, b) => a.order - b.order)
  const currentTask = getCurrentTask(sortedTasks)

  return (
    <View style={styles.contentSection}>
      <View style={styles.contentHeader}>
        <View style={styles.contentIndexBadge}>
          <Text style={styles.contentIndexText}>{index + 1}</Text>
        </View>
        <View style={styles.contentHeaderInfo}>
          <Text style={styles.contentType}>
            {CONTENT_TYPE_LABELS[content.type] ?? content.type}
          </Text>
          {content.description ? (
            <Text style={styles.contentDesc} numberOfLines={2}>{content.description}</Text>
          ) : null}
          {content.postScheduledAt ? (
            <Text style={styles.contentDate}>
              Pubblicazione: {formatDate(content.postScheduledAt)}
            </Text>
          ) : null}
        </View>
      </View>

      {content.postLink ? (
        <View style={styles.postLinkRow}>
          <Ionicons name="link-outline" size={14} color="#6366f1" />
          <Text style={styles.postLinkText} numberOfLines={1}>{content.postLink}</Text>
        </View>
      ) : null}

      <View style={styles.tasksList}>
        {sortedTasks.map((task) => (
          <WorkflowStep
            key={task.id}
            task={task}
            role={role}
            isActive={currentTask?.id === task.id}
            onAction={onAction}
          />
        ))}
      </View>
    </View>
  )
}

export default function PartnershipDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { partnership, isLoading, error, fetchPartnership, updateTask } = usePartnership(id!)

  useEffect(() => {
    if (id) fetchPartnership()
  }, [id, fetchPartnership])

  const handleAction = useCallback(
    async (taskId: string, payload: TaskActionPayload) => {
      await updateTask(taskId, payload)
    },
    [updateTask]
  )

  const role = (user?.role ?? 'INFLUENCER') as 'MANAGER' | 'INFLUENCER'

  if (isLoading && !partnership) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Caricamento...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  if (!partnership) return null

  const totalTasks = partnership.contents.reduce((sum, c) => sum + c.tasks.length, 0)
  const completedTasks = partnership.contents.reduce(
    (sum, c) => sum + c.tasks.filter((t) => t.status === 'COMPLETED').length,
    0
  )
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchPartnership}
            tintColor="#6366f1"
          />
        }
      >
        {/* Partnership header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandBlock}>
              <Text style={styles.brandName}>{partnership.brand.name}</Text>
              <Text style={styles.partnershipName}>{partnership.name}</Text>
            </View>
            <StatusBadge status={partnership.status} />
          </View>

          {role === 'MANAGER' && (
            <View style={styles.influencerRow}>
              <Ionicons name="person-circle-outline" size={16} color="#6b7280" />
              <Text style={styles.influencerName}>{partnership.influencer.name}</Text>
            </View>
          )}

          {partnership.brief && (
            <View style={styles.briefBox}>
              <Text style={styles.briefLabel}>Brief</Text>
              <Text style={styles.briefText}>{partnership.brief}</Text>
            </View>
          )}

          <PriceBreakdown totalPrice={partnership.totalPrice} netPrice={partnership.netPrice} />

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progresso complessivo</Text>
              <Text style={styles.progressCount}>{completedTasks}/{totalTasks} task</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>

          <Text style={styles.createdAt}>
            Creata il {formatDate(partnership.createdAt)}
          </Text>
        </View>

        {/* Contents */}
        <Text style={styles.sectionTitle}>
          Contenuti ({partnership.contents.length})
        </Text>
        {partnership.contents.map((content, index) => (
          <ContentSection
            key={content.id}
            content={content}
            role={role}
            index={index}
            onAction={handleAction}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  loadingText: { fontSize: 15, color: '#6b7280' },
  errorText: { fontSize: 15, color: '#ef4444', textAlign: 'center' },

  // Header
  header: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  brandBlock: { flex: 1, marginRight: 12 },
  brandName: { fontSize: 20, fontWeight: '800', color: '#111827' },
  partnershipName: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  influencerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  influencerName: { fontSize: 14, color: '#6b7280' },
  briefBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  briefLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  briefText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  progressSection: { marginTop: 8 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: { fontSize: 13, color: '#6b7280' },
  progressCount: { fontSize: 13, fontWeight: '700', color: '#374151' },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  createdAt: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 10,
  },

  // Section
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  contentSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  contentIndexBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentIndexText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  contentHeaderInfo: { flex: 1 },
  contentType: { fontSize: 16, fontWeight: '700', color: '#111827' },
  contentDesc: { fontSize: 13, color: '#6b7280', marginTop: 3, lineHeight: 18 },
  contentDate: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  postLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  postLinkText: { fontSize: 12, color: '#6366f1', flex: 1 },
  tasksList: { gap: 0 },
})
