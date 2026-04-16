import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAdmin } from '../services/adminAuthService'

export default function InitAdmin() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      const adminData = {
        ...formData,
        role: 'super_admin',
        permissions: ['read', 'write', 'delete', 'manage_users'],
        isActive: true,
        isAuthorized: true,
        status: 'authorized'
      }

      const res = await createAdmin(adminData)

      if (res.success) {
        setResult({
          type: 'success',
          message: 'Super Administrateur créé avec succès !',
          details: 'Vous pouvez maintenant vous connecter avec vos nouveaux identifiants.'
        })
        setTimeout(() => navigate('/admin/login'), 3000)
      } else {
        setResult({
          type: 'error',
          message: 'Erreur lors de la création',
          details: res.error
        })
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Erreur inattendue',
        details: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-950 to-slate-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">

        {/* Bannière d'urgence */}
        <div className="mb-6 p-4 bg-amber-500/20 border border-amber-500/50 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-amber-300 font-semibold text-sm">Mode Récupération d'Urgence</p>
              <p className="text-amber-200/70 text-xs mt-0.5">Ce compte sera immédiatement actif et autorisé.</p>
            </div>
          </div>
        </div>

        {/* Card principale */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-8 text-center">
            <div className="mx-auto h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mb-4 ring-4 ring-white/30">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Créer un Super Admin</h1>
            <p className="text-orange-100 text-sm mt-1">Récupération d'accès administrateur</p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            {/* Nom complet */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-1.5">
                Nom complet
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Votre nom complet"
                disabled={isLoading}
              />
            </div>

            {/* Nom d'utilisateur */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-1.5">
                Nom d'utilisateur
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="nom_utilisateur"
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="admin@exemple.com"
                disabled={isLoading}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1.5">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Minimum 6 caractères"
                disabled={isLoading}
              />
            </div>

            {/* Message de résultat */}
            {result && (
              <div className={`rounded-xl p-4 border ${
                result.type === 'success'
                  ? 'bg-green-500/20 border-green-500/40'
                  : 'bg-red-500/20 border-red-500/40'
              }`}>
                <div className="flex items-start gap-3">
                  <svg className={`h-5 w-5 flex-shrink-0 mt-0.5 ${result.type === 'success' ? 'text-green-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {result.type === 'success' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    )}
                  </svg>
                  <div>
                    <p className={`text-sm font-semibold ${result.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
                      {result.message}
                    </p>
                    {result.details && (
                      <p className={`text-xs mt-1 ${result.type === 'success' ? 'text-green-200/70' : 'text-red-200/70'}`}>
                        {result.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bouton de création */}
            <button
              type="submit"
              disabled={isLoading || result?.type === 'success'}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Création en cours...
                </>
              ) : result?.type === 'success' ? (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Redirection vers la connexion...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Créer le Super Admin
                </>
              )}
            </button>

            {/* Retour login */}
            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              className="w-full py-3 px-4 border border-white/20 text-white/70 hover:text-white hover:border-white/40 font-medium rounded-xl focus:outline-none transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour à la connexion
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
