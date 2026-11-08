import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'

export default function MaintenancePage() {
  const { profile, role } = useAuth()
  const [requests, setRequests] = useState([])
  const [workers, setWorkers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'Electrical', urgency: 'normal' })
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState(null)

  const loadData = async () => {
    const { data } = await supabase.from('maintenance_requests').select('*, profiles(full_name)').order('created_at', { ascending: false })
    setRequests(data || [])
    
    if (role === 'admin') {
      const { data: w } = await supabase.from('profiles').select('id, full_name').eq('role', 'worker')
      setWorkers(w || [])
    }
  }

  useEffect(() => { loadData() }, [role])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)
    let imageUrl = null

    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('maintenance').upload(fileName, file)
      if (uploadError) { alert(uploadError.message); setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('maintenance').getPublicUrl(fileName)
      imageUrl = publicUrl
    }

    await supabase.from('maintenance_requests').insert([{ 
      ...form, 
      reporter_id: profile.id, 
      image_url: imageUrl,
      status: 'submitted' 
    }])
    
    setForm({ title: '', description: '', category: 'Electrical', urgency: 'normal' })
    setFile(null)
    setShowForm(false)
    setUploading(false)
    loadData()
  }

  const assignWorker = async (requestId, workerId) => {
    await supabase.from('maintenance_requests').update({ assigned_to: workerId, status: 'assigned' }).eq('id', requestId)
    loadData()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Maintenance Requests</h1>
        {role !== 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-lg">
            {showForm ? 'Cancel' : '+ New Request'}
          </button>
        )}
      </div>

      {showForm && role !== 'admin' && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border space-y-4">
          <input required placeholder="Issue Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border p-2 rounded" />
          <textarea required placeholder="Describe the problem..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" rows="3"></textarea>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="border p-2 rounded">
              <option>Electrical</option><option>Plumbing</option><option>Furniture</option><option>Building</option><option>Other</option>
            </select>
            <select value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})} className="border p-2 rounded">
              <option value="low">Low Priority</option><option value="normal">Normal</option><option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Attach Photo</label>
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
          </div>
          <button type="submit" disabled={uploading} className="bg-brand-600 text-white px-4 py-2 rounded disabled:opacity-50">
            {uploading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr><th className="p-3">Issue</th><th className="p-3">Urgency</th><th className="p-3">Status</th>{role === 'admin' && <th className="p-3">Assign Worker</th>}</tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id} className="border-b">
                <td className="p-3">
                  <p className="font-medium">{req.title}</p>
                  <p className="text-xs text-slate-500">{req.category}</p>
                  {req.image_url && <a href={req.image_url} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">View Photo</a>}
                </td>
                <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${req.urgency === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-slate-100'}`}>{req.urgency}</span></td>
                <td className="p-3"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs uppercase font-bold">{req.status}</span></td>
                {role === 'admin' && (
                  <td className="p-3">
                    <select 
                      value={req.assigned_to || ''} 
                      onChange={(e) => assignWorker(req.id, e.target.value)}
                      className="border rounded p-1 text-sm"
                    >
                      <option value="" disabled>Select Worker</option>
                      {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
                    </select>
                  </td>
                )}
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-slate-500">No maintenance requests found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}