import { useState, useEffect } from 'react'
import { FirestoreService } from '../services/firestoreService'

// Enhanced SVG Icons
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
  const [submissionStats, setSubmissionStats] = useState(null)
  const [refundStats, setRefundStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState([])

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      setLoading(true)

      // 1. Charger les statistiques des soumissions
      const subResult = await FirestoreService.getStatistics()
      setSubmissionStats(subResult)

      // 2. Charger les statistiques des remboursements
      const refResult = await FirestoreService.getRefundStatistics()
      if (refResult.success) {
        setRefundStats(refResult.data)
      }

      // 3. Charger toutes les soumissions pour les graphiques (on peut limiter à 2000 pour la performance)
      const allSubmissions = await FirestoreService.getAllSubmissions(2000)
      setSubmissions(allSubmissions || [])

    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error)
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
  submissions.forEach(s => {
    if (s.createdAt) {
      const date = new Date(s.createdAt.seconds * 1000).toISOString().split('T')[0]
      const dayIndex = dailyStats.findIndex(day => day.date === date)
      if (dayIndex !== -1) {
        dailyStats[dayIndex].count++
      }
    }
  })

  // Statistiques globales combinées
  const totalOperations = (submissionStats?.total || 0) + (refundStats?.total || 0)
  const totalMoneyFlow = (submissionStats?.totalAmount || 0) + (refundStats?.totalAmount || 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-600 font-bold tracking-tight">Analyse des données en cours...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-6 mb-8 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
            <p className="text-slate-600 text-sm">Volume Global (Soumissions + Remboursements)</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadStatistics} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2">
              <Refresh /> Actualiser
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* TOP LEVEL OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><FileText /></div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Soumissions Total</p>
            <h3 className="text-3xl font-black text-slate-900">{submissionStats?.total || 0}</h3>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4"><Refresh /></div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Remboursements Total</p>
            <h3 className="text-3xl font-black text-slate-900">{refundStats?.total || 0}</h3>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4"><CheckCircle /></div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Demandes Validées</p>
            <h3 className="text-3xl font-black text-slate-900">{(submissionStats?.verified || 0) + (refundStats?.approved || 0) + (refundStats?.completed || 0)}</h3>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4"><Euro /></div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Volume Global</p>
            <h3 className="text-3xl font-black text-slate-900">{totalMoneyFlow.toFixed(2)} €</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Charts Section */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                <Calendar /> Activité récente (7j)
              </h3>
            </div>
            <div className="p-8">
              <div className="flex items-end justify-between gap-2 h-48">
                {dailyStats.map((d, i) => {
                  const max = Math.max(...dailyStats.map(x => x.count), 1)
                  const height = (d.count / max) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group">
                      <div className="w-full bg-slate-100 rounded-xl relative overflow-hidden h-full flex flex-col justify-end">
                        <div
                          className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-xl transition-all duration-700"
                          style={{ height: `${Math.max(5, height)}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 mt-3 group-hover:text-blue-600 transition-colors uppercase">{d.label}</p>
                      <p className="text-xs font-black text-slate-900">{d.count}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                <BarChart3 /> Répartition Soumissions
              </h3>
            </div>
            <div className="p-8 space-y-6">
              {submissionStats && submissionStats.byType ? Object.entries(submissionStats.byType).map(([type, count]) => {
                const pct = (count / submissionStats.total) * 100
                return (
                  <div key={type} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{type}</span>
                      <span className="text-sm font-black text-slate-900">{count} <small className="text-slate-400 font-bold ml-1">{pct.toFixed(0)}%</small></span>
                    </div>
                    <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(59,130,246,0.3)]" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                )
              }) : <p className="text-center text-slate-400 italic">Aucune donnée disponible</p>}
            </div>
          </div>
        </div>

        {/* DETAILED STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Performance Remboursements */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-600"></div>
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600"><TrendingUp /></div>
              Focus Remboursements
            </h3>
            <div className="space-y-6">
              <div className="flex border-b border-slate-100 pb-4 justify-between items-center">
                <span className="text-slate-500 font-bold text-sm">En attente</span>
                <span className="text-amber-600 font-black text-xl">{refundStats?.pending || 0}</span>
              </div>
              <div className="flex border-b border-slate-100 pb-4 justify-between items-center">
                <span className="text-slate-500 font-bold text-sm">En traitement</span>
                <span className="text-blue-600 font-black text-xl">{refundStats?.processing || 0}</span>
              </div>
              <div className="flex border-b border-slate-100 pb-4 justify-between items-center">
                <span className="text-slate-500 font-bold text-sm">Validés/Payés</span>
                <span className="text-emerald-600 font-black text-xl">{(refundStats?.approved || 0) + (refundStats?.completed || 0)}</span>
              </div>
              <div className="pt-4 text-center">
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Volume des remboursements</p>
                <h4 className="text-3xl font-black text-slate-900">{(refundStats?.totalAmount || 0).toFixed(2)} €</h4>
              </div>
            </div>
          </div>

          {/* Performance Soumissions */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600"><CheckCircle /></div>
              Taux de Réussite
            </h3>
            <div className="flex flex-col items-center py-4">
              <div className="relative w-36 h-36 flex items-center justify-center mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                  <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="12" fill="transparent"
                    className="text-blue-500 transition-all duration-1000"
                    strokeDasharray={402}
                    strokeDashoffset={402 - (402 * (submissionStats?.total > 0 ? (submissionStats.verified / submissionStats.total) : 0))}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-3xl font-black text-slate-900">
                  {submissionStats?.total > 0 ? ((submissionStats.verified / submissionStats.total) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <p className="text-center text-slate-500 font-bold text-sm leading-relaxed">
                Des soumissions sont validées avec succès sur la plateforme.
              </p>
            </div>
          </div>

          {/* Average Metrics */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-200">
            <h3 className="text-xl font-black mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Euro /></div>
              Valeur Moyenne
            </h3>
            <div className="space-y-10 py-6 text-center">
              <div>
                <h4 className="text-4xl font-black">{submissionStats?.total > 0 ? (submissionStats.totalAmount / submissionStats.total).toFixed(2) : 0} €</h4>
                <p className="text-blue-100 font-bold text-xs uppercase mt-2 tracking-widest">Par soumission</p>
              </div>
              <div className="h-px bg-white/10 w-1/2 mx-auto"></div>
              <div>
                <h4 className="text-4xl font-black">{refundStats?.total > 0 ? (refundStats.totalAmount / refundStats.total).toFixed(2) : 0} €</h4>
                <p className="text-blue-100 font-bold text-xs uppercase mt-2 tracking-widest">Par remboursement</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}