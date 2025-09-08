import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'

// Context
import { AdminAuthProvider } from './contexts/AdminAuthContext'

// Components
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'

// Pages
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import ManageSubmission from './pages/ManageSubmission'
import SubmissionDetails from './pages/SubmissionDetails'
import InitAdmin from './pages/InitAdmin'
import Dashboard from './pages/Dashboard'
import Submissions from './pages/Submissions'
import Statistics from './pages/Statistics'
import ManageRefunds from './pages/ManageRefunds'
import RefundDetails from './pages/RefundDetails'
import ManageAdmins from './pages/ManageAdmins'
import Layout from './components/Layout'

function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Routes publiques */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/init" element={<InitAdmin />} />
            
            {/* Routes protégées */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/submissions" element={
              <ProtectedRoute>
                <AdminLayout>
                  <Submissions />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/submissions/:id" element={
              <ProtectedRoute>
                <AdminLayout>
                  <SubmissionDetails />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/statistics" element={
              <ProtectedRoute>
                <AdminLayout>
                  <Statistics />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/manage/:id" element={
              <ProtectedRoute>
                <AdminLayout>
                  <ManageSubmission />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/refunds" element={
              <ProtectedRoute>
                <AdminLayout>
                  <ManageRefunds />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/refund-details/:requestId" element={
              <ProtectedRoute>
                <AdminLayout>
                  <RefundDetails />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/manage-admins" element={
              <ProtectedRoute>
                <AdminLayout>
                  <ManageAdmins />
                </AdminLayout>
              </ProtectedRoute>
            } />
            
            {/* Routes de l'ancien système (à migrer) */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/submissions" element={
              <ProtectedRoute>
                <Layout>
                  <Submissions />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/statistics" element={
              <ProtectedRoute>
                <Layout>
                  <Statistics />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
          
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AdminAuthProvider>
  )
}

export default App
