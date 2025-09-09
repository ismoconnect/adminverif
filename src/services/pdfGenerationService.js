import jsPDF from 'jspdf'
import 'jspdf-autotable'

export class PDFGenerationService {
  /**
   * Génère un PDF d'attestation de vérification
   * @param {Object} data - Données de la soumission
   * @param {string} data.referenceNumber - Numéro de référence
   * @param {string} data.customerName - Nom du client
   * @param {string} data.customerEmail - Email du client
   * @param {string} data.amount - Montant
   * @param {string} data.type - Type (coupon/carte cadeau)
   * @param {Array} data.coupons - Liste des coupons (si applicable)
   * @param {string} data.verificationDate - Date de vérification
   * @param {string} data.verifiedBy - Nom de l'admin qui a vérifié
   * @returns {Promise<Blob>} - PDF généré
   */
  static async generateVerificationCertificate(data) {
    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      
      // Couleurs
      const primaryColor = [249, 115, 22] // Orange
      const secondaryColor = [16, 185, 129] // Vert
      const textColor = [31, 41, 55] // Gris foncé
      const lightGray = [243, 244, 246] // Gris clair

      // Header avec logo et titre
      doc.setFillColor(...primaryColor)
      doc.rect(0, 0, pageWidth, 40, 'F')
      
      // Titre principal
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('ATTESTATION DE VÉRIFICATION', pageWidth / 2, 20, { align: 'center' })
      
      // Sous-titre
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text('Service d\'Attestation de Coupon', pageWidth / 2, 30, { align: 'center' })

      // Contenu principal
      let yPosition = 60
      
      // Badge de statut
      doc.setFillColor(...secondaryColor)
      doc.roundedRect(pageWidth / 2 - 30, yPosition, 60, 15, 3, 3, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('✅ VÉRIFIÉ', pageWidth / 2, yPosition + 10, { align: 'center' })
      
      yPosition += 35

      // Message de félicitations
      doc.setTextColor(...textColor)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Félicitations !', pageWidth / 2, yPosition, { align: 'center' })
      
      yPosition += 15
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      const message = `Votre ${data.type === 'coupon' ? 'coupon' : 'carte cadeau'} a été vérifié avec succès.`
      doc.text(message, pageWidth / 2, yPosition, { align: 'center' })
      
      yPosition += 30

      // Détails de la vérification
      doc.setFillColor(...lightGray)
      doc.rect(20, yPosition, pageWidth - 40, 80, 'F')
      
      // Titre de la section
      doc.setTextColor(...textColor)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Détails de la Vérification', 30, yPosition + 15)
      
      yPosition += 25

      // Informations détaillées
      const details = [
        ['Référence', data.referenceNumber],
        ['Client', data.customerName],
        ['Email', data.customerEmail],
        ['Type', data.type === 'coupon' ? 'Coupon' : 'Carte cadeau'],
        ['Montant', `${data.amount}€`],
        ['Date de vérification', this.formatDate(data.verificationDate)],
        ['Vérifié par', data.verifiedBy || 'Administrateur']
      ]

      details.forEach(([label, value], index) => {
        const rowY = yPosition + (index * 8)
        
        // Label
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(75, 85, 99) // Gris moyen
        doc.text(`${label}:`, 30, rowY)
        
        // Valeur
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...textColor)
        doc.text(value, 80, rowY)
      })

      yPosition += 100

      // Si des coupons spécifiques sont fournis
      if (data.coupons && data.coupons.length > 0) {
        doc.setFillColor(...lightGray)
        doc.rect(20, yPosition, pageWidth - 40, 60, 'F')
        
        doc.setTextColor(...textColor)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Coupons Vérifiés', 30, yPosition + 15)
        
        yPosition += 25

        // Tableau des coupons
        const couponData = data.coupons.map(coupon => [
          coupon.code || 'N/A',
          coupon.value || 'N/A',
          coupon.status === 'verified' ? 'Vérifié' : 'En attente'
        ])

        doc.autoTable({
          startY: yPosition,
          head: [['Code', 'Valeur', 'Statut']],
          body: couponData,
          theme: 'grid',
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          bodyStyles: {
            textColor: textColor
          },
          margin: { left: 30, right: 30 }
        })

        yPosition = doc.lastAutoTable.finalY + 20
      }

      // Signature et date
      yPosition = Math.max(yPosition, pageHeight - 80)
      
      doc.setTextColor(...textColor)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Cette attestation a été générée automatiquement le', 30, yPosition)
      doc.text(this.formatDate(new Date()), 30, yPosition + 10)
      
      // Signature
      doc.text('Signature électronique:', pageWidth - 100, yPosition)
      doc.setFont('helvetica', 'bold')
      doc.text('Service d\'Attestation', pageWidth - 100, yPosition + 10)

      // Footer
      doc.setFillColor(...lightGray)
      doc.rect(0, pageHeight - 20, pageWidth, 20, 'F')
      
      doc.setTextColor(107, 114, 128) // Gris
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('© 2024 Comprignt - Service d\'Attestation de Coupon', pageWidth / 2, pageHeight - 10, { align: 'center' })

      // Générer le blob
      const pdfBlob = doc.output('blob')
      return pdfBlob

    } catch (error) {
      console.error('Erreur génération PDF:', error)
      throw new Error('Erreur lors de la génération du PDF')
    }
  }

  /**
   * Génère une URL de téléchargement pour le PDF
   * @param {Object} data - Données de la soumission
   * @returns {Promise<string>} - URL de téléchargement
   */
  static async generateDownloadUrl(data) {
    try {
      const pdfBlob = await this.generateVerificationCertificate(data)
      
      // Créer une URL temporaire pour le téléchargement
      const url = URL.createObjectURL(pdfBlob)
      
      // Optionnel: Programmer la suppression de l'URL après 1 heure
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 3600000) // 1 heure
      
      return url
    } catch (error) {
      console.error('Erreur génération URL:', error)
      throw error
    }
  }

  /**
   * Formate une date pour l'affichage
   * @param {Date|string} date - Date à formater
   * @returns {string} - Date formatée
   */
  static formatDate(date) {
    const d = new Date(date)
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Sauvegarde le PDF sur le serveur (optionnel)
   * @param {Object} data - Données de la soumission
   * @param {string} submissionId - ID de la soumission
   * @returns {Promise<string>} - URL de sauvegarde
   */
  static async savePDFToServer(data, submissionId) {
    try {
      const pdfBlob = await this.generateVerificationCertificate(data)
      
      // Ici vous pouvez implémenter la sauvegarde sur votre serveur
      // Par exemple, upload vers Firebase Storage ou votre API
      
      // Exemple avec Firebase Storage (à adapter selon votre setup)
      /*
      const storageRef = ref(storage, `certificates/${submissionId}.pdf`)
      const uploadResult = await uploadBytes(storageRef, pdfBlob)
      const downloadURL = await getDownloadURL(uploadResult.ref)
      return downloadURL
      */
      
      // Pour l'instant, retourner une URL temporaire
      return URL.createObjectURL(pdfBlob)
      
    } catch (error) {
      console.error('Erreur sauvegarde PDF:', error)
      throw error
    }
  }
}
