import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { supabase } from '../../../services/supabase/client.js'
import { Search, Wrench, Megaphone, PlayCircle } from 'lucide-react'

export default function StudentDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ myRequests: 0, myItems: 0 })
  const [announcements, setAnnouncements] = useState([])
  const [activeLecture, setActiveLecture] = useState(null)

  useEffect(() => {
    if (!profile) return
    
    const checkData = async () => {
      // 1. Check for active lecture
      const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('student_id', profile.id)
      const courseIds = enrollments?.map(e => e.course_id) || []
      
      if (courseIds.length > 0) {
        const { data: s } = await supabase.from('lecture_sessions').select('*, courses(code, title)').in('course_id', courseIds).eq('is_active', true).maybeSingle()
        setActiveLecture(s || null)
      }

      // 2. Load stats
      const [m, l] = await Promise.all([
        supabase.from('maintenance_requests').select('*', { count: 'exact', head: true }).eq('reporter_id', profile.id),
        supabase.from('items').select('*', { count: 'exact', head: true }).eq('reporter_id', profile.id)
      ])
      setStats({ myRequests: m.count || 0, myItems: l.count || 0 })
      
      // 3. Load announcements
      const { data: a } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3)
      setAnnouncements(a || [])
    }

    checkData()
    const interval = setInterval(checkData, 5000) // Check every 5 seconds
    return () => clearInterval(interval)
  }, [profile])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {profile?.full_name}</h1>
        <p className="text-sm text-slate-500">Here is what is happening on campus today.</p>
      </div>

      {/* ACTIVE LECTURE BANNER */}
      {activeLecture && (
        <div className="bg-brand-600 text-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 animate-pulse-slow">
          <div>
            <div className="flex items-center gap-2 font-bold mb-1">
              <PlayCircle className="w-5 h-5" /> Class in Session!
            </div>
            <h2 className="text-2xl font-bold">{activeLecture.courses?.code} - {activeLecture.courses?.title}</h2>
            <p className="text-brand-100">Topic: {activeLecture.topic}</p>
          </div>
          <Link to="/student/attendance" className="bg-white text-brand-700 px-6 py-3 rounded-lg font-bold hover:bg-slate-50 transition shrink-0">
            Return to Class
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 grid place-items-center mb-4"><Wrench className="w-5 h-5" /></div>
          <h3 className="font-semibold text-slate-800">My Maintenance Requests</h3>
          <p className="text-3xl font-bold mt-1">{stats.myRequests}</p>
          <Link to="/student/maintenance" className="text-sm text-brand-600 mt-2 inline-block hover:underline">Manage requests &rarr;</Link>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 grid place-items-center mb-4"><Search className="w-5 h-5" /></div>
          <h3 className="font-semibold text-slate-800">My Reported Items</h3>
          <p className="text-3xl font-bold mt-1">{stats.myItems}</p>
          <Link to="/student/lost-found" className="text-sm text-brand-600 mt-2 inline-block hover:underline">View Lost & Found &rarr;</Link>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 grid place-items-center mb-4"><Megaphone className="w-5 h-5" /></div>
          <h3 className="font-semibold text-slate-800">Campus Announcements</h3>
          <Link to="/student/announcements" className="text-sm text-brand-600 mt-2 inline-block hover:underline">Read latest news &rarr;</Link>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="font-semibold text-lg mb-4">Recent Announcements</h2>
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className="border-b last:border-0 pb-4 last:pb-0">
              <h4 className="font-medium">{a.title}</h4>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{a.body}</p>
            </div>
          ))}
          {announcements.length === 0 && <p className="text-sm text-slate-500">No announcements yet.</p>}
        </div>
      </div>
    </div>
  )
}