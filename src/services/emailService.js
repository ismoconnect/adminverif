import emailjs from '@emailjs/browser'
import { PDFGenerationService } from './pdfGenerationService'

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
      // Générer le PDF d'attestation
      let attestationUrl = ''
      try {
        const pdfData = {
          referenceNumber: submissionData.referenceNumber,
          customerName: submissionData.customerName,
          customerEmail: submissionData.customerEmail,
          amount: submissionData.amount,
          type: submissionData.type,
          coupons: submissionData.coupons || [],
          verificationDate: new Date(),
          verifiedBy: submissionData.verifiedBy || 'Administrateur'
        }
        
        attestationUrl = await PDFGenerationService.generateDownloadUrl(pdfData)
        console.log('PDF d\'attestation généré:', attestationUrl)
      } catch (pdfError) {
        console.error('Erreur génération PDF:', pdfError)
        // Continuer sans le PDF si la génération échoue
      }

      const templateParams = {
        email: submissionData.customerEmail,
        name: submissionData.customerName || 'Client',
        title: `Vérification de votre ${submissionData.type === 'coupon' ? 'coupon' : 'carte cadeau'} - Référence: ${submissionData.referenceNumber || 'N/A'}`,
        message: `Félicitations ! Votre ${submissionData.type === 'coupon' ? 'coupon' : 'carte cadeau'} d'un montant de ${submissionData.amount || '0'}€ a été vérifié avec succès.`,
        reference_number: submissionData.referenceNumber || 'N/A',
        amount: submissionData.amount || '0',
        submission_type: submissionData.type === 'coupon' ? 'Coupon' : 'Carte cadeau',
        status: 'Vérifié',
        attestation_url: attestationUrl || '#' // URL du PDF ou lien par défaut
      }

      console.log('Paramètres email:', templateParams)

      // Valider les paramètres
      const validation = this.validateEmailParams(templateParams)
      if (!validation.isValid) {
        console.error('Paramètres email invalides:', validation.errors)
        return { 
          success: false, 
          message: `Paramètres invalides: ${validation.errors.join(', ')}` 
        }
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
      
      // Gestion spécifique des erreurs EmailJS
      if (error.status === 422) {
        return { 
          success: false, 
          message: 'Erreur de validation des paramètres email. Vérifiez la configuration du template.' 
        }
      } else if (error.status === 400) {
        return { 
          success: false, 
          message: 'Erreur de configuration EmailJS. Vérifiez les identifiants de service.' 
        }
      } else {
        return { 
          success: false, 
          message: `Erreur lors de l'envoi de l'email de vérification: ${error.text || error.message}` 
        }
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
        email: submissionData.customerEmail,
        name: submissionData.customerName || 'Client',
        title: `Rejet de votre ${submissionData.type === 'coupon' ? 'coupon' : 'carte cadeau'} - Référence: ${submissionData.referenceNumber || 'N/A'}`,
        message: `Malheureusement, votre ${submissionData.type === 'coupon' ? 'coupon' : 'carte cadeau'} d'un montant de ${submissionData.amount || '0'}€ n'a pas pu être vérifié.${reason ? ` Raison: ${reason}` : ''}`,
        reference_number: submissionData.referenceNumber || 'N/A',
        amount: submissionData.amount || '0',
        submission_type: submissionData.type === 'coupon' ? 'Coupon' : 'Carte cadeau',
        status: 'Rejeté'
      }

      console.log('Paramètres email rejet:', templateParams)

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
        email: refundData.customerEmail,
        name: refundData.customerName || 'Client',
        title: `Remboursement approuvé - Référence: ${refundData.referenceNumber || 'N/A'}`,
        message: `Votre demande de remboursement a été approuvée. Le montant de ${refundData.amount || '0'}€ sera traité selon votre méthode de remboursement choisie.`,
        reference_number: refundData.referenceNumber || 'N/A',
        amount: refundData.amount || '0',
        submission_type: 'Remboursement',
        status: 'Approuvé'
      }

      console.log('Paramètres email remboursement:', templateParams)

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
        email: 'test@example.com',
        name: 'Test',
        title: 'Test EmailJS - MyVerif',
        message: 'Ceci est un email de test pour vérifier la configuration EmailJS.',
        reference_number: 'TEST-001',
        amount: '0.00',
        submission_type: 'Test',
        status: 'Test'
      }

      console.log('Test EmailJS avec paramètres:', testParams)

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
      
      if (error.status === 422) {
        return { 
          success: false, 
          message: 'Erreur 422: Vérifiez que le template EmailJS utilise les bonnes variables' 
        }
      } else if (error.status === 400) {
        return { 
          success: false, 
          message: 'Erreur 400: Vérifiez le Service ID et Template ID dans EmailJS' 
        }
      } else {
        return { 
          success: false, 
          message: `Erreur test EmailJS: ${error.text || error.message}` 
        }
      }
    }
  }

  /**
   * Valide les paramètres avant envoi
   * @param {Object} params - Paramètres à valider
   * @returns {Object} - {isValid: boolean, errors: string[]}
   */
  static validateEmailParams(params) {
    const errors = []
    
    if (!params.email || !params.email.includes('@')) {
      errors.push('Email destinataire invalide')
    }
    
    if (!params.name || params.name.trim() === '') {
      errors.push('Nom destinataire requis')
    }
    
    if (!params.title || params.title.trim() === '') {
      errors.push('Titre requis')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
