import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { advanceWorkflow, rejectAndGoBack, TaskType, TaskStatus } from '@/lib/workflow'
import { sendTaskNotification } from '@/lib/notifications'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { action, revisionNotes, postLink, metrics } = body

    // Get the task with content and partnership
    const task = await prisma.contentTask.findUnique({
      where: { id: params.taskId },
      include: {
        content: {
          include: {
            partnership: {
              include: {
                brand: true,
                influencer: true,
              },
            },
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task non trovato' }, { status: 404 })
    }

    // Verify partnership matches
    if (task.content.partnership.id !== params.id) {
      return NextResponse.json({ error: 'Task non trovato' }, { status: 404 })
    }

    // Access control
    const partnership = task.content.partnership
    if (
      session.user.role === 'INFLUENCER' &&
      partnership.influencerId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // Manager-only tasks
    const managerOnlyTasks: string[] = [TaskType.BRAND_APPROVAL, TaskType.BRAND_REVIEW]
    if (
      managerOnlyTasks.includes(task.type) &&
      session.user.role !== 'MANAGER'
    ) {
      return NextResponse.json(
        { error: 'Solo il manager può approvare o rifiutare' },
        { status: 403 }
      )
    }

    if (action === 'complete') {
      // Mark task as completed
      await prisma.contentTask.update({
        where: { id: params.taskId },
        data: {
          status: TaskStatus.COMPLETED,
          completedAt: new Date(),
        },
      })

      // Handle post link update
      if (postLink && task.type === TaskType.POST_CONTENT) {
        await prisma.content.update({
          where: { id: task.contentId },
          data: { postLink },
        })
      }

      // Handle metrics
      if (metrics && task.type === TaskType.REPORTING) {
        await prisma.contentMetric.create({
          data: {
            contentId: task.contentId,
            views: metrics.views || 0,
            linkClicks: metrics.linkClicks || 0,
          },
        })
      }

      // Advance workflow
      const nextTask = await advanceWorkflow(task.contentId, task.type as TaskType)

      // Send notification for the next task
      if (nextTask) {
        await sendTaskNotification(
          partnership.influencerId,
          nextTask.type as TaskType,
          nextTask.status as TaskStatus,
          partnership.brand.name,
          nextTask.dueDate,
          null,
          nextTask.dueDate
        )
      }

      return NextResponse.json({ success: true, nextTask })
    } else if (action === 'reject') {
      if (!revisionNotes?.trim()) {
        return NextResponse.json(
          { error: 'Le note di revisione sono obbligatorie' },
          { status: 400 }
        )
      }

      const previousTask = await rejectAndGoBack(
        task.contentId,
        task.type as TaskType,
        revisionNotes.trim()
      )

      if (previousTask) {
        // Notify influencer about revision needed
        await sendTaskNotification(
          partnership.influencerId,
          previousTask.type as TaskType,
          TaskStatus.REVISION_NEEDED,
          partnership.brand.name,
          previousTask.dueDate,
          revisionNotes.trim()
        )
      }

      return NextResponse.json({ success: true, previousTask })
    } else {
      return NextResponse.json({ error: 'Azione non valida' }, { status: 400 })
    }
  } catch (err) {
    console.error('PUT /api/partnerships/[id]/tasks/[taskId] error:', err)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
