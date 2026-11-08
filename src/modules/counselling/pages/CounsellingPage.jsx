import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { ShieldCheck, AlertTriangle } from 'lucide-react'

export default function CounsellingPage() {
  const { profile, role } = useAuth()
  const [requests, setRequests] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ issue_summary: '', preferred_date: '' })

  const loadRequests = async () => {
    const { data } = await supabase.from('counselling_requests').select('*, profiles(full_name)').order('created_at', { ascending: false })
    setRequests(data || [])
  }

  useEffect(() => { loadRequests() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await supabase.from('counselling_requests').insert([{ ...form, student_id: profile.id }])
    setForm({ issue_summary: '', preferred_date: '' })
    setShowForm(false)
    loadRequests()
  }

  const updateStatus = async (id, status) => {
    await supabase.from('counselling_requests').update({ status }).eq('id', id)
    loadRequests()
  }

  const isAdmin = role === 'admin'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex gap-3 mb-6">
        <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
        <div>
          <h3 className="font-bold text-red-800">Emergency Notice</h3>
          <p className="text-sm text-red-700 mt-1">BaratonHub is not an emergency service. If you or someone else is in immediate danger, please contact Campus Security or local emergency services immediately.</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Counselling Services</h1>
          <p className="text-sm text-slate-500">Your privacy is strictly protected. Records are isolated from general university data.</p>
        </div>
        {!isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> {showForm ? 'Cancel' : 'Request Session'}
          </button>
        )}
      </div>

      {showForm && !isAdmin && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <textarea required placeholder="Briefly describe the issue (kept strictly confidential)..." value={form.issue_summary} onChange={e => setForm({...form, issue_summary: e.target.value})} className="w-full border p-2 rounded" rows="3"></textarea>
          <input type="date" value={form.preferred_date} onChange={e => setForm({...form, preferred_date: e.target.value})} className="border p-2 rounded" />
          <button type="submit" className="bg-navy-900 text-white px-4 py-2 rounded-lg">Submit Confidential Request</button>
        </form>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              {isAdmin && <th className="p-3">Student</th>}
              <th className="p-3">Issue Summary</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
              {isAdmin && <th className="p-3">Action</th>}
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id} className="border-b">
                {isAdmin && <td className="p-3 font-medium">{req.profiles?.full_name}</td>}
                <td className="p-3 text-slate-600 truncate max-w-xs">{req.issue_summary}</td>
                <td className="p-3">{req.preferred_date || '-'}</td>
                <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{req.status}</span></td>
                {isAdmin && (
                  <td className="p-3">
                    <select value={req.status} onChange={(e) => updateStatus(req.id, e.target.value)} className="border rounded p-1 text-sm">
                      <option value="pending">Pending</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                )}
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={isAdmin ? 5 : 3} className="p-6 text-center text-slate-500">No requests found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}