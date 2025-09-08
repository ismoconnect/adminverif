import { useState, useEffect } from 'react'
import { getAllAdmins, getPendingAdmins, authorizeAdmin, revokeAdminAuthorization } from '../services/adminAuthService'

export default function ManageAdmins() {
  const [pendingAdmins, setPendingAdmins] = useState([])
  const [allAdmins, setAllAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    loadAdmins()
  }, [])

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

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Gestion des Administrateurs
          </h3>

          {/* Admins en attente d'autorisation */}
          <div className="mb-8">
            <h4 className="text-md font-medium text-gray-900 mb-3">
              En attente d'autorisation ({pendingAdmins.length})
            </h4>
            
            {pendingAdmins.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun administrateur en attente d'autorisation.</p>
            ) : (
              <div className="space-y-3">
                {pendingAdmins.map((admin) => (
                  <div key={admin.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                            <p className="text-sm text-gray-500">@{admin.username}</p>
                            <p className="text-sm text-gray-500">{admin.email}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Créé le: {formatDate(admin.createdAt)}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAuthorize(admin.id)}
                          disabled={actionLoading === admin.id}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {actionLoading === admin.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            'Autoriser'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tous les admins */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Tous les administrateurs ({allAdmins.length})
            </h4>
            
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Administrateur
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
                    <tr key={admin.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                          <div className="text-sm text-gray-500">@{admin.username}</div>
                          <div className="text-sm text-gray-500">{admin.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          admin.isAuthorized 
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
