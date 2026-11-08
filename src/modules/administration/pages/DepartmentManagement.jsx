import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { Building, Plus, Trash2 } from 'lucide-react'

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState({ name: '', code: '' })
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    const { data } = await supabase.from('departments').select('*').order('name')
    setDepartments(data || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('departments').insert([form])
    if (error) alert(error.message)
    else {
      setForm({ name: '', code: '' })
      loadData()
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? Students and lecturers in this department will be unassigned.")) return
    await supabase.from('departments').delete().eq('id', id)
    loadData()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center"><Building className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Department Management</h1>
          <p className="text-sm text-slate-500">Create and manage university departments.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl border shadow-sm flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Department Name</label>
          <input required placeholder="e.g. Department of Nursing" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-2 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
        </div>
        <div className="w-32">
          <label className="block text-sm font-medium mb-1">Short Code</label>
          <input placeholder="e.g. NUR" value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full border p-2 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
        </div>
        <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-xl h-10 flex items-center gap-2"><Plus className="w-4 h-4" /> Add</button>
      </form>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr><th className="p-4">Department Name</th><th className="p-4">Code</th><th className="p-4 text-right">Action</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="3" className="p-6 text-center">Loading...</td></tr> : departments.map(d => (
              <tr key={d.id} className="border-b hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-800">{d.name}</td>
                <td className="p-4 text-slate-500">{d.code || '-'}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDelete(d.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {departments.length === 0 && <tr><td colSpan="3" className="p-6 text-center text-slate-500">No departments created yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}