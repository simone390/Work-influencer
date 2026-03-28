import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import StatusBadge from './StatusBadge'
import type { ContentTask, TaskType, UserRole, TaskActionPayload } from '../types'

const TASK_ICONS: Record<string, string> = {
  WRITE_SCRIPT: '✍️',
  BRAND_APPROVAL: '✅',
  RECORD_CONTENT: '🎬',
  BRAND_REVIEW: '👁️',
  POST_CONTENT: '📱',
  REPORTING: '📊',
  SUBMIT_INVOICE: '🧾',
}

const TASK_LABELS: Record<string, string> = {
  WRITE_SCRIPT: 'Scrivi Script',
  BRAND_APPROVAL: 'Approvazione Brand',
  RECORD_CONTENT: 'Registra Contenuto',
  BRAND_REVIEW: 'Revisione Brand',
  POST_CONTENT: 'Pubblica',
  REPORTING: 'Reporting',
  SUBMIT_INVOICE: 'Fattura',
}

const MANAGER_TASKS: TaskType[] = ['BRAND_APPROVAL', 'BRAND_REVIEW']
const INFLUENCER_TASKS: TaskType[] = [
  'WRITE_SCRIPT',
  'RECORD_CONTENT',
  'POST_CONTENT',
  'REPORTING',
  'SUBMIT_INVOICE',
]

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface WorkflowStepProps {
  task: ContentTask
  role: UserRole
  isActive: boolean
  onAction: (taskId: string, payload: TaskActionPayload) => Promise<void>
}

