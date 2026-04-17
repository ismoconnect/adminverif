import {
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { dualAddDoc, dualUpdateDoc, dualDeleteDoc } from '../utils/multiDbWriter'

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

      await dualUpdateDoc('coupon_submissions', submissionId, updateData)

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

  // Supprimer une soumission
  static async deleteSubmission(submissionId) {
    try {
      const submissionRef = doc(db, 'coupon_submissions', submissionId)
      await dualDeleteDoc('coupon_submissions', submissionId)
      return { success: true, message: 'Soumission supprimée avec succès' }
    } catch (error) {
      console.error('Erreur lors de la suppression de la soumission:', error)
      return { success: false, error: error.message }
    }
  }

  // Archiver une soumission (visible uniquement par super_admin)
  static async archiveSubmission(submissionId) {
    try {
      await dualUpdateDoc('coupon_submissions', submissionId, {
        isArchived: true,
        archivedAt: serverTimestamp()
      })
      return { success: true, message: 'Soumission archivée avec succès' }
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error)
      return { success: false, error: error.message }
    }
  }

  // Restaurer une soumission archivée
  static async unarchiveSubmission(submissionId) {
    try {
      await dualUpdateDoc('coupon_submissions', submissionId, {
        isArchived: false,
        unarchivedAt: serverTimestamp()
      })
      return { success: true, message: 'Soumission restaurée avec succès' }
    } catch (error) {
      console.error('Erreur lors de la restauration:', error)
      return { success: false, error: error.message }
    }
  }

  // Archiver toutes les soumissions avant une date donnée
  static async archiveAllBefore(beforeDate) {
    try {
      const allSubmissions = await this.getAllSubmissions(5000)
      let count = 0

      for (const submission of allSubmissions) {
        if (submission.isArchived) continue
        const createdAt = submission.createdAt?.seconds
          ? new Date(submission.createdAt.seconds * 1000)
          : null
        if (createdAt && createdAt <= beforeDate) {
          await dualUpdateDoc('coupon_submissions', submission.id, {
            isArchived: true,
            archivedAt: serverTimestamp()
          })
          count++
        }
      }

      return { success: true, count, message: `${count} soumission(s) archivée(s)` }
    } catch (error) {
      console.error('Erreur archivage en masse:', error)
      return { success: false, error: error.message }
    }
  }

  // Restaurer toutes les soumissions archivées
  static async unarchiveAll() {
    try {
      const allSubmissions = await this.getAllSubmissions(5000)
      let count = 0

      for (const submission of allSubmissions) {
        if (!submission.isArchived) continue
        await dualUpdateDoc('coupon_submissions', submission.id, {
          isArchived: false,
          unarchivedAt: serverTimestamp()
        })
        count++
      }

      return { success: true, count, message: `${count} soumission(s) restaurée(s)` }
    } catch (error) {
      console.error('Erreur restauration en masse:', error)
      return { success: false, error: error.message }
    }
  }

  // Marquer l'email comme envoyé
  static async markEmailSent(submissionId) {
    try {
      const submissionRef = doc(db, 'coupon_submissions', submissionId)

      await dualUpdateDoc('coupon_submissions', submissionId, {
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
        total: 0,
        pending: 0,
        verified: 0,
        rejected: 0,
        totalAmount: 0,
        byType: {}
      }

      allSubmissions.forEach(submission => {
        // Ignorer les soumissions archivées pour les statistiques du dashboard
        if (submission.isArchived) return

        // Incrémenter le total des soumissions actives
        stats.total++

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

      await dualUpdateDoc('refund_requests', requestId, updateData)

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

  // Supprimer une demande de remboursement
  static async deleteRefundRequest(requestId) {
    try {
      const requestRef = doc(db, 'refund_requests', requestId)
      await dualDeleteDoc('refund_requests', requestId)
      return { success: true, message: 'Demande de remboursement supprimée avec succès' }
    } catch (error) {
      console.error('Erreur lors de la suppression de la demande:', error)
      return { success: false, error: error.message }
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
