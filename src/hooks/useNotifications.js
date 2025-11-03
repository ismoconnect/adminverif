import { useState, useEffect } from 'react'
import { subscribeToNotifications } from '../services/notificationService'

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToNotifications(({ notifications, unreadCount }) => {
      setNotifications(notifications)
      setUnreadCount(unreadCount)
      setLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return { notifications, unreadCount, loading }
}

