import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'

const ROLE_LABELS: Record<string, string> = {
  MANAGER: 'Manager',
  INFLUENCER: 'Influencer',
}

const ROLE_COLORS: Record<string, string> = {
  MANAGER: '#6366f1',
  INFLUENCER: '#10b981',
}

interface MenuItemProps {
  icon: string
  label: string
  onPress: () => void
  color?: string
  danger?: boolean
}

function MenuItem({ icon, label, onPress, color = '#374151', danger = false }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? '#fef2f2' : '#f3f4f6' }]}>
        <Ionicons name={icon as any} size={20} color={danger ? '#ef4444' : color} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: '#ef4444' }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
    </TouchableOpacity>
  )
}

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    Alert.alert(
      'Esci',
      'Sei sicuro di voler uscire dall\'app?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true)
            try {
              await logout()
              router.replace('/(auth)/login')
            } finally {
              setIsLoggingOut(false)
            }
          },
        },
      ]
    )
  }

  const roleColor = ROLE_COLORS[user?.role ?? 'INFLUENCER']
  const roleLabel = ROLE_LABELS[user?.role ?? 'INFLUENCER']

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: roleColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + '20' }]}>
            <Text style={[styles.roleLabel, { color: roleColor }]}>{roleLabel}</Text>
          </View>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color="#9ca3af" />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="shield-outline" size={16} color="#9ca3af" />
            <Text style={styles.infoLabel}>Ruolo</Text>
            <Text style={styles.infoValue}>{roleLabel}</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          <MenuItem
            icon="briefcase-outline"
            label="Le mie partnership"
            onPress={() => router.push('/(tabs)/partnerships')}
            color="#6366f1"
          />
          <View style={styles.divider} />
          <MenuItem
            icon="notifications-outline"
            label="Notifiche"
            onPress={() => router.push('/(tabs)/notifications')}
            color="#f59e0b"
          />
        </View>

        {/* Logout */}
        <View style={styles.menuCard}>
          {isLoggingOut ? (
            <View style={styles.menuItem}>
              <ActivityIndicator color="#ef4444" />
              <Text style={[styles.menuLabel, { color: '#ef4444', marginLeft: 8 }]}>
                Uscita in corso...
              </Text>
            </View>
          ) : (
            <MenuItem
              icon="log-out-outline"
              label="Esci dall'account"
              onPress={handleLogout}
              danger
            />
          )}
        </View>

        <Text style={styles.version}>Work Influencer v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, paddingBottom: 40 },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
})
