import fs from 'fs';

const content = `import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Users, BookOpen, Calendar, ShieldCheck, ArrowUpRight, Play, BarChart2, Megaphone, CalendarDays, Settings, Activity, Database, Shield, Bell, Wrench, HelpCircle, Server, X, Clock } from 'lucide-react'

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [time, setTime] = useState(new Date())
  const [stats, setStats] = useState({ students: 0, staff: 0, courses: 0, lectures: 0 })
  
  // Activity State
  const [allActivities, setAllActivities] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [activityFilter, setActivityFilter] = useState('all') // 'today', 'week', 'month', 'all'
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

      // Fetch Stats
      const { count: students } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student')
      const { count: staff } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['lecturer', 'worker', 'admin'])
      const { count: courses } = await supabase.from('courses').select('*', { count: 'exact', head: true })
      const { count: lectures } = await supabase.from('lecture_sessions').select('*', { count: 'exact', head: true }).eq('is_active', true)
      setStats({ students: students || 0, staff: staff || 0, courses: courses || 0, lectures: lectures || 0 })

      // Fetch ALL Activities
      const [users, lecturesData, maintenance, complaints, scholarships] = await Promise.all([
        supabase.from('profiles').select('full_name, email, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('lecture_sessions').select('topic, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('maintenance_requests').select('title, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('complaints').select('subject, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('scholarship_applications').select('created_at, scholarships(title)').order('created_at', { ascending: false }).limit(50)
      ])

      let feed = []
      users.data?.forEach(u => feed.push({ id: \`u-\${Math.random()}\`, type: 'User', icon: Users, color: 'text-green-500', bg: 'bg-green-100', text: 'New user registered', sub: u.email, date: u.created_at }))
      lecturesData.data?.forEach(l => feed.push({ id: \`l-\${Math.random()}\`, type: 'Lecture', icon: Play, color: 'text-blue-500', bg: 'bg-blue-100', text: 'Lecture started', sub: l.topic || 'Class Session', date: l.created_at }))
      maintenance.data?.forEach(m => feed.push({ id: \`m-\${Math.random()}\`, type: 'Maintenance', icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-100', text: 'Maintenance request', sub: m.title, date: m.created_at }))
      complaints.data?.forEach(c => feed.push({ id: \`c-\${Math.random()}\`, type: 'Complaint', icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-100', text: 'New complaint', sub: c.subject, date: c.created_at }))
      scholarships.data?.forEach(s => feed.push({ id: \`s-\${Math.random()}\`, type: 'Scholarship', icon: HelpCircle, color: 'text-pink-500', bg: 'bg-pink-100', text: 'Scholarship applied', sub: s.scholarships?.title || 'Application', date: s.created_at }))

      // Sort all by date descending
      feed.sort((a, b) => new Date(b.date) - new Date(a.date))
      
      setAllActivities(feed)
      setRecentActivities(feed.slice(0, 5))
    }
    fetchData()
  }, [])

  // Filter Logic
  const filteredActivities = allActivities.filter(act => {
    if (activityFilter === 'all') return true
    const actDate = new Date(act.date)
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    if (activityFilter === 'today') return actDate >= startOfToday
    
    if (activityFilter === 'week') {
      const startOfWeek = new Date(startOfToday)
      startOfWeek.setDate(startOfWeek.getDate() - 7)
      return actDate >= startOfWeek
    }
    
    if (activityFilter === 'month') {
      const startOfMonth = new Date(startOfToday)
      startOfMonth.setMonth(startOfMonth.getMonth() - 1)
      return actDate >= startOfMonth
    }
    return true
  })

  return (
    <div className="space-y-6 pb-10 max-w-[1600px] mx-auto">
      
      {/* HERO BANNER */}
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

      {/* STAT CARDS */}
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
        
        {/* PLATFORM OVERVIEW */}
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

        {/* QUICK ACTIONS */}
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

        {/* RECENT ACTIVITY (WITH NEW VIEW ALL BUTTON) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><Activity className="w-5 h-5 text-brand-600" /> Recent Activity</h2>
            <button onClick={() => setShowActivityModal(true)} className="text-xs font-bold text-brand-600 hover:underline">View All &rarr;</button>
          </div>
          <div className="space-y-5">
            {recentActivities.map((act, i) => (
              <div key={i} className="flex gap-4 relative">
                {i !== recentActivities.length - 1 && <div className="absolute left-2.5 top-8 bottom-[-20px] w-px bg-slate-200"></div>}
                <div className={\`w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center shrink-0 z-10 \${act.bg}\`}>
                  <act.icon className={\`w-3 h-3 \${act.color}\`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800 leading-tight">{act.text}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{act.sub}</p>
                </div>
                <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">{new Date(act.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            ))}
            {recentActivities.length === 0 && <p className="text-sm text-slate-500">No recent activity.</p>}
          </div>
        </div>
      </div>

      {/* ACTIVITY MODAL */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Activity className="w-5 h-5 text-brand-600" /> All Platform Activity</h2>
                <p className="text-xs text-slate-500 mt-1">Track all users, lectures, and services across the platform.</p>
              </div>
              <button onClick={() => setShowActivityModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 p-4 border-b bg-white overflow-x-auto">
              {[
                { label: 'All Time', value: 'all' },
                { label: 'Today', value: 'today' },
                { label: 'Last 7 Days', value: 'week' },
                { label: 'Last 30 Days', value: 'month' }
              ].map(f => (
                <button 
                  key={f.value} 
                  onClick={() => setActivityFilter(f.value)}
                  className={\`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition \${activityFilter === f.value ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Scrollable List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {filteredActivities.map(act => (
                <div key={act.id} className="flex gap-4 p-3 hover:bg-slate-50 rounded-xl transition border border-transparent hover:border-slate-100">
                  <div className={\`w-10 h-10 rounded-full flex items-center justify-center shrink-0 \${act.bg}\`}>
                    <act.icon className={\`w-5 h-5 \${act.color}\`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-slate-800 text-sm">{act.text}</p>
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                        {new Date(act.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{act.sub}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded-md">{act.type}</span>
                  </div>
                </div>
              ))}
              
              {filteredActivities.length === 0 && (
                <div className="text-center py-10">
                  <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No activity found for this time period.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}`;

fs.writeFileSync('src/modules/administration/pages/AdminDashboard.jsx', content);
console.log("✅ Admin Dashboard Activity Modal with Filters implemented successfully!");