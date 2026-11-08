import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'

export default function AssignedTasks() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const loadTasks = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('assigned_to', profile.id)
      .order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }

  useEffect(() => { loadTasks() }, [profile?.id])

  const markComplete = async (id) => {
    await supabase.from('maintenance_requests').update({ status: 'completed' }).eq('id', id)
    loadTasks()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Assigned Tasks</h1>
        <p className="text-sm text-slate-500">View and complete maintenance requests assigned to you.</p>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map(task => (
            <div key={task.id} className="bg-white p-5 rounded-xl border shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{task.status}</span>
                <span className="text-xs text-slate-400">{new Date(task.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="font-bold text-lg">{task.title}</h3>
              <p className="text-slate-600 text-sm mt-1 flex-1">{task.description}</p>
              <p className="text-xs font-semibold mt-2 text-slate-700">Category: {task.category} | Urgency: {task.urgency}</p>
              
              {task.image_url && (
                <a href={task.image_url} target="_blank" rel="noreferrer" className="mt-3 block">
                  <img src={task.image_url} alt="Issue" className="w-full h-32 object-cover rounded border" />
                </a>
              )}

              {task.status !== 'completed' && (
                <button onClick={() => markComplete(task.id)} className="mt-4 w-full bg-navy-900 text-white py-2 rounded-lg font-medium hover:bg-navy-800 transition">
                  Mark as Completed
                </button>
              )}
            </div>
          ))}
          {tasks.length === 0 && <p className="text-slate-500 col-span-full">You have no assigned tasks right now.</p>}
        </div>
      )}
    </div>
  )
}