export default function WorkflowStep({ task, role, isActive, onAction }: WorkflowStepProps) {
  const [loading, setLoading] = useState(false)
  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [reportingModalVisible, setReportingModalVisible] = useState(false)
  const [postLinkModalVisible, setPostLinkModalVisible] = useState(false)
  const [views, setViews] = useState('')
  const [linkClicks, setLinkClicks] = useState('')
  const [postLink, setPostLink] = useState('')

  const canManagerAct =
    role === 'MANAGER' && MANAGER_TASKS.includes(task.type as TaskType) && isActive
  const canInfluencerAct =
    role === 'INFLUENCER' && INFLUENCER_TASKS.includes(task.type as TaskType) && isActive

  const isActionable = canManagerAct || canInfluencerAct

  async function handleComplete() {
    if (task.type === 'REPORTING') {
      setReportingModalVisible(true)
      return
    }
    if (task.type === 'POST_CONTENT') {
      setPostLinkModalVisible(true)
      return
    }
    setLoading(true)
    try {
      await onAction(task.id, { action: 'complete' })
    } catch (err: unknown) {
      Alert.alert('Errore', (err as Error).message ?? 'Operazione non riuscita.')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove() {
    setLoading(true)
    try {
      await onAction(task.id, { action: 'complete' })
    } catch (err: unknown) {
      Alert.alert('Errore', (err as Error).message ?? 'Operazione non riuscita.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReject() {
    if (!revisionNotes.trim()) {
      Alert.alert('Attenzione', 'Le note di revisione sono obbligatorie.')
      return
    }
    setLoading(true)
    try {
      await onAction(task.id, { action: 'reject', revisionNotes: revisionNotes.trim() })
      setRejectModalVisible(false)
      setRevisionNotes('')
    } catch (err: unknown) {
      Alert.alert('Errore', (err as Error).message ?? 'Operazione non riuscita.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReportingSubmit() {
    const viewsNum = parseInt(views, 10) || 0
    const clicksNum = parseInt(linkClicks, 10) || 0
    setLoading(true)
    try {
      await onAction(task.id, {
        action: 'complete',
        metrics: { views: viewsNum, linkClicks: clicksNum },
      })
      setReportingModalVisible(false)
      setViews('')
      setLinkClicks('')
    } catch (err: unknown) {
      Alert.alert('Errore', (err as Error).message ?? 'Operazione non riuscita.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePostLinkSubmit() {
    setLoading(true)
    try {
      await onAction(task.id, {
        action: 'complete',
        postLink: postLink.trim() || undefined,
      })
      setPostLinkModalVisible(false)
      setPostLink('')
    } catch (err: unknown) {
      Alert.alert('Errore', (err as Error).message ?? 'Operazione non riuscita.')
    } finally {
      setLoading(false)
    }
  }

  const icon = TASK_ICONS[task.type] ?? '📋'
  const label = TASK_LABELS[task.type] ?? task.type
  const dueDate = formatDate(task.dueDate)

  return (
    <>
      <View style={[styles.container, isActive && styles.containerActive]}>
        <View style={styles.header}>
          <View style={styles.iconLabel}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
          </View>
          <StatusBadge status={task.status} size="sm" />
        </View>

        {dueDate && (
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
            <Text style={styles.dateText}>Scadenza: {dueDate}</Text>
          </View>
        )}

        {task.status === 'REVISION_NEEDED' && task.revisionNotes && (
          <View style={styles.revisionBox}>
            <Ionicons name="alert-circle" size={14} color="#ef4444" />
            <Text style={styles.revisionText}>{task.revisionNotes}</Text>
          </View>
        )}

        {task.completedAt && (
          <View style={styles.dateRow}>
            <Ionicons name="checkmark-circle-outline" size={13} color="#10b981" />
            <Text style={[styles.dateText, { color: '#10b981' }]}>
              Completato il {formatDate(task.completedAt)}
            </Text>
          </View>
        )}

        {isActionable && (
          <View style={styles.actionsRow}>
            {canInfluencerAct && (
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handleComplete}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnPrimaryText}>
                    {task.type === 'WRITE_SCRIPT' && 'Segna script scritto'}
                    {task.type === 'RECORD_CONTENT' && 'Segna video registrato'}
                    {task.type === 'POST_CONTENT' && 'Segna pubblicato'}
                    {task.type === 'REPORTING' && 'Inserisci metriche'}
                    {task.type === 'SUBMIT_INVOICE' && 'Segna fattura inviata'}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {canManagerAct && (
              <>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={handleApprove}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>Approva</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnDanger}
                  onPress={() => setRejectModalVisible(true)}
                  disabled={loading}
                >
                  <Text style={styles.btnDangerText}>Rifiuta</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>

      {/* Reject modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rifiuta e richiedi revisione</Text>
            <Text style={styles.modalLabel}>Note di revisione *</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Indica cosa deve essere rivisto..."
              value={revisionNotes}
              onChangeText={setRevisionNotes}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => { setRejectModalVisible(false); setRevisionNotes('') }}
              >
                <Text style={styles.btnSecondaryText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnDanger}
                onPress={handleReject}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnDangerText}>Rifiuta</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Reporting modal */}
      <Modal
        visible={reportingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReportingModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Inserisci metriche</Text>
            <Text style={styles.modalLabel}>Visualizzazioni</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="0"
              value={views}
              onChangeText={setViews}
            />
            <Text style={styles.modalLabel}>Click sul link</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="0"
              value={linkClicks}
              onChangeText={setLinkClicks}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => { setReportingModalVisible(false); setViews(''); setLinkClicks('') }}
              >
                <Text style={styles.btnSecondaryText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handleReportingSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Salva</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Post link modal */}
      <Modal
        visible={postLinkModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPostLinkModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Segna come pubblicato</Text>
            <Text style={styles.modalLabel}>Link del post (opzionale)</Text>
            <TextInput
              style={styles.input}
              keyboardType="url"
              autoCapitalize="none"
              placeholder="https://..."
              value={postLink}
              onChangeText={setPostLink}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => { setPostLinkModalVisible(false); setPostLink('') }}
              >
                <Text style={styles.btnSecondaryText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handlePostLinkSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Conferma</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  containerActive: {
    backgroundColor: '#eef2ff',
    borderLeftColor: '#6366f1',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  labelActive: {
    color: '#4f46e5',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  revisionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  revisionText: {
    fontSize: 13,
    color: '#dc2626',
    flex: 1,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  btnDanger: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDangerText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 13,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
})
