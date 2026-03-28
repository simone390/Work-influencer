import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { TASK_LABELS, CONTENT_TYPE_LABELS, TaskType, TaskStatus } from '@/lib/workflow'

interface Props {
  params: { token: string }
}

function getTaskStatusColor(status: string) {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800'
    case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
    case 'COMPLETED': return 'bg-green-100 text-green-800'
    case 'REVISION_NEEDED': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getTaskStatusLabel(status: string) {
  switch (status) {
    case 'PENDING': return 'In Attesa'
    case 'IN_PROGRESS': return 'In Corso'
    case 'COMPLETED': return 'Completato'
    case 'REVISION_NEEDED': return 'Revisione Richiesta'
    default: return status
  }
}

function getPartnershipStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-green-100 text-green-700'
    case 'COMPLETED': return 'bg-gray-100 text-gray-700'
    case 'PAUSED': return 'bg-yellow-100 text-yellow-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function getPartnershipStatusLabel(status: string) {
  switch (status) {
    case 'ACTIVE': return 'Attiva'
    case 'COMPLETED': return 'Completata'
    case 'PAUSED': return 'In Pausa'
    default: return status
  }
}

export default async function BrandPublicPage({ params }: Props) {
  const brand = await prisma.brand.findUnique({
    where: { publicToken: params.token },
    include: {
      partnerships: {
        include: {
          influencer: { select: { id: true, name: true } },
          contents: {
            include: {
              tasks: { orderBy: { order: 'asc' } },
              metrics: { orderBy: { reportedAt: 'desc' }, take: 1 },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!brand) {
    notFound()
  }

  const activePartnerships = brand.partnerships.filter((p) => p.status !== 'COMPLETED')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-md">
              {brand.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logo} alt={brand.name} className="w-10 h-10 object-contain" />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {brand.name.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{brand.name}</h1>
              <p className="text-gray-500 text-sm mt-0.5">Portale Collaborazioni</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-primary-600">
              {brand.partnerships.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Partnership Totali</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-600">
              {brand.partnerships.filter((p) => p.status === 'ACTIVE').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Attive</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-green-600">
              {brand.partnerships.filter((p) => p.status === 'COMPLETED').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Completate</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-700">
              {brand.partnerships.reduce((acc, p) => acc + p.contents.length, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Contenuti Totali</p>
          </div>
        </div>

        {/* Partnerships */}
        {brand.partnerships.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <p className="text-gray-500">Nessuna partnership attiva al momento</p>
          </div>
        ) : (
          <div className="space-y-6">
            {brand.partnerships.map((partnership) => {
              const totalTasks = partnership.contents.reduce(
                (acc, c) => acc + c.tasks.length, 0
              )
              const completedTasks = partnership.contents.reduce(
                (acc, c) => acc + c.tasks.filter((t) => t.status === 'COMPLETED').length, 0
              )
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

              return (
                <div
                  key={partnership.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* Partnership header */}
                  <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-indigo-50">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="text-lg font-bold text-gray-900">
                            {partnership.name}
                          </h2>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPartnershipStatusColor(partnership.status)}`}>
                            {getPartnershipStatusLabel(partnership.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Influencer: <span className="font-medium">{partnership.influencer.name}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Creata il {format(new Date(partnership.createdAt), 'dd MMMM yyyy', { locale: it })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Avanzamento</p>
                        <p className="text-2xl font-bold text-primary-600">{progress}%</p>
                        <p className="text-xs text-gray-500">{completedTasks}/{totalTasks} task</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="w-full bg-white/60 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contents */}
                  <div className="p-6 space-y-6">
                    {partnership.contents.map((content, contentIndex) => {
                      const completedContentTasks = content.tasks.filter((t) => t.status === 'COMPLETED').length
                      const currentTask = content.tasks.find(
                        (t) => t.status === 'IN_PROGRESS' || t.status === 'REVISION_NEEDED'
                      )

                      return (
                        <div key={content.id} className="border border-gray-100 rounded-xl overflow-hidden">
                          {/* Content header */}
                          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary-100 text-primary-700">
                                {CONTENT_TYPE_LABELS[content.type] || content.type}
                              </span>
                              <span className="text-sm font-medium text-gray-700">
                                Contenuto #{contentIndex + 1}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {currentTask && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTaskStatusColor(currentTask.status)}`}>
                                  {TASK_LABELS[currentTask.type as TaskType]}: {getTaskStatusLabel(currentTask.status)}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {completedContentTasks}/{content.tasks.length}
                              </span>
                            </div>
                          </div>

                          <div className="p-4 space-y-3">
                            {content.description && (
                              <p className="text-sm text-gray-600">{content.description}</p>
                            )}

                            {content.postScheduledAt && (
                              <p className="text-xs text-gray-500">
                                📅 Pubblicazione prevista:{' '}
                                <span className="font-medium">
                                  {format(new Date(content.postScheduledAt), "dd/MM/yyyy 'alle' HH:mm", { locale: it })}
                                </span>
                              </p>
                            )}

                            {content.postLink && (
                              <p className="text-xs text-gray-500">
                                🔗 Link:{' '}
                                <a
                                  href={content.postLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary-600 hover:underline"
                                >
                                  {content.postLink}
                                </a>
                              </p>
                            )}

                            {/* Metrics */}
                            {content.metrics.length > 0 && (
                              <div className="mt-2 flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                                <div>
                                  <p className="text-xs text-gray-500">Visualizzazioni</p>
                                  <p className="text-base font-bold text-gray-900">
                                    {content.metrics[0].views.toLocaleString('it-IT')}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Click</p>
                                  <p className="text-base font-bold text-gray-900">
                                    {content.metrics[0].linkClicks.toLocaleString('it-IT')}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Workflow steps */}
                            <div className="mt-3">
                              <p className="text-xs font-medium text-gray-500 mb-2">
                                Progresso Workflow
                              </p>
                              <div className="flex items-center gap-1 flex-wrap">
                                {content.tasks.map((task, taskIndex) => (
                                  <div
                                    key={task.id}
                                    className="flex items-center gap-1"
                                  >
                                    <div
                                      className={`group relative inline-flex items-center px-2 py-1 rounded-md text-xs font-medium cursor-default ${
                                        task.status === TaskStatus.COMPLETED
                                          ? 'bg-green-100 text-green-700'
                                          : task.status === TaskStatus.IN_PROGRESS
                                          ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                                          : task.status === TaskStatus.REVISION_NEEDED
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-gray-100 text-gray-400'
                                      }`}
                                    >
                                      {task.status === TaskStatus.COMPLETED && '✓ '}
                                      {TASK_LABELS[task.type as TaskType]}
                                    </div>
                                    {taskIndex < content.tasks.length - 1 && (
                                      <span className="text-gray-300 text-xs">→</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-8 mt-8 border-t border-gray-200">
        <p className="text-center text-xs text-gray-400">
          Portale dedicato a {brand.name} · Accesso riservato
        </p>
      </footer>
    </div>
  )
}
