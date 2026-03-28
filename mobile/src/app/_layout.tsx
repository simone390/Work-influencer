import React from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from '../hooks/useAuth'

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="partnership/[id]"
          options={{
            headerShown: true,
            headerTitle: 'Dettaglio Partnership',
            headerBackTitle: 'Indietro',
            headerTintColor: '#6366f1',
            headerStyle: { backgroundColor: '#f9fafb' },
          }}
        />
      </Stack>
    </AuthProvider>
  )
}
