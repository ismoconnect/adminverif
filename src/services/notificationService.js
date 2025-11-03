import { db } from '../lib/firebase'
import { 
  collection, 
  doc,
  query, 
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  getDocs,
  serverTimestamp,
  where,
  Timestamp
} from 'firebase/firestore'

const NOTIFICATIONS_COLLECTION = 'admin_notifications'

// Types de notifications
export const NOTIFICATION_TYPES = {
  NEW_SUBMISSION: 'new_submission',
  SUBMISSION_UPDATED: 'submission_updated',
  NEW_REFUND_REQUEST: 'new_refund_request',
  REFUND_UPDATED: 'refund_updated',
  NEW_CONTACT_MESSAGE: 'new_contact_message',
  CONTACT_MESSAGE_UPDATED: 'contact_message_updated'
}

// Créer une notification
export const createNotification = async (type, title, message, data = {}) => {
  try {
    const notification = {
      type,
      title,
      message,
      data,
      read: false,
      createdAt: serverTimestamp()
    }
    
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notification)
    return { success: true }
  } catch (error) {
    console.error('Erreur création notification:', error)
    return { success: false, error: error.message }
  }
}

// Récupérer toutes les notifications
export const getAllNotifications = async (limitCount = 100) => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
    
    const querySnapshot = await getDocs(q)
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }))
    
    return { success: true, notifications }
  } catch (error) {
    console.error('Erreur récupération notifications:', error)
    return { success: false, error: error.message }
  }
}

// Récupérer les notifications non lues
export const getUnreadNotifications = async () => {
  try {
    // Récupérer toutes les notifications et filtrer côté client pour éviter l'index composite
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(100)
    )
    
    const querySnapshot = await getDocs(q)
    const allNotifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }))
    
    // Filtrer les non lues côté client
    const notifications = allNotifications.filter(n => !n.read)
    
    return { success: true, notifications }
  } catch (error) {
    console.error('Erreur récupération notifications non lues:', error)
    return { success: false, error: error.message }
  }
}

// Marquer une notification comme lue
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId)
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Erreur marquage notification:', error)
    return { success: false, error: error.message }
  }
}

// Marquer toutes les notifications comme lues
export const markAllNotificationsAsRead = async () => {
  try {
    const unreadResult = await getUnreadNotifications()
    if (!unreadResult.success) {
      return unreadResult
    }
    
    const promises = unreadResult.notifications.map(notification =>
      markNotificationAsRead(notification.id)
    )
    
    await Promise.all(promises)
    return { success: true }
  } catch (error) {
    console.error('Erreur marquage toutes notifications:', error)
    return { success: false, error: error.message }
  }
}

// Écouter les notifications en temps réel
export const subscribeToNotifications = (callback, limitCount = 50) => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }))
    
    const unreadCount = notifications.filter(n => !n.read).length
    
    callback({
      notifications,
      unreadCount
    })
  }, (error) => {
    console.error('Erreur écoute notifications:', error)
    callback({
      notifications: [],
      unreadCount: 0,
      error: error.message
    })
  })
}

// Écouter les nouvelles soumissions pour créer des notifications
export const subscribeToNewSubmissions = (callback) => {
  const q = query(
    collection(db, 'coupon_submissions'),
    orderBy('createdAt', 'desc'),
    limit(1)
  )
  
  let lastSubmissionTime = null
  let isInitialLoad = true
  
  return onSnapshot(q, async (snapshot) => {
    if (!snapshot.empty) {
      const latestDoc = snapshot.docs[0]
      const latestSubmission = {
        id: latestDoc.id,
        ...latestDoc.data()
      }
      
      const submissionTime = latestDoc.data().createdAt
      const currentTime = submissionTime.toMillis()
      
      // Ignorer le premier chargement
      if (isInitialLoad) {
        isInitialLoad = false
        lastSubmissionTime = currentTime
        return
      }
      
      // Créer une notification seulement si c'est une nouvelle soumission
      if (lastSubmissionTime && currentTime > lastSubmissionTime) {
        lastSubmissionTime = currentTime
        
        // Créer la notification
        await createNotification(
          NOTIFICATION_TYPES.NEW_SUBMISSION,
          'Nouvelle soumission',
          `Une nouvelle soumission de coupon a été reçue de ${latestSubmission.email || 'un client'}`,
          {
            submissionId: latestSubmission.id,
            email: latestSubmission.email,
            type: latestSubmission.type
          }
        )
        
        if (callback) {
          callback(latestSubmission)
        }
      }
    }
  }, (error) => {
    console.error('Erreur écoute soumissions:', error)
  })
}

