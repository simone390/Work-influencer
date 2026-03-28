import { prisma } from './prisma'
import { addDays } from 'date-fns'

// String constants for task types and statuses (SQLite doesn't support enums)
export const TaskType = {
  WRITE_SCRIPT: 'WRITE_SCRIPT',
  BRAND_APPROVAL: 'BRAND_APPROVAL',
  RECORD_CONTENT: 'RECORD_CONTENT',
  BRAND_REVIEW: 'BRAND_REVIEW',
  POST_CONTENT: 'POST_CONTENT',
  REPORTING: 'REPORTING',
  SUBMIT_INVOICE: 'SUBMIT_INVOICE',
} as const

export type TaskType = typeof TaskType[keyof typeof TaskType]

export const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REVISION_NEEDED: 'REVISION_NEEDED',
} as const

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus]

interface ContentWorkflowInput {
  contentId: string
  scriptDeadline: Date
  recordingDeadline: Date
  postDate: Date
}

export async function createContentTasks(input: ContentWorkflowInput) {
  const { contentId, scriptDeadline, recordingDeadline, postDate } = input
  const reportingDue = addDays(postDate, 7)

  const tasks = await prisma.contentTask.createMany({
    data: [
      {
        contentId,
        type: TaskType.WRITE_SCRIPT,
        status: TaskStatus.IN_PROGRESS,
        dueDate: scriptDeadline,
        order: 1,
      },
      {
        contentId,
        type: TaskType.BRAND_APPROVAL,
        status: TaskStatus.PENDING,
        order: 2,
      },
      {
        contentId,
        type: TaskType.RECORD_CONTENT,
        status: TaskStatus.PENDING,
        dueDate: recordingDeadline,
        order: 3,
      },
      {
        contentId,
        type: TaskType.BRAND_REVIEW,
        status: TaskStatus.PENDING,
        order: 4,
      },
      {
        contentId,
        type: TaskType.POST_CONTENT,
        status: TaskStatus.PENDING,
        dueDate: postDate,
        order: 5,
      },
      {
        contentId,
        type: TaskType.REPORTING,
        status: TaskStatus.PENDING,
        dueDate: reportingDue,
        order: 6,
      },
      {
        contentId,
        type: TaskType.SUBMIT_INVOICE,
        status: TaskStatus.PENDING,
        order: 7,
      },
    ],
  })

  return tasks
}

export async function advanceWorkflow(contentId: string, completedTaskType: string) {
  const nextTaskMap: Record<string, string> = {
    [TaskType.WRITE_SCRIPT]: TaskType.BRAND_APPROVAL,
    [TaskType.BRAND_APPROVAL]: TaskType.RECORD_CONTENT,
    [TaskType.RECORD_CONTENT]: TaskType.BRAND_REVIEW,
    [TaskType.BRAND_REVIEW]: TaskType.POST_CONTENT,
    [TaskType.POST_CONTENT]: TaskType.REPORTING,
    [TaskType.REPORTING]: TaskType.SUBMIT_INVOICE,
  }

  const nextTaskType = nextTaskMap[completedTaskType]
  if (!nextTaskType) return null

  const nextTask = await prisma.contentTask.findFirst({
    where: {
      contentId,
      type: nextTaskType,
    },
  })

  if (!nextTask) return null

  const updated = await prisma.contentTask.update({
    where: { id: nextTask.id },
    data: { status: TaskStatus.IN_PROGRESS },
  })

  return updated
}

export async function rejectAndGoBack(
  contentId: string,
  rejectedTaskType: string,
  revisionNotes: string
) {
  const previousTaskMap: Record<string, string> = {
    [TaskType.BRAND_APPROVAL]: TaskType.WRITE_SCRIPT,
    [TaskType.BRAND_REVIEW]: TaskType.RECORD_CONTENT,
  }

  const previousTaskType = previousTaskMap[rejectedTaskType]
  if (!previousTaskType) return null

  // Mark the rejected task with revision needed
  await prisma.contentTask.updateMany({
    where: {
      contentId,
      type: rejectedTaskType,
    },
    data: {
      status: TaskStatus.REVISION_NEEDED,
      revisionNotes,
    },
  })

  // Go back to previous task
  const previousTask = await prisma.contentTask.findFirst({
    where: {
      contentId,
      type: previousTaskType,
    },
  })

  if (!previousTask) return null

  const updated = await prisma.contentTask.update({
    where: { id: previousTask.id },
    data: {
      status: TaskStatus.IN_PROGRESS,
      completedAt: null,
      revisionNotes,
    },
  })

  return updated
}

export const TASK_LABELS: Record<string, string> = {
  WRITE_SCRIPT: 'Scrittura Script',
  BRAND_APPROVAL: 'Approvazione Brand',
  RECORD_CONTENT: 'Registrazione Contenuto',
  BRAND_REVIEW: 'Revisione Brand',
  POST_CONTENT: 'Pubblicazione',
  REPORTING: 'Reporting',
  SUBMIT_INVOICE: 'Invio Fattura',
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: 'In Attesa',
  IN_PROGRESS: 'In Corso',
  COMPLETED: 'Completato',
  REVISION_NEEDED: 'Revisione Richiesta',
}

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  REEL: 'Reel',
  STORY: 'Story',
  POST: 'Post',
  VIDEO: 'Video',
  OTHER: 'Altro',
}

export const PARTNERSHIP_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Attiva',
  COMPLETED: 'Completata',
  PAUSED: 'In Pausa',
}
