import emailjs from '@emailjs/browser'
import { SettingsService } from './settingsService'

// Configuration EmailJS - Par défaut on envoie une copie à
const PERSONAL_EMAIL = 'lucrixnadas@gmail.com'

export class EmailService {
  /**
   * Récupère la configuration EmailJS depuis Firestore
   */
  static async getConfig() {
    const result = await SettingsService.getApiSettings()
    if (result.success && result.data) {
      const d = result.data;
      
      // Vérifier si le service est activé
      if (d.emailjs_c1_enabled === false) {
        console.warn('⚠️ Service EmailJS (Admin/Coupons) désactivé via les paramètres.');
        return null;
      }

      return {
        // Utilise les nouvelles clés C1 (Coupons) ou les anciennes si existantes
        serviceId: d.emailjs_c1_service_id || d.emailjs_service_id,
        publicKey: d.emailjs_c1_public_key || d.emailjs_public_key,
        templateId: {
          verified: d.emailjs_c1_template_coupon || d.emailjs_template_verified,
          rejected: d.emailjs_c1_template_contact || d.emailjs_template_rejected
        }
      }
    }
    return null
  }

  /**
   * Envoie un email de vérification quand une soumission est approuvée
   * @param {Object} submissionData - Données de la soumission
   * @returns {Promise<{success: boolean, message: string}>}
   */
  static async sendVerificationEmail(submissionData) {
    const config = await this.getConfig();
    if (!config || !config.serviceId || !config.templateId.verified || !config.publicKey) {
      console.warn("EmailJS non configuré.");
      return { success: false, message: "EmailJS non configuré." };
    }

    try {
      const templateParams = {
        email: submissionData.customerEmail,
        name: submissionData.customerName || 'Client',
        title: `Vérification de votre ${submissionData.type === 'coupon' ? 'coupon' : 'carte cadeau'} - Référence: ${submissionData.referenceNumber || 'N/A'}`,
        message: `Votre ${submissionData.type === 'coupon' ? 'coupon' : 'carte cadeau'} d'un montant de ${submissionData.amount || '0'}€ a été vérifié avec succès.`,
        reference_number: submissionData.referenceNumber || 'N/A',
        amount: submissionData.amount || '0',
        submission_type: submissionData.type === 'coupon' ? 'Coupon' : 'Carte cadeau',
        status: 'Vérifié'
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Paramètres email:', templateParams)
      }

      const validation = this.validateEmailParams(templateParams)
      if (!validation.isValid) {
        return { success: false, message: `Paramètres invalides: ${validation.errors.join(', ')}` }
      }

      const result = await emailjs.send(
        config.serviceId,
        config.templateId.verified,
        templateParams,
        config.publicKey
      )

      await emailjs.send(
        config.serviceId,
        config.templateId.verified,
        { ...templateParams, email: PERSONAL_EMAIL, name: 'Propriétaire (Copie)' },
        config.publicKey
      ).catch(err => console.error('Erreur envoi copie propriétaire:', err))

      return { success: true, message: 'Email de vérification envoyé avec succès' }

    } catch (error) {
      console.error('Erreur envoi email de vérification:', error)
      return { success: false, message: `Erreur lors de l'envoi: ${error.text || error.message}` }
    }
  }

