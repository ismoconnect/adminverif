import emailjs from '@emailjs/browser'

// Configuration EmailJS
const EMAILJS_CONFIG = {
  serviceId: 'service_rnqc9zh',
  templateId: {
    verified: 'template_asgn9e8', // Template pour statut vérifié
    rejected: 'template_asgn9e8'  // Template pour statut rejeté (même template, contenu différent)
  },
  publicKey: '6RR8pBaWS0fFEa_tG'
}

// Initialiser EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey)

export class EmailService {
  /**
   * Envoie un email de vérification quand une soumission est approuvée
   * @param {Object} submissionData - Données de la soumission
   * @param {string} submissionData.customerEmail - Email du client
   * @param {string} submissionData.customerName - Nom du client
   * @param {string} submissionData.referenceNumber - Numéro de référence
   * @param {string} submissionData.amount - Montant
   * @param {string} submissionData.type - Type (coupon/carte cadeau)
   * @returns {Promise<{success: boolean, message: string}>}
   */
  static async sendVerificationEmail(submissionData) {
    try {
      const templateParams = {
        to_email: submissionData.customerEmail,
        to_name: submissionData.customerName || 'Client',
        reference_number: submissionData.referenceNumber,
        amount: submissionData.amount,
        submission_type: submissionData.type === 'coupon' ? 'Coupon' : 'Carte cadeau',
        status: 'Vérifié',
        message: `Félicitations ! Votre ${submissionData.type === 'coupon' ? 'coupon' : 'carte cadeau'} a été vérifié avec succès.`,
        subject: 'Vérification de votre soumission - MyVerif'
      }

      const result = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId.verified,
        templateParams
      )

      console.log('Email de vérification envoyé:', result)
      return { 
        success: true, 
        message: 'Email de vérification envoyé avec succès' 
      }

    } catch (error) {
      console.error('Erreur envoi email de vérification:', error)
      return { 
        success: false, 
        message: 'Erreur lors de l\'envoi de l\'email de vérification' 
      }
    }
  }

  /**
   * Envoie un email de rejet quand une soumission est rejetée
   * @param {Object} submissionData - Données de la soumission
   * @param {string} submissionData.customerEmail - Email du client
   * @param {string} submissionData.customerName - Nom du client
   * @param {string} submissionData.referenceNumber - Numéro de référence
   * @param {string} submissionData.amount - Montant
   * @param {string} submissionData.type - Type (coupon/carte cadeau)
   * @param {string} reason - Raison du rejet (optionnel)
   * @returns {Promise<{success: boolean, message: string}>}
   */
  static async sendRejectionEmail(submissionData, reason = '') {
    try {
      const templateParams = {
        to_email: submissionData.customerEmail,
        to_name: submissionData.customerName || 'Client',
        reference_number: submissionData.referenceNumber,
        amount: submissionData.amount,
        submission_type: submissionData.type === 'coupon' ? 'Coupon' : 'Carte cadeau',
        status: 'Rejeté',
        message: `Malheureusement, votre ${submissionData.type === 'coupon' ? 'coupon' : 'carte cadeau'} n'a pas pu être vérifié.${reason ? ` Raison: ${reason}` : ''}`,
        subject: 'Statut de votre soumission - MyVerif'
      }

      const result = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId.rejected,
        templateParams
      )

      console.log('Email de rejet envoyé:', result)
      return { 
        success: true, 
        message: 'Email de rejet envoyé avec succès' 
      }

    } catch (error) {
      console.error('Erreur envoi email de rejet:', error)
      return { 
        success: false, 
        message: 'Erreur lors de l\'envoi de l\'email de rejet' 
      }
    }
  }

  /**
   * Envoie un email de remboursement approuvé
   * @param {Object} refundData - Données du remboursement
   * @returns {Promise<{success: boolean, message: string}>}
   */
  static async sendRefundApprovalEmail(refundData) {
    try {
      const templateParams = {
        to_email: refundData.customerEmail,
        to_name: refundData.customerName || 'Client',
        reference_number: refundData.referenceNumber,
        amount: refundData.amount,
        submission_type: 'Remboursement',
        status: 'Approuvé',
        message: `Votre demande de remboursement a été approuvée. Le montant de ${refundData.amount}€ sera traité selon votre méthode de remboursement choisie.`,
        subject: 'Remboursement approuvé - MyVerif'
      }

      const result = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId.verified, // Utiliser le même template
        templateParams
      )

      console.log('Email de remboursement approuvé envoyé:', result)
      return { 
        success: true, 
        message: 'Email de remboursement approuvé envoyé avec succès' 
      }

    } catch (error) {
      console.error('Erreur envoi email remboursement approuvé:', error)
      return { 
        success: false, 
        message: 'Erreur lors de l\'envoi de l\'email de remboursement approuvé' 
      }
    }
  }

  /**
   * Teste la configuration EmailJS
   * @returns {Promise<{success: boolean, message: string}>}
   */
  static async testEmailConfiguration() {
    try {
      const testParams = {
        to_email: 'test@example.com',
        to_name: 'Test',
        reference_number: 'TEST-001',
        amount: '0.00',
        submission_type: 'Test',
        status: 'Test',
        message: 'Ceci est un email de test pour vérifier la configuration EmailJS.',
        subject: 'Test EmailJS - MyVerif'
      }

      const result = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId.verified,
        testParams
      )

      console.log('Test EmailJS réussi:', result)
      return { 
        success: true, 
        message: 'Configuration EmailJS testée avec succès' 
      }

    } catch (error) {
      console.error('Erreur test EmailJS:', error)
      return { 
        success: false, 
        message: 'Erreur lors du test de la configuration EmailJS' 
      }
    }
  }
}
