/**
 * Service pour l'envoi de notifications via Telegram
 * Utilisé pour les copies personnelles du propriétaire dans l'Admin
 */
export class TelegramService {
    // Utiliser des constantes ou process.env si disponible
    static BOT_TOKEN = '8585200194:AAH1_4YuuuESNcwUrHF6jwlJ4vFCGiKm2BI';
    static CHAT_ID = '7783827859';

    /**
     * Envoie un message formaté via Telegram
     */
    static async sendMessage(message) {
        if (!this.BOT_TOKEN || this.BOT_TOKEN === 'VOTRE_BOT_TOKEN_ICI') {
            console.warn('Telegram non configuré dans l\'Admin.');
            return { success: false };
        }

        try {
            const response = await fetch(`https://api.telegram.org/bot${this.BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.CHAT_ID,
                    text: message,
                    parse_mode: 'HTML',
                }),
            });
            return { success: true };
        } catch (error) {
            console.error('Erreur TG Admin:', error);
            return { success: false };
        }
    }

    /**
     * Notifie d'une action admin (Vérification/Rejet)
     */
    static async notifyAdminAction(action, data) {
        const message = `
<b>🛠️ Action Admin: ${action}</b>
----------------------------------
<b>Client:</b> ${data.customerName}
<b>Référence:</b> <code>${data.referenceNumber}</code>
<b>Montant:</b> ${data.amount} €
<b>Statut:</b> ${data.status}
${data.reason ? `<b>Raison:</b> ${data.reason}` : ''}
    `.trim();

        return this.sendMessage(message);
    }
}

export default TelegramService;
