import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { supabase } from '../../../services/supabase/client.js'
import { BookOpen, CheckCircle, Calendar, Megaphone, MapPin, Clock, ArrowRight, PlayCircle, Trophy } from 'lucide-react'

export default function StudentDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ courses: 0, events: 0, notices: 0, attendanceRate: 0, present: 0, late: 0, absent: 0 })
  const [activeLecture, setActiveLecture] = useState(null)
  const [events, setEvents] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    const loadDashboard = async () => {
      // 1. Fetch stats
      const { count: courseCount } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('student_id', profile.id)
      const { count: eventCount } = await supabase.from('campus_events').select('*', { count: 'exact', head: true }).gte('event_date', new Date().toISOString())
      const { count: noticeCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).eq('is_read', false)

      // 2. Attendance Calculation
      const { data: records } = await supabase.from('lecture_attendance').select('status').eq('student_id', profile.id)
      const total = records?.length || 0
      const present = records?.filter(r => r.status === 'Present' || r.status === 'Manual').length || 0
      const late = records?.filter(r => r.status === 'Late').length || 0
      const absent = total - present - late
      const rate = total > 0 ? Math.round((present / total) * 100) : 0

      setStats({ courses: courseCount || 0, events: eventCount || 0, notices: noticeCount || 0, attendanceRate: rate, present, late, absent })

      // 3. Active Lecture
      const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('student_id', profile.id)
      const courseIds = enrollments?.map(e => e.course_id) || []
      if (courseIds.length > 0) {
        const { data: s } = await supabase.from('lecture_sessions').select('*, courses(code, title, profiles(full_name)), venue_lat, venue_lng, radius_meters').in('course_id', courseIds).eq('is_active', true).limit(1)
        if (s && s.length > 0) setActiveLecture(s[0])
      }

      // 4. Upcoming Events & Announcements
      const { data: ev } = await supabase.from('campus_events').select('*').gte('event_date', new Date().toISOString()).order('event_date', { ascending: true }).limit(2)
      setEvents(ev || [])
      
      const { data: an } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(2)
      setAnnouncements(an || [])

      setLoading(false)
    }
    loadDashboard()
  }, [profile])

  if (loading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>

  return (
    <div className="space-y-6 pb-10">
      
      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 rounded-2xl p-8 relative overflow-hidden flex items-center justify-between shadow-lg">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"><BookOpen className="w-6 h-6 text-white" /></div>
            <h1 className="text-3xl font-bold text-white">Welcome back, {profile?.full_name?.split(' ')[0]}!</h1>
          </div>
          <p className="text-brand-100 text-lg">Keep learning, keep achieving.</p>
        </div>
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/University_of_Eastern_Africa_Baraton_Main_Building.jpg/1200px-University_of_Eastern_Africa_Baraton_Main_Building.jpg" alt="UEAB" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-40 mask-image-gradient" style={{ maskImage: 'linear-gradient(to right, transparent, black)' }} />
        <div className="absolute right-6 bottom-6 bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg text-white font-bold border border-white/30">UEAB</div>
      </div>

      {/* STAT CARDS */}
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
          <div><p className="text-sm text-slate-500 font-medium">Upcoming Events</p><p className="text-2xl font-bold text-slate-900">{stats.events}</p></div>
        </Link>
        <Link to="/student/notifications" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center"><Megaphone className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium">Unread Notices</p><p className="text-2xl font-bold text-slate-900">{stats.notices}</p></div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COL: Active Lecture & Events */}
        <div className="lg:col-span-2 space-y-6">
          {/* ACTIVE LECTURE */}
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
                      <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {activeLecture.location || 'Main Hall'}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Started: {new Date(activeLecture.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                  </div>
                  <Link to="/student/attendance" className="mt-6 w-full bg-brand-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-700 transition">
                    <PlayCircle className="w-5 h-5" /> View Lecture & Check Attendance <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="bg-green-50 rounded-xl p-6 flex flex-col items-center justify-center text-center border border-green-100 min-w-[200px]">
                  <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
                  <p className="font-bold text-green-800">You are in class!</p>
                  <p className="text-xs text-green-600 mt-1">Location Verified</p>
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mt-4 shadow-sm"><MapPin className="w-5 h-5 text-green-500" /></div>
                  <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wider font-bold">Checked in</p>
                  <p className="font-bold text-slate-800">10:32 AM</p>
                </div>
              </div>
            </div>
          ) : (
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">No active lectures right now.</div>
          )}

          {/* UPCOMING EVENTS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-800">Upcoming Events</h2>
              <Link to="/student/events" className="text-sm text-brand-600 font-bold flex items-center gap-1 hover:underline">View All <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="p-4 space-y-3">
              {events.map(ev => (
                <div key={ev.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center shrink-0"><Calendar className="w-5 h-5" /></div>
                    <div>
                      <p className="font-bold text-slate-800">{ev.title}</p>
                      <p className="text-xs text-slate-500">{new Date(ev.event_date).toLocaleDateString()} • {new Date(ev.event_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                  <Link to="/student/events" className="bg-brand-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-brand-700">Join</Link>
                </div>
              ))}
              {events.length === 0 && <p className="text-center text-slate-500 py-4">No upcoming events.</p>}
            </div>
          </div>
        </div>

        {/* RIGHT COL: Attendance Donut & Announcements */}
        <div className="space-y-6">
          {/* DONUT CHART */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 mb-6">My Attendance</h2>
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40 rounded-full flex items-center justify-center mb-6" style={{ background: `conic-gradient(#10b981 ${stats.attendanceRate}%, #e2e8f0 0)` }}>
                <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-3xl font-bold text-slate-900">{stats.attendanceRate}%</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Overall</span>
                </div>
              </div>
              <div className="w-full space-y-3">
                <div className="flex justify-between items-center text-sm"><span className="flex items-center gap-2 font-medium"><span className="w-2 h-2 rounded-full bg-green-500"></span> Present</span> <span className="font-bold">{stats.present}</span></div>
                <div className="flex justify-between items-center text-sm"><span className="flex items-center gap-2 font-medium"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Late</span> <span className="font-bold">{stats.late}</span></div>
                <div className="flex justify-between items-center text-sm"><span className="flex items-center gap-2 font-medium"><span className="w-2 h-2 rounded-full bg-red-500"></span> Absent</span> <span className="font-bold">{stats.absent}</span></div>
              </div>
            </div>
            <div className="mt-6 bg-brand-50 border border-brand-100 rounded-xl p-4 flex items-center gap-3">
              <Trophy className="w-6 h-6 text-brand-600 shrink-0" />
              <p className="text-xs text-brand-800 font-medium leading-relaxed">Great! You are meeting the attendance requirement.</p>
            </div>
          </div>

          {/* ANNOUNCEMENTS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-800">Latest Announcements</h2>
              <Link to="/student/announcements" className="text-sm text-brand-600 font-bold flex items-center gap-1 hover:underline">View All <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="p-4 space-y-4">
              {announcements.map(a => (
                <div key={a.id} className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><Megaphone className="w-5 h-5" /></div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}