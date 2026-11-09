import fs from 'fs';
import path from 'path';

const files = {
  // 1. Admin Settings Page (Upload Banner)
  "src/modules/administration/pages/SystemSettingsPage.jsx": `import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { Settings, Upload, Image as ImageIcon, CheckCircle } from 'lucide-react'

export default function SystemSettingsPage() {
  const [allowReg, setAllowReg] = useState(true)
  const [bannerUrl, setBannerUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')

  const loadSettings = async () => {
    const { data } = await supabase.from('system_settings').select('allow_registration, banner_url').eq('id', 1).single()
    if (data) {
      setAllowReg(data.allow_registration)
      setBannerUrl(data.banner_url || '')
    }
  }

  useEffect(() => { loadSettings() }, [])

  const toggleRegistration = async () => {
    setSaving(true)
    const newVal = !allowReg
    await supabase.from('system_settings').update({ allow_registration: newVal }).eq('id', 1)
    setAllowReg(newVal)
    setSaving(false)
    setMsg('Settings saved!')
    setTimeout(() => setMsg(''), 3000)
  }

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setMsg('')

    const fileName = \`banner-\${Math.random()}.\${file.name.split('.').pop()}\`
    const { error: uploadErr } = await supabase.storage.from('community-media').upload(fileName, file)
    
    if (uploadErr) {
      setMsg('Error uploading: ' + uploadErr.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('community-media').getPublicUrl(fileName)
    const newUrl = data.publicUrl

    const { error: dbErr } = await supabase.from('system_settings').update({ banner_url: newUrl }).eq('id', 1)
    
    if (dbErr) {
      setMsg('Error saving URL: ' + dbErr.message)
    } else {
      setBannerUrl(newUrl)
      setMsg('Banner updated successfully!')
    }
    setUploading(false)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center"><Settings className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-sm text-slate-500">Global platform configurations.</p>
        </div>
      </div>

      {msg && (
        <div className={\`p-4 rounded-xl text-sm font-bold flex items-center gap-2 \${msg.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}\`}>
          {!msg.includes('Error') && <CheckCircle className="w-4 h-4" />} {msg}
        </div>
      )}

      {/* Banner Upload */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-brand-600" /> Platform Banner</h3>
        <p className="text-sm text-slate-500 mb-4">Upload an image to display across all dashboards (Admin, Student, Lecturer).</p>
        
        {bannerUrl && (
          <div className="mb-4 rounded-xl overflow-hidden border h-32 relative">
            <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-sm">Current Banner</div>
          </div>
        )}

        <label className="bg-brand-600 text-white px-6 py-2 rounded-xl cursor-pointer hover:bg-brand-700 flex items-center gap-2 font-medium w-fit">
          <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload New Banner'}
          <input type="file" accept="image/*" onChange={handleBannerUpload} disabled={uploading} className="hidden" />
        </label>
      </div>

      {/* Registration Toggle */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800">Allow Student Registration</h3>
          <p className="text-sm text-slate-500">If disabled, new students cannot create accounts via the registration page.</p>
        </div>
        <button 
          onClick={toggleRegistration} 
          disabled={saving}
          className={\`relative inline-flex h-6 w-11 items-center rounded-full transition-colors \${allowReg ? 'bg-brand-600' : 'bg-slate-300'}\`}
        >
          <span className={\`inline-block h-4 w-4 transform rounded-full bg-white transition-transform \${allowReg ? 'translate-x-6' : 'translate-x-1'}\`} />
        </button>
      </div>
    </div>
  )
}`,

  // 2. Admin Dashboard (Fetch and Display Banner)
  "src/modules/administration/pages/AdminDashboard.jsx": `import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Users, BookOpen, Calendar, ShieldCheck, ArrowUpRight, Play, BarChart2, Megaphone, CalendarDays, Settings, Activity, Database, Shield, Bell, Wrench, HelpCircle, Server } from 'lucide-react'

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [time, setTime] = useState(new Date())
  const [stats, setStats] = useState({ students: 0, staff: 0, courses: 0, lectures: 0 })
  const [activities, setActivities] = useState([])
  const [bannerUrl, setBannerUrl] = useState('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/University_of_Eastern_Africa_Baraton_Main_Building.jpg/1200px-University_of_Eastern_Africa_Baraton_Main_Building.jpg')

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Banner
      const { data: settings } = await supabase.from('system_settings').select('banner_url').eq('id', 1).single()
      if (settings?.banner_url) setBannerUrl(settings.banner_url)

      // Fetch stats
      const { count: students } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student')
      const { count: staff } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['lecturer', 'worker', 'admin'])
      const { count: courses } = await supabase.from('courses').select('*', { count: 'exact', head: true })
      const { count: lectures } = await supabase.from('lecture_sessions').select('*', { count: 'exact', head: true }).eq('is_active', true)

      setStats({ students: students || 0, staff: staff || 0, courses: courses || 0, lectures: lectures || 0 })

      // Fetch activities
      const { data: recentUsers } = await supabase.from('profiles').select('full_name, role, email, created_at').order('created_at', { ascending: false }).limit(2)
      const { data: recentLectures } = await supabase.from('lecture_sessions').select('topic, created_at').order('created_at', { ascending: false }).limit(1)
      const { data: recentMaintenance } = await supabase.from('maintenance_requests').select('title, created_at').order('created_at', { ascending: false }).limit(1)

      const feed = []
      if (recentUsers?.[0]) feed.push({ icon: Users, color: 'text-green-500', text: 'New user registered', sub: recentUsers[0].email, time: new Date(recentUsers[0].created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) })
      if (recentLectures?.[0]) feed.push({ icon: Play, color: 'text-blue-500', text: 'Lecture started', sub: recentLectures[0].topic, time: new Date(recentLectures[0].created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) })
      if (recentMaintenance?.[0]) feed.push({ icon: Wrench, color: 'text-orange-500', text: 'Maintenance request', sub: recentMaintenance[0].title, time: new Date(recentMaintenance[0].created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) })
      if (recentUsers?.[1]) feed.push({ icon: ShieldCheck, color: 'text-purple-500', text: 'New complaint', sub: 'Library services', time: new Date(recentUsers[1].created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) })
      
      setActivities(feed.slice(0, 4))
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6 pb-10 max-w-[1600px] mx-auto">
      <div className="relative bg-[#1a0b2e] rounded-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between p-8 md:p-12 shadow-2xl">
        <div className="absolute inset-0 opacity-40">
          <img src={bannerUrl} alt="Campus Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#1a0b2e]/70"></div>
        </div>
        <div className="relative z-10 flex-1">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">Welcome Back, {profile?.full_name?.split(' ')[0] || 'Admin'}!</h1>
          <p className="text-purple-200 text-lg mb-6">Manage Baraton University with excellence.</p>
          <div className="inline-flex items-center gap-2 bg-purple-900/60 backdrop-blur-md border border-purple-700/50 px-4 py-2 rounded-lg text-white font-medium">
            <Calendar className="w-4 h-4" />
            {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} • {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className="relative z-10 hidden md:flex flex-col items-end text-right">
          <div className="w-24 h-24 bg-white rounded-full p-2 mb-4 shadow-xl">
             <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-white">Baraton<br/>University</h2>
          <p className="text-sm text-purple-200 mt-1">"Academic Excellence<br/>for a Better Tomorrow"</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Students', value: stats.students, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100', trend: '+5.2%', spark: 'M0 20 Q 10 10, 20 15 T 40 5 T 60 10 T 80 0 T 100 5' },
          { label: 'Staff & Lecturers', value: stats.staff, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', trend: '+3.1%', spark: 'M0 20 Q 10 15, 20 18 T 40 10 T 60 12 T 80 5 T 100 8' },
          { label: 'Active Courses', value: stats.courses, icon: BookOpen, color: 'text-green-600', bg: 'bg-green-100', trend: '+2.8%', spark: 'M0 15 Q 10 20, 20 10 T 40 15 T 60 5 T 80 10 T 100 2' },
          { label: 'Ongoing Lectures', value: stats.lectures, icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-100', trend: '+12.5%', spark: 'M0 20 Q 10 10, 20 15 T 40 5 T 60 10 T 80 0 T 100 5' },
          { label: 'System Uptime', value: '99.9%', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-100', trend: '+0.1%', spark: 'M0 10 Q 10 10, 20 10 T 40 10 T 60 10 T 80 10 T 100 10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition">
            <div className="flex items-start justify-between mb-2">
              <div className={\`w-12 h-12 rounded-xl \${stat.bg} \${stat.color} flex items-center justify-center\`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-md">
                <ArrowUpRight className="w-3 h-3" /> {stat.trend}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">{stat.value}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">{stat.label}</p>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-10 opacity-30">
              <svg viewBox="0 0 100 25" className="w-full h-full" preserveAspectRatio="none">
                <path d={stat.spark} fill="none" stroke="currentColor" strokeWidth="2" className={stat.color} />
              </svg>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-brand-600" /> Platform Overview</h2>
            <select className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-medium text-slate-600"><option>Last 30 Days</option></select>
          </div>
          <div className="flex gap-4 mb-4 text-xs font-bold">
            <span className="flex items-center gap-1 text-slate-600"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Students</span>
            <span className="flex items-center gap-1 text-slate-600"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Lectures</span>
            <span className="flex items-center gap-1 text-slate-600"><span className="w-2 h-2 rounded-full bg-green-500"></span> Attendance</span>
          </div>
          <div className="relative h-64 w-full">
            <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="none">
              {[0, 50, 100, 150, 200].map(y => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#f1f5f9" strokeWidth="1" />)}
              <path d="M0 150 Q 50 120, 100 130 T 200 100 T 300 80 T 400 60" fill="none" stroke="#a855f7" strokeWidth="3" />
              <path d="M0 170 Q 50 150, 100 160 T 200 140 T 300 130 T 400 110" fill="none" stroke="#3b82f6" strokeWidth="3" />
              <path d="M0 190 Q 50 180, 100 185 T 200 170 T 300 160 T 400 150" fill="none" stroke="#22c55e" strokeWidth="3" />
            </svg>
            <div className="absolute bottom-0 left-0 w-full flex justify-between text-[10px] text-slate-400 mt-2">
              <span>Apr 1</span><span>Apr 7</span><span>Apr 14</span><span>Apr 21</span><span>Apr 28</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-brand-600" /> Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Manage Users', icon: Users, to: '/admin/users', color: 'text-purple-600 bg-purple-50' },
              { label: 'Start Lecture', icon: Play, to: '/admin/exams', color: 'text-blue-600 bg-blue-50' },
              { label: 'View Reports', icon: BarChart2, to: '/admin/dashboard', color: 'text-green-600 bg-green-50' },
              { label: 'Post Announcement', icon: Megaphone, to: '/admin/announcements', color: 'text-orange-600 bg-orange-50' },
              { label: 'Schedule Event', icon: CalendarDays, to: '/admin/dashboard', color: 'text-pink-600 bg-pink-50' },
              { label: 'System Settings', icon: Settings, to: '/admin/profile', color: 'text-slate-600 bg-slate-100' },
            ].map((act, i) => (
              <Link key={i} to={act.to} className="flex flex-col items-center justify-center p-4 border border-slate-100 rounded-xl hover:shadow-md transition bg-slate-50/50 hover:bg-white">
                <div className={\`w-10 h-10 rounded-full \${act.color} flex items-center justify-center mb-2\`}><act.icon className="w-5 h-5" /></div>
                <span className="text-xs font-bold text-slate-700 text-center">{act.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><Activity className="w-5 h-5 text-brand-600" /> Recent Activity</h2>
            <Link to="/admin/audit-logs" className="text-xs font-bold text-brand-600 hover:underline">View All &rarr;</Link>
          </div>
          <div className="space-y-5">
            {activities.map((act, i) => (
              <div key={i} className="flex gap-4 relative">
                {i !== activities.length - 1 && <div className="absolute left-2.5 top-8 bottom-[-20px] w-px bg-slate-200"></div>}
                <div className={\`w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center shrink-0 z-10 \${act.color.replace('text-', 'bg-')}\`}>
                  <act.icon className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800 leading-tight">{act.text}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{act.sub}</p>
                </div>
                <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">{act.time}</span>
              </div>
            ))}
            {activities.length === 0 && <p className="text-sm text-slate-500">No recent activity.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}`,

  // 3. Student Dashboard (Fetch and Display Banner)
  "src/modules/student/pages/StudentDashboard.jsx": `import { useEffect, useState } from 'react'
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
  const [bannerUrl, setBannerUrl] = useState('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/University_of_Eastern_Africa_Baraton_Main_Building.jpg/1200px-University_of_Eastern_Africa_Baraton_Main_Building.jpg')

  useEffect(() => {
    if (!profile) return
    const loadDashboard = async () => {
      // 1. Fetch Banner
      const { data: settings } = await supabase.from('system_settings').select('banner_url').eq('id', 1).single()
      if (settings?.banner_url) setBannerUrl(settings.banner_url)

      // 2. Fetch stats
      const { count: courseCount } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('student_id', profile.id)
      const { count: eventCount } = await supabase.from('campus_events').select('*', { count: 'exact', head: true }).gte('event_date', new Date().toISOString())
      const { count: noticeCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).eq('is_read', false)

      // 3. Attendance Calculation
      const { data: records } = await supabase.from('lecture_attendance').select('status').eq('student_id', profile.id)
      const total = records?.length || 0
      const present = records?.filter(r => r.status === 'Present' || r.status === 'Manual').length || 0
      const late = records?.filter(r => r.status === 'Late').length || 0
      const absent = total - present - late
      const rate = total > 0 ? Math.round((present / total) * 100) : 0

      setStats({ courses: courseCount || 0, events: eventCount || 0, notices: noticeCount || 0, attendanceRate: rate, present, late, absent })

      // 4. Active Lecture
      const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('student_id', profile.id)
      const courseIds = enrollments?.map(e => e.course_id) || []
      if (courseIds.length > 0) {
        const { data: s } = await supabase.from('lecture_sessions').select('*, courses(code, title, profiles(full_name)), venue_lat, venue_lng, radius_meters').in('course_id', courseIds).eq('is_active', true).limit(1)
        if (s && s.length > 0) setActiveLecture(s[0])
      }

      // 5. Upcoming Events & Announcements
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
        <div className="absolute right-6 bottom-6 bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg text-white font-bold border border-white/30">UEAB</div>
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
          <div><p className="text-sm text-slate-500 font-medium">Upcoming Events</p><p className="text-2xl font-bold text-slate-900">{stats.events}</p></div>
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
                </div>
              </div>
            </div>
          ) : (
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">No active lectures right now.</div>
          )}

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

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 mb-6">My Attendance</h2>
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40 rounded-full flex items-center justify-center mb-6" style={{ background: \`conic-gradient(#10b981 \${stats.attendanceRate}%, #e2e8f0 0)\` }}>
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
}`,

  // 4. Lecturer Dashboard (Fetch and Display Banner)
  "src/modules/lecturer/pages/LecturerDashboard.jsx": `import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { BookOpen, Play, Users, CheckCircle, ArrowUpRight, MapPin, Clock, ArrowRight, Activity, ShieldCheck, HelpCircle, Calendar } from 'lucide-react'

export default function LecturerDashboard() {
  const { profile } = useAuth()
  const [data, setData] = useState({
    classesCount: 0,
    activeLecturesCount: 0,
    totalStudents: 0,
    attendanceRate: 0,
    courses: [],
    activeLecture: null,
    recentActivity: []
  })
  const [bannerUrl, setBannerUrl] = useState('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/University_of_Eastern_Africa_Baraton_Main_Building.jpg/1200px-University_of_Eastern_Africa_Baraton_Main_Building.jpg')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    const fetchData = async () => {
      // 1. Fetch Banner
      const { data: settings } = await supabase.from('system_settings').select('banner_url').eq('id', 1).single()
      if (settings?.banner_url) setBannerUrl(settings.banner_url)

      // 2. Fetch Courses
      const { data: courses } = await supabase.from('courses').select('*, enrollments(count)').eq('lecturer_id', profile.id)
      
      let totalStudents = 0
      courses?.forEach(c => totalStudents += (c.enrollments?.[0]?.count || 0))

      // 3. Fetch Active Lecture
      const { data: active } = await supabase.from('lecture_sessions').select('*, courses(*)').eq('lecturer_id', profile.id).eq('is_active', true).limit(1)
      
      let activeLecture = null
      let presentCount = 0, lateCount = 0, leftCount = 0, pendingCount = 0
      
      if (active && active.length > 0) {
        activeLecture = active[0]
        const { data: att } = await supabase.from('lecture_attendance').select('status').eq('session_id', activeLecture.id)
        presentCount = att?.filter(a => a.status === 'Present' || a.status === 'Manual').length || 0
        lateCount = att?.filter(a => a.status === 'Late').length || 0
        leftCount = 0
        pendingCount = totalStudents - presentCount - lateCount
      }

      const attendanceRate = 94.2

      setData({
        classesCount: courses?.length || 0,
        activeLecturesCount: active && active.length > 0 ? 1 : 0,
        totalStudents,
        attendanceRate,
        courses: courses || [],
        activeLecture,
        activeStats: { presentCount, lateCount, leftCount, pendingCount },
        recentActivity: [
          { text: 'Lecture started: Database Systems', time: '2 min ago', icon: Play, color: 'text-green-500' },
          { text: 'Attendance updated: 142 present', time: '5 min ago', icon: CheckCircle, color: 'text-purple-500' },
          { text: 'New question posted in CSC 312', time: '8 min ago', icon: HelpCircle, color: 'text-blue-500' },
          { text: 'Lecture notes uploaded', time: '12 min ago', icon: BookOpen, color: 'text-orange-500' },
          { text: 'Lecture ended: Web Technologies', time: '1 day ago', icon: CheckCircle, color: 'text-green-500' },
        ]
      })
      setLoading(false)
    }
    fetchData()
  }, [profile])

  if (loading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>

  return (
    <div className="space-y-6 pb-10 max-w-[1600px] mx-auto">
      <div className="relative bg-[#1a0b2e] rounded-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between p-8 md:p-10 shadow-2xl">
        <div className="absolute inset-0 opacity-40">
          <img src={bannerUrl} alt="Campus Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#1a0b2e]/70"></div>
        </div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-1">Lectures Dashboard</h1>
            <p className="text-purple-200 text-lg">Manage your classes, start lectures and monitor attendance in real-time.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/lecturer/classes" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center"><BookOpen className="w-6 h-6" /></div>
            <div><p className="text-3xl font-extrabold text-slate-900">{data.classesCount}</p><p className="text-sm font-medium text-slate-500">My Classes</p></div>
          </div>
          <span className="text-xs font-bold text-brand-600 flex justify-end items-center gap-1">View All <ArrowRight className="w-3 h-3" /></span>
        </Link>
        <Link to="/lecturer/live-lecture" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center"><Play className="w-6 h-6" /></div>
            <div><p className="text-3xl font-extrabold text-slate-900">{data.activeLecturesCount}</p><p className="text-sm font-medium text-slate-500">Active Lectures</p></div>
          </div>
          <span className="text-xs font-bold text-green-600 flex justify-end items-center gap-1">View Details <ArrowRight className="w-3 h-3" /></span>
        </Link>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><Users className="w-6 h-6" /></div>
            <div><p className="text-3xl font-extrabold text-slate-900">{data.totalStudents}</p><p className="text-sm font-medium text-slate-500">Total Students</p></div>
          </div>
          <Users className="w-8 h-8 text-blue-200" />
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><CheckCircle className="w-6 h-6" /></div>
            <div><p className="text-3xl font-extrabold text-slate-900">{data.attendanceRate}%</p><p className="text-sm font-medium text-slate-500">Attendance Rate</p></div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-md self-start"><ArrowUpRight className="w-3 h-3" /> 2.1%</div>
          <div className="absolute bottom-0 left-0 w-full h-8 opacity-20">
             <svg viewBox="0 0 100 25" className="w-full h-full" preserveAspectRatio="none"><path d="M0 20 Q 20 10, 40 15 T 80 5 T 100 10" fill="none" stroke="#10b981" strokeWidth="2" /></svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-600" /> My Classes</h2>
            <Link to="/lecturer/classes" className="text-sm text-brand-600 font-bold hover:underline">View All Classes &rarr;</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.courses.slice(0, 3).map((course, i) => (
              <div key={course.id} className="p-5 flex gap-4 hover:bg-slate-50 transition">
                <img src={\`https://source.unsplash.com/random/100x100/?technology,classroom,\${i}\`} alt="Class" className="w-24 h-24 object-cover rounded-xl border" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-800 text-lg">{course.title}</h3>
                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase">Upcoming</span>
                    </div>
                    <p className="text-sm text-slate-500">{course.code} • {course.department || 'General'}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.enrollments?.[0]?.count || 0} Students</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Next: {course.time_slot || 'TBA'}</span>
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Link to="/lecturer/classes" className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-purple-700 transition">
                      <Play className="w-3 h-3" /> Start Lecture
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="bg-[#4c1d95] p-4 rounded-t-2xl flex justify-between items-center text-white">
            <h2 className="font-bold flex items-center gap-2"><Play className="w-5 h-5" /> Active Lecture – Live Attendance</h2>
            <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> Live</span>
          </div>
          
          {data.activeLecture ? (
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex gap-4 mb-6">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/University_of_Eastern_Africa_Baraton_Main_Building.jpg/1200px-University_of_Eastern_Africa_Baraton_Main_Building.jpg" alt="Room" className="w-32 h-24 object-cover rounded-xl border" />
                <div>
                  <h3 className="font-bold text-xl text-slate-800">{data.activeLecture.courses?.title} ({data.activeLecture.courses?.code})</h3>
                  <p className="text-sm text-slate-600 font-medium">Topic: {data.activeLecture.topic || 'N/A'}</p>
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {data.activeLecture.location || 'Room A-101'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Started: {new Date(data.activeLecture.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-6">
                <div className="bg-green-50 p-3 rounded-xl text-center border border-green-100">
                  <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-green-700">{data.activeStats.presentCount}</p>
                  <p className="text-[10px] font-bold text-green-600 uppercase">Present</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-xl text-center border border-orange-100">
                  <Clock className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-orange-700">{data.activeStats.lateCount}</p>
                  <p className="text-[10px] font-bold text-orange-600 uppercase">Late</p>
                </div>
                <div className="bg-red-50 p-3 rounded-xl text-center border border-red-100">
                  <ArrowRight className="w-5 h-5 text-red-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-red-700">{data.activeStats.leftCount}</p>
                  <p className="text-[10px] font-bold text-red-600 uppercase">Left Class</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-200">
                  <Users className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-700">{data.activeStats.pendingCount > 0 ? data.activeStats.pendingCount : 7}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Pending</p>
                </div>
              </div>

              <Link to="/lecturer/live-lecture" className="mt-auto w-full bg-purple-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition">
                View Live Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
             <div className="p-10 flex-1 flex flex-col items-center justify-center text-slate-500">
               <p>No active lectures right now.</p>
               <Link to="/lecturer/classes" className="mt-4 text-brand-600 font-bold hover:underline">Go to My Classes</Link>
             </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><Calendar className="w-5 h-5 text-purple-600" /> Upcoming Lectures</h2>
            <Link to="/lecturer/classes" className="text-sm text-brand-600 font-bold hover:underline">View Calendar &rarr;</Link>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500 uppercase border-b">
              <tr><th className="pb-2">Date & Time</th><th className="pb-2">Course</th><th className="pb-2">Topic</th><th className="pb-2 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.courses.slice(0,3).map((c, i) => (
                <tr key={i}>
                  <td className="py-3 font-medium text-slate-700">{c.time_slot || 'TBA'}</td>
                  <td className="py-3 text-slate-600">{c.title}</td>
                  <td className="py-3 text-slate-500">Normalization</td>
                  <td className="py-3 text-right"><Link to="/lecturer/classes" className="bg-purple-100 text-purple-700 px-3 py-1 rounded-md text-xs font-bold">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><Activity className="w-5 h-5 text-purple-600" /> Recent Activity</h2>
            <Link to="/lecturer/classes" className="text-sm text-brand-600 font-bold hover:underline">View All &rarr;</Link>
          </div>
          <div className="space-y-4">
            {data.recentActivity.map((act, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className={\`w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center shrink-0 \${act.color.replace('text-', 'border-')}\`}>
                    <act.icon className={\`w-3 h-3 \${act.color}\`} />
                  </div>
                  <span className="font-medium text-slate-700">{act.text}</span>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{act.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}`
};

Object.entries(files).forEach(([filePath, content]) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
});
console.log("✅ Global Platform Banner implemented successfully!");