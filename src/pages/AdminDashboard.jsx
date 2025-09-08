import { useState, useEffect } from 'react'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { db } from '../lib/firebase'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { FirestoreService } from '../services/firestoreService'

export default function AdminDashboard() {
  const { admin, logout } = useAdminAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0
  })
  const [refundStats, setRefundStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    totalAmount: 0,
    totalRefunded: 0
  })
  const [recentRefunds, setRecentRefunds] = useState([])

  useEffect(() => {
    fetchSubmissions()
    fetchRefundData()
  }, [])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      
      // Récupérer les soumissions récentes depuis la collection coupon_submissions
      const submissionsQuery = query(
        collection(db, 'coupon_submissions'),
        orderBy('createdAt', 'desc'),
        limit(3)
      )
      
      const querySnapshot = await getDocs(submissionsQuery)
      const submissionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      setSubmissions(submissionsData)
      
      // Calculer les statistiques
      const total = submissionsData.length
      const pending = submissionsData.filter(s => s.status === 'pending').length
      const verified = submissionsData.filter(s => s.status === 'verified').length
      const rejected = submissionsData.filter(s => s.status === 'rejected').length
      
      setStats({ total, pending, verified, rejected })
      
    } catch (error) {
      console.error('Erreur récupération soumissions:', error)
      // En cas d'erreur, afficher des données vides
      setSubmissions([])
      setStats({ total: 0, pending: 0, verified: 0, rejected: 0 })
    } finally {
      setLoading(false)
    }
  }

  const fetchRefundData = async () => {
    try {
      // Récupérer les statistiques de remboursement
      const statsResult = await FirestoreService.getRefundStatistics()
      if (statsResult.success) {
        setRefundStats(statsResult.data)
      }

      // Récupérer les remboursements récents
      const recentResult = await FirestoreService.getAllRefundRequests(5)
      if (recentResult.success) {
        setRecentRefunds(recentResult.data)
      }
    } catch (error) {
      console.error('Erreur récupération remboursements:', error)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('fr-FR')
  }

  const getRefundStatusInfo = (status) => {
    const statusMap = {
      pending: { text: 'En attente', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      processing: { text: 'En cours', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      approved: { text: 'Approuvée', color: 'text-green-600', bgColor: 'bg-green-100' },
      rejected: { text: 'Rejetée', color: 'text-red-600', bgColor: 'bg-red-100' },
      completed: { text: 'Terminée', color: 'text-green-600', bgColor: 'bg-green-100' }
    }
    return statusMap[status] || statusMap.pending
  }

  const getRefundMethodText = (method) => {
    const methodMap = {
      bank_transfer: 'Virement bancaire',
      paypal: 'PayPal',
      card_refund: 'Remboursement carte'
    }
    return methodMap[method] || method
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'verified': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'En attente'
      case 'verified': return 'Vérifié'
      case 'rejected': return 'Rejeté'
      default: return status || 'Nouveau'
    }
  }

  const getClientName = (submission) => {
    // Extraire le nom du client depuis l'email ou utiliser l'email comme nom
    if (submission.email) {
      const emailParts = submission.email.split('@')
      return emailParts[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
    return 'Client anonyme'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header fixe - Desktop seulement */}
      <header className="hidden lg:block fixed top-0 left-64 right-0 z-30 bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Tableau de bord Admin</h1>
              <p className="text-gray-600 text-sm">Bienvenue, {admin?.name || admin?.username}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  fetchSubmissions()
                  fetchRefundData()
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal avec padding pour le header fixe sur desktop */}
      <div className="flex-1 pt-0 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Carte Total */}
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Carte En attente */}
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">En attente</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Carte Vérifiés */}
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Vérifiés</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.verified}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Carte Rejetés */}
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Rejetés</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.rejected}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques des remboursements */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Remboursements</h2>
            <a
              href="/admin/refunds"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Voir tout →
            </a>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            {/* Total remboursements */}
            <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total demandes</dt>
                      <dd className="text-2xl font-bold text-gray-900">{refundStats.total}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* En attente */}
            <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">En attente</dt>
                      <dd className="text-2xl font-bold text-gray-900">{refundStats.pending}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Approuvées */}
            <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Approuvées</dt>
                      <dd className="text-2xl font-bold text-gray-900">{refundStats.approved}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Montant total */}
            <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Montant total</dt>
                      <dd className="text-2xl font-bold text-gray-900">{refundStats.totalAmount.toFixed(2)} €</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Tableau des soumissions */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-6 sm:px-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">3 dernières soumissions</h3>
            <p className="mt-2 text-sm text-gray-600">
              Les 3 soumissions les plus récentes de coupons et cartes cadeaux
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des soumissions...</p>
            </div>
          ) : (
            <>
              {/* Version desktop - Tableau */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coupons
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getClientName(submission)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {submission.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              Ref: {submission.referenceNumber || submission.id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                            {getStatusText(submission.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {submission.serviceType || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm text-gray-900">
                            {submission.coupons?.length || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(submission.createdAt)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Version mobile - Cartes */}
              <div className="lg:hidden">
                <div className="space-y-4 p-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {getClientName(submission)}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {submission.email}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Ref: {submission.referenceNumber || submission.id}
                          </p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                          {getStatusText(submission.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Service:</span>
                          <p className="font-medium text-gray-900">
                            {submission.serviceType || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Coupons:</span>
                          <p className="font-medium text-gray-900">
                            {submission.coupons?.length || 0}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="text-gray-500 text-xs">Date:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(submission.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {/* Footer normal */}
      <footer className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Admin Panel</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>© {new Date().getFullYear()} MyVerif</span>
              <span>•</span>
              <span>Version 1.0</span>
            </div>
          </div>
        </div>

        {/* Remboursements récents */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-6 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">5 derniers remboursements</h3>
            <p className="mt-2 text-sm text-gray-600">
              Les 5 demandes de remboursement les plus récentes
            </p>
          </div>
          
          {recentRefunds.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">Aucune demande de remboursement</p>
              <p className="text-gray-400 text-sm mt-1">Les nouvelles demandes apparaîtront ici</p>
            </div>
          ) : (
            <>
              {/* Version desktop - Tableau */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Référence
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentRefunds.map((refund) => {
                      const statusInfo = getRefundStatusInfo(refund.status)
                      return (
                        <tr key={refund.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{refund.fullName}</div>
                            <div className="text-sm text-gray-500">{refund.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 font-mono">
                              {refund.referenceNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {refund.totalAmount.toFixed(2)} €
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                              {statusInfo.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(refund.submittedAt)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Version mobile - Cartes */}
              <div className="md:hidden">
                <div className="space-y-3 p-4">
                  {recentRefunds.map((refund) => {
                    const statusInfo = getRefundStatusInfo(refund.status)
                    return (
                      <div key={refund.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 mb-1 truncate" title={refund.fullName}>
                              {refund.fullName}
                            </div>
                            <div className="text-xs text-gray-500 truncate" title={refund.email}>
                              {refund.email}
                            </div>
                            <div className="text-xs font-mono text-gray-600 mt-1 truncate" title={refund.referenceNumber}>
                              {refund.referenceNumber}
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ml-2 flex-shrink-0 ${statusInfo.bgColor} ${statusInfo.color}`}>
                            {statusInfo.text}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-3 rounded-lg border">
                            <div className="text-xs text-gray-500 mb-1">Montant</div>
                            <div className="text-lg font-bold text-gray-900">
                              {refund.totalAmount.toFixed(2)} €
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-lg border">
                            <div className="text-xs text-gray-500 mb-1">Date</div>
                            <div className="text-sm text-gray-900">
                              {formatDate(refund.submittedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </footer>
    </div>
    </div>
  )
}
