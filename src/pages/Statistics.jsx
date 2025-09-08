import { useState, useEffect } from 'react'
import { FirestoreService } from '../services/firestoreService'

// Icônes SVG améliorées
const FileText = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const Clock = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CheckCircle = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const XCircle = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const TrendingUp = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const Euro = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3c1.657 0 3-1.343 3-3s-1.343-3-3-3z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v6m0 6v6" />
  </svg>
)

const BarChart3 = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const Refresh = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const Calendar = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

export default function Statistics() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState([])

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      
      // Charger les statistiques
      const statsResult = await FirestoreService.getStatistics()
      setStats(statsResult)
      
      // Charger toutes les soumissions pour les graphiques
      const submissionsResult = await FirestoreService.getAllSubmissions(1000)
      setSubmissions(submissionsResult || [])
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculer les statistiques par jour (7 derniers jours)
  const getLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        count: 0
      })
    }
    return days
  }

  const dailyStats = getLast7Days()
  submissions.forEach(submission => {
    if (submission.createdAt) {
      const date = new Date(submission.createdAt.seconds * 1000).toISOString().split('T')[0]
      const dayIndex = dailyStats.findIndex(day => day.date === date)
      if (dayIndex !== -1) {
        dailyStats[dayIndex].count++
      }
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header - Desktop seulement */}
      <div className="hidden lg:block fixed top-0 left-64 right-0 z-30 bg-white shadow-lg border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
              <p className="text-gray-600 text-sm">Analyse des performances et tendances</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-semibold">
                {stats?.total || 0} soumissions
              </div>
              <button
                onClick={loadStatistics}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <Refresh />
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Espace pour le header fixe sur desktop */}
      <div className="hidden lg:block h-20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistiques principales - Cards modernes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Total soumissions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">Total soumissions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* En attente */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                    <Clock className="text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">En attente</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.pending || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vérifiées */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">Vérifiées</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.verified || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Montant total */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Euro className="text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">Montant total</p>
                  <p className="text-2xl font-bold text-gray-900">{(stats?.totalAmount || 0).toFixed(2)} €</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Graphique par jour */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <Calendar />
                Activité des 7 derniers jours
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dailyStats.map((day, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-16 text-sm font-medium text-gray-600">{day.label}</div>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, (day.count / Math.max(...dailyStats.map(d => d.count), 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-8 text-sm font-medium text-gray-900">{day.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Répartition par type */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <BarChart3 />
                Répartition par type
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats && stats.byType ? Object.entries(stats.byType).map(([type, count]) => {
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
                  return (
                    <div key={type} className="flex items-center">
                      <div className="w-20 text-sm font-medium text-gray-600 truncate">{type}</div>
                      <div className="flex-1 mx-3">
                        <div className="bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-12 text-sm font-medium text-gray-900">{count}</div>
                      <div className="w-12 text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                    </div>
                  )
                }) : (
                  <div className="text-center py-8 text-gray-500">
                    Aucune donnée disponible
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Métriques de performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Taux de traitement */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <h3 className="text-white font-semibold text-lg">Taux de traitement</h3>
            </div>
            <div className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {stats && stats.total > 0 ? ((stats.verified / stats.total) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-sm text-gray-600">
                  {stats?.verified || 0} sur {stats?.total || 0} soumissions
                </p>
                <div className="mt-4 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats && stats.total > 0 ? (stats.verified / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Taux de rejet */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <h3 className="text-white font-semibold text-lg">Taux de rejet</h3>
            </div>
            <div className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600 mb-2">
                  {stats && stats.total > 0 ? ((stats.rejected / stats.total) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-sm text-gray-600">
                  {stats?.rejected || 0} sur {stats?.total || 0} soumissions
                </p>
                <div className="mt-4 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats && stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Montant moyen */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
              <h3 className="text-white font-semibold text-lg">Montant moyen</h3>
            </div>
            <div className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {stats && stats.total > 0 ? (stats.totalAmount / stats.total).toFixed(2) : 0} €
                </div>
                <p className="text-sm text-gray-600">
                  Par soumission
                </p>
                <div className="mt-4 flex items-center justify-center">
                  <TrendingUp className="text-purple-500" />
                  <span className="ml-2 text-sm text-gray-600">Tendance positive</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Graphique par heure (24h) */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
            <h3 className="text-white font-semibold text-lg">Soumissions par heure (24h)</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-12 gap-2 h-32 items-end">
              {Array.from({ length: 24 }, (_, hour) => {
                const hourSubmissions = submissions.filter(submission => {
                  if (!submission.createdAt) return false
                  const submissionHour = new Date(submission.createdAt.seconds * 1000).getHours()
                  return submissionHour === hour
                }).length
                
                const maxSubmissions = Math.max(...Array.from({ length: 24 }, (_, h) => 
                  submissions.filter(s => {
                    if (!s.createdAt) return false
                    return new Date(s.createdAt.seconds * 1000).getHours() === h
                  }).length
                ), 1)
                
                const height = (hourSubmissions / maxSubmissions) * 100
                
                return (
                  <div key={hour} className="flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t transition-all duration-500"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    ></div>
                    <div className="text-xs text-gray-500 mt-1">{hour}h</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}