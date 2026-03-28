import React, { useEffect, useCallback } from 'react'
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
import { useNotifications } from '../../hooks/useNotifications'
import NotificationItem from '../../components/NotificationItem'
import type { Notification } from '../../types'

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markRead,
    markAllRead,
  } = useNotifications()

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationItem notification={item} onPress={markRead} />
    ),
    [markRead]
  )

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header action */}
      {unreadCount > 0 && (
        <View style={styles.topBar}>
          <Text style={styles.unreadBadge}>{unreadCount} non lette</Text>
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Segna tutte come lette</Text>
          </TouchableOpacity>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchNotifications}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 48 }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>Nessuna notifica.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  unreadBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366f1',
  },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eef2ff',
    borderRadius: 20,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
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
