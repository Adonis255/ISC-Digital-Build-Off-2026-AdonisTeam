import fs from 'fs';
import path from 'path';

const files = {
  // 1. Profile Page (Part 1)
  "src/modules/student/pages/ProfilePage.jsx": `import { useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Camera } from 'lucide-react'

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleUpdate = async (e) => {
    e.preventDefault()
    setMsg('Saving...')
    const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', profile.id)
    if (error) setMsg(error.message)
    else {
      setMsg('Profile updated!')
      if (refreshProfile) refreshProfile()
    }
  }

  const uploadAvatar = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fileName = \`\${profile.id}-\${Math.random()}.\${file.name.split('.').pop()}\`
    await supabase.storage.from('avatars').upload(fileName, file)
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
    setUploading(false)
    if (refreshProfile) refreshProfile()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-slate-100" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand-600 text-white flex items-center justify-center text-3xl font-bold border-4 border-slate-100">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow border cursor-pointer hover:bg-slate-50">
              <Camera className="w-4 h-4 text-slate-600" />
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile?.full_name}</h2>
            <p className="text-slate-500">{profile?.email}</p>
            <span className="inline-block mt-2 px-2 py-1 bg-slate-100 rounded text-xs uppercase font-bold">{profile?.role}</span>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4 border-t pt-6">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full border p-2 rounded" placeholder="+254..." />
          </div>
          {msg && <p className="text-sm text-brand-600 font-medium">{msg}</p>}
          <button type="submit" className="bg-navy-900 text-white px-6 py-2 rounded-lg">Save Changes</button>
        </form>
      </div>
    </div>
  )
}`,

  // 2. Department Permissions (Part 1)
  "src/modules/administration/pages/DepartmentPermissions.jsx": `import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { Shield } from 'lucide-react'

export default function DepartmentPermissions() {
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState('')
  const [permissions, setPermissions] = useState([])
  const MODULES = ['Finance', 'Maintenance', 'Lost & Found', 'Counselling']

  const loadData = async () => {
    const { data: d } = await supabase.from('departments').select('*')
    setDepartments(d || [])
    if (d?.length > 0 && !selectedDept) setSelectedDept(d[0].id)
  }

  const loadPermissions = async () => {
    if (!selectedDept) return
    const { data } = await supabase.from('department_permissions').select('*').eq('department_id', selectedDept)
    
    // Ensure all modules have a record
    const formatted = MODULES.map(m => {
      const existing = data?.find(p => p.module === m)
      return existing || { department_id: selectedDept, module: m, can_view: false, can_edit: false }
    })
    setPermissions(formatted)
  }

  useEffect(() => { loadData() }, [])
  useEffect(() => { loadPermissions() }, [selectedDept])

  const togglePermission = async (module, field) => {
    const perm = permissions.find(p => p.module === module)
    const newVal = !perm[field]
    
    // Update local state
    setPermissions(prev => prev.map(p => p.module === module ? { ...p, [field]: newVal } : p))
    
    // Upsert to DB
    await supabase.from('department_permissions').upsert({ 
      department_id: selectedDept, 
      module, 
      [field]: newVal 
    }, { onConflict: 'department_id, module' })
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center"><Shield className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold">Department Permissions</h1>
          <p className="text-sm text-slate-500">Configure what each department can view and edit.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="border p-2 rounded-lg mb-6 w-full max-w-xs">
          {departments.map(d => <option key={d.id} value={d.id}>{d.name} Department</option>)}
        </select>

        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr><th className="p-3">Module</th><th className="p-3 text-center">Can View</th><th className="p-3 text-center">Can Edit</th></tr>
          </thead>
          <tbody>
            {permissions.map(p => (
              <tr key={p.module} className="border-b">
                <td className="p-3 font-medium">{p.module}</td>
                <td className="p-3 text-center">
                  <input type="checkbox" checked={p.can_view} onChange={() => togglePermission(p.module, 'can_view')} className="w-5 h-5 cursor-pointer accent-brand-600" />
                </td>
                <td className="p-3 text-center">
                  <input type="checkbox" checked={p.can_edit} onChange={() => togglePermission(p.module, 'can_edit')} className="w-5 h-5 cursor-pointer accent-brand-600" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}`,

  // 3. Finance (Part 2)
  "src/modules/finance/pages/FinancePage.jsx": `import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { DollarSign } from 'lucide-react'

export default function FinancePage() {
  const { profile, role } = useAuth()
  const [records, setRecords] = useState([])
  const [students, setStudents] = useState([])
  const [form, setForm] = useState({ student_id: '', description: '', amount: '' })

  const loadData = async () => {
    const { data } = await supabase.from('finance_records').select('*, profiles(full_name)').order('created_at', { ascending: false })
    setRecords(data || [])
    if (role === 'admin') {
      const { data: s } = await supabase.from('profiles').select('id, full_name').eq('role', 'student')
      setStudents(s || [])
    }
  }

  useEffect(() => { loadData() }, [role])

  const handleCreate = async (e) => {
    e.preventDefault()
    await supabase.from('finance_records').insert([form])
    setForm({ student_id: '', description: '', amount: '' })
    loadData()
  }

  const markPaid = async (id) => {
    await supabase.from('finance_records').update({ status: 'paid' }).eq('id', id)
    loadData()
  }

  const isAdmin = role === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center"><DollarSign className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold">Finance Records</h1>
          <p className="text-sm text-slate-500">{isAdmin ? 'Manage student fee balances.' : 'View your fee statement.'}</p>
        </div>
      </div>

      {isAdmin && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border flex gap-4 items-end">
          <div className="flex-1"><label className="block text-sm mb-1">Student</label>
            <select required value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})} className="w-full border p-2 rounded">
              <option value="">Select Student...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div className="flex-1"><label className="block text-sm mb-1">Description</label><input required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" placeholder="Tuition Fee" /></div>
          <div className="w-32"><label className="block text-sm mb-1">Amount (Ksh)</label><input required type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full border p-2 rounded" placeholder="50000" /></div>
          <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg">Add Record</button>
        </form>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>{isAdmin && <th className="p-3">Student</th>}<th className="p-3">Description</th><th className="p-3">Amount</th><th className="p-3">Status</th>{isAdmin && <th className="p-3">Action</th>}</tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className="border-b">
                {isAdmin && <td className="p-3 font-medium">{r.profiles?.full_name}</td>}
                <td className="p-3">{r.description}</td>
                <td className="p-3 font-bold">Ksh {r.amount}</td>
                <td className="p-3"><span className={\`px-2 py-1 rounded text-xs font-bold uppercase \${r.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>{r.status}</span></td>
                {isAdmin && <td className="p-3">{r.status !== 'paid' && <button onClick={() => markPaid(r.id)} className="text-sm text-brand-600 font-medium">Mark Paid</button>}</td>}
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={isAdmin ? 5 : 3} className="p-6 text-center text-slate-500">No finance records found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}`,

  // 4. Complaints (Part 2)
  "src/modules/complaints/pages/ComplaintsPage.jsx": `import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { AlertCircle } from 'lucide-react'

export default function ComplaintsPage() {
  const { profile, role } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [form, setForm] = useState({ subject: '', description: '' })

  const loadData = async () => {
    const { data } = await supabase.from('complaints').select('*, profiles(full_name)').order('created_at', { ascending: false })
    setComplaints(data || [])
  }

  useEffect(() => { loadData() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await supabase.from('complaints').insert([{ ...form, student_id: profile.id }])
    setForm({ subject: '', description: '' })
    loadData()
  }

  const resolveComplaint = async (id) => {
    await supabase.from('complaints').update({ status: 'resolved' }).eq('id', id)
    loadData()
  }

  const isAdmin = role === 'admin'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center"><AlertCircle className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold">Complaints & Feedback</h1>
          <p className="text-sm text-slate-500">Submit an issue to the administration.</p>
        </div>
      </div>

      {!isAdmin && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <input required placeholder="Subject" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full border p-2 rounded" />
          <textarea required placeholder="Describe your issue..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" rows="3"></textarea>
          <button type="submit" className="bg-navy-900 text-white px-6 py-2 rounded-lg">Submit Complaint</button>
        </form>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>{isAdmin && <th className="p-3">Student</th>}<th className="p-3">Subject</th><th className="p-3">Description</th><th className="p-3">Status</th>{isAdmin && <th className="p-3">Action</th>}</tr>
          </thead>
          <tbody>
            {complaints.map(c => (
              <tr key={c.id} className="border-b">
                {isAdmin && <td className="p-3 font-medium">{c.profiles?.full_name}</td>}
                <td className="p-3">{c.subject}</td>
                <td className="p-3 text-sm text-slate-600">{c.description}</td>
                <td className="p-3"><span className={\`px-2 py-1 rounded text-xs font-bold uppercase \${c.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}\`}>{c.status}</span></td>
                {isAdmin && <td className="p-3">{c.status !== 'resolved' && <button onClick={() => resolveComplaint(c.id)} className="text-sm text-brand-600 font-medium">Mark Resolved</button>}</td>}
              </tr>
            ))}
            {complaints.length === 0 && <tr><td colSpan={isAdmin ? 5 : 3} className="p-6 text-center text-slate-500">No complaints found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}`,

  // 5. Updated Sidebar
  "src/components/layout/Sidebar.jsx": `import { NavLink } from 'react-router-dom'
import { LogOut, Home, Users, Wrench, Megaphone, Bell, Search, MessageSquare, Calendar, ShieldCheck, BookOpen, User, Shield, DollarSign, AlertCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'

export default function Sidebar() {
  const { profile, role, signOut } = useAuth()
  
  const nav = {
    student: [
      { to: '/student/dashboard', label: 'Dashboard', icon: Home },
      { to: '/student/community', label: 'Community', icon: MessageSquare },
      { to: '/student/lost-found', label: 'Lost & Found', icon: Search },
      { to: '/student/maintenance', label: 'Maintenance', icon: Wrench },
      { to: '/student/finance', label: 'My Fees', icon: DollarSign },
      { to: '/student/complaints', label: 'Complaints', icon: AlertCircle },
      { to: '/student/counselling', label: 'Counselling', icon: ShieldCheck },
      { to: '/student/profile', label: 'Profile', icon: User },
      { to: '/student/notifications', label: 'Notifications', icon: Bell }
    ],
    admin: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: Home },
      { to: '/admin/users', label: 'User Management', icon: Users },
      { to: '/admin/courses', label: 'Courses', icon: BookOpen },
      { to: '/admin/permissions', label: 'Dept Permissions', icon: Shield },
      { to: '/admin/finance', label: 'Finance', icon: DollarSign },
      { to: '/admin/complaints', label: 'Complaints', icon: AlertCircle },
      { to: '/admin/maintenance', label: 'Maintenance', icon: Wrench },
      { to: '/admin/counselling', label: 'Counselling', icon: ShieldCheck },
      { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/admin/profile', label: 'Profile', icon: User },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell }
    ],
    lecturer: [
      { to: '/lecturer/dashboard', label: 'Dashboard', icon: Home },
      { to: '/lecturer/classes', label: 'My Classes', icon: BookOpen },
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
    <aside className="w-64 bg-navy-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-20">
      <div className="p-6 border-b border-navy-700">
        <h1 className="text-xl font-bold text-white">BaratonHub</h1>
        <p className="text-xs text-brand-400 capitalize">{role} Portal</p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {(nav[role] || []).map((item) => (
          <NavLink key={item.label} to={item.to} className={({isActive}) => \`flex items-center gap-3 px-3 py-2.5 rounded-lg transition \${isActive ? 'bg-brand-600 text-white' : 'hover:bg-navy-800'}\`}>
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
}`,

  // 6. Final Routes
  "src/app/routes.jsx": `import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import Login from '../modules/authentication/pages/Login.jsx'
import Register from '../modules/authentication/pages/Register.jsx'
import StudentDashboard from '../modules/student/pages/StudentDashboard.jsx'
import AdminDashboard from '../modules/administration/pages/AdminDashboard.jsx'
import LecturerDashboard from '../modules/lecturer/pages/LecturerDashboard.jsx'
import WorkerDashboard from '../modules/worker/pages/WorkerDashboard.jsx'
import UserManagement from '../modules/administration/pages/UserManagement.jsx'
import CourseManagement from '../modules/administration/pages/CourseManagement.jsx'
import DepartmentPermissions from '../modules/administration/pages/DepartmentPermissions.jsx'
import LostFoundPage from '../modules/lost-and-found/pages/LostFoundPage.jsx'
import MaintenancePage from '../modules/maintenance/pages/MaintenancePage.jsx'
import AnnouncementsPage from '../modules/announcements/pages/AnnouncementsPage.jsx'
import CommunityPage from '../modules/community/pages/CommunityPage.jsx'
import NotificationsPage from '../modules/notifications/pages/NotificationsPage.jsx'
import AssignedTasks from '../modules/worker/pages/AssignedTasks.jsx'
import GroupsPage from '../modules/student/pages/GroupsPage.jsx'
import EventsPage from '../modules/student/pages/EventsPage.jsx'
import CounsellingPage from '../modules/counselling/pages/CounsellingPage.jsx'
import MyClasses from '../modules/lecturer/pages/MyClasses.jsx'
import ProfilePage from '../modules/student/pages/ProfilePage.jsx'
import FinancePage from '../modules/finance/pages/FinancePage.jsx'
import ComplaintsPage from '../modules/complaints/pages/ComplaintsPage.jsx'
import { ROLE_HOME } from '../utils/constants.js'

export default function AppRoutes() {
  const { user, role, loading, signOut } = useAuth()
  
  if (loading) return <div className="h-screen grid place-items-center text-slate-500">Loading...</div>
  if (user && !role) return <div className="h-screen grid place-items-center bg-slate-100 p-4"><div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md"><h2 className="text-xl font-bold text-red-600 mb-2">Profile Not Found</h2><button onClick={signOut} className="bg-slate-800 text-white px-4 py-2 rounded-lg w-full">Sign Out</button></div></div>

  return (
    <Routes>
      <Route path="/" element={!user ? <Navigate to="/login" /> : <Navigate to={ROLE_HOME[role] || '/login'} />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to={ROLE_HOME[role] || '/login'} />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={ROLE_HOME[role] || '/login'} />} />

      <Route element={<DashboardLayout allowedRoles={['student']} />}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/community" element={<CommunityPage />} />
        <Route path="/student/groups" element={<GroupsPage />} />
        <Route path="/student/events" element={<EventsPage />} />
        <Route path="/student/lost-found" element={<LostFoundPage />} />
        <Route path="/student/maintenance" element={<MaintenancePage />} />
        <Route path="/student/finance" element={<FinancePage />} />
        <Route path="/student/complaints" element={<ComplaintsPage />} />
        <Route path="/student/counselling" element={<CounsellingPage />} />
        <Route path="/student/announcements" element={<AnnouncementsPage />} />
        <Route path="/student/profile" element={<ProfilePage />} />
        <Route path="/student/notifications" element={<NotificationsPage />} />
      </Route>

      <Route element={<DashboardLayout allowedRoles={['admin']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/courses" element={<CourseManagement />} />
        <Route path="/admin/permissions" element={<DepartmentPermissions />} />
        <Route path="/admin/finance" element={<FinancePage />} />
        <Route path="/admin/complaints" element={<ComplaintsPage />} />
        <Route path="/admin/lost-found" element={<LostFoundPage />} />
        <Route path="/admin/maintenance" element={<MaintenancePage />} />
        <Route path="/admin/counselling" element={<CounsellingPage />} />
        <Route path="/admin/announcements" element={<AnnouncementsPage />} />
        <Route path="/admin/profile" element={<ProfilePage />} />
        <Route path="/admin/notifications" element={<NotificationsPage />} />
      </Route>

      <Route element={<DashboardLayout allowedRoles={['lecturer']} />}>
        <Route path="/lecturer/dashboard" element={<LecturerDashboard />} />
        <Route path="/lecturer/classes" element={<MyClasses />} />
        <Route path="/lecturer/announcements" element={<AnnouncementsPage />} />
        <Route path="/lecturer/profile" element={<ProfilePage />} />
        <Route path="/lecturer/notifications" element={<NotificationsPage />} />
      </Route>

      <Route element={<DashboardLayout allowedRoles={['worker']} />}>
        <Route path="/worker/dashboard" element={<WorkerDashboard />} />
        <Route path="/worker/tasks" element={<AssignedTasks />} />
        <Route path="/worker/profile" element={<ProfilePage />} />
        <Route path="/worker/notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}`
};

Object.entries(files).forEach(([filePath, content]) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
});
console.log("✅ All 3 tasks (Profiles, Permissions, Finance/Complaints) generated successfully!");