import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../contexts/AdminAuthContext'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAdminAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Rediriger vers la page de connexion en gardant l'URL de destination
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return children
}
