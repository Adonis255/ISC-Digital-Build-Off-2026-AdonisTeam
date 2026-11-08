import { NavLink } from 'react-router-dom'
import { LogOut, Home, Users, Wrench, Megaphone, Bell, Search, MessageSquare, Calendar, ShieldCheck, BookOpen } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'

export default function Sidebar() {
  const { profile, role, signOut } = useAuth()
  
  const nav = {
    student: [
      { to: '/student/dashboard', label: 'Dashboard', icon: Home },
      { to: '/student/community', label: 'Community', icon: MessageSquare },
      { to: '/student/groups', label: 'Study Groups', icon: Users },
      { to: '/student/events', label: 'Campus Events', icon: Calendar },
      { to: '/student/lost-found', label: 'Lost & Found', icon: Search },
      { to: '/student/maintenance', label: 'Maintenance', icon: Wrench },
      { to: '/student/counselling', label: 'Counselling', icon: ShieldCheck },
      { to: '/student/notifications', label: 'Notifications', icon: Bell }
    ],
    admin: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: Home },
      { to: '/admin/users', label: 'User Management', icon: Users },
      { to: '/admin/courses', label: 'Courses', icon: BookOpen },
      { to: '/admin/lost-found', label: 'Lost & Found', icon: Search },
      { to: '/admin/maintenance', label: 'Maintenance', icon: Wrench },
      { to: '/admin/counselling', label: 'Counselling', icon: ShieldCheck },
      { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell }
    ],
    lecturer: [
      { to: '/lecturer/dashboard', label: 'Dashboard', icon: Home },
      { to: '/lecturer/classes', label: 'My Classes', icon: BookOpen },
      { to: '/lecturer/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/lecturer/notifications', label: 'Notifications', icon: Bell }
    ],
    worker: [
      { to: '/worker/dashboard', label: 'Dashboard', icon: Home },
      { to: '/worker/tasks', label: 'My Tasks', icon: Wrench },
      { to: '/worker/notifications', label: 'Notifications', icon: Bell }
    ]
  }

  return (
    <aside className="w-64 bg-navy-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-20">
      <div className="p-6 border-b border-navy-700">
        <h1 className="text-xl font-bold text-white">BaratonHub</h1>
        <p className="text-xs text-brand-400 capitalize">{role} Portal</p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {(nav[role] || []).map((item) => (
          <NavLink key={item.label} to={item.to} className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${isActive ? 'bg-brand-600 text-white' : 'hover:bg-navy-800'}`}>
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