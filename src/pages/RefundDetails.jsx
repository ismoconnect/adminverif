import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FirestoreService } from '../services/firestoreService'
import { toast } from 'react-toastify'

export default function RefundDetails() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const [refundRequest, setRefundRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    if (requestId) {
      fetchRefundRequest()
    }
  }, [requestId])

  const fetchRefundRequest = async () => {
    try {
      setLoading(true)
      const result = await FirestoreService.getRefundRequestByReference(requestId)
      
      if (result.success) {
        setRefundRequest(result.data)
        setAdminNotes(result.data.adminNotes || '')
      } else {
        toast.error('Demande de remboursement non trouvée')
        navigate('/admin/refunds')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement de la demande')
      navigate('/admin/refunds')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      toast.error('Veuillez sélectionner un statut')
      return
    }

    try {
      setUpdating(true)
      
      const result = await FirestoreService.updateRefundRequestStatus(
        requestId, 
        newStatus, 
        adminNotes
      )
      
      if (result.success) {
        toast.success('Statut mis à jour avec succès')
        fetchRefundRequest() // Recharger les données
        setNewStatus('')
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        text: 'En attente',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: '⏳',
        description: 'Demande reçue, en attente de traitement'
      },
      processing: {
        text: 'En cours de traitement',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: '🔄',
        description: 'Demande en cours d\'examen par l\'équipe'
      },
      approved: {
        text: 'Approuvée',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: '✅',
        description: 'Demande approuvée, remboursement en préparation'
      },
      rejected: {
        text: 'Rejetée',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: '❌',
        description: 'Demande rejetée'
      },
      completed: {
        text: 'Remboursement effectué',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: '💰',
        description: 'Remboursement effectué avec succès'
      }
    }
    
    return statusMap[status] || statusMap.pending
  }

  const getRefundMethodText = (method) => {
    const methodMap = {
      bank_transfer: 'Virement bancaire',
      paypal: 'PayPal',
      card_refund: 'Remboursement carte bancaire'
    }
    return methodMap[method] || method
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Non disponible'
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateEstimatedCompletion = (submittedAt, status) => {
    if (status === 'completed' || status === 'rejected') return null
    
    const submitted = submittedAt.toDate ? submittedAt.toDate() : new Date(submittedAt)
    const estimated = new Date(submitted.getTime() + 24 * 60 * 60 * 1000) // +24h
    
    return estimated.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!refundRequest) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Demande de remboursement non trouvée</p>
        <button
          onClick={() => navigate('/admin/refunds')}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Retour à la liste
        </button>
      </div>
    )
  }

  const statusInfo = getStatusInfo(refundRequest.status)
  const estimatedCompletion = calculateEstimatedCompletion(refundRequest.submittedAt, refundRequest.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header amélioré */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/admin/refunds')}
                  className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Détails du remboursement
                  </h1>
                  <p className="text-gray-600 mt-1 font-mono">{refundRequest.referenceNumber}</p>
                </div>
              </div>
              <div className={`px-6 py-3 rounded-xl ${statusInfo.bgColor} ${statusInfo.color} font-semibold flex items-center gap-2 shadow-lg`}>
                <span className="text-xl">{statusInfo.icon}</span>
                {statusInfo.text}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contenu principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Statut et estimation */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Statut de la demande
                </h2>
                <p className="text-gray-600 mb-4">{statusInfo.description}</p>
                
                {estimatedCompletion && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold text-blue-900">Remboursement prévu au plus tard le:</span>
                    </div>
                    <p className="text-blue-800 font-bold mt-1 text-lg">{estimatedCompletion}</p>
                  </div>
                )}
              </div>

              {/* Informations personnelles */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Informations personnelles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Nom complet</span>
                    <p className="text-gray-900 font-medium mt-1">{refundRequest.fullName}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Email</span>
                    <p className="text-gray-900 font-medium mt-1">{refundRequest.email}</p>
                  </div>
                  {refundRequest.phone && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Téléphone</span>
                      <p className="text-gray-900 font-medium mt-1">{refundRequest.phone}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Pays</span>
                    <p className="text-gray-900 font-medium mt-1">{refundRequest.country}</p>
                  </div>
                </div>
              </div>

          {/* Informations de remboursement */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de remboursement</h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Méthode:</span>
                <p className="text-gray-900">{getRefundMethodText(refundRequest.refundMethod)}</p>
              </div>
              
              {refundRequest.refundMethod === 'bank_transfer' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {refundRequest.bankName && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Banque:</span>
                      <p className="text-gray-900">{refundRequest.bankName}</p>
                    </div>
                  )}
                  {refundRequest.accountHolder && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Titulaire:</span>
                      <p className="text-gray-900">{refundRequest.accountHolder}</p>
                    </div>
                  )}
                  {refundRequest.iban && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">IBAN:</span>
                      <p className="text-gray-900 font-mono">{refundRequest.iban}</p>
                    </div>
                  )}
                  {refundRequest.bic && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">BIC:</span>
                      <p className="text-gray-900 font-mono">{refundRequest.bic}</p>
                    </div>
                  )}
                </div>
              )}
              
              {refundRequest.refundMethod === 'paypal' && refundRequest.paypalEmail && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Email PayPal:</span>
                  <p className="text-gray-900">{refundRequest.paypalEmail}</p>
                </div>
              )}
              
              {refundRequest.refundMethod === 'card_refund' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {refundRequest.cardHolder && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Titulaire de la carte:</span>
                      <p className="text-gray-900">{refundRequest.cardHolder}</p>
                    </div>
                  )}
                  {refundRequest.cardNumber && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Numéro de carte:</span>
                      <p className="text-gray-900 font-mono">**** **** **** {refundRequest.cardNumber.slice(-4)}</p>
                    </div>
                  )}
                  {refundRequest.cardExpiry && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Date d'expiration:</span>
                      <p className="text-gray-900">{refundRequest.cardExpiry}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Coupons à rembourser */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Coupons à rembourser</h2>
            <div className="space-y-4">
              {refundRequest.coupons.map((coupon, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Code du coupon:</span>
                      <p className="text-gray-900 font-mono">{coupon.couponCode}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Numéro de série:</span>
                      <p className="text-gray-900 font-mono">{coupon.serialNumber}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Montant:</span>
                      <p className="text-gray-900 font-semibold">{coupon.amount.toFixed(2)} €</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-500">Raison:</span>
                    <p className="text-gray-900">{coupon.reason}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Montant total à rembourser:</span>
                <span className="text-2xl font-bold text-orange-600">{refundRequest.totalAmount.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Informations supplémentaires */}
          {(refundRequest.reason || refundRequest.additionalInfo) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations supplémentaires</h2>
              <div className="space-y-4">
                {refundRequest.reason && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Raison générale:</span>
                    <p className="text-gray-900 mt-1">{refundRequest.reason}</p>
                  </div>
                )}
                {refundRequest.additionalInfo && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Informations complémentaires:</span>
                    <p className="text-gray-900 mt-1">{refundRequest.additionalInfo}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Demande soumise</p>
                  <p className="text-sm text-gray-500">{formatDate(refundRequest.submittedAt)}</p>
                </div>
              </div>
              
              {refundRequest.processedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Demande traitée</p>
                    <p className="text-sm text-gray-500">{formatDate(refundRequest.processedAt)}</p>
                    {refundRequest.processedBy && (
                      <p className="text-xs text-gray-400">Par: {refundRequest.processedBy}</p>
                    )}
                  </div>
                </div>
              )}
              
              {refundRequest.completedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Remboursement effectué</p>
                    <p className="text-sm text-gray-500">{formatDate(refundRequest.completedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

            {/* Sidebar - Actions admin */}
            <div className="space-y-6">
              {/* Mise à jour du statut */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Actions admin
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Nouveau statut
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Sélectionner un statut</option>
                      <option value="processing">En cours de traitement</option>
                      <option value="approved">Approuvée</option>
                      <option value="rejected">Rejetée</option>
                      <option value="completed">Remboursement effectué</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Notes admin
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Ajoutez des notes pour le client..."
                    />
                  </div>
                  
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updating || !newStatus}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {updating ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Mise à jour...
                      </div>
                    ) : (
                      'Mettre à jour le statut'
                    )}
                  </button>
                </div>
              </div>

              {/* Informations techniques */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Informations techniques
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">ID</span>
                    <p className="text-gray-900 font-mono text-sm mt-1">{refundRequest.id}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Dernière mise à jour</span>
                    <p className="text-gray-900 font-medium mt-1">{formatDate(refundRequest.updatedAt)}</p>
                  </div>
                  {refundRequest.userAgent && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">User Agent</span>
                      <p className="text-gray-900 text-xs break-all mt-1 font-mono">{refundRequest.userAgent}</p>
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
