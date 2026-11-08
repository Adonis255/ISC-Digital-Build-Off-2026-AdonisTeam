import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { Building } from 'lucide-react'

export default function OfficeManagement() {
  const [offices, setOffices] = useState([])
  const [form, setForm] = useState({ name: '', building: '', room: '', operating_hours: '', services: '' })

  const loadOffices = async () => {
    const { data } = await supabase.from('offices').select('*').order('name')
    setOffices(data || [])
  }

  useEffect(() => { loadOffices() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    await supabase.from('offices').insert([form])
    setForm({ name: '', building: '', room: '', operating_hours: '', services: '' })
    loadOffices()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><Building className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold">Office Management</h1>
          <p className="text-sm text-slate-500">Register campus offices and their locations.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input required placeholder="Office Name (e.g. Admissions)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-2 rounded" />
          <input required placeholder="Building" value={form.building} onChange={e => setForm({...form, building: e.target.value})} className="w-full border p-2 rounded" />
          <input required placeholder="Room Number" value={form.room} onChange={e => setForm({...form, room: e.target.value})} className="w-full border p-2 rounded" />
        </div>
        <input placeholder="Operating Hours (e.g. Mon-Fri 8AM-5PM)" value={form.operating_hours} onChange={e => setForm({...form, operating_hours: e.target.value})} className="w-full border p-2 rounded" />
        <input placeholder="Services Offered (comma separated)" value={form.services} onChange={e => setForm({...form, services: e.target.value})} className="w-full border p-2 rounded" />
        <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg">Add Office</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offices.map(o => (
          <div key={o.id} className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="font-bold text-lg text-slate-800">{o.name}</h3>
            <p className="text-sm text-slate-600 mt-1 font-medium">{o.building} • {o.room}</p>
            <p className="text-sm text-slate-500 mt-2">🕒 {o.operating_hours || 'N/A'}</p>
            <p className="text-sm text-slate-500 mt-1">🛠️ {o.services || 'N/A'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}