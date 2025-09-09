import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FirestoreService } from '../services/firestoreService'
import { toast } from 'react-toastify'

export default function ManageRefunds() {
  const [refundRequests, setRefundRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(null)
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    fetchRefundRequests()
  }, [])

  const fetchRefundRequests = async () => {
    try {
      setLoading(true)
      const result = await FirestoreService.getAllRefundRequests(1000) // Récupérer plus d'éléments pour la pagination côté client
      
      if (result.success) {
        setRefundRequests(result.data)
        setTotalItems(result.data.length)
      } else {
        toast.error('Erreur lors du chargement des demandes')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des demandes')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (requestId, newStatus, notes = '') => {
    try {
      setUpdatingStatus(requestId)
      
      const result = await FirestoreService.updateRefundRequestStatus(requestId, newStatus, notes)
      
      if (result.success) {
        toast.success('Statut mis à jour avec succès')
        fetchRefundRequests() // Recharger les données
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        text: 'En attente',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: '⏳'
      },
      processing: {
        text: 'En cours',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: '🔄'
      },
      approved: {
        text: 'Approuvée',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: '✅'
      },
      rejected: {
        text: 'Rejetée',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: '❌'
      },
      completed: {
        text: 'Terminée',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: '💰'
      }
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

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Non disponible'
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Fonctions de pagination
  const getFilteredAndSearchedData = () => {
    let filtered = refundRequests

    // Appliquer le filtre de statut
    if (filter !== 'all') {
      filtered = filtered.filter(request => request.status === filter)
    }

    // Appliquer la recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(request => 
        request.referenceNumber?.toLowerCase().includes(term) ||
        request.fullName?.toLowerCase().includes(term) ||
        request.email?.toLowerCase().includes(term) ||
        request.amount?.toString().includes(term)
      )
    }

    return filtered
  }

  const getPaginatedData = () => {
    const filtered = getFilteredAndSearchedData()
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filtered.slice(startIndex, endIndex)
  }

  const getTotalPages = () => {
    const filtered = getFilteredAndSearchedData()
    return Math.ceil(filtered.length / itemsPerPage)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset à la première page
  }

  // Reset pagination quand les filtres changent
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchTerm])

  // Utiliser la nouvelle logique de filtrage avec pagination
  const filteredRequests = getFilteredAndSearchedData()
  const paginatedRequests = getPaginatedData()
  const totalPages = getTotalPages()

  const getStatusCounts = () => {
    const counts = {
      all: refundRequests.length,
      pending: 0,
      processing: 0,
      approved: 0,
      rejected: 0,
      completed: 0
    }
    
    refundRequests.forEach(request => {
      counts[request.status] = (counts[request.status] || 0) + 1
    })
    
    return counts
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header amélioré */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des remboursements</h1>
                  <p className="text-gray-600 mt-1">Gérez les demandes de remboursement des clients</p>
                </div>
              </div>
              <button
                onClick={fetchRefundRequests}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualiser
              </button>
            </div>
          </div>

          {/* Statistiques améliorées */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{statusCounts.all}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
                  <div className="text-xs sm:text-sm text-gray-600">En attente</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{statusCounts.processing}</div>
                  <div className="text-xs sm:text-sm text-gray-600">En cours</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{statusCounts.approved}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Approuvées</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Rejetées</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-600">{statusCounts.completed}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Terminées</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres et recherche améliorés */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Rechercher par référence, nom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'processing', 'approved', 'rejected', 'completed'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      filter === status
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    }`}
                  >
                    {status === 'all' ? 'Tous' : getStatusInfo(status).text}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Liste des demandes améliorée */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Version desktop - Tableau optimisé */}
            <div className="hidden xl:block">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                      Référence
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-48">
                      Client
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                      Montant
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                      Méthode
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                      Statut
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">
                      Date
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRequests.map((request) => {
                    const statusInfo = getStatusInfo(request.status)
                    return (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-3 py-3">
                          <div className="text-xs font-medium text-gray-900 font-mono truncate" title={request.referenceNumber}>
                            {request.referenceNumber}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-xs font-medium text-gray-900 truncate" title={request.fullName}>
                            {request.fullName}
                          </div>
                          <div className="text-xs text-gray-500 truncate" title={request.email}>
                            {request.email}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm font-bold text-gray-900">
                            {request.totalAmount.toFixed(2)} €
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-xs text-gray-900 truncate" title={getRefundMethodText(request.refundMethod)}>
                            {getRefundMethodText(request.refundMethod)}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.color}`}>
                            <span className="mr-1 text-xs">{statusInfo.icon}</span>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-500">
                          {formatDate(request.submittedAt)}
                        </td>
                        <td className="px-3 py-3 text-xs font-medium">
                          <div className="flex flex-col gap-1 items-start">
                            <Link
                              to={`/admin/refund-details/${request.id}`}
                              className="text-blue-600 hover:text-blue-900 font-medium text-xs whitespace-nowrap"
                            >
                              Voir détails
                            </Link>
                            
                            {request.status === 'pending' && (
                              <button
                                onClick={() => handleStatusUpdate(request.id, 'processing')}
                                disabled={updatingStatus === request.id}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50 font-medium text-xs whitespace-nowrap"
                              >
                                {updatingStatus === request.id ? '...' : 'Traiter'}
                              </button>
                            )}
                            
                            {request.status === 'processing' && (
                              <div className="flex flex-col gap-1 items-start">
                                <button
                                  onClick={() => handleStatusUpdate(request.id, 'approved')}
                                  disabled={updatingStatus === request.id}
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50 font-medium text-xs whitespace-nowrap"
                                >
                                  {updatingStatus === request.id ? '...' : 'Approuver'}
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(request.id, 'rejected')}
                                  disabled={updatingStatus === request.id}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50 font-medium text-xs whitespace-nowrap"
                                >
                                  {updatingStatus === request.id ? '...' : 'Rejeter'}
                                </button>
                              </div>
                            )}
                            
                            {request.status === 'approved' && (
                              <button
                                onClick={() => handleStatusUpdate(request.id, 'completed')}
                                disabled={updatingStatus === request.id}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50 font-medium text-xs whitespace-nowrap"
                              >
                                {updatingStatus === request.id ? '...' : 'Finaliser'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Version tablet - Tableau compact */}
            <div className="hidden lg:block xl:hidden">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRequests.map((request) => {
                    const statusInfo = getStatusInfo(request.status)
                    return (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-3 py-3">
                          <div className="text-xs font-medium text-gray-900 font-mono truncate" title={request.referenceNumber}>
                            {request.referenceNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(request.submittedAt)}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-xs font-medium text-gray-900 truncate" title={request.fullName}>
                            {request.fullName}
                          </div>
                          <div className="text-xs text-gray-500 truncate" title={request.email}>
                            {request.email}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getRefundMethodText(request.refundMethod)}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm font-bold text-gray-900">
                            {request.totalAmount.toFixed(2)} €
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.color}`}>
                            <span className="mr-1 text-xs">{statusInfo.icon}</span>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs font-medium">
                          <div className="flex flex-col gap-1 items-start">
                            <Link
                              to={`/admin/refund-details/${request.id}`}
                              className="text-blue-600 hover:text-blue-900 font-medium text-xs whitespace-nowrap"
                            >
                              Voir détails
                            </Link>
                            
                            {request.status === 'pending' && (
                              <button
                                onClick={() => handleStatusUpdate(request.id, 'processing')}
                                disabled={updatingStatus === request.id}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50 font-medium text-xs whitespace-nowrap"
                              >
                                {updatingStatus === request.id ? '...' : 'Traiter'}
                              </button>
                            )}
                            
                            {request.status === 'processing' && (
                              <div className="flex flex-col gap-1 items-start">
                                <button
                                  onClick={() => handleStatusUpdate(request.id, 'approved')}
                                  disabled={updatingStatus === request.id}
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50 font-medium text-xs whitespace-nowrap"
                                >
                                  {updatingStatus === request.id ? '...' : 'Approuver'}
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(request.id, 'rejected')}
                                  disabled={updatingStatus === request.id}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50 font-medium text-xs whitespace-nowrap"
                                >
                                  {updatingStatus === request.id ? '...' : 'Rejeter'}
                                </button>
                              </div>
                            )}
                            
                            {request.status === 'approved' && (
                              <button
                                onClick={() => handleStatusUpdate(request.id, 'completed')}
                                disabled={updatingStatus === request.id}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50 font-medium text-xs whitespace-nowrap"
                              >
                                {updatingStatus === request.id ? '...' : 'Finaliser'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Version mobile - Cartes améliorées */}
            <div className="lg:hidden">
              {filteredRequests.map((request) => {
                const statusInfo = getStatusInfo(request.status)
                return (
                  <div key={request.id} className="p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-mono font-medium text-gray-900 mb-1 truncate" title={request.referenceNumber}>
                          {request.referenceNumber}
                        </div>
                        <div className="text-sm font-medium text-gray-900 truncate" title={request.fullName}>
                          {request.fullName}
                        </div>
                        <div className="text-xs text-gray-500 truncate" title={request.email}>
                          {request.email}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ml-2 flex-shrink-0 ${statusInfo.bgColor} ${statusInfo.color}`}>
                        <span className="mr-1 text-xs">{statusInfo.icon}</span>
                        {statusInfo.text}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Montant</div>
                        <div className="text-lg font-bold text-gray-900">
                          {request.totalAmount.toFixed(2)} €
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Méthode</div>
                        <div className="text-sm text-gray-900 truncate" title={getRefundMethodText(request.refundMethod)}>
                          {getRefundMethodText(request.refundMethod)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-4 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDate(request.submittedAt)}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/admin/refund-details/${request.id}`}
                        className="inline-flex items-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Voir détails
                      </Link>
                      
                      {request.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(request.id, 'processing')}
                          disabled={updatingStatus === request.id}
                          className="inline-flex items-center bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200"
                        >
                          {updatingStatus === request.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          ) : (
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          )}
                          {updatingStatus === request.id ? 'Traitement...' : 'Traiter'}
                        </button>
                      )}
                      
                      {request.status === 'processing' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(request.id, 'approved')}
                            disabled={updatingStatus === request.id}
                            className="inline-flex items-center bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200"
                          >
                            {updatingStatus === request.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            ) : (
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {updatingStatus === request.id ? 'Approbation...' : 'Approuver'}
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(request.id, 'rejected')}
                            disabled={updatingStatus === request.id}
                            className="inline-flex items-center bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200"
                          >
                            {updatingStatus === request.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            ) : (
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            {updatingStatus === request.id ? 'Rejet...' : 'Rejeter'}
                          </button>
                        </>
                      )}
                      
                      {request.status === 'approved' && (
                        <button
                          onClick={() => handleStatusUpdate(request.id, 'completed')}
                          disabled={updatingStatus === request.id}
                          className="inline-flex items-center bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200"
                        >
                          {updatingStatus === request.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          ) : (
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          )}
                          {updatingStatus === request.id ? 'Finalisation...' : 'Finaliser'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {filteredRequests.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">Aucune demande trouvée</p>
                <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos filtres de recherche</p>
              </div>
            )}

            {/* Contrôles de pagination */}
            {filteredRequests.length > 0 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-700">
                      Affichage de{' '}
                      <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                      {' '}à{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, filteredRequests.length)}
                      </span>
                      {' '}sur{' '}
                      <span className="font-medium">{filteredRequests.length}</span>
                      {' '}résultats
                    </p>
                    <div className="flex items-center space-x-2">
                      <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
                        Par page:
                      </label>
                      <select
                        id="itemsPerPage"
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Précédent</span>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Numéros de page */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNumber
                                ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Suivant</span>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
