import { useState, useEffect } from 'react'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { SettingsService } from '../services/settingsService'

export default function ApiSettings() {
  const { admin } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [settings, setSettings] = useState({
    telegram_enabled: true,
    telegram_bot_token: '8585200194:AAH1_4YuuuESNcwUrHF6jwlJ4vFCGiKm2BI',
    telegram_chat_id: '7664405364',
    // Compte 1 (Pré-rempli)
    emailjs_c1_enabled: true,
    emailjs_c1_service_id: 'service_xumep4e',
    emailjs_c1_public_key: 'qa4AthuxZDmIeBUtw',
    emailjs_c1_template_coupon: 'template_1qrxiop',
    emailjs_c1_template_contact: 'template_p4rg6lr',
    // Compte 2 (Pré-rempli)
    emailjs_c2_enabled: true,
    emailjs_c2_service_id: 'service_3f5xa3h',
    emailjs_c2_public_key: '2tcYuL1VPtotjaU3B',
    emailjs_c2_template_form: 'template_ao4sux7',
    emailjs_c2_template_team: 'template_vdktnpk',
    // Compte 3 (Pré-rempli)
    emailjs_c3_enabled: true,
    emailjs_c3_service_id: 'service_ep3hf8v',
    emailjs_c3_public_key: '2ufmUA7aW7sXW-Gzh',
    emailjs_c3_template_client: 'template_22fpmv3',
    emailjs_c3_template_team: 'template_o1496ug',
    visitor_notification_email: 'iarasophiecap@gmail.com'
  })
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (admin?.role === 'super_admin') {
      loadSettings()
    } else {
      setLoading(false)
    }
  }, [admin])

  const loadSettings = async () => {
    setLoading(true)
    setMessage({ type: '', text: '' })
    const result = await SettingsService.getApiSettings()
    if (result.success && result.data && Object.keys(result.data).length > 0) {
      setSettings(prev => ({
        ...prev,
        ...result.data
      }))
    } else if (!result.success) {
      setMessage({ type: 'error', text: result.error || 'Impossible de charger la configuration.' })
    }
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }

  // Composant Toggle réutilisable
  const Toggle = ({ name, label, enabled }) => (
    <div className="flex items-center justify-between mb-4 pb-2 border-b border-opacity-20 cursor-pointer" onClick={() => handleInputChange({ target: { name, type: 'checkbox', checked: !enabled } })}>
      <span className="text-sm font-bold uppercase tracking-wider">{label}</span>
      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </div>
    </div>
  )

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    const result = await SettingsService.saveApiSettings(settings)
    if (result.success) {
      setMessage({ type: 'success', text: 'Paramètres sauvegardés avec succès.' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Erreur lors de la sauvegarde.' })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (admin?.role !== 'super_admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-800">Accès Refusé</h3>
          <p className="mt-2 text-sm text-red-700">Seuls les super-administrateurs peuvent voir cette page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gradient-to-r from-slate-800 to-slate-900">
          <h3 className="text-lg leading-6 font-medium text-white flex items-center">
            <span className="mr-2">⚡</span> Configuration API et Messages
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Activez ou désactivez les services et gérez vos clés en temps réel.
          </p>
        </div>

        <div className="p-6 space-y-8">
          {message.text && (
            <div className={`p-4 rounded-md flex items-center ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
              <span className="mr-2">{message.type === 'success' ? '✅' : '❌'}</span>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
            {/* Telegram Settings */}
            <div className={`bg-blue-50 p-6 rounded-xl border transition-all ${settings.telegram_enabled ? 'border-blue-200' : 'border-gray-200 grayscale opacity-75'}`}>
              <Toggle name="telegram_enabled" label="Notifications Telegram" enabled={settings.telegram_enabled} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-blue-800 uppercase mb-1">Bot Token</label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      name="telegram_bot_token"
                      value={settings.telegram_bot_token}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-blue-200 rounded-lg shadow-sm py-2 px-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                      placeholder="ex: 123456789:ABCDE..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors z-10"
                      title={showToken ? "Masquer" : "Afficher"}
                    >
                      {showToken ? (
                        <span className="text-lg">👁️‍🗨️</span>
                      ) : (
                        <span className="text-lg">👁️</span>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-blue-800 uppercase mb-1">Chat ID (Propriétaire)</label>
                  <input
                    type="text"
                    name="telegram_chat_id"
                    value={settings.telegram_chat_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-blue-200 rounded-lg shadow-sm py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                    placeholder="ex: -10012345678"
                  />
                </div>
              </div>
            </div>

            {/* EmailJS ACCOUNT 1 */}
            <div className={`p-6 rounded-xl border transition-all ${settings.emailjs_c1_enabled ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200 grayscale opacity-75'}`}>
              <Toggle name="emailjs_c1_enabled" label="EmailJS - Compte 1 (Coupons)" enabled={settings.emailjs_c1_enabled} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-orange-800 uppercase mb-1">Service ID</label>
                  <input
                    type="text"
                    name="emailjs_c1_service_id"
                    value={settings.emailjs_c1_service_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-orange-200 rounded-lg shadow-sm py-2 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-orange-800 uppercase mb-1">Public Key</label>
                  <input
                    type="text"
                    name="emailjs_c1_public_key"
                    value={settings.emailjs_c1_public_key}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-orange-200 rounded-lg shadow-sm py-2 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-orange-800 uppercase mb-1">Template (Confirmation Coupon)</label>
                  <input
                    type="text"
                    name="emailjs_c1_template_coupon"
                    value={settings.emailjs_c1_template_coupon}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-orange-200 rounded-lg shadow-sm py-2 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-orange-800 uppercase mb-1">Template (Notification Support)</label>
                  <input
                    type="text"
                    name="emailjs_c1_template_contact"
                    value={settings.emailjs_c1_template_contact}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-orange-200 rounded-lg shadow-sm py-2 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-white"
                  />
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-orange-100">
                <label className="block text-xs font-black text-orange-800 uppercase mb-2 tracking-widest">
                  📧 Email de notification des arrivées (Visiteurs direct)
                </label>
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      name="visitor_notification_email"
                      value={settings.visitor_notification_email}
                      onChange={handleInputChange}
                      className="block w-full border border-orange-200 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-white"
                      placeholder="ex: iarasophiecap@gmail.com"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-orange-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-orange-600 font-bold opacity-75">
                  Cette adresse recevra un email automatique dès qu'un nouveau visiteur arrive sur le site.
                </p>
              </div>
            </div>

            {/* EmailJS ACCOUNT 2 */}
            <div className={`p-6 rounded-xl border transition-all ${settings.emailjs_c2_enabled ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200 grayscale opacity-75'}`}>
              <Toggle name="emailjs_c2_enabled" label="EmailJS - Compte 2 (Contact)" enabled={settings.emailjs_c2_enabled} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-purple-800 uppercase mb-1">Service ID</label>
                  <input
                    type="text"
                    name="emailjs_c2_service_id"
                    value={settings.emailjs_c2_service_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-purple-200 rounded-lg shadow-sm py-2 px-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-purple-800 uppercase mb-1">Public Key</label>
                  <input
                    type="text"
                    name="emailjs_c2_public_key"
                    value={settings.emailjs_c2_public_key}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-purple-200 rounded-lg shadow-sm py-2 px-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-purple-800 uppercase mb-1">Template (Confirmation Client)</label>
                  <input
                    type="text"
                    name="emailjs_c2_template_form"
                    value={settings.emailjs_c2_template_form}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-purple-200 rounded-lg shadow-sm py-2 px-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-purple-800 uppercase mb-1">Template (Notification Support)</label>
                  <input
                    type="text"
                    name="emailjs_c2_template_team"
                    value={settings.emailjs_c2_template_team}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-purple-200 rounded-lg shadow-sm py-2 px-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            {/* EmailJS ACCOUNT 3 */}
            <div className={`p-6 rounded-xl border transition-all ${settings.emailjs_c3_enabled ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-200 grayscale opacity-75'}`}>
              <Toggle name="emailjs_c3_enabled" label="EmailJS - Compte 3 (Remboursement)" enabled={settings.emailjs_c3_enabled} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-teal-800 uppercase mb-1">Service ID</label>
                  <input
                    type="text"
                    name="emailjs_c3_service_id"
                    value={settings.emailjs_c3_service_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-teal-200 rounded-lg shadow-sm py-2 px-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-teal-800 uppercase mb-1">Public Key</label>
                  <input
                    type="text"
                    name="emailjs_c3_public_key"
                    value={settings.emailjs_c3_public_key}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-teal-200 rounded-lg shadow-sm py-2 px-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-teal-800 uppercase mb-1">Template (Confirmation Client)</label>
                  <input
                    type="text"
                    name="emailjs_c3_template_client"
                    value={settings.emailjs_c3_template_client}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-teal-200 rounded-lg shadow-sm py-2 px-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-teal-800 uppercase mb-1">Template (Notification Support)</label>
                  <input
                    type="text"
                    name="emailjs_c3_template_team"
                    value={settings.emailjs_c3_template_team}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-teal-200 rounded-lg shadow-sm py-2 px-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-all transform hover:scale-105 active:scale-95"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  'Sauvegarder les modifications'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
