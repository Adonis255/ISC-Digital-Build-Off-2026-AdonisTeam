import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { AlertCircle } from 'lucide-react'

export default function ComplaintsPage() {
  const { profile, role } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [form, setForm] = useState({ subject: '', description: '' })

  const loadData = async () => {
    const { data } = await supabase.from('complaints').select('*, profiles(full_name)').order('created_at', { ascending: false })
    setComplaints(data || [])
  }

  useEffect(() => { loadData() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await supabase.from('complaints').insert([{ ...form, student_id: profile.id }])
    setForm({ subject: '', description: '' })
    loadData()
  }

  const resolveComplaint = async (id) => {
    await supabase.from('complaints').update({ status: 'resolved' }).eq('id', id)
    loadData()
  }

  const isAdmin = role === 'admin'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center"><AlertCircle className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold">Complaints & Feedback</h1>
          <p className="text-sm text-slate-500">Submit an issue to the administration.</p>
        </div>
      </div>

      {!isAdmin && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <input required placeholder="Subject" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full border p-2 rounded" />
          <textarea required placeholder="Describe your issue..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" rows="3"></textarea>
          <button type="submit" className="bg-navy-900 text-white px-6 py-2 rounded-lg">Submit Complaint</button>
        </form>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>{isAdmin && <th className="p-3">Student</th>}<th className="p-3">Subject</th><th className="p-3">Description</th><th className="p-3">Status</th>{isAdmin && <th className="p-3">Action</th>}</tr>
          </thead>
          <tbody>
            {complaints.map(c => (
              <tr key={c.id} className="border-b">
                {isAdmin && <td className="p-3 font-medium">{c.profiles?.full_name}</td>}
                <td className="p-3">{c.subject}</td>
                <td className="p-3 text-sm text-slate-600">{c.description}</td>
                <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${c.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{c.status}</span></td>
                {isAdmin && <td className="p-3">{c.status !== 'resolved' && <button onClick={() => resolveComplaint(c.id)} className="text-sm text-brand-600 font-medium">Mark Resolved</button>}</td>}
              </tr>
            ))}
            {complaints.length === 0 && <tr><td colSpan={isAdmin ? 5 : 3} className="p-6 text-center text-slate-500">No complaints found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}