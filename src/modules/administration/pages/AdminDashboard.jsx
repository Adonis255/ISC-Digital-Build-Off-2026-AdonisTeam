import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Users, BookOpen, Calendar, ShieldCheck, ArrowUpRight, Play, BarChart2, Megaphone, CalendarDays, Settings, Activity, Wrench, HelpCircle } from 'lucide-react'

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [time, setTime] = useState(new Date())
  const [stats, setStats] = useState({ students: 0, staff: 0, courses: 0, lectures: 0 })
  const [activities, setActivities] = useState([])
  
  // FIXED: Use state for banner with fallback
  const [bannerUrl, setBannerUrl] = useState('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/University_of_Eastern_Africa_Baraton_Main_Building.jpg/1200px-University_of_Eastern_Africa_Baraton_Main_Building.jpg')

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Banner safely
      const { data: settings } = await supabase.from('system_settings').select('banner_url').eq('id', 1).maybeSingle()
      if (settings?.banner_url) setBannerUrl(settings.banner_url)

      const { count: students } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student')
      const { count: staff } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['lecturer', 'worker', 'admin'])
      const { count: courses } = await supabase.from('courses').select('*', { count: 'exact', head: true })
      const { count: lectures } = await supabase.from('lecture_sessions').select('*', { count: 'exact', head: true }).eq('is_active', true)
      setStats({ students: students || 0, staff: staff || 0, courses: courses || 0, lectures: lectures || 0 })

      const feed = []
      const { data: recentUsers } = await supabase.from('profiles').select('full_name, role, email, created_at').order('created_at', { ascending: false }).limit(2)
      if (recentUsers?.[0]) feed.push({ icon: Users, color: 'text-green-500', bg: 'bg-green-100', text: 'New user registered', sub: recentUsers[0].email, time: new Date(recentUsers[0].created_at).toLocaleTimeString() })
      
      const { data: recentLectures } = await supabase.from('lecture_sessions').select('topic, created_at').order('created_at', { ascending: false }).limit(1)
      if (recentLectures?.[0]) feed.push({ icon: Play, color: 'text-blue-500', bg: 'bg-blue-100', text: 'Lecture started', sub: recentLectures[0].topic, time: new Date(recentLectures[0].created_at).toLocaleTimeString() })
      
      setActivities(feed.slice(0, 4))
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6 pb-10 max-w-[1600px] mx-auto">
      <div className="relative bg-[#1a0b2e] rounded-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between p-8 md:p-12 shadow-2xl">
        <div className="absolute inset-0 opacity-40">
          <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#1a0b2e]/70"></div>
        </div>
        <div className="relative z-10 flex-1">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">Welcome Back, {profile?.full_name?.split(' ')[0] || 'Admin'}!</h1>
          <p className="text-purple-200 text-lg mb-6">Manage Baraton University with excellence.</p>
          <div className="inline-flex items-center gap-2 bg-purple-900/60 backdrop-blur-md border border-purple-700/50 px-4 py-2 rounded-lg text-white font-medium">
            <Calendar className="w-4 h-4" />
            {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <div className="relative z-10 hidden md:flex flex-col items-end text-right">
          <div className="w-24 h-24 bg-white rounded-full p-2 mb-4 shadow-xl">
             <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-white">Baraton<br/>University</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Students', value: stats.students, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
          { label: 'Staff & Lecturers', value: stats.staff, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Active Courses', value: stats.courses, icon: BookOpen, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Ongoing Lectures', value: stats.lectures, icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-100' },
          { label: 'System Uptime', value: '99.9%', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between mb-2">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}><stat.icon className="w-6 h-6" /></div>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">{stat.value}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}