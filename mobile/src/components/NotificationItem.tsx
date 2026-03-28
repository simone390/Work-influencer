import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Notification } from '../types'

interface NotificationItemProps {
  notification: Notification
  onPress: (id: string) => void
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return 'adesso'
  if (diffMin < 60) return `${diffMin} min fa`
  if (diffHours < 24) return `${diffHours} ore fa`
  if (diffDays === 1) return 'ieri'
  return `${diffDays} giorni fa`
}

export default function NotificationItem({ notification, onPress }: NotificationItemProps) {
  return (
    <TouchableOpacity
      style={[styles.container, !notification.read && styles.unread]}
      activeOpacity={0.8}
      onPress={() => onPress(notification.id)}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={notification.read ? 'notifications-outline' : 'notifications'}
          size={20}
          color={notification.read ? '#9ca3af' : '#6366f1'}
        />
        {!notification.read && <View style={styles.dot} />}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !notification.read && styles.titleUnread]}>
          {notification.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.time}>{timeAgo(notification.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'flex-start',
    gap: 12,
  },
  unread: {
    backgroundColor: '#fafafe',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366f1',
    borderWidth: 2,
    borderColor: '#fff',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 3,
  },
  titleUnread: {
    fontWeight: '700',
    color: '#111827',
  },
  body: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  time: {
    fontSize: 11,
    color: '#9ca3af',
  },
})
