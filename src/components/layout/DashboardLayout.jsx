import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Navbar from './Navbar.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { ROLE_HOME } from '../../utils/constants.js'

export default function DashboardLayout({ allowedRoles }) {
  const { user, role, loading } = useAuth()
  if (loading) return <div className="h-screen grid place-items-center">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(role)) return <Navigate to={ROLE_HOME[role] || '/login'} replace />

  return (
    <div className="min-h-screen bg-slate-50 md:pl-64">
      <Sidebar />
      <Navbar />
      <main className="p-4 md:p-8"><Outlet /></main>
    </div>
  )
}