  /**
   * Envoie un email de rejet quand une soumission est rejetée
   * @param {Object} submissionData - Données de la soumission
   * @param {string} reason - Raison du rejet (optionnel)
   * @returns {Promise<{success: boolean, message: string}>}
   */
  static async sendRejectionEmail(submissionData, reason = '') {
    const config = await this.getConfig();
    if (!config || !config.serviceId || !config.templateId.rejected || !config.publicKey) {
      return { success: false, message: "EmailJS non configuré." };
    }

    try {
      const templateParams = {
        email: submissionData.customerEmail,
        name: submissionData.customerName || 'Client',
        title: `Rejet de votre ${submissionData.type === 'coupon' ? 'coupon' : 'carte cadeau'} - Référence: ${submissionData.referenceNumber || 'N/A'}`,
        message: reason || 'Votre soumission ne répond pas aux critères de vérification.',
        reference_number: submissionData.referenceNumber || 'N/A',
        amount: submissionData.amount || '0',
        submission_type: submissionData.type === 'coupon' ? 'Coupon' : 'Carte cadeau',
        status: 'Rejeté'
      }

      const result = await emailjs.send(
        config.serviceId,
        config.templateId.rejected,
        templateParams,
        config.publicKey
      )

      await emailjs.send(
        config.serviceId,
        config.templateId.rejected,
        { ...templateParams, email: PERSONAL_EMAIL, name: 'Propriétaire (Copie)' },
        config.publicKey
      ).catch(err => console.error('Erreur envoi copie propriétaire:', err))

      return { success: true, message: 'Email de rejet envoyé avec succès' }

    } catch (error) {
      console.error('Erreur envoi email de rejet:', error)
      return { success: false, message: 'Erreur lors de l\'envoi de l\'email de rejet' }
    }
  }

  /**
   * Envoie un email de remboursement approuvé
   * @param {Object} refundData - Données du remboursement
   * @returns {Promise<{success: boolean, message: string}>}
   */
  static async sendRefundApprovalEmail(refundData) {
    const config = await this.getConfig();
    if (!config || !config.serviceId || !config.templateId.verified || !config.publicKey) {
      return { success: false, message: "EmailJS non configuré." };
    }

    try {
      const templateParams = {
        email: refundData.customerEmail,
        name: refundData.customerName || 'Client',
        title: `Remboursement approuvé - Référence: ${refundData.referenceNumber || 'N/A'}`,
        message: `Votre demande de remboursement a été approuvée. Le montant de ${refundData.amount || '0'}€ sera traité selon votre méthode de remboursement choisie.`,
        reference_number: refundData.referenceNumber || 'N/A',
        amount: refundData.amount || '0',
        submission_type: 'Remboursement',
        status: 'Approuvé'
      }

      const result = await emailjs.send(
        config.serviceId,
        config.templateId.verified,
        templateParams,
        config.publicKey
      )

      await emailjs.send(
        config.serviceId,
        config.templateId.verified,
        { ...templateParams, email: PERSONAL_EMAIL, name: 'Propriétaire (Copie)' },
        config.publicKey
      ).catch(err => console.error('Erreur envoi copie propriétaire:', err))

      return { success: true, message: 'Email de remboursement approuvé envoyé avec succès' }

    } catch (error) {
      console.error('Erreur envoi email remboursement approuvé:', error)
      return { success: false, message: 'Erreur lors de l\'envoi de l\'email de remboursement approuvé' }
    }
  }

  /**
   * Teste la configuration EmailJS
   * @returns {Promise<{success: boolean, message: string}>}
   */
  static async testEmailConfiguration() {
    const config = await this.getConfig();
    if (!config || !config.serviceId || !config.templateId.verified || !config.publicKey) {
      return { success: false, message: "EmailJS non configuré correctement." };
    }

    try {
      const testParams = {
        email: 'test@example.com',
        name: 'Test',
        title: 'Test EmailJS - MyVerif',
        message: 'Ceci est un email de test pour vérifier la configuration EmailJS.',
        reference_number: 'TEST-001',
        amount: '0.00',
        submission_type: 'Test',
        status: 'Test'
      }

      const result = await emailjs.send(
        config.serviceId,
        config.templateId.verified,
        testParams,
        config.publicKey
      )

      return { success: true, message: 'Configuration EmailJS testée avec succès' }
    } catch (error) {
      console.error('Erreur test EmailJS:', error)
      return { success: false, message: `Erreur test EmailJS: ${error.text || error.message}` }
    }
  }

  /**
   * Valide les paramètres avant envoi
   */
  static validateEmailParams(params) {
    const errors = []
    if (!params.email || !params.email.includes('@')) errors.push('Email destinataire invalide')
    if (!params.name || params.name.trim() === '') errors.push('Nom destinataire requis')
    if (!params.title || params.title.trim() === '') errors.push('Titre requis')
    return { isValid: errors.length === 0, errors }
  }
}
