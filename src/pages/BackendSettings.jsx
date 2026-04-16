import { useState, useEffect } from 'react'
import { currentBackend, switchBackendView } from '../lib/firebase'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import SettingsService from '../services/settingsService'
import { toast } from 'react-toastify'

// Composants SVG locaux pour éviter les dépendances externes
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
  const [loading, setLoading] = useState(false)
  const [suspensionLoading, setSuspensionLoading] = useState(true)
  const [isSuspended, setIsSuspended] = useState(false)

  useEffect(() => {
    fetchSuspensionStatus()
  }, [])

  const fetchSuspensionStatus = async () => {
    setSuspensionLoading(true)
    const result = await SettingsService.getSuspensionStatus()
    if (result.success) {
      setIsSuspended(result.isSuspended)
    }
    setSuspensionLoading(false)
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

  const handleSwitch = (type) => {
    setLoading(true)
    switchBackendView(type)
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
            Configuration du Backend & Migration
          </h3>
          <p className="mt-1 text-sm text-slate-300">
            Gérez la transition entre vos projets Firebase et la duplication des données.
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* État de la Duplication */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Statut de la Duplication : ACTIVÉ
            </h4>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Chaque action d'écriture (nouvelle soumission, mise à jour de statut, nouvel admin) est actuellement envoyée **simultanément** vers vos deux projets Firebase.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contrôle de Suspension (RESERVE SUPER-ADMIN) */}
          <div className="border-t pt-8">
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

          {/* Sélecteur de Backend de VUE */}
          <div className="border-t pt-8">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Sélecteur de Backend (Vue)</h4>
            <p className="text-sm text-gray-500 mb-6">
              Choisissez le projet Firebase que vous souhaitez visualiser dans ce tableau de bord. 
              <br /><span className="text-orange-600 font-medium">Note : Changer la vue rechargera la page.</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option Nouveau Backend (Primaire) */}
              <div 
                className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${
                  currentBackend === 'primary' 
                    ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' 
                    : 'border-gray-200 hover:border-orange-200'
                }`}
                onClick={() => !loading && currentBackend !== 'primary' && handleSwitch('primary')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-900">NOUVEAU BACKEND</span>
                  {currentBackend === 'primary' && (
                    <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase">Actif</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-1">ID Projet: adminmyverif</p>
                <p className="text-[11px] text-gray-400">C'est le backend principal par défaut pour les nouveaux utilisateurs.</p>
              </div>

              {/* Option Ancien Backend (Secondaire) */}
              <div 
                className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${
                  currentBackend === 'secondary' 
                    ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' 
                    : 'border-gray-200 hover:border-purple-200'
                }`}
                onClick={() => !loading && currentBackend !== 'secondary' && handleSwitch('secondary')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-900">ANCIEN BACKEND</span>
                  {currentBackend === 'secondary' && (
                    <span className="bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase">Actif</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-1">ID Projet: myverif-67454</p>
                <p className="text-[11px] text-gray-400">À utiliser pour vérifier les anciennes données non migrées.</p>
              </div>
            </div>
          </div>

          {/* Info de Sécurité */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 text-xs text-yellow-800">
            <strong>IMPORTANT :</strong> Le système de duplication est permanent. Même si vous visualisez l'ancien backend, vos nouvelles écritures seront toujours copiées sur le nouveau pour garantir que rien n'est perdu durant la transition.
          </div>
        </div>
      </div>
    </div>
  )
}
