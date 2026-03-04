import { useState, useEffect } from 'react'
import { getAllAdmins, getPendingAdmins, authorizeAdmin, revokeAdminAuthorization, createAdmin, updateAdminRole } from '../services/adminAuthService'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { Link } from 'react-router-dom'

export default function ManageAdmins() {
  const [pendingAdmins, setPendingAdmins] = useState([])
  const [allAdmins, setAllAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [updateRoleLoading, setUpdateRoleLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'admin'
  })
  const { admin } = useAdminAuth()

  useEffect(() => {
    if (admin?.role === 'super_admin') {
      loadAdmins()
    }
  }, [admin])

  const loadAdmins = async () => {
    setLoading(true)
    try {
      const [pendingResult, allResult] = await Promise.all([
        getPendingAdmins(),
        getAllAdmins()
      ])

      if (pendingResult.success) {
        setPendingAdmins(pendingResult.admins)
      }

      if (allResult.success) {
        setAllAdmins(allResult.admins)
      }
    } catch (error) {
      console.error('Erreur chargement admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAuthorize = async (adminId) => {
    setActionLoading(adminId)
    try {
      const result = await authorizeAdmin(adminId)
      if (result.success) {
        await loadAdmins() // Recharger la liste
      }
    } catch (error) {
      console.error('Erreur autorisation:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevoke = async (adminId) => {
    setActionLoading(adminId)
    try {
      const result = await revokeAdminAuthorization(adminId)
      if (result.success) {
        await loadAdmins() // Recharger la liste
      }
    } catch (error) {
      console.error('Erreur révocation:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError('')
    setCreateSuccess('')

    try {
      // Déterminer les permissions en fonction du rôle
      const permissions = newAdmin.role === 'super_admin'
        ? ['read', 'write', 'delete', 'manage_users']
        : ['read', 'write']

      const result = await createAdmin({
        ...newAdmin,
        permissions,
        // Un super admin qui crée un compte l'autorise directement
        isAuthorized: true,
        status: 'authorized'
      })

      if (result.success) {
        setCreateSuccess('Administrateur créé avec succès !')
        setNewAdmin({
          name: '',
          username: '',
          email: '',
          password: '',
          role: 'admin'
        })
        setTimeout(() => {
          setShowCreateModal(false)
          setCreateSuccess('')
          loadAdmins()
        }, 2000)
      } else {
        setCreateError(result.error)
      }
    } catch (error) {
      setCreateError('Une erreur est survenue lors de la création')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewAdmin(prev => ({ ...prev, [name]: value }))
  }

  const handleOpenRoleModal = (admin) => {
    setEditingAdmin(admin)
    setShowRoleModal(true)
  }

  const handleUpdateRole = async (newRole) => {
    setUpdateRoleLoading(true)
    try {
      const result = await updateAdminRole(editingAdmin.id, newRole)
      if (result.success) {
        setShowRoleModal(false)
        setEditingAdmin(null)
        await loadAdmins()
      } else {
        alert(result.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur update role:', error)
      alert('Une erreur est survenue')
    } finally {
      setUpdateRoleLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp.seconds * 1000).toLocaleDateString('fr-FR')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (admin?.role !== 'super_admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800">Accès Refusé</h3>
          <p className="mt-2 text-sm text-red-700">
            Désolé, seuls les super-administrateurs peuvent accéder à cette page.
          </p>
          <div className="mt-6">
            <Link to="/admin/dashboard" className="text-sm font-medium text-red-600 hover:text-red-500">
              Retour au tableau de bord &rarr;
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header avec statistiques */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <h3 className="text-xl font-semibold text-gray-900">
                Gestion des Administrateurs
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Gérez les autorisations et les comptes administrateurs
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Créer un Admin
              </button>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Total Admins</p>
                  <p className="text-2xl font-semibold text-blue-900">{allAdmins.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-600">En attente</p>
                  <p className="text-2xl font-semibold text-yellow-900">{pendingAdmins.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">Autorisés</p>
                  <p className="text-2xl font-semibold text-green-900">{allAdmins.length - pendingAdmins.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Admins en attente d'autorisation */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2 sm:mb-0">
                En attente d'autorisation
              </h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {pendingAdmins.length} en attente
              </span>
            </div>

            {pendingAdmins.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande en attente</h3>
                <p className="mt-1 text-sm text-gray-500">Tous les administrateurs sont autorisés.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingAdmins.map((admin) => (
                  <div key={admin.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50 hover:bg-yellow-100 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{admin.name}</p>
                            <p className="text-sm text-gray-500 truncate">@{admin.username}</p>
                            <p className="text-sm text-gray-500 truncate">{admin.email}</p>
                            <div className="mt-2 text-xs text-gray-500">
                              Créé le: {formatDate(admin.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:ml-4">
                        <button
                          onClick={() => handleAuthorize(admin.id)}
                          disabled={actionLoading === admin.id}
                          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === admin.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Autoriser
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tous les admins */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900 mb-2 sm:mb-0">
              Tous les administrateurs
            </h4>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {allAdmins.length} total
            </span>
          </div>

          {allAdmins.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun administrateur</h3>
              <p className="mt-1 text-sm text-gray-500">Aucun administrateur n'a été créé.</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Version mobile - Cards */}
              <div className="block sm:hidden space-y-4">
                {allAdmins.map((admin) => (
                  <div key={admin.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${admin.isAuthorized ? 'bg-green-200' : 'bg-yellow-200'
                          }`}>
                          <svg className={`w-6 h-6 ${admin.isAuthorized ? 'text-green-700' : 'text-yellow-700'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{admin.name}</p>
                        <p className="text-sm text-gray-500 truncate">@{admin.username}</p>
                        <p className="text-sm text-gray-500 truncate">{admin.email}</p>
                        <div className="mt-2 flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${admin.isAuthorized
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {admin.isAuthorized ? 'Autorisé' : 'En attente'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(admin.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      {admin.isAuthorized ? (
                        <button
                          onClick={() => handleRevoke(admin.id)}
                          disabled={actionLoading === admin.id}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {actionLoading === admin.id ? '...' : 'Révoquer'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAuthorize(admin.id)}
                          disabled={actionLoading === admin.id}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {actionLoading === admin.id ? '...' : 'Autoriser'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Version desktop - Table */}
              <div className="hidden sm:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Administrateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rôle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Créé le
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allAdmins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${admin.isAuthorized ? 'bg-green-200' : 'bg-yellow-200'
                              }`}>
                              <svg className={`h-6 w-6 ${admin.isAuthorized ? 'text-green-700' : 'text-yellow-700'
                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                              <div className="text-sm text-gray-500">@{admin.username}</div>
                              <div className="text-sm text-gray-500">{admin.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${admin.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                            {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${admin.isAuthorized
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {admin.isAuthorized ? 'Autorisé' : 'En attente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(admin.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-3">
                            {admin.isAuthorized ? (
                              <button
                                onClick={() => handleRevoke(admin.id)}
                                disabled={actionLoading === admin.id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                {actionLoading === admin.id ? '...' : 'Révoquer'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAuthorize(admin.id)}
                                disabled={actionLoading === admin.id}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              >
                                {actionLoading === admin.id ? '...' : 'Autoriser'}
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenRoleModal(admin)}
                              className="text-orange-600 hover:orange-red-900"
                            >
                              Modifier Rôle
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de création d'admin */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateAdmin}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Nouveau compte administrateur
                      </h3>

                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                          <input
                            type="text"
                            name="name"
                            required
                            value={newAdmin.name}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Nom d'utilisateur</label>
                          <input
                            type="text"
                            name="username"
                            required
                            value={newAdmin.username}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <input
                            type="email"
                            name="email"
                            required
                            value={newAdmin.email}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                          <input
                            type="password"
                            name="password"
                            required
                            value={newAdmin.password}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Rôle</label>
                          <select
                            name="role"
                            value={newAdmin.role}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          >
                            <option value="admin">Administrateur Standard</option>
                            <option value="super_admin">Super Administrateur</option>
                          </select>
                          <p className="mt-1 text-xs text-gray-500">
                            {newAdmin.role === 'super_admin'
                              ? 'Accès complet incluant la gestion des admins.'
                              : 'Accès limité au traitement des demandes.'}
                          </p>
                        </div>
                      </div>

                      {createError && (
                        <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                          {createError}
                        </div>
                      )}

                      {createSuccess && (
                        <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-600">
                          {createSuccess}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {createLoading ? 'Création...' : 'Créer l\'administrateur'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification de rôle */}
      {showRoleModal && editingAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Modifier le rôle
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Modification du rôle pour <strong>{editingAdmin.name}</strong>
                    </p>

                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() => handleUpdateRole('admin')}
                        disabled={updateRoleLoading}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${editingAdmin.role === 'admin' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-orange-200'
                          }`}
                      >
                        <div className="font-medium text-gray-900">Administrateur Standard</div>
                        <div className="text-xs text-gray-500">Accès limité au traitement des demandes.</div>
                      </button>

                      <button
                        onClick={() => handleUpdateRole('super_admin')}
                        disabled={updateRoleLoading}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${editingAdmin.role === 'super_admin' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-orange-200'
                          }`}
                      >
                        <div className="font-medium text-gray-900">Super Administrateur</div>
                        <div className="text-xs text-gray-500">Accès complet incluant la gestion des admins.</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:w-auto sm:text-sm"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}