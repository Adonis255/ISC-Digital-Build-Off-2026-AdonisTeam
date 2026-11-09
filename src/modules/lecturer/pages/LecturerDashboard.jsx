import { useEffect, useState } from 'react'
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
                <img src={`https://source.unsplash.com/random/100x100/?technology,classroom,${i}`} alt="Class" className="w-24 h-24 object-cover rounded-xl border" />
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
                  <div className={`w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center shrink-0 ${act.color.replace('text-', 'border-')}`}>
                    <act.icon className={`w-3 h-3 ${act.color}`} />
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
}