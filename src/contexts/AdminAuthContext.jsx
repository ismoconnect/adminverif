import { createContext, useContext, useState, useEffect } from 'react'
import { authenticateAdmin, validateAdminSession } from '../services/adminAuthService'

const AdminAuthContext = createContext(null)

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (context === null || context === undefined) {
    throw new Error('useAdminAuth doit être utilisé dans un AdminAuthProvider')
  }
  return context
}

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Vérifier la session au chargement
  useEffect(() => {
    const checkSession = async () => {
      try {
        const adminId = localStorage.getItem('adminId')
        if (adminId) {
          const result = await validateAdminSession(adminId)
          if (result.success) {
            setAdmin(result.admin)
          } else {
            localStorage.removeItem('adminId')
          }
        }
      } catch (error) {
        console.error('Erreur vérification session:', error)
        localStorage.removeItem('adminId')
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (username, password) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await authenticateAdmin(username, password)
      
      if (result.success) {
        setAdmin(result.admin)
        localStorage.setItem('adminId', result.admin.id)
        return { success: true }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = 'Erreur de connexion'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour connecter automatiquement un admin après création
  const autoLogin = async (adminData) => {
    try {
      setLoading(true)
      setError(null)
      
      // Simuler une authentification réussie avec les données de l'admin créé
      const admin = {
        id: adminData.id,
        username: adminData.username,
        name: adminData.name,
        email: adminData.email,
        role: adminData.role,
        permissions: adminData.permissions,
        isActive: adminData.isActive
      }
      
      setAdmin(admin)
      localStorage.setItem('adminId', admin.id)
      return { success: true, admin }
    } catch (error) {
      const errorMessage = 'Erreur de connexion automatique'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setAdmin(null)
    localStorage.removeItem('adminId')
    setError(null)
  }

  const value = {
    admin,
    loading,
    error,
    login,
    autoLogin,
    logout,
    isAuthenticated: !!admin
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}
