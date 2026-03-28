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
    const [
      totalPartnerships,
      activePartnerships,
      priceAgg,
      pendingApprovals,
      upcomingTasks,
    ] = await Promise.all([
      prisma.partnership.count(),
      prisma.partnership.count({ where: { status: 'ACTIVE' } }),
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
      <div className="max-w-6xl">
        <div className="mb-7">
          <h1 className="text-[28px] font-bold text-[#1d1d1f] tracking-tight mb-1">Dashboard</h1>
          <p className="text-[15px] text-[#6e6e73]">Benvenuto, {session.user.name}</p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard title="Partnership Totali" value={totalPartnerships}
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
          <StatCard title="Partnership Attive" value={activePartnerships} colorClass="text-[#0071e3]"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          />
          <StatCard title="Fatturato Totale" value={`€${totalRevenue.toLocaleString('it-IT')}`} subtitle={`Netto: €${totalNet.toLocaleString('it-IT')}`} colorClass="text-[#34c759]"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard title="Approvazioni Pending" value={pendingApprovals.length} colorClass="text-[#ff9500]"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#f0f0f0] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-[#1d1d1f]">Approvazioni in Attesa</h2>
              {pendingApprovals.length > 0 && (
                <span className="text-[11px] bg-[#fff3e0] text-[#ff9500] px-2 py-0.5 rounded-full font-semibold">{pendingApprovals.length}</span>
              )}
            </div>
            {pendingApprovals.length === 0 ? (
              <p className="text-[13.5px] text-[#8e8e93] text-center py-5">Nessuna approvazione in attesa</p>
            ) : (
              <div className="flex flex-col gap-2">
                {pendingApprovals.map((task) => (
                  <Link key={task.id} href={`/partnerships/${task.content.partnership.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#fff8f0] hover:bg-[#fff3e0] transition-colors no-underline">
                    <div>
                      <p className="text-[13.5px] font-semibold text-[#1d1d1f] mb-0.5">{task.content.partnership.name}</p>
                      <p className="text-[12px] text-[#6e6e73]">{TASK_LABELS[task.type as TaskType]} · {CONTENT_TYPE_LABELS[task.content.type]} · {task.content.partnership.influencer.name}</p>
                    </div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#8e8e93"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#f0f0f0] p-5">
            <h2 className="text-[15px] font-semibold text-[#1d1d1f] mb-4">Task in Scadenza</h2>
            {upcomingTasks.length === 0 ? (
              <p className="text-[13.5px] text-[#8e8e93] text-center py-5">Nessun task in scadenza</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {upcomingTasks.map((task) => (
                  <Link key={task.id} href={`/partnerships/${task.content.partnership.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[#f5f5f7] transition-colors no-underline">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-[13.5px] font-semibold text-[#1d1d1f] truncate">{task.content.partnership.name}</p>
                        <Badge variant={getTaskStatusVariant(task.status)}>{getTaskStatusLabel(task.status)}</Badge>
                      </div>
                      <p className="text-[12px] text-[#6e6e73]">{TASK_LABELS[task.type as TaskType]} · {task.content.partnership.influencer.name}</p>
                    </div>
                    {task.dueDate && (
                      <span className="text-[12px] text-[#6e6e73] ml-2 flex-shrink-0">{format(new Date(task.dueDate), 'dd/MM', { locale: it })}</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#f0f0f0] p-5">
          <h2 className="text-[15px] font-semibold text-[#1d1d1f] mb-4">Azioni Rapide</h2>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/partnerships/new" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full text-[13.5px] font-medium transition-colors no-underline">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              Nuova Partnership
            </Link>
            <Link href="/brands/new" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d2d2d7] rounded-full text-[13.5px] font-medium transition-colors no-underline">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              Nuovo Brand
            </Link>
            <Link href="/influencers/new" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d2d2d7] rounded-full text-[13.5px] font-medium transition-colors no-underline">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
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
        contents: { include: { tasks: { orderBy: { order: 'asc' } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.contentTask.findMany({
      where: {
        status: { in: [TaskStatus.IN_PROGRESS, TaskStatus.REVISION_NEEDED] },
        content: { partnership: { influencerId: session.user.id } },
      },
      include: {
        content: { include: { partnership: { include: { brand: true } } } },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
      take: 10,
    }),
  ])

  return (
    <div className="max-w-3xl">
      <div className="mb-7">
        <h1 className="text-[28px] font-bold text-[#1d1d1f] tracking-tight mb-1">La Mia Dashboard</h1>
        <p className="text-[15px] text-[#6e6e73]">Bentornata, {session.user.name}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard title="Partnership Attive" value={myPartnerships.length} colorClass="text-[#0071e3]"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <StatCard title="Task Attivi" value={myPendingTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length} colorClass="text-[#0071e3]"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard title="Revisioni da Fare" value={myPendingTasks.filter((t) => t.status === TaskStatus.REVISION_NEEDED).length} colorClass="text-[#ff3b30]"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
      </div>

      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#f0f0f0] p-5 mb-4">
        <h2 className="text-[15px] font-semibold text-[#1d1d1f] mb-4">I Miei Task</h2>
        {myPendingTasks.length === 0 ? (
          <p className="text-[13.5px] text-[#8e8e93] text-center py-6">Nessun task attivo al momento</p>
        ) : (
          <div className="flex flex-col gap-2">
            {myPendingTasks.map((task) => (
              <Link key={task.id} href={`/partnerships/${task.content.partnership.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-[#f0f0f0] hover:border-[#d2d2d7] hover:bg-[#fafafa] transition-colors no-underline">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-[13.5px] font-semibold text-[#1d1d1f]">{TASK_LABELS[task.type as TaskType]}</p>
                    <Badge variant={getTaskStatusVariant(task.status)}>{getTaskStatusLabel(task.status)}</Badge>
                  </div>
                  <p className="text-[12px] text-[#6e6e73]">{task.content.partnership.name} · {task.content.partnership.brand.name} · {CONTENT_TYPE_LABELS[task.content.type]}</p>
                  {task.revisionNotes && task.status === TaskStatus.REVISION_NEEDED && (
                    <p className="text-[12px] text-[#ff3b30] mt-1">Note: {task.revisionNotes}</p>
                  )}
                </div>
                {task.dueDate && (
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-[12px] font-semibold text-[#1d1d1f]">{format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: it })}</p>
                    <p className="text-[11px] text-[#6e6e73]">{format(new Date(task.dueDate), 'HH:mm')}</p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#f0f0f0] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-[#1d1d1f]">Partnership Attive</h2>
          <Link href="/partnerships" className="text-[13.5px] text-[#0071e3] no-underline font-medium">Vedi tutte →</Link>
        </div>
        {myPartnerships.length === 0 ? (
          <p className="text-[13.5px] text-[#8e8e93] text-center py-6">Nessuna partnership attiva</p>
        ) : (
          <div className="flex flex-col gap-2">
            {myPartnerships.map((p) => {
              const totalTasks = p.contents.reduce((acc, c) => acc + c.tasks.length, 0)
              const completedTasks = p.contents.reduce((acc, c) => acc + c.tasks.filter((t) => t.status === 'COMPLETED').length, 0)
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
              return (
                <Link key={p.id} href={`/partnerships/${p.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-[#f0f0f0] hover:border-[#d2d2d7] transition-colors no-underline">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-[#1d1d1f] truncate mb-0.5">{p.name}</p>
                    <p className="text-[12px] text-[#6e6e73] mb-2">{p.brand.name}</p>
                    <div className="w-full bg-[#f0f0f0] rounded-full h-1">
                      <div className="bg-[#0071e3] h-1 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="ml-4 text-right flex-shrink-0">
                    <Badge variant={getPartnershipStatusVariant(p.status)}>{getPartnershipStatusLabel(p.status)}</Badge>
                    <p className="text-[11px] text-[#6e6e73] mt-1">{completedTasks}/{totalTasks} task</p>
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
