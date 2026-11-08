import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Briefcase, Calendar, Building, CheckCircle, FileText } from 'lucide-react'

export default function InternshipsPage() {
  const { profile, role } = useAuth()
  const [internships, setInternships] = useState([])
  const [myApps, setMyApps] = useState([])
  const [allApps, setAllApps] = useState([]) // For admin
  
  // Admin Create Form
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', company: '', description: '', deadline: '' })
  
  // Student Apply Form
  const [applyingTo, setApplyingTo] = useState(null)
  const [cvFile, setCvFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const loadData = async () => {
    const { data: i } = await supabase.from('internships').select('*').order('created_at', { ascending: false })
    setInternships(i || [])

    if (role === 'student') {
      const { data: a } = await supabase.from('internship_applications').select('*').eq('student_id', profile.id)
      setMyApps(a || [])
    }

    if (role === 'admin') {
      const { data: aa } = await supabase.from('internship_applications').select('*, profiles(full_name, email), internships(title, company)').order('created_at', { ascending: false })
      setAllApps(aa || [])
    }
  }

  useEffect(() => { loadData() }, [role, profile])

  const handleCreate = async (e) => {
    e.preventDefault()
    await supabase.from('internships').insert([{ ...form, created_by: profile.id }])
    setForm({ title: '', company: '', description: '', deadline: '' })
    setShowForm(false)
    loadData()
  }

  const handleApply = async (e) => {
    e.preventDefault()
    if (!cvFile) return alert('Please upload your CV (PDF).')
    setUploading(true)

    // 1. Upload CV to Storage
    const fileName = `cv-${profile.id}-${Date.now()}.pdf`
    const { error: uploadErr } = await supabase.storage.from('cvs').upload(fileName, cvFile)
    if (uploadErr) { alert(uploadErr.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('cvs').getPublicUrl(fileName)

    // 2. Save Application to DB
    const { error: dbErr } = await supabase.from('internship_applications').insert([{
      internship_id: applyingTo.id,
      student_id: profile.id,
      cv_url: publicUrl
    }])

    setUploading(false)
    if (dbErr) alert(dbErr.message)
    else {
      alert('Application submitted successfully!')
      setApplyingTo(null)
      setCvFile(null)
      loadData()
    }
  }

  const updateAppStatus = async (appId, status) => {
    await supabase.from('internship_applications').update({ status }).eq('id', appId)
    loadData()
  }

  const isAdmin = role === 'admin'

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center"><Briefcase className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">Internships</h1>
            <p className="text-sm text-slate-500">Find and apply for opportunities to grow your career.</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-lg">
            {showForm ? 'Cancel' : '+ Post Internship'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Job Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border p-2 rounded" />
            <input required placeholder="Company Name" value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full border p-2 rounded" />
          </div>
          <textarea required placeholder="Description and requirements..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" rows="3"></textarea>
          <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="border p-2 rounded" />
          <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg">Publish Opportunity</button>
        </form>
      )}

      {applyingTo && (
        <form onSubmit={handleApply} className="bg-indigo-50 border border-indigo-200 p-6 rounded-xl space-y-4">
          <h3 className="font-bold text-lg">Apply for: {applyingTo.title} at {applyingTo.company}</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Upload CV (PDF only)</label>
            <input required type="file" accept=".pdf" onChange={e => setCvFile(e.target.files[0])} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-100 file:text-indigo-700" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={uploading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg disabled:opacity-50">
              {uploading ? 'Uploading & Submitting...' : 'Submit Application'}
            </button>
            <button type="button" onClick={() => setApplyingTo(null)} className="bg-slate-200 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {internships.map(item => {
          const hasApplied = myApps.find(a => a.internship_id === item.id)
          
          return (
            <div key={item.id} className="bg-white p-6 rounded-xl border shadow-sm flex flex-col hover:shadow-md transition">
              <h3 className="font-bold text-lg text-slate-800">{item.title}</h3>
              <div className="flex items-center gap-1 text-slate-600 text-sm mt-1 mb-3">
                <Building className="w-4 h-4" /> {item.company}
              </div>
              <p className="text-slate-600 text-sm flex-1 whitespace-pre-wrap">{item.description}</p>
              
              {item.deadline && (
                <div className="mt-4 pt-3 border-t flex items-center gap-2 text-xs font-medium text-red-600">
                  <Calendar className="w-4 h-4" /> Apply before: {new Date(item.deadline).toLocaleDateString()}
                </div>
              )}

              {role === 'student' && (
                <div className="mt-4 pt-3 border-t">
                  {hasApplied ? (
                    <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                      <span className="text-sm font-bold text-green-800 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Applied</span>
                      <span className="text-xs font-bold uppercase bg-green-200 text-green-900 px-2 py-1 rounded">{hasApplied.status}</span>
                    </div>
                  ) : (
                    <button onClick={() => setApplyingTo(item)} className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
                      Apply Now
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {isAdmin && allApps.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Student Applications</h2>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b">
                <tr><th className="p-3">Student</th><th className="p-3">Role Applied For</th><th className="p-3">CV</th><th className="p-3">Status</th><th className="p-3">Action</th></tr>
              </thead>
              <tbody>
                {allApps.map(app => (
                  <tr key={app.id} className="border-b">
                    <td className="p-3 font-medium">{app.profiles?.full_name}</td>
                    <td className="p-3">{app.internships?.title} <span className="text-slate-400">({app.internships?.company})</span></td>
                    <td className="p-3"><a href={app.cv_url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">View CV</a></td>
                    <td className="p-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold">{app.status}</span></td>
                    <td className="p-3">
                      <select value={app.status} onChange={(e) => updateAppStatus(app.id, e.target.value)} className="border rounded p-1 text-sm">
                        <option value="Applied">Applied</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}