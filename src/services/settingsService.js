import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { dualUpdateDoc } from '../utils/multiDbWriter'

const SETTINGS_COLLECTION = 'settings'
const API_DOC = 'api'

export class SettingsService {
  /**
   * Récupère la configuration des APIs
   * @returns {Promise<{success: boolean, data: Object, error?: string}>}
   */
  static async getApiSettings() {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, API_DOC)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          success: true,
          data: docSnap.data()
        }
      } else {
        // Retourner une configuration par défaut vide si non existante
        return {
          success: true,
          data: {
            telegram_enabled: true,
            telegram_bot_token: '8585200194:AAH1_4YuuuESNcwUrHF6jwlJ4vFCGiKm2BI',
            telegram_chat_id: '7783827859',
            // Compte 1 (Coupons)
            emailjs_c1_enabled: true,
            emailjs_c1_service_id: 'service_xumep4e',
            emailjs_c1_public_key: 'qa4AthuxZDmIeBUtw',
            emailjs_c1_template_coupon: 'template_1qrxiop',
            emailjs_c1_template_contact: 'template_p4rg6lr',
            // Compte 2 (Contact)
            emailjs_c2_enabled: true,
            emailjs_c2_service_id: 'service_3f5xa3h',
            emailjs_c2_public_key: '2tcYuL1VPtotjaU3B',
            emailjs_c2_template_form: 'template_ao4sux7',
            emailjs_c2_template_team: 'template_vdktnpk',
            // Compte 3 (Remboursement)
            emailjs_c3_enabled: true,
            emailjs_c3_service_id: 'service_ep3hf8v',
            emailjs_c3_public_key: '2ufmUA7aW7sXW-Gzh',
            emailjs_c3_template_client: 'template_22fpmv3',
            emailjs_c3_template_team: 'template_o1496ug'
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres API:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Sauvegarde la configuration des APIs sur les deux bases
   * @param {Object} settingsData 
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  static async saveApiSettings(settingsData) {
    try {
      // Puisque dualUpdateDoc nécessite que le document existe, nous faisons un setDoc sur les deux bases
      const params = {
        ...settingsData,
        updatedAt: new Date().toISOString()
      }

      const refPrimary = doc(db, SETTINGS_COLLECTION, API_DOC)
      await setDoc(refPrimary, params, { merge: true })

      return {
        success: true,
        message: 'Paramètres sauvegardés avec succès.'
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres API:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Récupère l'état de suspension du site depuis Firestore (collection app_settings/suspension)
   * @returns {Promise<{success: boolean, isSuspended: boolean, error?: string}>}
   */
  static async getSuspensionStatus() {
    try {
      const docRef = doc(db, 'app_settings', 'suspension')
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          success: true,
          isSuspended: !!docSnap.data().isSuspended
        }
      }
      return { success: true, isSuspended: false }
    } catch (error) {
      console.error('Erreur lors de la récupération du statut de suspension:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Met à jour l'état de suspension sur les deux bases (Primary et Secondary)
   * @param {boolean} isSuspended 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async updateSuspensionStatus(isSuspended) {
    try {
      const params = {
        isSuspended,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      }

      // 1. Mise à jour sur la base de données
      const refPrimary = doc(db, 'app_settings', 'suspension')
      await setDoc(refPrimary, params, { merge: true })

      return { success: true }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la suspension:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Récupère l'état d'archivage automatique
   */
  static async getAutoArchiveStatus() {
    try {
      const docRef = doc(db, 'app_settings', 'archive')
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          success: true,
          autoArchive: !!docSnap.data().autoArchive
        }
      }
      return { success: true, autoArchive: false }
    } catch (error) {
      console.error('Erreur lors de la récupération du statut d\'archivage:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Met à jour l'état d'archivage automatique
   */
  static async updateAutoArchiveStatus(autoArchive) {
    try {
      const params = {
        autoArchive,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      }

      const refPrimary = doc(db, 'app_settings', 'archive')
      await setDoc(refPrimary, params, { merge: true })

      return { success: true }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'archivage:', error)
      return { success: false, error: error.message }
    }
  }
}

export default SettingsService
