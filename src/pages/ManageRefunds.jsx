import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FirestoreService } from '../services/firestoreService'
import { EmailService } from '../services/emailService'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { toast } from 'react-toastify'
import { TelegramService } from '../services/telegramService'

// Enhanced SVG Icons
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const ProcessIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const RefundIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
)

export default function ManageRefunds() {
  const [refundRequests, setRefundRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState(null)

  const { admin } = useAdminAuth()
  const isSuperAdmin = admin?.role === 'super_admin'

  useEffect(() => {
    fetchRefundRequests()
  }, [])

  const fetchRefundRequests = async () => {
    try {
      setLoading(true)
      const result = await FirestoreService.getAllRefundRequests(2000)
      if (result.success) {
        setRefundRequests(result.data)
      } else {
        toast.error('Erreur lors du chargement des demandes')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des demandes')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (requestId, newStatus, notes = '') => {
    try {
      setUpdatingStatus(requestId)
      const result = await FirestoreService.updateRefundRequestStatus(requestId, newStatus, notes)

      if (result.success) {
        const refundRequest = refundRequests.find(req => req.id === requestId)
        if (newStatus === 'approved' && refundRequest?.customerEmail) {
          try {
            await EmailService.sendRefundApprovalEmail({
              customerEmail: refundRequest.customerEmail,
              customerName: refundRequest.customerName,
              referenceNumber: refundRequest.referenceNumber,
              amount: refundRequest.amount
            })
            // Notification Telegram pour le propriétaire
            await TelegramService.notifyAdminAction('Approbation Remboursement', {
              customerName: refundRequest.customerName,
              referenceNumber: refundRequest.referenceNumber,
              amount: refundRequest.amount,
              status: 'Approuvé'
            }).catch(e => console.error('Erreur TG:', e))

            toast.success('Statut mis à jour et email envoyé')
          } catch (e) {
            toast.warning('Statut mis à jour mais erreur envoi email')
          }
        } else {
          toast.success('Statut mis à jour avec succès')
        }
        fetchRefundRequests()
      } else {
        toast.error('Erreur mise à jour')
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!requestToDelete || !isSuperAdmin) return
    try {
      setIsDeleting(true)
      const result = await FirestoreService.deleteRefundRequest(requestToDelete.id)
      if (result.success) {
        toast.success('Demande supprimée')
        setRefundRequests(prev => prev.filter(req => req.id !== requestToDelete.id))
        setShowDeleteModal(false)
        setRequestToDelete(null)
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { text: 'En attente', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: '⏳' },
      processing: { text: 'En cours', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: '🔄' },
      approved: { text: 'Approuvée', color: 'text-green-700', bgColor: 'bg-green-100', icon: '✅' },
      rejected: { text: 'Rejetée', color: 'text-rose-700', bgColor: 'bg-rose-100', icon: '❌' },
      completed: { text: 'Terminée', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: '💰' }
    }
    return statusMap[status] || { text: status, color: 'text-gray-700', bgColor: 'bg-gray-100', icon: '❓' }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Non disponible'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const getFilteredData = () => {
    let filtered = refundRequests
    if (filter !== 'all') filtered = filtered.filter(r => r.status === filter)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(r =>
        r.referenceNumber?.toLowerCase().includes(term) ||
        r.fullName?.toLowerCase().includes(term) ||
        r.email?.toLowerCase().includes(term)
      )
    }
    return filtered
  }

  const filteredRequests = getFilteredData()
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1e293b] tracking-tight">Remboursements</h1>
            <p className="text-slate-500 mt-1">Gérez et suivez toutes les demandes de remboursement clients.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchRefundRequests} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
              <ProcessIcon /> Actualiser
            </button>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                type="text"
                placeholder="Rechercher un client ou une référence..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {['all', 'pending', 'processing', 'approved', 'rejected', 'completed'].map(s => (
                <button
                  key={s}
                  onClick={() => { setFilter(s); setCurrentPage(1) }}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === s
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {s === 'all' ? 'Tous' : getStatusInfo(s).text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden xl:block">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Référence / Client</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Montant / Méthode</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRequests.map(r => {
                  const s = getStatusInfo(r.status)
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="font-mono text-xs text-blue-600 font-bold mb-1">{r.referenceNumber}</div>
                        <div className="font-semibold text-slate-900">{r.fullName}</div>
                        <div className="text-xs text-slate-500">{r.email}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-lg font-extrabold text-slate-900">{r.totalAmount.toFixed(2)} €</div>
                        <div className="text-xs text-slate-500 font-medium">via {r.refundMethod === 'bank_transfer' ? 'Virement' : r.refundMethod}</div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${s.bgColor} ${s.color} border border-transparent`}>
                          <span className="mr-1.5">{s.icon}</span> {s.text}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500">
                        {formatDate(r.submittedAt)}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap justify-end gap-2 max-w-[200px] ml-auto">
                          <Link to={`/admin/refund-details/${r.id}`} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all" title="Détails">
                            <EyeIcon /> Détails
                          </Link>

                          {r.status === 'pending' && (
                            <button onClick={() => handleStatusUpdate(r.id, 'processing')} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 hover:bg-amber-100 rounded-lg transition-all" title="Traiter">
                              <ProcessIcon /> Traiter
                            </button>
                          )}

                          {r.status === 'processing' && (
                            <button onClick={() => handleStatusUpdate(r.id, 'approved')} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 hover:bg-green-100 rounded-lg transition-all" title="Approuver">
                              <CheckIcon /> Approuver
                            </button>
                          )}

                          {r.status === 'approved' && (
                            <button onClick={() => handleStatusUpdate(r.id, 'completed')} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 rounded-lg transition-all" title="Finaliser">
                              <RefundIcon /> Finaliser
                            </button>
                          )}

                          {isSuperAdmin && (
                            <button onClick={() => { setRequestToDelete(r); setShowDeleteModal(true) }} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-lg transition-all" title="Supprimer">
                              <TrashIcon /> Supprimer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Cards for Tablet/Mobile */}
          <div className="xl:hidden divide-y divide-slate-100">
            {paginatedRequests.map(r => {
              const s = getStatusInfo(r.status)
              return (
                <div key={r.id} className="p-4 sm:p-6 hover:bg-slate-50/50 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-mono text-[10px] text-blue-600 font-bold mb-1 tracking-wider">{r.referenceNumber}</div>
                      <div className="font-bold text-slate-900 leading-tight">{r.fullName}</div>
                      <div className="text-xs text-slate-500">{r.email}</div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.bgColor} ${s.color}`}>
                      {s.text}
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xl font-black text-slate-900 leading-none">{r.totalAmount.toFixed(2)} €</div>
                      <div className="text-[10px] text-slate-400 mt-1 font-bold italic">{formatDate(r.submittedAt)}</div>
                    </div>
                    <div className="flex gap-1.5">
                      <Link to={`/admin/refund-details/${r.id}`} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all">Détails</Link>
                      {r.status === 'pending' && <button onClick={() => handleStatusUpdate(r.id, 'processing')} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-all shadow-sm">Traiter</button>}
                      {r.status === 'processing' && <button onClick={() => handleStatusUpdate(r.id, 'approved')} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-all shadow-sm">Approuver</button>}
                      {r.status === 'approved' && <button onClick={() => handleStatusUpdate(r.id, 'completed')} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-all shadow-sm">Finaliser</button>}
                      {isSuperAdmin && <button onClick={() => { setRequestToDelete(r); setShowDeleteModal(true) }} className="p-1.5 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100 transition-all"><TrashIcon /></button>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Empty State */}
          {filteredRequests.length === 0 && (
            <div className="py-20 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-50 rounded-full mb-4 text-slate-300">
                <ProcessIcon />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Aucun résultat</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-2 text-sm">Nous n'avons trouvé aucun remboursement correspondant à vos critères.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold disabled:opacity-30 transition-all hover:bg-slate-50"
            >
              Précédent
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold disabled:opacity-30 transition-all hover:bg-slate-50"
            >
              Suivant
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowDeleteModal(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden text-center p-8">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-600">
              <TrashIcon />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Confirmation</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Voulez-vous vraiment supprimer cette demande ? <br />Cette action est <span className="text-rose-600 font-bold">irréversible</span>.
            </p>
            {requestToDelete && (
              <div className="bg-slate-50 rounded-2xl p-4 mb-8 text-left border border-slate-100">
                <div className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">{requestToDelete.referenceNumber}</div>
                <div className="font-bold text-slate-900 underline decoration-blue-500/30 underline-offset-4">{requestToDelete.fullName}</div>
                <div className="text-slate-500 text-xs mt-1">{requestToDelete.email}</div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-all order-2 sm:order-1">Annuler</button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-3 bg-rose-600 text-white font-black rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all disabled:opacity-50 order-1 sm:order-2"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