// Écouter les nouvelles demandes de remboursement
export const subscribeToNewRefundRequests = (callback) => {
  const q = query(
    collection(db, 'refund_requests'),
    orderBy('submittedAt', 'desc'),
    limit(1)
  )
  
  let lastRefundTime = null
  let isInitialLoad = true
  
  return onSnapshot(q, async (snapshot) => {
    if (!snapshot.empty) {
      const latestDoc = snapshot.docs[0]
      const latestRefund = {
        id: latestDoc.id,
        ...latestDoc.data()
      }
      
      const refundTime = latestDoc.data().submittedAt
      const currentTime = refundTime.toMillis()
      
      // Ignorer le premier chargement
      if (isInitialLoad) {
        isInitialLoad = false
        lastRefundTime = currentTime
        return
      }
      
      if (lastRefundTime && currentTime > lastRefundTime) {
        lastRefundTime = currentTime
        
        await createNotification(
          NOTIFICATION_TYPES.NEW_REFUND_REQUEST,
          'Nouvelle demande de remboursement',
          `Une nouvelle demande de remboursement a été soumise (${latestRefund.referenceNumber || latestRefund.id})`,
          {
            refundId: latestRefund.id,
            referenceNumber: latestRefund.referenceNumber,
            amount: latestRefund.totalAmount
          }
        )
        
        if (callback) {
          callback(latestRefund)
        }
      }
    }
  }, (error) => {
    console.error('Erreur écoute remboursements:', error)
  })
}

// Écouter les nouveaux messages de contact
export const subscribeToNewContactMessages = (callback) => {
  const q = query(
    collection(db, 'contact_messages'),
    orderBy('createdAt', 'desc'),
    limit(1)
  )
  
  let lastMessageTime = null
  let isInitialLoad = true
  
  return onSnapshot(q, async (snapshot) => {
    if (!snapshot.empty) {
      const latestDoc = snapshot.docs[0]
      const latestMessage = {
        id: latestDoc.id,
        ...latestDoc.data()
      }
      
      const messageTime = latestDoc.data().createdAt
      const currentTime = messageTime.toMillis()
      
      // Ignorer le premier chargement
      if (isInitialLoad) {
        isInitialLoad = false
        lastMessageTime = currentTime
        return
      }
      
      if (lastMessageTime && currentTime > lastMessageTime) {
        lastMessageTime = currentTime
        
        await createNotification(
          NOTIFICATION_TYPES.NEW_CONTACT_MESSAGE,
          'Nouveau message de contact',
          `Nouveau message de ${latestMessage.name || latestMessage.email || 'un visiteur'}: ${latestMessage.subject || 'Sans sujet'}`,
          {
            messageId: latestMessage.id,
            name: latestMessage.name,
            email: latestMessage.email,
            subject: latestMessage.subject
          }
        )
        
        if (callback) {
          callback(latestMessage)
        }
      }
    }
  }, (error) => {
    console.error('Erreur écoute messages contact:', error)
  })
}

// Initialiser toutes les écoutes
export const initializeNotificationListeners = () => {
  const unsubscribes = []
  
  // Écouter les nouvelles soumissions
  const unsub1 = subscribeToNewSubmissions()
  unsubscribes.push(unsub1)
  
  // Écouter les nouvelles demandes de remboursement
  const unsub2 = subscribeToNewRefundRequests()
  unsubscribes.push(unsub2)
  
  // Écouter les nouveaux messages de contact
  const unsub3 = subscribeToNewContactMessages()
  unsubscribes.push(unsub3)
  
  // Retourner une fonction pour désabonner toutes les écoutes
  return () => {
    unsubscribes.forEach(unsub => unsub())
  }
}

