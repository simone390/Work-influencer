import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Badge, getTaskStatusVariant, getTaskStatusLabel, getPartnershipStatusVariant, getPartnershipStatusLabel } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/Card'
import { TASK_LABELS, CONTENT_TYPE_LABELS, TaskType, TaskStatus } from '@/lib/workflow'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const isManager = session.user.role === 'MANAGER'

  if (isManager) {
    // Manager dashboard
    const [
      totalPartnerships,
      activePartnerships,
      completedPartnerships,
      priceAgg,
      pendingApprovals,
      upcomingTasks,
    ] = await Promise.all([
      prisma.partnership.count(),
      prisma.partnership.count({ where: { status: 'ACTIVE' } }),
      prisma.partnership.count({ where: { status: 'COMPLETED' } }),
      prisma.partnership.aggregate({
        _sum: { totalPrice: true, netPrice: true },
      }),
      prisma.contentTask.findMany({
        where: {
          type: { in: [TaskType.BRAND_APPROVAL, TaskType.BRAND_REVIEW] },
          status: TaskStatus.IN_PROGRESS,
        },
        include: {
          content: {
            include: {
              partnership: {
                include: { brand: true, influencer: { select: { id: true, name: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 10,
      }),
      prisma.contentTask.findMany({
        where: {
          status: { in: [TaskStatus.IN_PROGRESS, TaskStatus.REVISION_NEEDED] },
          dueDate: { not: null },
        },
        include: {
          content: {
            include: {
              partnership: {
                include: { brand: true, influencer: { select: { id: true, name: true } } },
              },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 8,
      }),
    ])

    const totalRevenue = priceAgg._sum.totalPrice || 0
    const totalNet = priceAgg._sum.netPrice || 0

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Benvenuto, {session.user.name}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Partnership Totali"
            value={totalPartnerships}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatCard
            title="Partnership Attive"
            value={activePartnerships}
            colorClass="text-blue-600"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <StatCard
            title="Fatturato Totale"
            value={`€${totalRevenue.toLocaleString('it-IT')}`}
            subtitle={`Netto: €${totalNet.toLocaleString('it-IT')}`}
            colorClass="text-green-600"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Approvazioni Pending"
            value={pendingApprovals.length}
            colorClass="text-orange-600"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending approvals */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Approvazioni in Attesa</h2>
              {pendingApprovals.length > 0 && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                  {pendingApprovals.length}
                </span>
              )}
            </div>
            {pendingApprovals.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nessuna approvazione in attesa
              </p>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((task) => (
                  <Link
                    key={task.id}
                    href={`/partnerships/${task.content.partnership.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {task.content.partnership.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {TASK_LABELS[task.type as TaskType]} · {CONTENT_TYPE_LABELS[task.content.type]} · {task.content.partnership.influencer.name}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming tasks */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Task in Scadenza</h2>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nessun task in scadenza
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/partnerships/${task.content.partnership.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {task.content.partnership.name}
                        </p>
                        <Badge variant={getTaskStatusVariant(task.status)}>
                          {getTaskStatusLabel(task.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {TASK_LABELS[task.type as TaskType]} · {task.content.partnership.influencer.name}
                      </p>
                    </div>
                    {task.dueDate && (
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {format(new Date(task.dueDate), 'dd/MM', { locale: it })}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Azioni Rapide</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/partnerships/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuova Partnership
            </Link>
            <Link
              href="/brands/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuovo Brand
            </Link>
            <Link
              href="/influencers/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuovo Influencer
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Influencer dashboard
  const [myPartnerships, myPendingTasks] = await Promise.all([
    prisma.partnership.findMany({
      where: { influencerId: session.user.id, status: 'ACTIVE' },
      include: {
        brand: true,
        influencer: { select: { id: true, name: true, email: true } },
        contents: {
          include: {
            tasks: { orderBy: { order: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.contentTask.findMany({
      where: {
        status: { in: [TaskStatus.IN_PROGRESS, TaskStatus.REVISION_NEEDED] },
        content: {
          partnership: { influencerId: session.user.id },
        },
      },
      include: {
        content: {
          include: {
            partnership: {
              include: { brand: true },
            },
          },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
      take: 10,
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">La Mia Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Bentornata, {session.user.name}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Partnership Attive"
          value={myPartnerships.length}
          colorClass="text-primary-600"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <StatCard
          title="Task Attivi"
          value={myPendingTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length}
          colorClass="text-blue-600"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          title="Revisioni da Fare"
          value={myPendingTasks.filter((t) => t.status === TaskStatus.REVISION_NEEDED).length}
          colorClass="text-red-600"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* My tasks */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">I Miei Task</h2>
        {myPendingTasks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Nessun task attivo al momento
          </p>
        ) : (
          <div className="space-y-3">
            {myPendingTasks.map((task) => (
              <Link
                key={task.id}
                href={`/partnerships/${task.content.partnership.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">
                      {TASK_LABELS[task.type as TaskType]}
                    </p>
                    <Badge variant={getTaskStatusVariant(task.status)}>
                      {getTaskStatusLabel(task.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {task.content.partnership.name} · {task.content.partnership.brand.name} · {CONTENT_TYPE_LABELS[task.content.type]}
                  </p>
                  {task.revisionNotes && task.status === TaskStatus.REVISION_NEEDED && (
                    <p className="text-xs text-red-600 mt-1">
                      Note: {task.revisionNotes}
                    </p>
                  )}
                </div>
                {task.dueDate && (
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-xs font-medium text-gray-700">
                      {format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: it })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(task.dueDate), 'HH:mm')}
                    </p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* My partnerships */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Partnership Attive</h2>
          <Link href="/partnerships" className="text-sm text-primary-600 hover:text-primary-700">
            Vedi tutte →
          </Link>
        </div>
        {myPartnerships.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Nessuna partnership attiva
          </p>
        ) : (
          <div className="space-y-3">
            {myPartnerships.map((p) => {
              const totalTasks = p.contents.reduce((acc, c) => acc + c.tasks.length, 0)
              const completedTasks = p.contents.reduce((acc, c) => acc + c.tasks.filter((t) => t.status === 'COMPLETED').length, 0)
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

              return (
                <Link
                  key={p.id}
                  href={`/partnerships/${p.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.brand.name}</p>
                    <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <Badge variant={getPartnershipStatusVariant(p.status)}>
                      {getPartnershipStatusLabel(p.status)}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{completedTasks}/{totalTasks} task</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
