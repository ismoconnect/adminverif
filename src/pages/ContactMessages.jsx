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

  const handleDelete = async (messageId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      return
    }
    
    setActionLoading(messageId)
    try {
      const result = await deleteContactMessage(messageId)
      if (result.success) {
        await loadMessages()
        await loadStats()
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
    } finally {
      setActionLoading(null)
    }
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
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Messages de Contact
          </h3>
          
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
                  className={`border rounded-lg p-4 ${
                    message.isRead 
                      ? 'border-gray-200 bg-gray-50' 
                      : 'border-orange-200 bg-orange-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {message.name || 'Anonyme'}
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          message.isRead 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {message.isRead ? 'Lu' : 'Non lu'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Email:</strong> {message.email}
                      </p>
                      
                      {message.phone && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Téléphone:</strong> {message.phone}
                        </p>
                      )}
                      
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Sujet:</strong> {message.subject || 'Aucun sujet'}
                      </p>
                      
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Message:</strong> {message.message}
                      </p>
                      
                      <p className="text-xs text-gray-500">
                        Reçu le: {formatDate(message.createdAt)}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      {!message.isRead ? (
                        <button
                          onClick={() => handleMarkAsRead(message.id)}
                          disabled={actionLoading === message.id}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          {actionLoading === message.id ? '...' : 'Marquer lu'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkAsUnread(message.id)}
                          disabled={actionLoading === message.id}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                        >
                          {actionLoading === message.id ? '...' : 'Marquer non lu'}
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(message.id)}
                        disabled={actionLoading === message.id}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                      >
                        {actionLoading === message.id ? '...' : 'Supprimer'}
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
  )
}
