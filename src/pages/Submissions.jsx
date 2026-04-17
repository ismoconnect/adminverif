import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FirestoreService } from '../services/firestoreService'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { toast } from 'react-toastify'

// Icônes SVG améliorées
const Clock = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CheckCircle = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const XCircle = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const Eye = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const Edit = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const Mail = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const Search = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const Filter = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
  </svg>
)

const Trash = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const Archive = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  </svg>
)

const Undo = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l6 6M3 10l6-6" />
  </svg>
)

export default function Submissions() {
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)

  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [submissionToDelete, setSubmissionToDelete] = useState(null)

  const { admin } = useAdminAuth()
  const isSuperAdmin = admin?.role === 'super_admin'
  const [viewMode, setViewMode] = useState('active') // 'active' ou 'archived'

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const data = await FirestoreService.getAllSubmissions()
      setSubmissions(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des soumissions:', error)
      toast.error('Erreur lors du chargement des soumissions')
      setSubmissions([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (submission) => {
    setSubmissionToDelete(submission)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!submissionToDelete || !isSuperAdmin) return

    try {
      setIsDeleting(true)
      const result = await FirestoreService.deleteSubmission(submissionToDelete.id)

      if (result.success) {
        toast.success('Soumission supprimée avec succès')
        setSubmissions(prev => prev.filter(s => s.id !== submissionToDelete.id))
        setShowDeleteModal(false)
        setSubmissionToDelete(null)
      } else {
        toast.error('Erreur lors de la suppression: ' + result.error)
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error('Une erreur est survenue lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleArchive = async (submission) => {
    if (!isSuperAdmin) return
    const result = await FirestoreService.archiveSubmission(submission.id)
    if (result.success) {
      toast.success('Soumission archivée')
      setSubmissions(prev => prev.map(s => s.id === submission.id ? { ...s, isArchived: true } : s))
    } else {
      toast.error('Erreur: ' + result.error)
    }
  }

  const handleUnarchive = async (submission) => {
    if (!isSuperAdmin) return
    const result = await FirestoreService.unarchiveSubmission(submission.id)
    if (result.success) {
      toast.success('Soumission restaurée')
      setSubmissions(prev => prev.map(s => s.id === submission.id ? { ...s, isArchived: false } : s))
    } else {
      toast.error('Erreur: ' + result.error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock />
      case 'verified':
        return <CheckCircle />
      case 'rejected':
        return <XCircle />
      default:
        return <Clock />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente'
      case 'verified':
        return 'Vérifiée'
      case 'rejected':
        return 'Rejetée'
      default:
        return 'Inconnu'
    }
  }

  const getClientName = (submission) => {
    if (!submission) return 'Client anonyme'
    if (submission.clientName) return submission.clientName
    if (submission.email) return submission.email.split('@')[0]
    return 'Client anonyme'
  }

  const filteredSubmissions = (submissions || []).filter(submission => {
    // Filtrer les archivées selon le mode de vue
    if (viewMode === 'active' && submission.isArchived) return false
    if (viewMode === 'archived' && !submission.isArchived) return false
    // Les admins normaux ne voient JAMAIS les archivées
    if (!isSuperAdmin && submission.isArchived) return false

    const matchesSearch = searchTerm === '' ||
      getClientName(submission).toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.type?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const archivedCount = (submissions || []).filter(s => s.isArchived).length

  // Pagination logic
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentSubmissions = filteredSubmissions.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement des soumissions...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Soumissions</h1>
              <p className="text-gray-600 text-sm">Gérer toutes les soumissions de coupons</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-semibold">
                {filteredSubmissions.length} soumissions
              </div>
              <button
                onClick={fetchSubmissions}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Espace pour le header fixe sur desktop */}
      <div className="hidden lg:block h-20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filtres - Design amélioré */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔍 Rechercher par nom ou email
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tapez pour rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>
            <div className="lg:w-64">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📊 Filtrer par statut
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 appearance-none"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="verified">Vérifiées</option>
                  <option value="rejected">Rejetées</option>
                </select>
                <Filter className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Onglets Actives / Archives (super_admin uniquement) */}
        {isSuperAdmin && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setViewMode('active')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                viewMode === 'active'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              📋 Soumissions actives
            </button>
            <button
              onClick={() => setViewMode('archived')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                viewMode === 'archived'
                  ? 'bg-gray-700 text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              🗄️ Archives
              {archivedCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  viewMode === 'archived' ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {archivedCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Liste des soumissions - Design adaptatif */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-lg">Liste des soumissions</h2>
              <div className="text-white text-sm">
                {filteredSubmissions.length} soumission{filteredSubmissions.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Contenu - Desktop: Tableau, Mobile: Cards */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                          <Mail className="text-orange-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getClientName(submission)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {submission.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(submission.status)}`}>
                        <span className="mr-1">{getStatusIcon(submission.status)}</span>
                        {getStatusText(submission.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.createdAt ? new Date(submission.createdAt.seconds * 1000).toLocaleDateString('fr-FR') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/admin/submissions/${submission.id}`)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md transition-colors duration-200 flex items-center gap-1 text-xs"
                        >
                          <Eye />
                          Voir détails
                        </button>
                        {viewMode === 'active' && (
                          <button
                            onClick={() => navigate(`/admin/manage/${submission.id}`)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-md transition-colors duration-200 flex items-center gap-1 text-xs"
                          >
                            <Edit />
                            Gérer
                          </button>
                        )}
                        {isSuperAdmin && viewMode === 'archived' && (
                          <button
                            onClick={() => handleUnarchive(submission)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md transition-colors duration-200 flex items-center gap-1 text-xs"
                            title="Restaurer"
                          >
                            <Undo />
                            Restaurer
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDeleteClick(submission)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md transition-colors duration-200 flex items-center gap-1 text-xs"
                          >
                            <Trash />
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: Cards */}
          <div className="lg:hidden">
            <div className="p-4 space-y-4">
              {currentSubmissions.map((submission) => (
                <div key={submission.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Mail className="text-orange-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {getClientName(submission)}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {submission.email}
                        </div>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(submission.status)} whitespace-nowrap`}>
                        <span className="mr-0.5">{getStatusIcon(submission.status)}</span>
                        <span className="truncate">{getStatusText(submission.status)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Type</div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {submission.type}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Date</div>
                      <div className="text-xs text-gray-900">
                        {submission.createdAt ? new Date(submission.createdAt.seconds * 1000).toLocaleDateString('fr-FR') : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/admin/submissions/${submission.id}`)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md transition-colors duration-200 flex items-center justify-center gap-1 text-xs font-medium"
                      >
                        <Eye />
                        Voir détails
                      </button>
                      <button
                        onClick={() => navigate(`/admin/manage/${submission.id}`)}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-md transition-colors duration-200 flex items-center justify-center gap-1 text-xs font-medium"
                      >
                        <Edit />
                        Gérer
                      </button>
                    </div>
                    {isSuperAdmin && viewMode === 'archived' && (
                      <button
                        onClick={() => handleUnarchive(submission)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md transition-colors duration-200 flex items-center justify-center gap-1 text-xs font-medium"
                      >
                        <Undo />
                        Restaurer
                      </button>
                    )}
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteClick(submission)}
                        className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md transition-colors duration-200 flex items-center justify-center gap-1 text-xs font-medium"
                      >
                        <Trash />
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white px-4 py-4 border-t border-gray-200">
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune soumission trouvée</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Essayez de modifier vos critères de recherche.'
                    : 'Aucune soumission n\'a encore été enregistrée.'}
                </p>
              </div>
            ) : filteredSubmissions.length > itemsPerPage && (
              <>
                <div className="lg:hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-gray-600">
                      {startIndex + 1}-{Math.min(endIndex, filteredSubmissions.length)} sur {filteredSubmissions.length}
                    </div>
                    <div className="text-xs text-gray-500">
                      Page {currentPage} sur {totalPages}
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Précédent
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                        let page;
                        if (totalPages <= 3) page = i + 1;
                        else if (currentPage <= 2) page = i + 1;
                        else if (currentPage >= totalPages - 1) page = totalPages - 2 + i;
                        else page = currentPage - 1 + i;

                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${page === currentPage ? 'bg-orange-500 text-white' : 'text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200'}`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-1"
                    >
                      Suivant
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="hidden lg:flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Affichage de {startIndex + 1} à {Math.min(endIndex, filteredSubmissions.length)} sur {filteredSubmissions.length} soumissions
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Précédent
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${page === currentPage ? 'bg-orange-500 text-white' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowDeleteModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Supprimer la soumission
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Êtes-vous sûr de vouloir supprimer cette soumission ? Cette action est irréversible et toutes les données associées seront perdues.
                      </p>
                      {submissionToDelete && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                          <span className="font-semibold">{getClientName(submissionToDelete)}</span> ({submissionToDelete.email})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteConfirm}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}