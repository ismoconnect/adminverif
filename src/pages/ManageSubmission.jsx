import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { db } from '../lib/firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import ConfirmationDialog from '../components/ConfirmationDialog'
import { EmailService } from '../services/emailService'
import { toast } from 'react-toastify'

// Icônes SVG améliorées
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

const ArrowLeft = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const Save = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
)

export default function ManageSubmission() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { admin, logout } = useAdminAuth()
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [couponStatuses, setCouponStatuses] = useState({})
  const [updatingCoupon, setUpdatingCoupon] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

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
        setNewStatus(data.status || 'pending')
        
        // Initialiser les statuts des coupons
        const initialCouponStatuses = {}
        if (data.coupons) {
          data.coupons.forEach((coupon, index) => {
            initialCouponStatuses[index] = coupon.status || 'pending'
          })
        }
        setCouponStatuses(initialCouponStatuses)
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

  const handleStatusUpdate = async () => {
    try {
      setUpdating(true)
      const docRef = doc(db, 'coupon_submissions', id)
      
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: admin?.username || 'admin'
      })
      
      setSubmission(prev => ({
        ...prev,
        status: newStatus,
        updatedAt: new Date()
      }))
      
      // Envoyer un email selon le nouveau statut
      if (newStatus === 'verified' && submission?.email) {
        try {
          const emailResult = await EmailService.sendVerificationEmail({
            customerEmail: submission.email,
            customerName: submission.fullName,
            referenceNumber: submission.referenceNumber,
            amount: submission.totalAmount,
            type: submission.type || 'coupon'
          })
          
          if (emailResult.success) {
            toast.success('Statut mis à jour et email envoyé avec succès')
          } else {
            toast.warning('Statut mis à jour mais erreur lors de l\'envoi de l\'email')
          }
        } catch (emailError) {
          console.error('Erreur envoi email:', emailError)
          toast.warning('Statut mis à jour mais erreur lors de l\'envoi de l\'email')
        }
      } else if (newStatus === 'rejected' && submission?.email) {
        try {
          const emailResult = await EmailService.sendRejectionEmail({
            customerEmail: submission.email,
            customerName: submission.fullName,
            referenceNumber: submission.referenceNumber,
            amount: submission.totalAmount,
            type: submission.type || 'coupon'
          }, rejectionReason)
          
          if (emailResult.success) {
            toast.success('Statut mis à jour et email envoyé avec succès')
          } else {
            toast.warning('Statut mis à jour mais erreur lors de l\'envoi de l\'email')
          }
        } catch (emailError) {
          console.error('Erreur envoi email:', emailError)
          toast.warning('Statut mis à jour mais erreur lors de l\'envoi de l\'email')
        }
      } else {
        toast.success('Statut mis à jour avec succès')
      }
      
      setShowSuccessDialog(true)
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      toast.error('Erreur lors de la mise à jour du statut')
    } finally {
      setUpdating(false)
    }
  }

  const handleCouponStatusUpdate = async (couponIndex, newCouponStatus) => {
    try {
      setUpdatingCoupon(couponIndex)
      const docRef = doc(db, 'coupon_submissions', id)
      
      // Récupérer le document actuel
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) return
      
      const data = docSnap.data()
      const updatedCoupons = [...data.coupons]
      
      // Mettre à jour le statut du coupon
      updatedCoupons[couponIndex] = {
        ...updatedCoupons[couponIndex],
        status: newCouponStatus,
        updatedAt: new Date()
      }
      
      // Calculer le nouveau statut global
      const newGlobalStatus = calculateGlobalStatus(updatedCoupons)
      
      // Mettre à jour le document
      await updateDoc(docRef, {
        coupons: updatedCoupons,
        status: newGlobalStatus,
        updatedAt: serverTimestamp(),
        updatedBy: admin?.username || 'admin'
      })
      
      // Mettre à jour l'état local
      setSubmission(prev => ({
        ...prev,
        coupons: updatedCoupons,
        status: newGlobalStatus,
        updatedAt: new Date()
      }))
      
      setCouponStatuses(prev => ({
        ...prev,
        [couponIndex]: newCouponStatus
      }))
      
      setNewStatus(newGlobalStatus)
      
    } catch (error) {
      console.error('Erreur mise à jour coupon:', error)
    } finally {
      setUpdatingCoupon(null)
    }
  }

  const calculateGlobalStatus = (coupons) => {
    if (!coupons || coupons.length === 0) return 'pending'
    
    const statuses = coupons.map(coupon => coupon.status)
    
    // Si tous les coupons sont vérifiés
    if (statuses.every(status => status === 'verified')) {
      return 'verified'
    }
    
    // Si tous les coupons sont rejetés
    if (statuses.every(status => status === 'rejected')) {
      return 'rejected'
    }
    
    // Si il y a des corrections en attente
    if (statuses.some(status => status === 'pending_correction')) {
      return 'pending_correction'
    }
    
    // Si il y a un mélange de statuts
    if (statuses.some(status => status === 'verified') && statuses.some(status => status === 'rejected')) {
      return 'partially_verified'
    }
    
    // Si tous sont en cours
    if (statuses.every(status => status === 'pending' || status === 'processing')) {
      return 'processing'
    }
    
    // Par défaut
    return 'pending'
  }


  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'partially_verified':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'pending_correction':
        return 'bg-purple-100 text-purple-800 border-purple-200'
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
      case 'partially_verified':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'pending_correction':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )
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
      case 'partially_verified':
        return 'Partiellement vérifiée'
      case 'pending_correction':
        return 'Correction en attente'
      default:
        return 'Inconnu'
    }
  }

  const getClientName = (submission) => {
    if (submission.clientName) return submission.clientName
    if (submission.email) return submission.email.split('@')[0]
    return 'Client anonyme'
  }

  // Fonctions pour les statuts des coupons individuels
  const getCouponStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending_correction':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCouponStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock />
      case 'verified':
        return <CheckCircle />
      case 'rejected':
        return <XCircle />
      case 'pending_correction':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )
      default:
        return <Clock />
    }
  }

  const getCouponStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente'
      case 'verified':
        return 'Vérifié'
      case 'rejected':
        return 'Rejeté'
      case 'pending_correction':
        return 'Correction en attente'
      default:
        return 'Inconnu'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement de la soumission...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Gestion de la soumission</h1>
                <p className="text-gray-600 text-sm">Gérer le statut et les informations</p>
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
            <h1 className="text-lg font-bold text-gray-900">Gestion soumission</h1>
            <p className="text-gray-600 text-xs">Statut et informations</p>
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
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">Coupon {index + 1}</h3>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCouponStatusColor(couponStatuses[index] || coupon.status)}`}>
                            <span className="mr-1">{getCouponStatusIcon(couponStatuses[index] || coupon.status)}</span>
                            {getCouponStatusText(couponStatuses[index] || coupon.status)}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">Montant: {coupon.amount}€</span>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Code du coupon
                          {(couponStatuses[index] || coupon.status) === 'pending_correction' && (
                            <span className="text-purple-600 text-xs ml-2">(Code corrigé par le client)</span>
                          )}
                        </label>
                        <code className="text-sm font-mono bg-white border border-gray-200 rounded px-2 py-1 block">
                          {coupon.code}
                        </code>
                        
                        {/* Afficher le code original si il a été corrigé */}
                        {coupon.originalCode && (
                          <div className="mt-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Code original (incorrect):</label>
                            <code className="text-xs font-mono bg-red-50 border border-red-200 rounded px-2 py-1 block text-red-700">
                              {coupon.originalCode}
                            </code>
                          </div>
                        )}
                        
                        {/* Afficher les informations de correction */}
                        {coupon.correctionSubmittedAt && (
                          <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded">
                            <div className="text-xs text-purple-700">
                              <strong>Correction soumise le:</strong> {new Date(coupon.correctionSubmittedAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div className="text-xs text-purple-700">
                              <strong>Par:</strong> {coupon.correctionSubmittedBy === 'client' ? 'Client' : coupon.correctionSubmittedBy}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Gestion du statut individuel */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Statut:</label>
                        <select
                          value={couponStatuses[index] || coupon.status || 'pending'}
                          onChange={(e) => handleCouponStatusUpdate(index, e.target.value)}
                          disabled={updatingCoupon === index}
                          className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="pending">En attente</option>
                          <option value="verified">Vérifié</option>
                          <option value="rejected">Rejeté</option>
                          <option value="pending_correction">Correction en attente</option>
                        </select>
                        {updatingCoupon === index && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Panneau de gestion */}
          <div className="space-y-6">
            {/* Gestion du statut */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                  <Save />
                  Gestion du statut
                </h2>
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
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nouveau statut</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="pending">En attente</option>
                      <option value="verified">Vérifiée</option>
                      <option value="rejected">Rejetée</option>
                      <option value="partially_verified">Partiellement vérifiée</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={updating || newStatus === submission.status}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
                  >
                    {updating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Mise à jour...
                      </>
                    ) : (
                      <>
                        <Save />
                        Mettre à jour le statut
                      </>
                    )}
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

      {/* Boîte de dialogue de confirmation */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => {
          setShowConfirmDialog(false)
          handleStatusUpdate()
        }}
        title="Confirmer la modification"
        message={`Êtes-vous sûr de vouloir changer le statut vers "${getStatusText(newStatus)}" ?`}
        confirmText="Confirmer"
        cancelText="Annuler"
        type="warning"
      />

      {/* Boîte de dialogue de succès */}
      <ConfirmationDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        onConfirm={() => setShowSuccessDialog(false)}
        title="Statut mis à jour"
        message="Le statut a été mis à jour avec succès !"
        confirmText="OK"
        type="success"
      />
    </div>
  )
}