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
      <div style={{ maxWidth: '1200px' }}>
        {/* Page header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.03em', marginBottom: '4px' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '15px', color: '#6e6e73' }}>
            Benvenuto, {session.user.name}
          </p>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <StatCard
            title="Partnership Totali"
            value={totalPartnerships}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatCard
            title="Partnership Attive"
            value={activePartnerships}
            colorClass="text-[#0071e3]"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <StatCard
            title="Fatturato Totale"
            value={`€${totalRevenue.toLocaleString('it-IT')}`}
            subtitle={`Netto: €${totalNet.toLocaleString('it-IT')}`}
            colorClass="text-[#34c759]"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Approvazioni Pending"
            value={pendingApprovals.length}
            colorClass="text-[#ff9500]"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          {/* Pending approvals */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #f0f0f0',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1d1d1f' }}>Approvazioni in Attesa</h2>
              {pendingApprovals.length > 0 && (
                <span
                  style={{
                    fontSize: '11px',
                    background: '#fff3e0',
                    color: '#ff9500',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    fontWeight: 600,
                  }}
                >
                  {pendingApprovals.length}
                </span>
              )}
            </div>
            {pendingApprovals.length === 0 ? (
              <p style={{ fontSize: '13.5px', color: '#8e8e93', textAlign: 'center', padding: '20px 0' }}>
                Nessuna approvazione in attesa
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pendingApprovals.map((task) => (
                  <Link
                    key={task.id}
                    href={`/partnerships/${task.content.partnership.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: '#fff8f0',
                      textDecoration: 'none',
                      transition: 'all 200ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fff3e0' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff8f0' }}
                  >
                    <div>
                      <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#1d1d1f', marginBottom: '2px' }}>
                        {task.content.partnership.name}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6e6e73' }}>
                        {TASK_LABELS[task.type as TaskType]} · {CONTENT_TYPE_LABELS[task.content.type]} · {task.content.partnership.influencer.name}
                      </p>
                    </div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#8e8e93">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming tasks */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #f0f0f0',
              padding: '20px',
            }}
          >
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1d1d1f', marginBottom: '16px' }}>
              Task in Scadenza
            </h2>
            {upcomingTasks.length === 0 ? (
              <p style={{ fontSize: '13.5px', color: '#8e8e93', textAlign: 'center', padding: '20px 0' }}>
                Nessun task in scadenza
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {upcomingTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/partnerships/${task.content.partnership.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'transparent',
                      textDecoration: 'none',
                      transition: 'all 200ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f7' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
                        <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#1d1d1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.content.partnership.name}
                        </p>
                        <Badge variant={getTaskStatusVariant(task.status)}>
                          {getTaskStatusLabel(task.status)}
                        </Badge>
                      </div>
                      <p style={{ fontSize: '12px', color: '#6e6e73' }}>
                        {TASK_LABELS[task.type as TaskType]} · {task.content.partnership.influencer.name}
                      </p>
                    </div>
                    {task.dueDate && (
                      <span style={{ fontSize: '12px', color: '#6e6e73', marginLeft: '8px', flexShrink: 0 }}>
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
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0',
            padding: '20px',
          }}
        >
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1d1d1f', marginBottom: '16px' }}>
            Azioni Rapide
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Link
              href="/partnerships/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 18px',
                background: '#0071e3',
                color: '#ffffff',
                borderRadius: '980px',
                fontSize: '13.5px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#0077ed' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#0071e3' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Nuova Partnership
            </Link>
            <Link
              href="/brands/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 18px',
                background: '#ffffff',
                color: '#1d1d1f',
                border: '1px solid #d2d2d7',
                borderRadius: '980px',
                fontSize: '13.5px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f7' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Nuovo Brand
            </Link>
            <Link
              href="/influencers/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 18px',
                background: '#ffffff',
                color: '#1d1d1f',
                border: '1px solid #d2d2d7',
                borderRadius: '980px',
                fontSize: '13.5px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f7' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
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
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.03em', marginBottom: '4px' }}>
          La Mia Dashboard
        </h1>
        <p style={{ fontSize: '15px', color: '#6e6e73' }}>
          Bentornata, {session.user.name}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard
          title="Partnership Attive"
          value={myPartnerships.length}
          colorClass="text-[#0071e3]"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <StatCard
          title="Task Attivi"
          value={myPendingTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length}
          colorClass="text-[#0071e3]"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          title="Revisioni da Fare"
          value={myPendingTasks.filter((t) => t.status === TaskStatus.REVISION_NEEDED).length}
          colorClass="text-[#ff3b30]"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* My tasks */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0',
          padding: '20px',
          marginBottom: '16px',
        }}
      >
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1d1d1f', marginBottom: '16px' }}>
          I Miei Task
        </h2>
        {myPendingTasks.length === 0 ? (
          <p style={{ fontSize: '13.5px', color: '#8e8e93', textAlign: 'center', padding: '24px 0' }}>
            Nessun task attivo al momento
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myPendingTasks.map((task) => (
              <Link
                key={task.id}
                href={`/partnerships/${task.content.partnership.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #f0f0f0',
                  textDecoration: 'none',
                  transition: 'all 200ms ease',
                  background: '#ffffff',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#d2d2d7'
                  e.currentTarget.style.background = '#fafafa'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#f0f0f0'
                  e.currentTarget.style.background = '#ffffff'
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                    <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#1d1d1f' }}>
                      {TASK_LABELS[task.type as TaskType]}
                    </p>
                    <Badge variant={getTaskStatusVariant(task.status)}>
                      {getTaskStatusLabel(task.status)}
                    </Badge>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6e6e73' }}>
                    {task.content.partnership.name} · {task.content.partnership.brand.name} · {CONTENT_TYPE_LABELS[task.content.type]}
                  </p>
                  {task.revisionNotes && task.status === TaskStatus.REVISION_NEEDED && (
                    <p style={{ fontSize: '12px', color: '#ff3b30', marginTop: '4px' }}>
                      Note: {task.revisionNotes}
                    </p>
                  )}
                </div>
                {task.dueDate && (
                  <div style={{ textAlign: 'right', marginLeft: '12px', flexShrink: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#1d1d1f' }}>
                      {format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: it })}
                    </p>
                    <p style={{ fontSize: '11px', color: '#6e6e73' }}>
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
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1d1d1f' }}>Partnership Attive</h2>
          <Link href="/partnerships" style={{ fontSize: '13.5px', color: '#0071e3', textDecoration: 'none', fontWeight: 500 }}>
            Vedi tutte →
          </Link>
        </div>
        {myPartnerships.length === 0 ? (
          <p style={{ fontSize: '13.5px', color: '#8e8e93', textAlign: 'center', padding: '24px 0' }}>
            Nessuna partnership attiva
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myPartnerships.map((p) => {
              const totalTasks = p.contents.reduce((acc, c) => acc + c.tasks.length, 0)
              const completedTasks = p.contents.reduce((acc, c) => acc + c.tasks.filter((t) => t.status === 'COMPLETED').length, 0)
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

              return (
                <Link
                  key={p.id}
                  href={`/partnerships/${p.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #f0f0f0',
                    textDecoration: 'none',
                    transition: 'all 200ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d2d2d7' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#f0f0f0' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#1d1d1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                      {p.name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6e6e73', marginBottom: '8px' }}>{p.brand.name}</p>
                    <div style={{ width: '100%', background: '#f0f0f0', borderRadius: '100px', height: '4px' }}>
                      <div
                        style={{
                          background: '#0071e3',
                          height: '4px',
                          borderRadius: '100px',
                          width: `${progress}%`,
                          transition: 'width 400ms ease',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ marginLeft: '16px', textAlign: 'right', flexShrink: 0 }}>
                    <Badge variant={getPartnershipStatusVariant(p.status)}>
                      {getPartnershipStatusLabel(p.status)}
                    </Badge>
                    <p style={{ fontSize: '11px', color: '#6e6e73', marginTop: '4px' }}>{completedTasks}/{totalTasks} task</p>
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
