import { db } from '../lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'

export class AdminPasswordService {
  /**
   * Change le mot de passe d'un administrateur
   * @param {string} adminId - ID de l'administrateur
   * @param {string} currentPassword - Mot de passe actuel
   * @param {string} newPassword - Nouveau mot de passe
   * @returns {Promise<{success: boolean, message: string}>}
   */
  static async changePassword(adminId, currentPassword, newPassword) {
    try {
      // Vérifier la force du nouveau mot de passe
      const passwordValidation = this.validatePassword(newPassword)
      if (!passwordValidation.isValid) {
        return { success: false, message: passwordValidation.message }
      }

      // Récupérer les données de l'admin depuis Firestore
      const adminRef = doc(db, 'admins', adminId)
      const adminDoc = await getDoc(adminRef)

      if (!adminDoc.exists()) {
        return { success: false, message: 'Administrateur non trouvé' }
      }

      const adminData = adminDoc.data()

      // Vérifier le mot de passe actuel (comparaison simple pour la démo)
      // Dans un vrai système, vous devriez utiliser un hash sécurisé
      if (adminData.password !== currentPassword) {
        return { success: false, message: 'Mot de passe actuel incorrect' }
      }

      // Mettre à jour le mot de passe et la date de dernière modification
      await updateDoc(adminRef, {
        password: newPassword,
        passwordLastChanged: new Date(),
        lastModified: new Date()
      })

      return { 
        success: true, 
        message: 'Mot de passe modifié avec succès' 
      }

    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error)
      return { success: false, message: 'Erreur lors du changement de mot de passe' }
    }
  }

  /**
   * Valide la force du mot de passe
   * @param {string} password - Mot de passe à valider
   * @returns {Object} - {isValid: boolean, message: string}
   */
  static validatePassword(password) {
    if (!password || password.length < 8) {
      return { 
        isValid: false, 
        message: 'Le mot de passe doit contenir au moins 8 caractères' 
      }
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return { 
        isValid: false, 
        message: 'Le mot de passe doit contenir au moins une lettre minuscule' 
      }
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return { 
        isValid: false, 
        message: 'Le mot de passe doit contenir au moins une lettre majuscule' 
      }
    }

    if (!/(?=.*\d)/.test(password)) {
      return { 
        isValid: false, 
        message: 'Le mot de passe doit contenir au moins un chiffre' 
      }
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return { 
        isValid: false, 
        message: 'Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&)' 
      }
    }

    return { isValid: true, message: 'Mot de passe valide' }
  }

  /**
   * Vérifie si l'admin doit changer son mot de passe
   * @param {string} adminId - ID de l'administrateur
   * @returns {Promise<{shouldChange: boolean, daysLeft?: number}>}
   */
  static async shouldChangePassword(adminId) {
    try {
      const adminRef = doc(db, 'admins', adminId)
      const adminDoc = await getDoc(adminRef)
      
      if (!adminDoc.exists()) {
        return { shouldChange: false }
      }

      const adminData = adminDoc.data()
      const passwordLastChanged = adminData.passwordLastChanged?.toDate()
      
      if (!passwordLastChanged) {
        return { shouldChange: true, daysLeft: 0 }
      }

      const daysSinceLastChange = Math.floor((new Date() - passwordLastChanged) / (1000 * 60 * 60 * 24))
      const maxDays = 90 // 90 jours maximum

      if (daysSinceLastChange >= maxDays) {
        return { shouldChange: true, daysLeft: 0 }
      }

      return { 
        shouldChange: false, 
        daysLeft: maxDays - daysSinceLastChange 
      }

    } catch (error) {
      console.error('Erreur lors de la vérification du mot de passe:', error)
      return { shouldChange: false }
    }
  }
}
