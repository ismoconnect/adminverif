import { db } from '../lib/firebase'
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore'

// Collection pour les messages de contact
const CONTACT_COLLECTION = 'contact_messages'

// Fonction pour récupérer tous les messages de contact
export const getAllContactMessages = async () => {
  try {
    const contactQuery = query(
      collection(db, CONTACT_COLLECTION),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(contactQuery)
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return { success: true, messages }
  } catch (error) {
    console.error('Erreur récupération messages contact:', error)
    return { success: false, error: 'Erreur lors de la récupération des messages' }
  }
}

// Fonction pour récupérer un message de contact par ID
export const getContactMessage = async (messageId) => {
  try {
    const messageDoc = await getDoc(doc(db, CONTACT_COLLECTION, messageId))
    
    if (!messageDoc.exists()) {
      return { success: false, error: 'Message introuvable' }
    }
    
    return { 
      success: true, 
      message: { id: messageDoc.id, ...messageDoc.data() } 
    }
  } catch (error) {
    console.error('Erreur récupération message:', error)
    return { success: false, error: 'Erreur lors de la récupération du message' }
  }
}

// Fonction pour marquer un message comme lu
export const markMessageAsRead = async (messageId) => {
  try {
    await updateDoc(doc(db, CONTACT_COLLECTION, messageId), {
      isRead: true,
      readAt: serverTimestamp(),
      readBy: 'admin' // Vous pouvez passer l'ID de l'admin connecté
    })
    
    return { success: true }
  } catch (error) {
    console.error('Erreur marquage message lu:', error)
    return { success: false, error: 'Erreur lors du marquage du message' }
  }
}

// Fonction pour marquer un message comme non lu
export const markMessageAsUnread = async (messageId) => {
  try {
    await updateDoc(doc(db, CONTACT_COLLECTION, messageId), {
      isRead: false,
      readAt: null,
      readBy: null
    })
    
    return { success: true }
  } catch (error) {
    console.error('Erreur marquage message non lu:', error)
    return { success: false, error: 'Erreur lors du marquage du message' }
  }
}

// Fonction pour supprimer un message de contact
export const deleteContactMessage = async (messageId) => {
  try {
    await deleteDoc(doc(db, CONTACT_COLLECTION, messageId))
    
    return { success: true }
  } catch (error) {
    console.error('Erreur suppression message:', error)
    return { success: false, error: 'Erreur lors de la suppression du message' }
  }
}

// Fonction pour récupérer les messages non lus
export const getUnreadContactMessages = async () => {
  try {
    const unreadQuery = query(
      collection(db, CONTACT_COLLECTION),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(unreadQuery)
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return { success: true, messages }
  } catch (error) {
    console.error('Erreur récupération messages non lus:', error)
    return { success: false, error: 'Erreur lors de la récupération des messages non lus' }
  }
}

// Fonction pour récupérer les statistiques des messages
export const getContactStats = async () => {
  try {
    const allMessages = await getAllContactMessages()
    const unreadMessages = await getUnreadContactMessages()
    
    if (!allMessages.success || !unreadMessages.success) {
      return { success: false, error: 'Erreur lors de la récupération des statistiques' }
    }
    
    const stats = {
      total: allMessages.messages.length,
      unread: unreadMessages.messages.length,
      read: allMessages.messages.length - unreadMessages.messages.length
    }
    
    return { success: true, stats }
  } catch (error) {
    console.error('Erreur calcul statistiques:', error)
    return { success: false, error: 'Erreur lors du calcul des statistiques' }
  }
}
