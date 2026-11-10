import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { ShieldCheck, AlertTriangle, Building, Phone, Plus, Trash2 } from 'lucide-react'

export default function CounsellingPage() {
  const { profile, role } = useAuth()
  const [requests, setRequests] = useState([])
  const [services, setServices] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showServiceForm, setShowServiceForm] = useState(false)
  
  const [form, setForm] = useState({ issue_summary: '', preferred_date: '' })
  const [serviceForm, setServiceForm] = useState({ name: '', office_number: '', contact: '', description: '' })

  const loadData = async () => {
    const { data: r } = await supabase.from('counselling_requests').select('*, profiles(full_name)').order('created_at', { ascending: false })
    setRequests(r || [])
    
    const { data: s } = await supabase.from('counselling_services').select('*').order('name')
    setServices(s || [])
  }

  useEffect(() => { loadData() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await supabase.from('counselling_requests').insert([{ ...form, student_id: profile.id }])
    setForm({ issue_summary: '', preferred_date: '' })
    setShowForm(false); loadData()
  }

  const handleCreateService = async (e) => {
    e.preventDefault()
    await supabase.from('counselling_services').insert([serviceForm])
    setServiceForm({ name: '', office_number: '', contact: '', description: '' })
    setShowServiceForm(false); loadData()
  }

  const handleDeleteService = async (id) => {
    if (!window.confirm('Delete this service?')) return
    await supabase.from('counselling_services').delete().eq('id', id)
    loadData()
  }

  const updateStatus = async (id, status) => {
    await supabase.from('counselling_requests').update({ status }).eq('id', id)
    loadData()
  }

  const isAdmin = role === 'admin'

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex gap-3">
        <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
        <div>
          <h3 className="font-bold text-red-800">Emergency Notice</h3>
          <p className="text-sm text-red-700 mt-1">BaratonHub is not an emergency service. If you are in immediate danger, contact Campus Security immediately.</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Counselling Services</h1>
          <p className="text-sm text-slate-500">Your privacy is strictly protected.</p>
        </div>
        {!isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> {showForm ? 'Cancel' : 'Request Session'}
          </button>
        )}
      </div>

      {/* ADMIN: MANAGE SERVICES */}
      {isAdmin && (
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="font-bold text-lg flex items-center gap-2"><Building className="w-5 h-5" /> Counselling Offices & Services</h2>
            <button onClick={() => setShowServiceForm(!showServiceForm)} className="text-sm bg-brand-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Service
            </button>
          </div>
          
          {showServiceForm && (
            <form onSubmit={handleCreateService} className="bg-slate-50 p-4 rounded-xl mb-4 space-y-3">
              <input required placeholder="Service Name (e.g. Mental Health Clinic)" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} className="w-full border p-2 rounded-lg" />
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Office Number (e.g. Admin Block, Rm 4)" value={serviceForm.office_number} onChange={e => setServiceForm({...serviceForm, office_number: e.target.value})} className="w-full border p-2 rounded-lg" />
                <input required placeholder="Contact Phone (e.g. ext 102)" value={serviceForm.contact} onChange={e => setServiceForm({...serviceForm, contact: e.target.value})} className="w-full border p-2 rounded-lg" />
              </div>
              <textarea placeholder="Description of services provided..." value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} className="w-full border p-2 rounded-lg" rows="2"></textarea>
              <button type="submit" className="bg-navy-900 text-white px-4 py-2 rounded-lg text-sm">Save Service</button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.map(s => (
              <div key={s.id} className="p-4 border rounded-xl relative group">
                <h3 className="font-bold text-slate-800">{s.name}</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Building className="w-3 h-3" /> {s.office_number}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Phone className="w-3 h-3" /> {s.contact}</p>
                <p className="text-sm text-slate-600 mt-2">{s.description}</p>
                <button onClick={() => handleDeleteService(s.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {services.length === 0 && <p className="text-sm text-slate-500 italic">No services added yet.</p>}
          </div>
        </div>
      )}

      {/* STUDENT: VIEW SERVICES */}
      {!isAdmin && services.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {services.map(s => (
            <div key={s.id} className="bg-white p-5 rounded-2xl border shadow-sm border-l-4 border-l-brand-500">
              <h3 className="font-bold text-slate-800">{s.name}</h3>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <p className="flex items-center gap-2"><Building className="w-4 h-4 text-slate-400" /> {s.office_number}</p>
                <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {s.contact}</p>
              </div>
              <p className="text-sm text-slate-500 mt-3 bg-slate-50 p-2 rounded-lg">{s.description}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && !isAdmin && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <textarea required placeholder="Briefly describe the issue (kept strictly confidential)..." value={form.issue_summary} onChange={e => setForm({...form, issue_summary: e.target.value})} className="w-full border p-2 rounded-xl" rows="3"></textarea>
          <input type="date" value={form.preferred_date} onChange={e => setForm({...form, preferred_date: e.target.value})} className="border p-2 rounded-xl" />
          <button type="submit" className="bg-navy-900 text-white px-4 py-2 rounded-xl">Submit Confidential Request</button>
        </form>
      )}

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>{isAdmin && <th className="p-3">Student</th>}<th className="p-3">Issue Summary</th><th className="p-3">Date</th><th className="p-3">Status</th>{isAdmin && <th className="p-3">Action</th>}</tr>
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