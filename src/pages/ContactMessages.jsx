import { useState, useEffect } from 'react'
import { 
  getAllContactMessages, 
  markMessageAsRead, 
  markMessageAsUnread, 
  deleteContactMessage,
  getContactStats 
} from '../services/contactService'

export default function ContactMessages() {
  const [messages, setMessages] = useState([])
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [filter, setFilter] = useState('all') // 'all', 'read', 'unread'
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState(null)

  useEffect(() => {
    loadMessages()
    loadStats()
  }, [])

  const loadMessages = async () => {
    setLoading(true)
    try {
      const result = await getAllContactMessages()
      if (result.success) {
        setMessages(result.messages)
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const result = await getContactStats()
      if (result.success) {
        setStats(result.stats)
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    }
  }

  const handleMarkAsRead = async (messageId) => {
    setActionLoading(messageId)
    try {
      const result = await markMessageAsRead(messageId)
      if (result.success) {
        await loadMessages()
        await loadStats()
      }
    } catch (error) {
      console.error('Erreur marquage lu:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkAsUnread = async (messageId) => {
    setActionLoading(messageId)
    try {
      const result = await markMessageAsUnread(messageId)
      if (result.success) {
        await loadMessages()
        await loadStats()
      }
    } catch (error) {
      console.error('Erreur marquage non lu:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteClick = (messageId) => {
    const message = messages.find(m => m.id === messageId)
    setMessageToDelete(message)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!messageToDelete) return
    
    setActionLoading(messageToDelete.id)
    try {
      const result = await deleteContactMessage(messageToDelete.id)
      if (result.success) {
        await loadMessages()
        await loadStats()
        setShowDeleteModal(false)
        setMessageToDelete(null)
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setMessageToDelete(null)
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp.seconds * 1000).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredMessages = messages.filter(message => {
    switch (filter) {
      case 'read':
        return message.isRead
      case 'unread':
        return !message.isRead
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
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
                Messages de Contact
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Gérez les messages de contact reçus
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Total</p>
                  <p className="text-2xl font-semibold text-blue-900">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-600">Non lus</p>
                  <p className="text-2xl font-semibold text-yellow-900">{stats.unread}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">Lus</p>
                  <p className="text-2xl font-semibold text-green-900">{stats.read}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filter === 'all' 
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous ({stats.total})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filter === 'unread' 
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Non lus ({stats.unread})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filter === 'read' 
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Lus ({stats.read})
            </button>
          </div>
        </div>
      </div>

      {/* Liste des messages */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun message</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' 
                  ? 'Aucun message de contact reçu.' 
                  : filter === 'unread' 
                    ? 'Aucun message non lu.' 
                    : 'Aucun message lu.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <div 
                  key={message.id} 
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    message.isRead 
                      ? 'border-gray-200 bg-gray-50' 
                      : 'border-orange-200 bg-orange-50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 mb-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          {message.name || 'Anonyme'}
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                          message.isRead 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {message.isRead ? 'Lu' : 'Non lu'}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>
                          <strong>Email:</strong> 
                          <span className="ml-1 break-all">{message.email}</span>
                        </p>
                        
                        {message.phone && (
                          <p>
                            <strong>Téléphone:</strong> 
                            <span className="ml-1">{message.phone}</span>
                          </p>
                        )}
                        
                        <p>
                          <strong>Sujet:</strong> 
                          <span className="ml-1">{message.subject || 'Aucun sujet'}</span>
                        </p>
                        
                        <div>
                          <strong>Message:</strong>
                          <p className="mt-1 text-gray-700 bg-white p-2 rounded border text-sm">
                            {message.message}
                          </p>
                        </div>
                        
                        <p className="text-xs text-gray-500">
                          Reçu le: {formatDate(message.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:ml-4">
                      {!message.isRead ? (
                        <button
                          onClick={() => handleMarkAsRead(message.id)}
                          disabled={actionLoading === message.id}
                          className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === message.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Marquer lu
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkAsUnread(message.id)}
                          disabled={actionLoading === message.id}
                          className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === message.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Marquer non lu
                            </>
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteClick(message.id)}
                        disabled={actionLoading === message.id}
                        className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === message.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Supprimer
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

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Confirmer la suppression
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Êtes-vous sûr de vouloir supprimer ce message de contact ?
                </p>
                {messageToDelete && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md text-left">
                    <p className="text-sm font-medium text-gray-900">
                      De: {messageToDelete.name || 'Anonyme'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Email: {messageToDelete.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      Sujet: {messageToDelete.subject || 'Aucun sujet'}
                    </p>
                  </div>
                )}
                <p className="text-sm text-red-600 mt-2 font-medium">
                  Cette action est irréversible.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 px-4 py-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={actionLoading === messageToDelete?.id}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                >
                  {actionLoading === messageToDelete?.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Suppression...
                    </>
                  ) : (
                    'Supprimer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
