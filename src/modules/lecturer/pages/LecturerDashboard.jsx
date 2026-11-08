import { useAuth } from '../../../hooks/useAuth.js'
import { BookOpen, Megaphone } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function LecturerDashboard() {
  const { profile } = useAuth()
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lecturer Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome, {profile?.full_name}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/lecturer/announcements" className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 grid place-items-center mb-4"><Megaphone className="w-5 h-5" /></div>
          <h3 className="font-semibold text-slate-800">Class Announcements</h3>
          <p className="text-sm text-slate-500 mt-1">Post updates and notices for your students.</p>
        </Link>
        <div className="bg-white p-6 rounded-xl border shadow-sm opacity-60">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 grid place-items-center mb-4"><BookOpen className="w-5 h-5" /></div>
          <h3 className="font-semibold text-slate-800">My Classes</h3>
          <p className="text-sm text-slate-500 mt-1">Class schedules and attendance (Coming Soon).</p>
        </div>
      </div>
    </div>
  )
}