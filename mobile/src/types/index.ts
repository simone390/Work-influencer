export type UserRole = 'MANAGER' | 'INFLUENCER'

export type TaskType =
  | 'WRITE_SCRIPT'
  | 'BRAND_APPROVAL'
  | 'RECORD_CONTENT'
  | 'BRAND_REVIEW'
  | 'POST_CONTENT'
  | 'REPORTING'
  | 'SUBMIT_INVOICE'

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REVISION_NEEDED'

export type PartnershipStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface ContentTask {
  id: string
  type: TaskType
  status: TaskStatus
  dueDate: string | null
  notes: string | null
  revisionNotes: string | null
  order: number
  completedAt: string | null
}

export interface Content {
  id: string
  type: string
  description: string | null
  postScheduledAt: string | null
  postLink: string | null
  tasks: ContentTask[]
}

export interface Brand {
  id: string
  name: string
  publicToken: string
}

export interface Partnership {
  id: string
  name: string
  status: PartnershipStatus
  totalPrice: number
  netPrice: number
  brief: string | null
  brand: Brand
  influencer: User
  contents: Content[]
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export interface NotificationsResponse {
  notifications: Notification[]
  unreadCount: number
  total: number
  page: number
  totalPages: number
}

export interface AuthSession {
  user: User
  sessionToken: string
}

export interface TaskActionPayload {
  action: 'complete' | 'approve' | 'reject'
  revisionNotes?: string
  postLink?: string
  metrics?: {
    views: number
    linkClicks: number
  }
}
