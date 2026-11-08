import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { AlertCircle, Lock } from 'lucide-react'

export default function ComplaintsPage() {
  const { profile, role } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [form, setForm] = useState({ subject: '', description: '', is_anonymous: false })
  const [adminNote, setAdminNote] = useState('')

  const loadData = async () => {
    const { data } = await supabase.from('complaints').select('*, profiles(full_name)').order('created_at', { ascending: false })
    setComplaints(data || [])
  }

  useEffect(() => { loadData() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Generate a random reference number (e.g., CMP-8492)
    const refNum = 'CMP-' + Math.floor(1000 + Math.random() * 9000)
    
    const { error } = await supabase.from('complaints').insert([{ 
      ...form, 
      student_id: profile.id,
      reference_number: refNum
    }])
    
    if (!error) {
      alert(`Complaint submitted! Your reference number is: ${refNum}`)
      setForm({ subject: '', description: '', is_anonymous: false })
      loadData()
    }
  }

  const updateComplaint = async (id, status, note) => {
    await supabase.from('complaints').update({ status, internal_notes: note }).eq('id', id)
    loadData()
  }

  const isAdmin = role === 'admin'

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center"><AlertCircle className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold">Complaints & Grievances</h1>
          <p className="text-sm text-slate-500">Submit issues securely to the administration.</p>
        </div>
      </div>

      {!isAdmin && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <input required placeholder="Subject" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full border p-2 rounded" />
          <textarea required placeholder="Describe your issue in detail..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" rows="3"></textarea>
          
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.is_anonymous} onChange={e => setForm({...form, is_anonymous: e.target.checked})} className="w-4 h-4 accent-brand-600" />
            <Lock className="w-4 h-4 text-slate-400" />
            Submit Anonymously (Your name will be hidden from reviewers)
          </label>

          <button type="submit" className="bg-navy-900 text-white px-6 py-2 rounded-lg">Submit Complaint</button>
        </form>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-3">Ref #</th>
              {isAdmin && <th className="p-3">Student</th>}
              <th className="p-3">Subject</th>
              <th className="p-3">Status</th>
              {isAdmin && <th className="p-3">Internal Notes / Action</th>}
            </tr>
          </thead>
          <tbody>
            {complaints.map(c => (
              <tr key={c.id} className="border-b">
                <td className="p-3 font-mono text-xs">{c.reference_number || 'N/A'}</td>
                {isAdmin && <td className="p-3 font-medium">{c.is_anonymous ? <span className="text-red-500 italic">Anonymous</span> : c.profiles?.full_name}</td>}
                <td className="p-3">
                  <p className="font-medium">{c.subject}</p>
                  <p className="text-xs text-slate-500 truncate max-w-xs">{c.description}</p>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${c.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{c.status}</span>
                </td>
                {isAdmin && (
                  <td className="p-3">
                    <div className="flex flex-col gap-2">
                      <input placeholder="Internal note..." defaultValue={c.internal_notes} onChange={(e) => setAdminNote(e.target.value)} className="border p-1 text-xs rounded" />
                      <select defaultValue={c.status} onChange={(e) => updateComplaint(c.id, e.target.value, adminNote || c.internal_notes)} className="border rounded p-1 text-xs">
                        <option value="pending">Pending</option>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {complaints.length === 0 && <tr><td colSpan={isAdmin ? 5 : 3} className="p-6 text-center text-slate-500">No complaints found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}