import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../lib/firebase'

// Service pour gérer les soumissions de coupons
export class FirestoreService {
  
  // Récupérer toutes les soumissions (pour l'admin)
  static async getAllSubmissions(limitCount = 100) {
    try {
      const q = query(
        collection(db, 'coupon_submissions'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )
      
      const querySnapshot = await getDocs(q)
      const submissions = []
      
      querySnapshot.forEach((doc) => {
        submissions.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return submissions
      
    } catch (error) {
      console.error('Erreur lors de la récupération:', error)
      return []
    }
  }
  
  // Récupérer les soumissions par statut
  static async getSubmissionsByStatus(status) {
    try {
      const q = query(
        collection(db, 'coupon_submissions'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const submissions = []
      
      querySnapshot.forEach((doc) => {
        submissions.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return {
        success: true,
        data: submissions
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération par statut:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  // Récupérer les soumissions par type de coupon
  static async getSubmissionsByType(type) {
    try {
      const q = query(
        collection(db, 'coupon_submissions'),
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const submissions = []
      
      querySnapshot.forEach((doc) => {
        submissions.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return {
        success: true,
        data: submissions
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération par type:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  // Mettre à jour le statut d'une soumission
  static async updateSubmissionStatus(submissionId, status, notes = '') {
    try {
      const submissionRef = doc(db, 'coupon_submissions', submissionId)
      
      const updateData = {
        status,
        updatedAt: serverTimestamp(),
        adminNotes: notes
      }
      
      // Ajouter des timestamps selon le statut
      if (status === 'processing') {
        updateData.processingStartedAt = serverTimestamp()
      } else if (status === 'completed' || status === 'rejected') {
        updateData.processingCompletedAt = serverTimestamp()
      }
      
      await updateDoc(submissionRef, updateData)
      
      return {
        success: true,
        message: 'Statut mis à jour avec succès'
      }
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  // Marquer l'email comme envoyé
  static async markEmailSent(submissionId) {
    try {
      const submissionRef = doc(db, 'coupon_submissions', submissionId)
      
      await updateDoc(submissionRef, {
        emailSent: true,
        emailSentAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      return {
        success: true,
        message: 'Email marqué comme envoyé'
      }
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour email:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  // Statistiques générales
  static async getStatistics() {
    try {
      const allSubmissions = await this.getAllSubmissions(1000)
      
      if (!Array.isArray(allSubmissions)) {
        return {
          total: 0,
          pending: 0,
          verified: 0,
          rejected: 0,
          totalAmount: 0,
          byType: {}
        }
      }
      
      const stats = {
        total: allSubmissions.length,
        pending: 0,
        verified: 0,
        rejected: 0,
        totalAmount: 0,
        byType: {}
      }
      
      allSubmissions.forEach(submission => {
        // Compter par statut
        if (submission.status) {
          stats[submission.status] = (stats[submission.status] || 0) + 1
        }
        
        // Compter par type
        if (submission.type) {
          stats.byType[submission.type] = (stats.byType[submission.type] || 0) + 1
        }
        
        // Somme totale
        if (submission.coupons && Array.isArray(submission.coupons)) {
          submission.coupons.forEach(coupon => {
            stats.totalAmount += parseFloat(coupon.amount) || 0
          })
        }
      })
      
      return stats
      
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error)
      return {
        total: 0,
        pending: 0,
        verified: 0,
        rejected: 0,
        totalAmount: 0,
        byType: {}
      }
    }
  }

  // ===== SERVICES POUR LES REMBOURSEMENTS =====

  // Récupérer toutes les demandes de remboursement (pour l'admin)
  static async getAllRefundRequests(limitCount = 50) {
    try {
      const q = query(
        collection(db, 'refund_requests'),
        orderBy('submittedAt', 'desc'),
        limit(limitCount)
      )
      
      const querySnapshot = await getDocs(q)
      const refundRequests = []
      
      querySnapshot.forEach((doc) => {
        refundRequests.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return {
        success: true,
        data: refundRequests
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes de remboursement:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Récupérer les demandes de remboursement par statut
  static async getRefundRequestsByStatus(status) {
    try {
      const q = query(
        collection(db, 'refund_requests'),
        where('status', '==', status),
        orderBy('submittedAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const refundRequests = []
      
      querySnapshot.forEach((doc) => {
        refundRequests.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return {
        success: true,
        data: refundRequests
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération par statut:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Récupérer une demande de remboursement par numéro de référence
  static async getRefundRequestByReference(referenceNumber) {
    try {
      const docRef = doc(db, 'refund_requests', referenceNumber)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          success: true,
          data: {
            id: docSnap.id,
            ...docSnap.data()
          }
        }
      } else {
        return {
          success: false,
          error: 'Demande de remboursement non trouvée'
        }
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération de la demande:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Mettre à jour le statut d'une demande de remboursement
  static async updateRefundRequestStatus(requestId, status, notes = '', processedBy = 'admin') {
    try {
      const requestRef = doc(db, 'refund_requests', requestId)
      
      const updateData = {
        status,
        updatedAt: serverTimestamp(),
        adminNotes: notes
      }
      
      // Ajouter des timestamps selon le statut
      if (status === 'processing') {
        updateData.processedAt = serverTimestamp()
        updateData.processedBy = processedBy
      } else if (status === 'approved' || status === 'rejected') {
        updateData.processedAt = serverTimestamp()
        updateData.processedBy = processedBy
      } else if (status === 'completed') {
        updateData.completedAt = serverTimestamp()
      }
      
      await updateDoc(requestRef, updateData)
      
      return {
        success: true,
        message: 'Statut mis à jour avec succès'
      }
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Statistiques des remboursements
  static async getRefundStatistics() {
    try {
      const allRequests = await this.getAllRefundRequests(1000)
      
      if (!allRequests.success) {
        return {
          success: false,
          error: allRequests.error
        }
      }
      
      const stats = {
        total: allRequests.data.length,
        pending: 0,
        processing: 0,
        approved: 0,
        rejected: 0,
        completed: 0,
        totalAmount: 0,
        totalRefunded: 0
      }
      
      allRequests.data.forEach(request => {
        // Compter par statut
        stats[request.status] = (stats[request.status] || 0) + 1
        
        // Somme totale des demandes
        stats.totalAmount += request.totalAmount || 0
        
        // Somme des remboursements effectués
        if (request.status === 'completed') {
          stats.totalRefunded += request.totalAmount || 0
        }
      })
      
      return {
        success: true,
        data: stats
      }
      
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques de remboursement:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default FirestoreService
