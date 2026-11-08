import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Briefcase, Calendar, Building } from 'lucide-react'

export default function InternshipsPage() {
  const { profile, role } = useAuth()
  const [internships, setInternships] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', company: '', description: '', deadline: '' })

  const loadData = async () => {
    const { data } = await supabase.from('internships').select('*').order('created_at', { ascending: false })
    setInternships(data || [])
  }

  useEffect(() => { loadData() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await supabase.from('internships').insert([{ ...form, created_by: profile.id }])
    setForm({ title: '', company: '', description: '', deadline: '' })
    setShowForm(false)
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
            <p className="text-sm text-slate-500">Find opportunities to grow your career.</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-lg">
            {showForm ? 'Cancel' : '+ Post Internship'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Job Title (e.g. Software Engineer Intern)" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border p-2 rounded" />
            <input required placeholder="Company Name" value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full border p-2 rounded" />
          </div>
          <textarea required placeholder="Description and requirements..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" rows="3"></textarea>
          <div>
            <label className="block text-sm font-medium mb-1">Application Deadline</label>
            <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="border p-2 rounded" />
          </div>
          <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg">Publish Opportunity</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {internships.map(item => (
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
          </div>
        ))}
        {internships.length === 0 && <p className="text-slate-500 col-span-full">No internships posted yet.</p>}
      </div>
    </div>
  )
}