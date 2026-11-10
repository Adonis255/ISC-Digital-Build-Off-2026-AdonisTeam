import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { supabase } from '../../../services/supabase/client.js'
import { BookOpen, CheckCircle, Calendar, Megaphone, MapPin, Clock, ArrowRight, PlayCircle, DollarSign } from 'lucide-react'

export default function StudentDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ courses: 0, events: 0, notices: 0, attendanceRate: 0 })
  const [feeStats, setFeeStats] = useState({ totalRequired: 0, totalPaid: 0, remaining: 0, progress: 0 })
  const [activeLecture, setActiveLecture] = useState(null)
  const [events, setEvents] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [bannerUrl, setBannerUrl] = useState('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/University_of_Eastern_Africa_Baraton_Main_Building.jpg/1200px-University_of_Eastern_Africa_Baraton_Main_Building.jpg')

  useEffect(() => {
    if (!profile) return
    const loadDashboard = async () => {
      // 1. Fetch Banner
      const { data: settings } = await supabase.from('system_settings').select('banner_url').eq('id', 1).maybeSingle()
      if (settings?.banner_url) setBannerUrl(settings.banner_url)

      // 2. Fetch stats
      const { count: courseCount } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('student_id', profile.id)
      
      // FIXED: Fetch all events, just order by date descending, so past/upcoming both show
      const { data: ev } = await supabase.from('campus_events').select('*').order('event_date', { ascending: false }).limit(3)
      setEvents(ev || [])

      const { count: noticeCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).eq('is_read', false)

      const { data: records } = await supabase.from('lecture_attendance').select('status').eq('student_id', profile.id)
      const total = records?.length || 0
      const present = records?.filter(r => r.status === 'Present' || r.status === 'Manual').length || 0
      const rate = total > 0 ? Math.round((present / total) * 100) : 0

      // 3. FEE CALCULATION
      const { data: payments } = await supabase.from('finance_records').select('amount').eq('student_id', profile.id).eq('status', 'paid')
      const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
      const totalRequired = ((courseCount || 0) * 20000) + 5000
      const remaining = Math.max(0, totalRequired - totalPaid)
      const feeProgress = totalRequired > 0 ? Math.min(100, Math.round((totalPaid / totalRequired) * 100)) : 0

      setStats({ courses: courseCount || 0, events: ev?.length || 0, notices: noticeCount || 0, attendanceRate: rate })
      setFeeStats({ totalRequired, totalPaid, remaining, progress: feeProgress })

      // 4. Active Lecture
      const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('student_id', profile.id)
      const courseIds = enrollments?.map(e => e.course_id) || []
      if (courseIds.length > 0) {
        const { data: s } = await supabase.from('lecture_sessions').select('*, courses(code, title, profiles(full_name))').in('course_id', courseIds).eq('is_active', true).limit(1)
        if (s && s.length > 0) setActiveLecture(s[0])
      }

      const { data: an } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(2)
      setAnnouncements(an || [])

      setLoading(false)
    }
    loadDashboard()
  }, [profile])

  if (loading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 rounded-2xl p-8 relative overflow-hidden flex items-center justify-between shadow-lg">
        <div className="absolute inset-0 opacity-30">
          <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-brand-900/40"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"><BookOpen className="w-6 h-6 text-white" /></div>
            <h1 className="text-3xl font-bold text-white">Welcome back, {profile?.full_name?.split(' ')[0]}!</h1>
          </div>
          <p className="text-brand-100 text-lg">Keep learning, keep achieving.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/student/catalog" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center"><BookOpen className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium">Enrolled Courses</p><p className="text-2xl font-bold text-slate-900">{stats.courses}</p></div>
        </Link>
        <Link to="/student/attendance" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium">Attendance Rate</p><p className="text-2xl font-bold text-slate-900">{stats.attendanceRate}%</p></div>
        </Link>
        <Link to="/student/events" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><Calendar className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium">Campus Events</p><p className="text-2xl font-bold text-slate-900">{stats.events}</p></div>
        </Link>
        <Link to="/student/notifications" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center"><Megaphone className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium">Unread Notices</p><p className="text-2xl font-bold text-slate-900">{stats.notices}</p></div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeLecture ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <h2 className="font-bold text-slate-800">Active Lecture – Now</h2>
                <span className="ml-auto bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md">In Progress</span>
              </div>
              <div className="p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center shrink-0"><BookOpen className="w-8 h-8 text-blue-600" /></div>
                    <div>
                      <h3 className="font-bold text-xl text-slate-900">{activeLecture.courses?.title}</h3>
                      <p className="text-slate-500 font-medium">{activeLecture.courses?.code}</p>
                      <p className="text-sm text-slate-600 mt-1">Lecturer: {activeLecture.courses?.profiles?.full_name}</p>
                      <p className="text-sm text-slate-600 mt-1">Topic: {activeLecture.topic}</p>
                    </div>
                  </div>
                  <Link to="/student/attendance" className="mt-6 w-full bg-brand-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-700 transition">
                    <PlayCircle className="w-5 h-5" /> View Lecture & Check Attendance
                  </Link>
                </div>
              </div>
            </div>
          ) : (
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">No active lectures right now.</div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-800">Recent Events</h2>
              <Link to="/student/events" className="text-sm text-brand-600 font-bold flex items-center gap-1 hover:underline">View All <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="p-4 space-y-3">
              {events.map(ev => (
                <div key={ev.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center shrink-0"><Calendar className="w-5 h-5" /></div>
                    <div>
                      <p className="font-bold text-slate-800">{ev.title}</p>
                      <p className="text-xs text-slate-500">{new Date(ev.event_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
              {events.length === 0 && <p className="text-center text-slate-500 py-4">No events found.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-600" /> Fee Clearance</h2>
            
            <div className="text-center mb-4">
              <p className="text-sm text-slate-500 font-medium">Remaining Balance</p>
              <p className={`text-3xl font-extrabold ${feeStats.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                Ksh {feeStats.remaining.toLocaleString()}
              </p>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden border">
              <div className={`h-3 rounded-full transition-all duration-1000 ${feeStats.progress === 100 ? 'bg-green-500' : 'bg-brand-500'}`} style={{ width: `${feeStats.progress}%` }}></div>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-400 mb-4">
              <span>Paid: {feeStats.progress}%</span>
              <span>Goal: 100%</span>
            </div>

            <Link to="/student/finance" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition">
              Manage Fees <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 mb-6">My Attendance</h2>
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 rounded-full flex items-center justify-center mb-6" style={{ background: `conic-gradient(#10b981 ${stats.attendanceRate}%, #e2e8f0 0)` }}>
                <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-2xl font-bold text-slate-900">{stats.attendanceRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}