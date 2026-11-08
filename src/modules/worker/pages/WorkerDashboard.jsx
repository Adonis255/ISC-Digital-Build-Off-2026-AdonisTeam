import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { supabase } from '../../../services/supabase/client.js'
import { ClipboardList, CheckCircle2, Clock } from 'lucide-react'

export default function WorkerDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 })

  useEffect(() => {
    if (!profile) return
    (async () => {
      const { data } = await supabase.from('maintenance_requests').select('status').eq('assigned_to', profile.id)
      const total = data?.length || 0
      const completed = data?.filter(r => r.status === 'completed').length || 0
      const pending = total - completed
      setStats({ total, pending, completed })
    })()
  }, [profile])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Worker Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome back, {profile?.full_name}. Here are your task stats.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 grid place-items-center mb-4"><ClipboardList className="w-5 h-5" /></div>
          <h3 className="font-semibold text-slate-800">Total Tasks</h3>
          <p className="text-3xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 grid place-items-center mb-4"><Clock className="w-5 h-5" /></div>
          <h3 className="font-semibold text-slate-800">Pending Tasks</h3>
          <p className="text-3xl font-bold mt-1">{stats.pending}</p>
          <Link to="/worker/tasks" className="text-sm text-brand-600 mt-2 inline-block hover:underline">View Tasks &rarr;</Link>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 grid place-items-center mb-4"><CheckCircle2 className="w-5 h-5" /></div>
          <h3 className="font-semibold text-slate-800">Completed Tasks</h3>
          <p className="text-3xl font-bold mt-1">{stats.completed}</p>
        </div>
      </div>
    </div>
  )
}