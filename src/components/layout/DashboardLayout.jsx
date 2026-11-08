import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Navbar from './Navbar.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { ROLE_HOME } from '../../utils/constants.js'

export default function DashboardLayout({ allowedRoles }) {
  const { user, role, loading } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  if (loading) return <div className="h-screen grid place-items-center">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(role)) return <Navigate to={ROLE_HOME[role] || '/login'} replace />

  return (
    <div className="min-h-screen bg-slate-50 md:pl-64 flex flex-col">
      <Sidebar isOpen={isMobileMenuOpen} closeMenu={() => setIsMobileMenuOpen(false)} />
      
      {/* Dark overlay when mobile menu is open */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar toggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="p-4 md:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}