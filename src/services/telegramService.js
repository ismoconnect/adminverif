import { SettingsService } from './settingsService'

/**
 * Service pour l'envoi de notifications via Telegram
 * Utilisé pour les copies personnelles du propriétaire dans l'Admin
 */
export class TelegramService {
    /**
     * Récupère la configuration Telegram depuis Firestore
     */
    static async getConfig() {
        const result = await SettingsService.getApiSettings();
        if (result.success && result.data) {
            if (result.data.telegram_enabled === false) {
                console.warn('⚠️ Service Telegram (Admin) désactivé via les paramètres.');
                return { botToken: null, chatId: null };
            }
            return {
                botToken: result.data.telegram_bot_token,
                chatId: result.data.telegram_chat_id
            };
        }
        return { botToken: null, chatId: null };
    }

    /**
     * Envoie un message formaté via Telegram
     */
    static async sendMessage(message) {
        const config = await this.getConfig();
        if (!config.botToken || !config.chatId) {
            console.warn('Telegram non configuré dans l\'Admin (clés manquantes).');
            return { success: false };
        }

        try {
            const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: config.chatId,
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
