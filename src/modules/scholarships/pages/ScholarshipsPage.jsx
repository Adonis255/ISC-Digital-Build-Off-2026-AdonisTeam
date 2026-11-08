import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Award, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react'

export default function ScholarshipsPage() {
  const { profile, role } = useAuth()
  const [scholarships, setScholarships] = useState([])
  const [myApps, setMyApps] = useState([])
  const [allApps, setAllApps] = useState([])
  
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', amount: '', deadline: '' })
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  
  // Admin Tab State
  const [adminTab, setAdminTab] = useState('pending')

  const loadData = async () => {
    const { data: s } = await supabase.from('scholarships').select('*').order('created_at', { ascending: false })
    setScholarships(s || [])

    if (role === 'student') {
      const { data: a } = await supabase.from('scholarship_applications').select('*').eq('student_id', profile.id)
      setMyApps(a || [])
    } else if (role === 'admin') {
      const { data: a } = await supabase.from('scholarship_applications').select('*, profiles(full_name, email), scholarships(title)').order('created_at', { ascending: false })
      setAllApps(a || [])
    }
  }

  useEffect(() => { loadData() }, [role, profile])

  const handleCreate = async (e) => {
    e.preventDefault()
    setUploading(true)

    let imageUrl = null
    if (imageFile) {
      const fileName = `scholarship-${Math.random()}.${imageFile.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage.from('community-media').upload(fileName, imageFile)
      if (!uploadError) {
        const { data } = supabase.storage.from('community-media').getPublicUrl(fileName)
        imageUrl = data.publicUrl
      }
    }

    await supabase.from('scholarships').insert([{ 
      ...form, 
      created_by: profile.id,
      image_url: imageUrl 
    }])
    
    setForm({ title: '', description: '', amount: '', deadline: '' })
    setImageFile(null)
    setShowForm(false)
    setUploading(false)
    loadData()
  }

  const handleApply = async (id) => {
    await supabase.from('scholarship_applications').insert([{ scholarship_id: id, student_id: profile.id }])
    loadData()
  }

  const updateStatus = async (id, status) => {
    await supabase.from('scholarship_applications').update({ status }).eq('id', id)
    loadData()
  }

  const isAdmin = role === 'admin'
  
  // Filter Admin applications based on active tab
  const filteredApps = allApps.filter(a => adminTab === 'all' ? true : a.status === adminTab)
  const pendingCount = allApps.filter(a => a.status === 'pending').length

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Scholarships & Bursaries</h1>
          <p className="text-sm text-slate-500">Financial aid opportunities for students.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm hover:bg-brand-700">
            {showForm ? 'Cancel' : '+ Post Scholarship'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <h2 className="font-bold text-lg border-b pb-2">Create Opportunity</h2>
          <input required placeholder="Scholarship Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
          <textarea required placeholder="Description and eligibility..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" rows="3"></textarea>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Amount / Value (e.g. Ksh 50,000)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full border p-3 rounded-xl" />
            <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full border p-3 rounded-xl" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cover Image</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700" />
          </div>

          <button type="submit" disabled={uploading} className="bg-navy-900 text-white px-6 py-2 rounded-xl disabled:opacity-50">
            {uploading ? 'Publishing...' : 'Publish Opportunity'}
          </button>
        </form>
      )}

      {/* ADMIN APPROVAL DASHBOARD */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden mb-8">
          <div className="p-5 border-b bg-purple-50 flex items-center justify-between">
            <h2 className="font-bold text-lg text-purple-900 flex items-center gap-2">
              <FileText className="w-5 h-5" /> Application Approvals
            </h2>
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </div>
          
          <div className="flex gap-4 px-6 pt-4 border-b">
            {['pending', 'approved', 'rejected', 'all'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setAdminTab(tab)} 
                className={`px-4 py-2 font-bold capitalize border-b-2 transition ${adminTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b">
                <tr><th className="p-4">Student</th><th className="p-4">Scholarship</th><th className="p-4">Date</th><th className="p-4">Status</th><th className="p-4 text-right">Action</th></tr>
              </thead>
              <tbody>
                {filteredApps.map(a => (
                  <tr key={a.id} className="border-t hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{a.profiles?.full_name}</p>
                      <p className="text-xs text-slate-500">{a.profiles?.email}</p>
                    </td>
                    <td className="p-4 font-medium">{a.scholarships?.title}</td>
                    <td className="p-4 text-slate-500">{new Date(a.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                        a.status === 'approved' ? 'bg-green-100 text-green-700' : 
                        a.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {a.status === 'pending' ? (
                        <>
                          <button onClick={() => updateStatus(a.id, 'approved')} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 transition">Approve</button>
                          <button onClick={() => updateStatus(a.id, 'rejected')} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 transition">Reject</button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredApps.length === 0 && (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-500">No {adminTab} applications found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SCHOLARSHIP LIST */}
      <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4 border-b pb-2">Available Opportunities</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scholarships.map(s => {
          const applied = myApps.find(a => a.scholarship_id === s.id)
          
          return (
            <div key={s.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
              {s.image_url ? (
                <img src={s.image_url} alt={s.title} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-yellow-50 flex items-center justify-center">
                  <Award className="w-12 h-12 text-yellow-400" />
                </div>
              )}
              
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-bold text-xl text-slate-800 mb-2">{s.title}</h3>
                {s.amount && <p className="text-brand-600 font-bold mb-3">{s.amount}</p>}
                <p className="text-slate-600 text-sm flex-1 whitespace-pre-wrap mb-4">{s.description}</p>
                
                {s.deadline && (
                  <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg mb-4 w-fit">
                    <Calendar className="w-4 h-4" /> Deadline: {new Date(s.deadline).toLocaleDateString()}
                  </div>
                )}

                {role === 'student' && (
                  applied ? (
                    <div className={`border px-4 py-2 rounded-xl text-center font-bold text-sm ${
                      applied.status === 'approved' ? 'bg-green-50 border-green-200 text-green-700' : 
                      applied.status === 'rejected' ? 'bg-red-50 border-red-200 text-red-700' : 
                      'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      Status: {applied.status.toUpperCase()}
                    </div>
                  ) : (
                    <button onClick={() => handleApply(s.id)} className="bg-brand-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-brand-700 transition">
                      Apply Now
                    </button>
                  )
                )}
              </div>
            </div>
          )
        })}
        {scholarships.length === 0 && <p className="text-slate-500 col-span-full text-center py-10">No scholarships posted yet.</p>}
      </div>
    </div>
  )
}