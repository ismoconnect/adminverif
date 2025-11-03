import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  subscribeToNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  NOTIFICATION_TYPES
} from '../services/notificationService'
import { toast } from 'react-toastify'

// Icônes
const BellIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

const CheckIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const FileTextIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const DollarIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
)

const MailIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'unread', 'read'
  const [markingAsRead, setMarkingAsRead] = useState(null)

  useEffect(() => {
    // Écouter les notifications en temps réel
    const unsubscribe = subscribeToNotifications(({ notifications, unreadCount }) => {
      setNotifications(notifications)
      setUnreadCount(unreadCount)
      setLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.NEW_SUBMISSION:
      case NOTIFICATION_TYPES.SUBMISSION_UPDATED:
        return <FileTextIcon />
      case NOTIFICATION_TYPES.NEW_REFUND_REQUEST:
      case NOTIFICATION_TYPES.REFUND_UPDATED:
        return <DollarIcon />
      case NOTIFICATION_TYPES.NEW_CONTACT_MESSAGE:
      case NOTIFICATION_TYPES.CONTACT_MESSAGE_UPDATED:
        return <MailIcon />
      default:
        return <BellIcon />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.NEW_SUBMISSION:
      case NOTIFICATION_TYPES.SUBMISSION_UPDATED:
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case NOTIFICATION_TYPES.NEW_REFUND_REQUEST:
      case NOTIFICATION_TYPES.REFUND_UPDATED:
        return 'bg-green-100 text-green-800 border-green-200'
      case NOTIFICATION_TYPES.NEW_CONTACT_MESSAGE:
      case NOTIFICATION_TYPES.CONTACT_MESSAGE_UPDATED:
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    setMarkingAsRead(notificationId)
    try {
      const result = await markNotificationAsRead(notificationId)
      if (result.success) {
        toast.success('Notification marquée comme lue')
      } else {
        toast.error('Erreur lors du marquage')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du marquage')
    } finally {
      setMarkingAsRead(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllNotificationsAsRead()
      if (result.success) {
        toast.success('Toutes les notifications ont été marquées comme lues')
      } else {
        toast.error('Erreur lors du marquage')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du marquage')
    }
  }

  const handleNotificationClick = (notification) => {
    // Marquer comme lue si ce n'est pas déjà fait
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }

    // Naviguer vers la page appropriée selon le type
    if (notification.data) {
      if (notification.data.submissionId) {
        navigate(`/admin/submissions/${notification.data.submissionId}`)
      } else if (notification.data.refundId) {
        navigate(`/admin/refund-details/${notification.data.refundId}`)
      } else if (notification.data.messageId) {
        navigate('/admin/contact-messages')
      }
    }
  }

  const formatDate = (date) => {
    if (!date) return 'Date inconnue'
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`
    if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`
    if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read
    if (filter === 'read') return notification.read
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement des notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="hidden lg:block fixed top-0 left-64 right-0 z-30 bg-white shadow-lg border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 text-sm">Toutes vos notifications en temps réel</p>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-semibold">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </div>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                  <CheckIcon />
                  Tout marquer comme lu
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Espace pour le header fixe sur desktop */}
      <div className="hidden lg:block h-20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <BellIcon />
              <h2 className="text-lg font-semibold text-gray-900">Filtrer les notifications</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Toutes ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Non lues ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'read'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Lues ({notifications.length - unreadCount})
              </button>
            </div>
          </div>
        </div>

        {/* Liste des notifications */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
            <h2 className="text-white font-semibold text-lg">
              {filteredNotifications.length} notification{filteredNotifications.length > 1 ? 's' : ''}
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BellIcon className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === 'all' ? 'Aucune notification' : filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification lue'}
                </h3>
                <p className="text-gray-500">
                  {filter === 'all' 
                    ? 'Vous n\'avez pas encore reçu de notifications.'
                    : 'Toutes vos notifications sont à jour.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-6 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icône */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{formatDate(notification.createdAt)}</span>
                            {notification.data && notification.data.type && (
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                {notification.data.type}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsRead(notification.id)
                            }}
                            disabled={markingAsRead === notification.id}
                            className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Marquer comme lu"
                          >
                            {markingAsRead === notification.id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            ) : (
                              <CheckIcon />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

