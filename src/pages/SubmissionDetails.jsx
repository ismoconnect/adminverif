import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

// Icônes SVG
const ArrowLeft = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const Clock = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CheckCircle = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const XCircle = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const Mail = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const User = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const Calendar = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const CreditCard = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
)

const Edit = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

export default function SubmissionDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubmission()
  }, [id])

  const fetchSubmission = async () => {
    try {
      setLoading(true)
      const docRef = doc(db, 'coupon_submissions', id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        setSubmission({ id: docSnap.id, ...data })
      } else {
        console.error('Soumission non trouvée')
        navigate('/admin/submissions')
      }
    } catch (error) {
      console.error('Erreur récupération soumission:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock />
      case 'verified':
        return <CheckCircle />
      case 'rejected':
        return <XCircle />
      default:
        return <Clock />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente'
      case 'verified':
        return 'Vérifiée'
      case 'rejected':
        return 'Rejetée'
      default:
        return 'Inconnu'
    }
  }

  const getClientName = (submission) => {
    if (!submission) return 'Client anonyme'
    if (submission.clientName) return submission.clientName
    if (submission.email) return submission.email.split('@')[0]
    return 'Client anonyme'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement des détails...</p>
        </div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Soumission non trouvée</h3>
          <p className="text-gray-500 mb-4">Cette soumission n'existe pas ou a été supprimée.</p>
          <button
            onClick={() => navigate('/admin/submissions')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Retour aux soumissions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header - Desktop seulement */}
      <div className="hidden lg:block fixed top-0 left-64 right-0 z-30 bg-white shadow-lg border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/submissions')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                <ArrowLeft />
                Retour aux soumissions
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Détails de la soumission</h1>
                <p className="text-gray-600 text-sm">Informations complètes de la soumission</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(submission.status)}`}>
                <span className="mr-1">{getStatusIcon(submission.status)}</span>
                {getStatusText(submission.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Header mobile simple */}
      <div className="lg:hidden bg-white shadow-lg border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">Détails soumission</h1>
            <p className="text-gray-600 text-xs">Informations complètes</p>
          </div>
        </div>
      </div>

      {/* Espace pour le header fixe sur desktop */}
      <div className="hidden lg:block h-20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Bouton retour mobile - en haut de la page */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => navigate('/admin/submissions')}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            <ArrowLeft />
            Retour aux soumissions
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations de la soumission */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations client */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                  <User />
                  Informations client
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du client</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="text-gray-400" />
                      <span className="text-gray-900 font-medium">{getClientName(submission)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="text-gray-400" />
                      <span className="text-gray-900">{submission.email}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type de coupon</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <CreditCard className="text-gray-400" />
                      <span className="text-gray-900 font-medium">{submission.type}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date de soumission</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="text-gray-400" />
                      <span className="text-gray-900">
                        {submission.createdAt ? new Date(submission.createdAt.seconds * 1000).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Détails des coupons */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                  <CreditCard />
                  Détails des coupons
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {submission.coupons && submission.coupons.map((coupon, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Coupon {index + 1}</h3>
                        <span className="text-sm text-gray-500">Montant: {coupon.amount}€</span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Code du coupon</label>
                        <code className="text-sm font-mono bg-white border border-gray-200 rounded px-2 py-1 block">
                          {coupon.code}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Panneau d'informations */}
          <div className="space-y-6">
            {/* Statut et actions */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h2 className="text-white font-semibold text-lg">Statut et actions</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Statut actuel</label>
                    <div className={`inline-flex items-center px-3 py-2 rounded-lg border ${getStatusColor(submission.status)}`}>
                      <span className="mr-2">{getStatusIcon(submission.status)}</span>
                      {getStatusText(submission.status)}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => navigate(`/admin/manage/${submission.id}`)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
                  >
                    <Edit />
                    Gérer cette soumission
                  </button>
                </div>
              </div>
            </div>

            {/* Informations de suivi */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <h2 className="text-white font-semibold text-lg">Informations de suivi</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ID de la soumission</label>
                    <code className="text-sm font-mono bg-gray-100 border border-gray-200 rounded px-2 py-1 block">
                      {submission.id}
                    </code>
                  </div>
                  
                  {submission.updatedAt && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Dernière modification</label>
                      <div className="text-sm text-gray-600">
                        {new Date(submission.updatedAt.seconds * 1000).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  )}
                  
                  {submission.updatedBy && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Modifié par</label>
                      <div className="text-sm text-gray-600">{submission.updatedBy}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
