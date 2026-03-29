import { prisma } from './prisma'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { TaskType, TaskStatus } from './workflow'
import { sendWebPushNotification } from './webpush'

export async function sendNotification(
  userId: string,
  title: string,
  body: string
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      body,
      read: false,
    },
  })

  // Also send web push notifications to all subscriptions for this user
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    })

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await sendWebPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            { title, body }
          )
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription expired or gone — remove from DB
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
          }
        }
      })
    )
  } catch (error) {
    console.error('Error sending web push notifications:', error)
  }

  return notification
}

export async function sendTaskNotification(
  influencerId: string,
  taskType: string,
  newStatus: string,
  brandName: string,
  dueDate?: Date | null,
  revisionNotes?: string | null,
  postTime?: Date | null
) {
  let title = ''
  let body = ''

  const dateStr = dueDate ? format(dueDate, 'dd/MM/yyyy', { locale: it }) : ''
  const timeStr = postTime ? format(postTime, 'HH:mm', { locale: it }) : ''

  if (taskType === TaskType.WRITE_SCRIPT && newStatus === TaskStatus.IN_PROGRESS) {
    title = 'Nuovo script da scrivere'
    body = `Devi scrivere lo script per ${brandName} entro ${dateStr}`
  } else if (taskType === TaskType.WRITE_SCRIPT && newStatus === TaskStatus.REVISION_NEEDED) {
    title = 'Revisione script richiesta'
    body = `Lo script per ${brandName} necessita di revisioni: ${revisionNotes || 'vedi note'}`
  } else if (taskType === TaskType.RECORD_CONTENT && newStatus === TaskStatus.IN_PROGRESS) {
    title = 'Contenuto da registrare'
    body = `Puoi registrare il contenuto per ${brandName} entro ${dateStr}`
  } else if (taskType === TaskType.POST_CONTENT && newStatus === TaskStatus.IN_PROGRESS) {
    title = 'Contenuto da pubblicare'
    body = `Ricordati di pubblicare il contenuto per ${brandName} il ${dateStr}${timeStr ? ` alle ${timeStr}` : ''}`
  } else if (taskType === TaskType.REPORTING && newStatus === TaskStatus.IN_PROGRESS) {
    title = 'Report da completare'
    body = `Inserisci i dati di reporting per ${brandName}`
  }

  if (title && body) {
    await sendNotification(influencerId, title, body)
  }
}

export async function markNotificationRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: { read: true },
  })
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false },
  })
}
