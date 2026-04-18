import { useState, useEffect } from 'react'
import AdminSidebar from './AdminSidebar'
import { initializeNotificationListeners } from '../services/notificationService'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { toast } from 'react-toastify'

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { admin } = useAdminAuth()

  // Initialiser les écouteurs de notifications et live visitors
  useEffect(() => {
    const unsubscribeNotifications = initializeNotificationListeners()
    let unsubscribeLiveVisitors = null;

    if (admin?.role === 'super_admin') {
      const liveVisitorsRef = collection(db, 'live_visitors')
      const q = query(liveVisitorsRef, where('status', '==', 'active'))
      
      let initLoad = true;
      unsubscribeLiveVisitors = onSnapshot(q, (snapshot) => {
        if (!initLoad) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              toast.info(`Nouveau visiteur sur la page : ${change.doc.data().formType || 'Général'}`, {
                autoClose: 5000,
                position: 'top-right'
              })
            }
          })
        }
        initLoad = false;
      })
    }

    return () => {
      if (unsubscribeNotifications) unsubscribeNotifications()
      if (unsubscribeLiveVisitors) unsubscribeLiveVisitors()
    }
  }, [admin])

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 lg:ml-64">
        {/* Mobile header with hamburger - Fixed */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
            <div className="w-6"></div> {/* Spacer pour centrer le titre */}
          </div>
        </div>

        <main className="flex-1 pt-16 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  )
}
