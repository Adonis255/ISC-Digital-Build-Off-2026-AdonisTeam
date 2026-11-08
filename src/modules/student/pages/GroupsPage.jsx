import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Users, Plus } from 'lucide-react'

export default function GroupsPage() {
  const { profile } = useAuth()
  const [groups, setGroups] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  const loadGroups = async () => {
    const { data } = await supabase.from('study_groups').select('*, profiles(full_name)').order('created_at', { ascending: false })
    setGroups(data || [])
  }

  useEffect(() => { loadGroups() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    await supabase.from('study_groups').insert([{ ...form, created_by: profile.id }])
    setForm({ name: '', description: '' })
    setShowForm(false)
    loadGroups()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Study Groups</h1>
          <p className="text-sm text-slate-500">Join or create groups for collaborative learning.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" /> {showForm ? 'Cancel' : 'Create Group'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <input required placeholder="Group Name (e.g. CS 101 Study Group)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-2 rounded" />
          <textarea required placeholder="What is this group about?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" rows="2"></textarea>
          <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg">Create</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map(g => (
          <div key={g.id} className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-brand-600" /> {g.name}</h3>
            <p className="text-slate-600 text-sm mt-2">{g.description}</p>
            <p className="text-xs text-slate-400 mt-3">Created by {g.profiles?.full_name}</p>
          </div>
        ))}
        {groups.length === 0 && <p className="text-slate-500">No study groups yet. Create the first one!</p>}
      </div>
    </div>
  )
}