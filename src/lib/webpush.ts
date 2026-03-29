import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:admin@j4ya.it',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendWebPushNotification(
  subscription: webpush.PushSubscription,
  payload: { title: string; body: string; url?: string }
) {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || '/',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      })
    )
  } catch (error: any) {
    if (error.statusCode === 410) {
      // Subscription expired - should be removed from DB
      console.log('Push subscription expired:', subscription.endpoint)
    }
    throw error
  }
}
