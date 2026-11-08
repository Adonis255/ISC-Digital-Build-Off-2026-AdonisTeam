import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'

export default function AssignedTasks() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const loadTasks = async () => {
    if (!profile) return
    const { data } = await supabase.from('maintenance_requests').select('*').eq('assigned_to', profile.id).order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }

  useEffect(() => { loadTasks() }, [profile?.id])

  const markComplete = async (id) => {
    if (!file) return alert('Please upload a photo of the completed work as evidence.')
    setUploading(true)
    const fileName = `evidence-${Math.random()}.${file.name.split('.').pop()}`
    const { error: uploadErr } = await supabase.storage.from('maintenance').upload(fileName, file)
    if (uploadErr) { alert(uploadErr.message); setUploading(false); return }
    
    const { data: { publicUrl } } = supabase.storage.from('maintenance').getPublicUrl(fileName)
    await supabase.from('maintenance_requests').update({ status: 'completed', evidence_url: publicUrl }).eq('id', id)
    
    setFile(null)
    setUploading(false)
    loadTasks()
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">My Assigned Tasks</h1>
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
            
            {task.image_url && <a href={task.image_url} target="_blank" rel="noreferrer" className="text-sm text-brand-600 hover:underline mt-2">View Original Issue Photo</a>}
            
            {task.status !== 'completed' ? (
              <div className="mt-4 pt-4 border-t space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Upload Completion Evidence</label>
                  <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700" />
                </div>
                <button onClick={() => markComplete(task.id)} disabled={uploading} className="w-full bg-navy-900 text-white py-2 rounded-lg font-medium hover:bg-navy-800 transition disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Mark as Completed'}
                </button>
              </div>
            ) : (
              task.evidence_url && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-green-700 mb-2">Completion Evidence Uploaded:</p>
                  <a href={task.evidence_url} target="_blank" rel="noreferrer">
                    <img src={task.evidence_url} alt="Evidence" className="w-full h-32 object-cover rounded-lg border" />
                  </a>
                </div>
              )
            )}
          </div>
        ))}
        {tasks.length === 0 && <p className="text-slate-500 col-span-full">You have no assigned tasks right now.</p>}
      </div>
    </div>
  )
}