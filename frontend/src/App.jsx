import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'

// Pages
import Login from './pages/Login'
import EmployeeDashboard from './pages/employee/Dashboard'
import Bookings from './pages/employee/Bookings'
import NewBooking from './pages/employee/NewBooking'
import BookingDetail from './pages/employee/BookingDetail'
import Maintenance from './pages/employee/Maintenance'
import NewMaintenance from './pages/employee/NewMaintenance'
import OwnerDashboard from './pages/owner/Dashboard'
import OwnerRooms from './pages/owner/Rooms'
import OwnerPromoCodes from './pages/owner/PromoCodes'
import OwnerEmployees from './pages/owner/Employees'
import OwnerBookings from './pages/owner/Bookings'
import OwnerMaintenance from './pages/owner/Maintenance'

function ProtectedRoute({ children, ownerOnly = false }) {
  const { user, isOwner } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (ownerOnly && !isOwner) return <Navigate to="/dashboard" replace />
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user, isOwner } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={isOwner ? '/owner/dashboard' : '/dashboard'} replace /> : <Login />} />

      {/* Employee routes */}
      <Route path="/dashboard" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
      <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
      <Route path="/bookings/new" element={<ProtectedRoute><NewBooking /></ProtectedRoute>} />
      <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
      <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
      <Route path="/maintenance/new" element={<ProtectedRoute><NewMaintenance /></ProtectedRoute>} />

      {/* Owner routes */}
      <Route path="/owner/dashboard" element={<ProtectedRoute ownerOnly><OwnerDashboard /></ProtectedRoute>} />
      <Route path="/owner/rooms" element={<ProtectedRoute ownerOnly><OwnerRooms /></ProtectedRoute>} />
      <Route path="/owner/promo-codes" element={<ProtectedRoute ownerOnly><OwnerPromoCodes /></ProtectedRoute>} />
      <Route path="/owner/employees" element={<ProtectedRoute ownerOnly><OwnerEmployees /></ProtectedRoute>} />
      <Route path="/owner/bookings" element={<ProtectedRoute ownerOnly><OwnerBookings /></ProtectedRoute>} />
      <Route path="/owner/maintenance" element={<ProtectedRoute ownerOnly><OwnerMaintenance /></ProtectedRoute>} />

      {/* Redirects */}
      <Route path="/" element={<Navigate to={user ? (isOwner ? '/owner/dashboard' : '/dashboard') : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3500, style: { fontSize: '0.875rem' } }} />
      <AppRoutes />
    </AuthProvider>
  )
}
