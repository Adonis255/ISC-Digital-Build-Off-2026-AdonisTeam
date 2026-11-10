import { NavLink } from 'react-router-dom'
import { LogOut, Home, Users, Wrench, Megaphone, Bell, Search, MessageSquare, Calendar, ShieldCheck, BookOpen, User, Shield, DollarSign, AlertCircle, Briefcase, Award, Contact, FileText, Settings, ShieldAlert, Building, CheckSquare, UserCheck, Library, HelpCircle, Trophy, Play, History, FolderOpen, CalendarDays } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'

export default function Sidebar({ isOpen, closeMenu }) {
  const { profile, role, signOut } = useAuth()
  
  const nav = {
    student: [
      { to: '/student/dashboard', label: 'Dashboard', icon: Home },
      { to: '/student/notice-board', label: 'Notice Board', icon: Megaphone },
      { to: '/student/catalog', label: 'My Courses', icon: BookOpen },
      { to: '/student/attendance', label: 'My Attendance', icon: Calendar },
      { to: '/student/exams', label: 'Exams', icon: FileText },
      { to: '/student/community', label: 'Community Feed', icon: MessageSquare },
      { to: '/student/leaders', label: 'Leaders Board', icon: ShieldCheck },
      { to: '/student/groups', label: 'Study Groups', icon: Users },
      { to: '/student/events', label: 'Campus Events', icon: CalendarDays },
      { to: '/student/lost-found', label: 'Lost & Found', icon: Search },
      { to: '/student/maintenance', label: 'Maintenance', icon: Wrench },
      { to: '/student/finance', label: 'My Fees', icon: DollarSign },
      { to: '/student/counselling', label: 'Counselling', icon: ShieldCheck },
      { to: '/student/directory', label: 'Academic Offices', icon: Contact },
      { to: '/student/internships', label: 'Internships', icon: Briefcase },
      { to: '/student/scholarships', label: 'Scholarships', icon: Award },
      { to: '/student/complaints', label: 'Complaints', icon: AlertCircle },
      { to: '/student/profile', label: 'Settings', icon: Settings },
      { to: '/student/notifications', label: 'Notifications', icon: Bell }
    ],
    admin: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: Home },
      { to: '/admin/notice-board', label: 'Notice Board', icon: Megaphone },
      { to: '/admin/users', label: 'User Management', icon: Users },
      { to: '/admin/departments', label: 'Departments', icon: Building },
      { to: '/admin/offices', label: 'Manage Offices', icon: Contact },
      { to: '/admin/courses', label: 'Academic Mgmt', icon: BookOpen },
      { to: '/admin/enrollments', label: 'Enrollments', icon: UserCheck },
      { to: '/admin/exams', label: 'Exams', icon: FileText },
      { to: '/admin/community', label: 'Community Feed', icon: MessageSquare },
      { to: '/admin/groups', label: 'Study Groups', icon: Users },
      { to: '/admin/events', label: 'Campus Events', icon: CalendarDays },
      { to: '/admin/internships', label: 'Internships', icon: Briefcase },
      { to: '/admin/scholarships', label: 'Scholarships', icon: Award },
      { to: '/admin/finance', label: 'Finance', icon: DollarSign },
      { to: '/admin/complaints', label: 'Complaints', icon: AlertCircle },
      { to: '/admin/maintenance', label: 'Maintenance', icon: Wrench },
      { to: '/admin/lost-found', label: 'Lost & Found', icon: Search },
      { to: '/admin/counselling', label: 'Counselling', icon: ShieldCheck },
      { to: '/admin/settings', label: 'System Settings', icon: Settings },
      { to: '/admin/profile', label: 'My Profile', icon: User },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell }
    ],
    lecturer: [
      { to: '/lecturer/dashboard', label: 'Dashboard', icon: Home },
      { to: '/lecturer/notice-board', label: 'Notice Board', icon: Megaphone },
      { to: '/lecturer/classes', label: 'My Classes', icon: BookOpen },
      { to: '/lecturer/live-lecture', label: 'Live Attendance', icon: Play },
      { to: '/lecturer/exams', label: 'Exams', icon: FileText },
      { to: '/lecturer/profile', label: 'Settings', icon: Settings },
      { to: '/lecturer/notifications', label: 'Notifications', icon: Bell }
    ],
    worker: [
      { to: '/worker/dashboard', label: 'Dashboard', icon: Home },
      { to: '/worker/notice-board', label: 'Notice Board', icon: Megaphone },
      { to: '/worker/tasks', label: 'My Tasks', icon: Wrench },
      { to: '/worker/profile', label: 'Settings', icon: Settings },
      { to: '/worker/notifications', label: 'Notifications', icon: Bell }
    ]
  }

  return (
    <aside className={`fixed left-0 top-0 z-40 w-64 flex flex-col h-screen transition-transform duration-300 ease-in-out bg-[#1a0b2e] text-slate-300 border-r border-purple-900 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="p-6 flex flex-col items-center justify-center border-b border-purple-900/50 shrink-0">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg">
          <img src="/logo.svg" alt="Baraton" className="w-12 h-12" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }} />
          <span className="text-brand-600 font-bold text-2xl hidden">B</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-wide">BaratonHub</h1>
        <p className="text-[10px] text-purple-300 font-medium uppercase tracking-widest mt-1">Baraton University</p>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        {(nav[role] || []).map((item) => (
          <NavLink key={item.label} to={item.to} onClick={closeMenu} 
            className={({isActive}) => `flex items-center justify-between px-4 py-3 rounded-lg transition font-medium text-sm ${isActive ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50' : 'hover:bg-purple-900/50 hover:text-white text-purple-200'}`}>
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" /> {item.label}
            </div>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-purple-900/50 shrink-0">
        <button onClick={signOut} className="flex items-center justify-center gap-2 text-purple-300 hover:text-white text-sm w-full py-2 transition font-medium"><LogOut className="w-4 h-4" /> Sign Out</button>
      </div>
    </aside>
  )
}