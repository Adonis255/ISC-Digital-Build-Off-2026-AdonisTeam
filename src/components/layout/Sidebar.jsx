import { NavLink } from 'react-router-dom'
import { LogOut, Home, Users, Wrench, Megaphone, Bell, Search, MessageSquare, Calendar, ShieldCheck, BookOpen, User, Shield, DollarSign, AlertCircle, Briefcase, Award, Contact, FileText, Settings, ShieldAlert, Building, CheckSquare, UserCheck, Library } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'

export default function Sidebar({ isOpen, closeMenu }) {
  const { profile, role, signOut } = useAuth()
  
  const nav = {
    student: [
      { to: '/student/dashboard', label: 'Dashboard', icon: Home },
      { to: '/student/catalog', label: 'Course Catalog', icon: Library },
      { to: '/student/attendance', label: 'My Attendance', icon: CheckSquare },
      { to: '/student/directory', label: 'Directory', icon: Contact },
      { to: '/student/exams', label: 'Exams', icon: FileText },
      { to: '/student/lost-found', label: 'Lost & Found', icon: Search },
      { to: '/student/maintenance', label: 'Maintenance', icon: Wrench },
      { to: '/student/finance', label: 'My Fees', icon: DollarSign },
      { to: '/student/internships', label: 'Internships', icon: Briefcase },
      { to: '/student/scholarships', label: 'Scholarships', icon: Award },
      { to: '/student/complaints', label: 'Complaints', icon: AlertCircle },
      { to: '/student/counselling', label: 'Counselling', icon: ShieldCheck },
      { to: '/student/profile', label: 'Profile', icon: User },
      { to: '/student/notifications', label: 'Notifications', icon: Bell }
    ],
    admin: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: Home },
      { to: '/admin/users', label: 'User Management', icon: Users },
      { to: '/admin/offices', label: 'Manage Offices', icon: Building },
      { to: '/admin/courses', label: 'Courses (CSV)', icon: BookOpen },
      { to: '/admin/enrollments', label: 'Enrollments', icon: UserCheck },
      { to: '/admin/exams', label: 'Exams', icon: FileText },
      { to: '/admin/finance', label: 'Finance', icon: DollarSign },
      { to: '/admin/internships', label: 'Internships', icon: Briefcase },
      { to: '/admin/scholarships', label: 'Scholarships', icon: Award },
      { to: '/admin/complaints', label: 'Complaints', icon: AlertCircle },
      { to: '/admin/maintenance', label: 'Maintenance', icon: Wrench },
      { to: '/admin/counselling', label: 'Counselling', icon: ShieldCheck },
      { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldAlert },
      { to: '/admin/profile', label: 'Profile', icon: User }
    ],
    lecturer: [
      { to: '/lecturer/dashboard', label: 'Dashboard', icon: Home },
      { to: '/lecturer/classes', label: 'My Classes', icon: BookOpen },
      { to: '/lecturer/exams', label: 'Exams', icon: FileText },
      { to: '/lecturer/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/lecturer/profile', label: 'Profile', icon: User },
      { to: '/lecturer/notifications', label: 'Notifications', icon: Bell }
    ],
    worker: [
      { to: '/worker/dashboard', label: 'Dashboard', icon: Home },
      { to: '/worker/tasks', label: 'My Tasks', icon: Wrench },
      { to: '/worker/profile', label: 'Profile', icon: User },
      { to: '/worker/notifications', label: 'Notifications', icon: Bell }
    ]
  }

  return (
    <aside className={`fixed left-0 top-0 z-40 w-64 bg-navy-900 text-slate-300 flex flex-col h-screen transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="p-6 border-b border-navy-700 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">BaratonHub</h1>
          <p className="text-xs text-brand-400 capitalize">{role} Portal</p>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {(nav[role] || []).map((item) => (
          <NavLink key={item.label} to={item.to} onClick={closeMenu} className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${isActive ? 'bg-brand-600 text-white' : 'hover:bg-navy-800'}`}>
            <item.icon className="w-5 h-5" /> {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-navy-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold">{profile?.full_name?.charAt(0) || 'U'}</div>
          <div className="text-sm truncate"><p className="text-white font-medium truncate">{profile?.full_name}</p></div>
        </div>
        <button onClick={signOut} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm w-full transition"><LogOut className="w-4 h-4" /> Sign Out</button>
      </div>
    </aside>
  )
}