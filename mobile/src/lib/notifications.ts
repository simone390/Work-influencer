import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import api from './api'

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

/**
 * Request notification permissions and get the Expo push token.
 * Then registers the token with the backend.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Le notifiche push richiedono un dispositivo fisico.')
    return null
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    })
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('Permesso per le notifiche non concesso.')
    return null
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    )
    const pushToken = tokenData.data
    console.log('Expo push token:', pushToken)

    // Register with backend (best-effort — endpoint may not exist yet)
    try {
      await api.post('/api/notifications/push-token', { token: pushToken })
    } catch {
      console.log('Registrazione push token non riuscita (endpoint non disponibile).')
    }

    return pushToken
  } catch (err) {
    console.error('Errore nel recupero del push token:', err)
    return null
  }
}

/**
 * Set up foreground and background notification listeners.
 * Returns a cleanup function to remove the subscriptions.
 */
export function setupNotificationListeners(
  onReceived?: (notification: Notifications.Notification) => void,
  onResponse?: (response: Notifications.NotificationResponse) => void
): () => void {
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    onReceived?.(notification)
  })

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    onResponse?.(response)
  })

  return () => {
    receivedSub.remove()
    responseSub.remove()
  }
}
