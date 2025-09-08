import { useState } from 'react'
import { createAdmin } from '../services/adminAuthService'

export default function InitAdmin() {
  const [formData, setFormData] = useState({
    username: 'admin',
    password: 'admin123',
    name: 'Administrateur Principal',
    email: 'admin@myverif.com'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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
        isActive: true
      }

      const result = await createAdmin(adminData)
      
      if (result.success) {
        setResult({
          type: 'success',
          message: 'Administrateur créé avec succès !',
          details: 'Votre compte est en attente d\'autorisation. Un super-administrateur doit approuver votre accès avant que vous puissiez vous connecter.'
        })
      } else {
        setResult({
          type: 'error',
          message: 'Erreur lors de la création',
          details: result.error
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-orange-500 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Initialisation Admin
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Créer le premier administrateur du système
          </p>
        </div>

        {/* Formulaire */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Nom d'utilisateur */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="admin"
                disabled={isLoading}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="admin123"
                disabled={isLoading}
              />
            </div>

            {/* Nom complet */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="Administrateur Principal"
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="admin@myverif.com"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Message de résultat */}
          {result && (
            <div className={`border rounded-md p-3 ${
              result.type === 'success' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex">
                <svg className={`h-5 w-5 ${
                  result.type === 'success' ? 'text-green-400' : 'text-red-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {result.type === 'success' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    result.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.message}
                  </p>
                  {result.details && (
                    <p className={`text-sm mt-1 ${
                      result.type === 'success' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {result.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bouton de création */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Création en cours...
                </div>
              ) : (
                'Créer l\'administrateur'
              )}
            </button>
          </div>
        </form>

        {/* Informations */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex">
            <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Processus d'autorisation</h3>
              <p className="text-sm text-blue-700 mt-1">
                Après la création de votre compte, un super-administrateur doit autoriser votre accès 
                dans Firestore avant que vous puissiez vous connecter au système.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
