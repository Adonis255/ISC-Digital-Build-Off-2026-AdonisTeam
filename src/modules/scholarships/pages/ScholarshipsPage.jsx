import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Award, Calendar } from 'lucide-react'

export default function ScholarshipsPage() {
  const { profile, role } = useAuth()
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', amount: '', deadline: '' })

  const loadData = async () => {
    const { data } = await supabase.from('scholarships').select('*').order('created_at', { ascending: false })
    setItems(data || [])
  }

  useEffect(() => { loadData() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await supabase.from('scholarships').insert([{ ...form, created_by: profile.id }])
    setForm({ title: '', description: '', amount: '', deadline: '' })
    setShowForm(false)
    loadData()
  }

  const isAdmin = role === 'admin'

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center"><Award className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">Scholarships & Bursaries</h1>
            <p className="text-sm text-slate-500">Financial aid opportunities for students.</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-lg">
            {showForm ? 'Cancel' : '+ Post Scholarship'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <input required placeholder="Scholarship Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border p-2 rounded" />
          <textarea required placeholder="Description and eligibility..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" rows="3"></textarea>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Amount / Value (e.g. Ksh 50,000)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full border p-2 rounded" />
            <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full border p-2 rounded" />
          </div>
          <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg">Publish Opportunity</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-xl border shadow-sm flex flex-col hover:shadow-md transition">
            <h3 className="font-bold text-lg text-slate-800">{item.title}</h3>
            {item.amount && <p className="text-brand-600 font-bold mt-1">{item.amount}</p>}
            <p className="text-slate-600 text-sm flex-1 whitespace-pre-wrap mt-2">{item.description}</p>
            {item.deadline && (
              <div className="mt-4 pt-3 border-t flex items-center gap-2 text-xs font-medium text-red-600">
                <Calendar className="w-4 h-4" /> Deadline: {new Date(item.deadline).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-slate-500 col-span-full">No scholarships posted yet.</p>}
      </div>
    </div>
  )
}