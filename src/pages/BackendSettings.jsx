import { useState, useEffect } from 'react'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import SettingsService from '../services/settingsService'
import { toast } from 'react-toastify'

const RefreshCw = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M3 21v-5h5"/>
  </svg>
);

const ShieldAlert = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
    <path d="M12 8v4"/>
    <path d="M12 16h.01"/>
  </svg>
);

export default function BackendSettings() {
  const { admin } = useAdminAuth()
  const [suspensionLoading, setSuspensionLoading] = useState(true)
  const [isSuspended, setIsSuspended] = useState(false)

  // Auto-archive state
  const [autoArchive, setAutoArchive] = useState(false)
  const [archiveLoading, setArchiveLoading] = useState(true)

  useEffect(() => {
    fetchSuspensionStatus()
    fetchArchiveStatus()
  }, [])

  const fetchSuspensionStatus = async () => {
    setSuspensionLoading(true)
    const result = await SettingsService.getSuspensionStatus()
    if (result.success) {
      setIsSuspended(result.isSuspended)
    }
    setSuspensionLoading(false)
  }

  const fetchArchiveStatus = async () => {
    setArchiveLoading(true)
    const result = await SettingsService.getAutoArchiveStatus()
    if (result.success) {
      setAutoArchive(result.autoArchive)
    }
    setArchiveLoading(false)
  }

  const handleToggleSuspension = async () => {
    const action = isSuspended ? 'réactiver' : 'suspendre'
    if (!window.confirm(`Êtes-vous sûr de vouloir ${action} l'accès client à la plateforme ?`)) {
      return
    }

    setSuspensionLoading(true)
    const result = await SettingsService.updateSuspensionStatus(!isSuspended)
    
    if (result.success) {
      setIsSuspended(!isSuspended)
      toast.success(`Plateforme ${!isSuspended ? 'suspendue' : 'réactivée'} avec succès !`)
    } else {
      toast.error('Erreur lors de la mise à jour de la suspension.')
    }
    setSuspensionLoading(false)
  }

  const handleToggleAutoArchive = async () => {
    const newValue = !autoArchive
    const action = newValue ? 'activer' : 'désactiver'
    
    if (newValue && !window.confirm('Activer l\'archivage automatique ?\n\nToutes les nouvelles soumissions seront automatiquement masquées des admins normaux. Seul le super_admin pourra les voir dans l\'onglet Archives.\n\nLes soumissions déjà archivées resteront archivées même si vous désactivez cette option plus tard.')) {
      return
    }

    setArchiveLoading(true)
    const result = await SettingsService.updateAutoArchiveStatus(newValue)
    if (result.success) {
      setAutoArchive(newValue)
      toast.success(`Archivage automatique ${newValue ? 'activé' : 'désactivé'} !`)
    } else {
      toast.error('Erreur lors de la mise à jour.')
    }
    setArchiveLoading(false)
  }

  if (admin?.role !== 'super_admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-800">Accès Refusé</h3>
          <p className="mt-2 text-sm text-red-700">Seuls les super-administrateurs peuvent gérer les paramètres système.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gradient-to-r from-slate-800 to-slate-900">
          <h3 className="text-lg leading-6 font-medium text-white">
            Paramètres Système & Accès Plateforme
          </h3>
          <p className="mt-1 text-sm text-slate-300">
            Gérez l'état du site client et l'archivage des soumissions.
          </p>
        </div>

        <div className="p-6 space-y-8">

          {/* Contrôle de Suspension */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium text-gray-900">Accès Plateforme Cliente</h4>
                <p className="text-sm text-gray-500">Contrôlez si les utilisateurs peuvent accéder au site ou s'ils voient la page de suspension.</p>
              </div>
              <div className="flex items-center space-x-2">
                {suspensionLoading && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />}
                <button
                  disabled={suspensionLoading}
                  onClick={handleToggleSuspension}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isSuspended ? 'bg-red-600' : 'bg-green-500'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isSuspended ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className={`rounded-xl p-5 border-2 ${
              isSuspended 
                ? 'border-red-200 bg-red-50' 
                : 'border-green-100 bg-green-50'
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`rounded-full p-3 ${isSuspended ? 'bg-red-100' : 'bg-green-100'}`}>
                  <ShieldAlert className={`w-6 h-6 ${isSuspended ? 'text-red-700' : 'text-green-700'}`} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${isSuspended ? 'text-red-800' : 'text-green-800'}`}>
                    ÉCRAN DE SUSPENSION : {isSuspended ? 'ACTIVÉ (Site Bloqué)' : 'DÉSACTIVÉ (Site Ouvert)'}
                  </p>
                  <p className={`text-xs ${isSuspended ? 'text-red-600' : 'text-green-600'}`}>
                    {isSuspended 
                      ? 'Tous les accès sont redirigés vers la page de maintenance sécurisée.' 
                      : 'Les clients peuvent soumettre leurs coupons et consulter leurs suivis normalement.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Archivage automatique */}
          <div className="border-t pt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium text-gray-900">🗄️ Archivage Automatique</h4>
                <p className="text-sm text-gray-500">Quand activé, chaque nouvelle soumission est automatiquement masquée des admins normaux.</p>
              </div>
              <div className="flex items-center space-x-2">
                {archiveLoading && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />}
                <button
                  disabled={archiveLoading}
                  onClick={handleToggleAutoArchive}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoArchive ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoArchive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className={`rounded-xl p-5 border-2 ${
              autoArchive 
                ? 'border-orange-200 bg-orange-50' 
                : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`rounded-full p-3 ${autoArchive ? 'bg-orange-100' : 'bg-gray-100'}`}>
                  <span className="text-2xl">{autoArchive ? '🗄️' : '📋'}</span>
                </div>
                <div>
                  <p className={`text-sm font-bold ${autoArchive ? 'text-orange-800' : 'text-gray-700'}`}>
                    {autoArchive ? 'ARCHIVAGE ACTIF — Les nouvelles soumissions sont masquées' : 'ARCHIVAGE INACTIF — Les soumissions sont visibles normalement'}
                  </p>
                  <p className={`text-xs ${autoArchive ? 'text-orange-600' : 'text-gray-500'}`}>
                    {autoArchive 
                      ? 'Seul le super_admin voit les nouvelles soumissions dans l\'onglet Archives. Les soumissions archivées resteront archivées même si vous désactivez cette option.' 
                      : 'Tous les admins voient les nouvelles soumissions dans la liste principale.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
