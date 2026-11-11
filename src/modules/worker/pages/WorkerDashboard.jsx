import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { supabase } from '../../../services/supabase/client.js'
import { ClipboardList, CheckCircle2, Clock } from 'lucide-react'

export default function WorkerDashboard() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [bannerUrl, setBannerUrl] = useState('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/University_of_Eastern_Africa_Baraton_Main_Building.jpg/1200px-University_of_Eastern_Africa_Baraton_Main_Building.jpg')

  useEffect(() => {
    if (!profile) return
    (async () => {
      // Fetch Banner
      const { data: settings } = await supabase.from('system_settings').select('banner_url').eq('id', 1).maybeSingle()
      if (settings?.banner_url) setBannerUrl(settings.banner_url)

      // FIXED: Fetch directly from maintenance_requests where assigned_to = worker
      const { data } = await supabase.from('maintenance_requests')
        .select('*')
        .eq('assigned_to', profile.id)
        .order('created_at', { ascending: false })
      
      setTasks(data || [])
    })()
  }, [profile?.id])

  const pending = tasks.filter(t => t.status !== 'completed').length
  const done = tasks.filter(t => t.status === 'completed').length

  return (
    <div className="space-y-6 pb-10">
      
      {/* HERO BANNER */}
      <div className="relative bg-[#1a0b2e] rounded-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between p-8 md:p-12 shadow-2xl">
        <div className="absolute inset-0 opacity-40">
          <img src={bannerUrl} alt="Campus Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#1a0b2e]/70"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">Worker Dashboard</h1>
          <p className="text-purple-200 text-lg">Welcome back, {profile?.full_name}. Here are your task stats.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/worker/tasks" className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 grid place-items-center mb-4"><ClipboardList className="w-5 h-5" /></div>
          <h3 className="font-semibold text-slate-800">Total Tasks</h3>
          <p className="text-3xl font-bold mt-1">{tasks.length}</p>
        </Link>
        <Link to="/worker/tasks" className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 grid place-items-center mb-4"><Clock className="w-5 h-5" /></div>
          <h3 className="font-semibold text-slate-800">Pending Tasks</h3>
          <p className="text-3xl font-bold mt-1">{pending}</p>
        </Link>
        <Link to="/worker/tasks" className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 grid place-items-center mb-4"><CheckCircle2 className="w-5 h-5" /></div>
          <h3 className="font-semibold text-slate-800">Completed Tasks</h3>
          <p className="text-3xl font-bold mt-1">{done}</p>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h2 className="font-semibold text-lg mb-4">Recent assignments</h2>
        {tasks.length === 0 ? <p className="text-sm text-slate-500">No assignments yet. Check back later.</p> : (
          <ul className="divide-y">
            {tasks.slice(0, 5).map(t => (
              <li key={t.id} className="py-3">
                <p className="font-medium">{t.title}</p>
                <p className="text-xs text-slate-500">
                  Status: <span className="uppercase font-bold">{t.status}</span> • Priority: {t.urgency}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}